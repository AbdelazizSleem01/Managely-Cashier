import { app, ipcMain } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import log from 'electron-log';

// Configure Logger for Updater
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Auto-Updater Core State
let isInitialized = false;
let mainWindowRef = null;
let updateState = {
    status: 'idle', // 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
    version: app.getVersion(),
    availableVersion: null,
    downloadProgress: null,
    error: null
};

// Transaction Lock Mechanism to prevent updates/restarts during active sales
let activeTransactionsCount = 0;
let transactionBusyReason = null;

export function setTransactionBusy(isBusy, reason = 'عملية كاشير قيد التنفيذ') {
    if (isBusy) {
        activeTransactionsCount++;
        transactionBusyReason = reason;
        log.info(`[Updater Lock] Transaction started: ${reason} (active count: ${activeTransactionsCount})`);
    } else {
        activeTransactionsCount = Math.max(0, activeTransactionsCount - 1);
        if (activeTransactionsCount === 0) {
            transactionBusyReason = null;
            log.info('[Updater Lock] All transactions cleared. Safe for update restart.');
        }
    }
}

export function isTransactionBusy() {
    return activeTransactionsCount > 0;
}

/**
 * Checks if an error is a non-fatal offline / network reachability error
 */
function isOfflineError(err) {
    if (!err) return false;
    const msg = (err.message || err.toString() || '').toLowerCase();
    const offlinePatterns = [
        'enotfound',
        'econnrefused',
        'econnreset',
        'etimedout',
        'net::err',
        'internet disconnected',
        'offline',
        'network error',
        'err_name_not_resolved',
        'err_internet_disconnected',
        'err_connection_refused',
        'could not resolve host'
    ];
    return offlinePatterns.some(pattern => msg.includes(pattern));
}

/**
 * Safely dispatches IPC events to the Renderer window
 */
function sendToRenderer(channel, data) {
    if (mainWindowRef && !mainWindowRef.isDestroyed() && mainWindowRef.webContents) {
        try {
            mainWindowRef.webContents.send(channel, data);
        } catch (e) {
            log.warn(`[Updater] Failed to send IPC event ${channel}:`, e.message);
        }
    }
}

/**
 * Initializes the Auto-Updater engine and binds listeners
 */
export function initAutoUpdater(mainWindow) {
    if (isInitialized) {
        mainWindowRef = mainWindow;
        return;
    }

    mainWindowRef = mainWindow;
    isInitialized = true;

    // Safety and Behavior Configurations
    autoUpdater.autoDownload = false; // Prompt before download or download in background safely
    autoUpdater.autoInstallOnAppQuit = true; // Apply downloaded update when app closes if user clicks 'Later'
    autoUpdater.allowDowngrade = false; // Security: Prevent version downgrading
    autoUpdater.allowPrerelease = false;

    // Event Listeners
    autoUpdater.on('checking-for-update', () => {
        updateState.status = 'checking';
        log.info('[Updater] Checking for updates on GitHub Releases...');
        sendToRenderer('updater:status', { status: 'checking' });
    });

    autoUpdater.on('update-available', (info) => {
        updateState.status = 'available';
        updateState.availableVersion = info.version;
        log.info(`[Updater] Update available: v${info.version} (Published: ${info.releaseDate})`);
        sendToRenderer('updater:available', {
            version: info.version,
            releaseDate: info.releaseDate,
            releaseNotes: info.releaseNotes,
            files: info.files
        });
    });

    autoUpdater.on('update-not-available', (info) => {
        updateState.status = 'not-available';
        log.info(`[Updater] No updates available. Current version (v${app.getVersion()}) is up to date.`);
        sendToRenderer('updater:not-available', { version: app.getVersion() });
    });

    autoUpdater.on('download-progress', (progressObj) => {
        updateState.status = 'downloading';
        updateState.downloadProgress = progressObj;
        log.info(`[Updater] Download progress: ${Math.round(progressObj.percent)}% (${progressObj.bytesPerSecond} B/s)`);
        sendToRenderer('updater:progress', {
            percent: progressObj.percent,
            bytesPerSecond: progressObj.bytesPerSecond,
            total: progressObj.total,
            transferred: progressObj.transferred
        });
    });

    autoUpdater.on('update-downloaded', (info) => {
        updateState.status = 'downloaded';
        log.info(`[Updater] Update downloaded successfully: v${info.version}`);
        sendToRenderer('updater:downloaded', {
            version: info.version,
            releaseNotes: info.releaseNotes
        });
    });

    autoUpdater.on('error', (err) => {
        updateState.status = 'error';
        updateState.error = err ? err.message : 'Unknown updater error';

        if (isOfflineError(err)) {
            log.info(`[Updater] Offline state or GitHub unreachable: ${updateState.error}. Skipping update check silently.`);
            sendToRenderer('updater:offline', { message: 'offline' });
        } else {
            log.error('[Updater] Auto-updater error:', err);
            sendToRenderer('updater:error', { message: updateState.error });
        }
    });

    // Register IPC Handlers
    ipcMain.handle('updater:check', async () => {
        try {
            log.info('[Updater IPC] Manual check requested.');
            const result = await autoUpdater.checkForUpdates();
            return {
                success: true,
                updateAvailable: !!(result && result.updateInfo && result.updateInfo.version !== app.getVersion()),
                versionInfo: result ? result.updateInfo : null
            };
        } catch (err) {
            const isOffline = isOfflineError(err);
            log.warn('[Updater IPC] Check error:', err.message);
            return {
                success: false,
                isOffline,
                error: err.message
            };
        }
    });

    ipcMain.handle('updater:download', async () => {
        try {
            log.info('[Updater IPC] Download update initiated.');
            updateState.status = 'downloading';
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (err) {
            log.error('[Updater IPC] Download error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('updater:install', async (_event, isSilent = false) => {
        try {
            // Check transaction safety lock
            if (isTransactionBusy()) {
                log.warn(`[Updater IPC] Restart postponed. Active transaction in progress: ${transactionBusyReason}`);
                return {
                    success: false,
                    postponed: true,
                    reason: 'transaction_in_progress',
                    message: `تعذر إعادة التشغيل حالياً: ${transactionBusyReason}. يرجى إتمام العملية ثم المحاولة مجدداً.`
                };
            }

            log.info('[Updater IPC] Quitting and installing update now...');
            setImmediate(() => {
                autoUpdater.quitAndInstall(isSilent, true);
            });
            return { success: true };
        } catch (err) {
            log.error('[Updater IPC] Install error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('updater:get-version', () => app.getVersion());
    ipcMain.handle('updater:get-state', () => updateState);
    ipcMain.handle('updater:is-busy', () => ({ isBusy: isTransactionBusy(), reason: transactionBusyReason }));

    // Silent background check on app launch after 4 seconds
    setTimeout(() => {
        if (app.isPackaged || process.env.FORCE_UPDATE_CHECK === 'true') {
            log.info('[Updater] Running silent startup update check...');
            autoUpdater.checkForUpdates().catch(err => {
                if (isOfflineError(err)) {
                    log.info('[Updater] Startup update check skipped (Offline/Unreachable).');
                } else {
                    log.warn('[Updater] Startup update check failed:', err.message);
                }
            });
        }
    }, 4000);
}
