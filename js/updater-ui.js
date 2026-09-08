// Auto-Updater UI & Notification Controller
// Handles checking, downloading, progress tracking, and restart installation prompt

let isUpdateModalOpen = false;
let updateProgressContainer = null;

function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond) {
    if (!bytesPerSecond || bytesPerSecond === 0) return '0 KB/s';
    return formatBytes(bytesPerSecond) + '/s';
}

// Inject CSS styles for Updater UI elements
function injectUpdaterStyles() {
    if (document.getElementById('updater-custom-styles')) return;
    const style = document.createElement('style');
    style.id = 'updater-custom-styles';
    style.textContent = `
        .updater-floating-toast {
            position: fixed;
            bottom: 24px;
            left: 24px;
            z-index: 99999;
            background: #ffffff;
            border-radius: 14px;
            box-shadow: 0 12px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08);
            border: 1px solid #e2e8f0;
            padding: 16px 20px;
            min-width: 320px;
            max-width: 420px;
            direction: rtl;
            font-family: 'Tajawal', sans-serif;
            animation: slideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            transition: all 0.3s ease;
        }

        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .updater-progress-bar {
            height: 8px;
            border-radius: 4px;
            background-color: #e2e8f0;
            overflow: hidden;
            position: relative;
            margin: 10px 0;
        }

        .updater-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4f46e5, #06b6d4);
            border-radius: 4px;
            width: 0%;
            transition: width 0.2s ease;
        }

        .updater-btn-primary {
            background-color: #4f46e5;
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: background 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .updater-btn-primary:hover {
            background-color: #4338ca;
        }

        .updater-btn-secondary {
            background-color: #f1f5f9;
            color: #475569;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            border: 1px solid #cbd5e1;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .updater-btn-secondary:hover {
            background-color: #e2e8f0;
            color: #1e293b;
        }
    `;
    document.head.appendChild(style);
}

// Show update available notification / modal
export function showUpdateAvailablePrompt(info) {
    if (!info || !info.version) return;
    
    // If a toast already exists, remove it first
    removeUpdaterToast();

    const toast = document.createElement('div');
    toast.id = 'updater-floating-toast';
    toast.className = 'updater-floating-toast';

    let releaseNotesHtml = '';
    if (info.releaseNotes) {
        let cleanNotes = typeof info.releaseNotes === 'string' ? info.releaseNotes : '';
        if (cleanNotes.length > 150) {
            cleanNotes = cleanNotes.substring(0, 150) + '...';
        }
        if (cleanNotes) {
            releaseNotesHtml = `<div style="font-size: 12px; color: #64748b; background: #f8fafc; padding: 6px 10px; border-radius: 6px; margin: 8px 0;">${cleanNotes}</div>`;
        }
    }

    toast.innerHTML = `
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: #e0e7ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
                    <i class="fas fa-sparkles"></i>
                </div>
                <div>
                    <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #1e293b;">يتوفر إصدار جديد!</h4>
                    <span style="display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 1px 8px; border-radius: 9999px; margin-top: 2px;">
                        الإصدار v${info.version}
                    </span>
                </div>
            </div>
            <button id="updater-toast-close" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; padding: 4px;">
                <i class="fas fa-times"></i>
            </button>
        </div>
        ${releaseNotesHtml}
        <p style="margin: 10px 0 12px 0; font-size: 13px; color: #475569;">
            يتوفر تحديث جديد للنظام يحتوي على تحسينات أمان وأداء. هل ترغب في تنزيله الآن؟
        </p>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button id="updater-btn-later" class="updater-btn-secondary">لاحقاً</button>
            <button id="updater-btn-download" class="updater-btn-primary">
                <i class="fas fa-download"></i>
                تحميل التحديث
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    document.getElementById('updater-toast-close')?.addEventListener('click', removeUpdaterToast);
    document.getElementById('updater-btn-later')?.addEventListener('click', removeUpdaterToast);
    document.getElementById('updater-btn-download')?.addEventListener('click', async () => {
        showDownloadingUI();
        if (window.electronAPI?.updater?.download) {
            try {
                await window.electronAPI.updater.download();
            } catch (err) {
                console.error('Download trigger error:', err);
            }
        }
    });
}

// Show downloading progress UI
export function showDownloadingUI() {
    removeUpdaterToast();

    const toast = document.createElement('div');
    toast.id = 'updater-floating-toast';
    toast.className = 'updater-floating-toast';

    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                <i class="fas fa-cloud-arrow-down fa-bounce"></i>
            </div>
            <div style="flex: 1;">
                <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">جاري تحميل التحديث...</h4>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 2px;">
                    <span id="updater-progress-percent">0%</span>
                    <span id="updater-progress-speed">-- KB/s</span>
                </div>
            </div>
        </div>

        <div class="updater-progress-bar">
            <div id="updater-progress-fill" class="updater-progress-fill"></div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
            <span id="updater-progress-bytes">0 MB / 0 MB</span>
            <span>التحميل يجري في الخلفية</span>
        </div>
    `;

    document.body.appendChild(toast);
}

// Update progress elements
export function updateDownloadProgressUI(progress) {
    if (!progress) return;
    
    let toast = document.getElementById('updater-floating-toast');
    if (!toast) {
        showDownloadingUI();
    }

    const percent = Math.round(progress.percent || 0);
    const percentEl = document.getElementById('updater-progress-percent');
    const fillEl = document.getElementById('updater-progress-fill');
    const speedEl = document.getElementById('updater-progress-speed');
    const bytesEl = document.getElementById('updater-progress-bytes');

    if (percentEl) percentEl.textContent = `${percent}%`;
    if (fillEl) fillEl.style.width = `${percent}%`;
    if (speedEl && progress.bytesPerSecond) speedEl.textContent = formatSpeed(progress.bytesPerSecond);
    if (bytesEl && progress.total) {
        bytesEl.textContent = `${formatBytes(progress.transferred)} / ${formatBytes(progress.total)}`;
    }
}

// Show update downloaded & ready to install prompt
export function showUpdateDownloadedPrompt(info) {
    removeUpdaterToast();

    if (typeof window.Swal !== 'undefined') {
        window.Swal.fire({
            title: 'تم تحميل التحديث بنجاح! 🎉',
            html: `
                <div style="text-align: center; direction: rtl; font-family: 'Tajawal', sans-serif;">
                    <p style="font-size: 15px; color: #334155; margin-bottom: 12px;">
                        الإصدار الجديد جاهز الآن للتثبيت.
                    </p>
                    <div style="background: #f1f5f9; padding: 12px; border-radius: 10px; font-size: 13px; color: #475569; margin-bottom: 10px;">
                        <i class="fas fa-shield-check text-green-600 ml-1"></i>
                        تم فحص وتأمين قاعدة بياناتك بالكامل. سيتم تطبيق التحديث بسلاسة مع الحفاظ على كافة البيانات.
                    </div>
                    <p style="font-size: 13px; color: #64748b;">
                        هل ترغب في إعادة التشغيل الآن لتطبيق التحديث؟
                    </p>
                </div>
            `,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-rotate-right mr-1"></i> إعادة التشغيل والتثبيت الآن',
            cancelButtonText: 'تثبيت عند إغلاق البرنامج',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#64748b',
            allowOutsideClick: true
        }).then((result) => {
            if (result.isConfirmed) {
                if (window.electronAPI?.updater?.install) {
                    window.electronAPI.updater.install();
                }
            }
        });
        return;
    }

    // Fallback floating toast
    const toast = document.createElement('div');
    toast.id = 'updater-floating-toast';
    toast.className = 'updater-floating-toast';
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: #dcfce7; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
                <i class="fas fa-circle-check"></i>
            </div>
            <div>
                <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #1e293b;">التحديث جاهز للتثبيت</h4>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">أعد تشغيل التطبيق لتطبيق التحديث</p>
            </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;">
            <button id="updater-btn-restart-later" class="updater-btn-secondary">لاحقاً</button>
            <button id="updater-btn-restart-now" class="updater-btn-primary">
                <i class="fas fa-rotate-right"></i>
                إعادة التشغيل الآن
            </button>
        </div>
    `;
    document.body.appendChild(toast);

    document.getElementById('updater-btn-restart-later')?.addEventListener('click', removeUpdaterToast);
    document.getElementById('updater-btn-restart-now')?.addEventListener('click', () => {
        if (window.electronAPI?.updater?.install) {
            window.electronAPI.updater.install();
        }
    });
}

// Remove floating toast
export function removeUpdaterToast() {
    const toast = document.getElementById('updater-floating-toast');
    if (toast) toast.remove();
}

// Initialize Updater Listeners globally
export function initAutoUpdaterUI() {
    if (typeof window === 'undefined' || !window.electronAPI?.updater) return;

    injectUpdaterStyles();

    // Listen to update events from Main Process
    window.electronAPI.updater.onUpdateAvailable((info) => {
        console.log('[Updater UI] Update available event received:', info);
        showUpdateAvailablePrompt(info);
    });

    window.electronAPI.updater.onDownloadProgress((progress) => {
        updateDownloadProgressUI(progress);
    });

    window.electronAPI.updater.onUpdateDownloaded((info) => {
        console.log('[Updater UI] Update downloaded event received:', info);
        showUpdateDownloadedPrompt(info);
    });

    window.electronAPI.updater.onUpdateError((err) => {
        console.warn('[Updater UI] Update error:', err);
        // Do not interrupt cashier with aggressive alert if download fails silently
        const toast = document.getElementById('updater-floating-toast');
        if (toast && toast.querySelector('#updater-progress-fill')) {
            toast.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #1e293b;">تعذر إكمال التنزيل</h4>
                        <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">يمكنك الاستمرار في العمل بشكل طبيعي</p>
                    </div>
                </div>
            `;
            setTimeout(() => {
                removeUpdaterToast();
            }, 5000);
        }
    });
}

// Auto-run on DOM ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutoUpdaterUI);
    } else {
        initAutoUpdaterUI();
    }
}
