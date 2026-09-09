import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { readFile, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import os from 'os';
import axios from 'axios';
import nodeMachineId from 'node-machine-id';

const { machineId } = nodeMachineId;

const VERIFY_URL = 'https://license-key-one.vercel.app/api/verify-license';
const TRACK_URL = 'https://license-key-one.vercel.app/api/track-usage';
const IP_API_URL = 'http://ip-api.com/json/';

export const getLicenseFilePath = () => {
  return join(app.getPath('userData'), 'license.json');
};

export const generateMachineId = async () => {
  try {
    return await machineId();
  } catch (err) {
    const hash = createHash('sha256');
    const fallback = `${os.hostname()}-${os.platform()}-${os.arch()}`;
    hash.update(fallback);
    return hash.digest('hex');
  }
};

export const getLocationInfo = async () => {
  try {
    const res = await axios.get(IP_API_URL, { timeout: 5000 });
    const data = res.data;
    return {
      ip: data.query || 'unknown',
      country: data.country || 'unknown',
      countryCode: data.countryCode || 'unknown',
      region: data.regionName || 'unknown',
      city: data.city || 'unknown',
      timezone: data.timezone || 'unknown'
    };
  } catch (err) {
    return {
      ip: 'unknown',
      country: 'unknown',
      countryCode: 'unknown',
      region: 'unknown',
      city: 'unknown',
      timezone: 'unknown'
    };
  }
};

export const trackUsage = async (licenseKey, mId, hostname, platform, appVersion) => {
  try {
    const loc = await getLocationInfo();
    const payload = {
      licenseKey,
      machineId: mId,
      hostname,
      platform,
      appVersion,
      location: loc
    };
    await axios.post(TRACK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
  } catch (err) {
    console.error('[License] Error sending track-usage:', err.message);
  }
};

const parseServerErrorMessage = (errData, fallbackMessage) => {
  if (!errData) return fallbackMessage;
  const reason = errData.reason || '';
  const msg = errData.message || fallbackMessage || '';

  if (reason === 'disabled' || msg.includes('disabled')) {
    return 'تم إيقاف مفتاح الترخيص من قبل المزود';
  }
  if (reason === 'expired' || msg.includes('expired')) {
    return 'انتهت صلاحية مفتاح الترخيص';
  }
  if (reason === 'device_limit' || msg.includes('device limit')) {
    return 'تم تجاوز الحد المسموح للأجهزة لهذا المفتاح';
  }
  if (reason === 'license_not_found') {
    return 'مفتاح الترخيص غير موجود أو غير صحيح';
  }
  return msg || 'مفتاح الترخيص غير صالح';
};

export const promptLicenseWindow = () => {
  return new Promise((resolve) => {
    let resolved = false;

    const licenseWin = new BrowserWindow({
      width: 540,
      height: 520,
      title: 'تفعيل البرنامج - Managely Cashier',
      icon: join(app.getAppPath(), 'assets/images/Logo.ico'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      show: true,
      modal: true,
      resizable: false,
      autoHideMenuBar: true
    });

    const licenseFilePath = getLicenseFilePath();

    // Remove any previous handlers to prevent duplicate registrations
    ipcMain.removeHandler('verify-license-key');
    ipcMain.removeAllListeners('license-submitted');

    // Handle modern async IPC verify-license-key
    ipcMain.handle('verify-license-key', async (event, rawKey) => {
      const key = (rawKey || '').trim();
      if (!key) {
        return { success: false, message: 'الرجاء إدخال مفتاح الترخيص!' };
      }

      try {
        const mId = await generateMachineId();
        const loc = await getLocationInfo();
        const hostname = os.hostname();
        const platform = os.platform();
        const appVersion = app.getVersion();

        const response = await axios.post(VERIFY_URL, {
          licenseKey: key,
          machineId: mId,
          location: loc
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 12000
        });

        const data = response.data;
        if (data && data.valid) {
          await trackUsage(key, mId, hostname, platform, appVersion);
          const licenseData = {
            licensed: true,
            key: key,
            verifiedAt: new Date().toISOString()
          };
          await writeFile(licenseFilePath, JSON.stringify(licenseData, null, 2), 'utf8');

          if (!resolved) {
            resolved = true;
            resolve(true);
          }
          return { success: true };
        } else {
          return { success: false, message: parseServerErrorMessage(data, 'مفتاح الترخيص غير صالح') };
        }
      } catch (err) {
        if (err.response?.data) {
          return {
            success: false,
            message: parseServerErrorMessage(err.response.data, err.message)
          };
        }
        if (err.code === 'ECONNABORTED' || err.message.includes('timeout') || !err.response) {
          return {
            success: false,
            message: 'فشل الاتصال بخادم التفعيل، يرجى التأكد من اتصال الإنترنت والمحاولة مجدداً.'
          };
        }
        return {
          success: false,
          message: err.message || 'خطأ غير متوقع أثناء التحقق من الترخيص'
        };
      }
    });

    // Backward compatibility for legacy license-submitted event
    ipcMain.on('license-submitted', async (event, rawKey) => {
      const key = (rawKey || '').trim();
      if (!key) {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
        return;
      }

      try {
        const mId = await generateMachineId();
        const loc = await getLocationInfo();
        const hostname = os.hostname();
        const platform = os.platform();
        const appVersion = app.getVersion();

        const response = await axios.post(VERIFY_URL, {
          licenseKey: key,
          machineId: mId,
          location: loc
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 12000
        });

        const data = response.data;
        if (data && data.valid) {
          await trackUsage(key, mId, hostname, platform, appVersion);
          const licenseData = {
            licensed: true,
            key: key,
            verifiedAt: new Date().toISOString()
          };
          await writeFile(licenseFilePath, JSON.stringify(licenseData, null, 2), 'utf8');
          licenseWin.close();
          if (!resolved) {
            resolved = true;
            resolve(true);
          }
        } else {
          const errMsg = parseServerErrorMessage(data, 'مفتاح الترخيص غير صالح');
          dialog.showErrorBox('خطأ في التفعيل', errMsg);
        }
      } catch (err) {
        const errMsg = parseServerErrorMessage(err.response?.data, err.message);
        dialog.showErrorBox('خطأ في التفعيل', errMsg);
      }
    });

    licenseWin.loadFile(join(app.getAppPath(), 'HTML/license.html')).catch((err) => {
      console.error('[License] Failed to load license.html:', err);
      dialog.showErrorBox('خطأ', 'فشل تحميل نافذة الترخيص');
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });

    licenseWin.on('closed', () => {
      ipcMain.removeHandler('verify-license-key');
      ipcMain.removeAllListeners('license-submitted');
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });
  });
};

export const verifyLicense = async () => {
  const licenseFilePath = getLicenseFilePath();

  if (!existsSync(licenseFilePath)) {
    return await promptLicenseWindow();
  }

  try {
    const rawData = await readFile(licenseFilePath, 'utf8');
    const licenseData = JSON.parse(rawData);

    if (!licenseData.licensed || !licenseData.key) {
      return await promptLicenseWindow();
    }

    const mId = await generateMachineId();
    const loc = await getLocationInfo();
    const hostname = os.hostname();
    const platform = os.platform();
    const appVersion = app.getVersion();

    try {
      const response = await axios.post(VERIFY_URL, {
        licenseKey: licenseData.key,
        machineId: mId,
        location: loc
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000
      });

      const data = response.data;
      if (data && data.valid) {
        await trackUsage(licenseData.key, mId, hostname, platform, appVersion);
        licenseData.verifiedAt = new Date().toISOString();
        await writeFile(licenseFilePath, JSON.stringify(licenseData, null, 2), 'utf8');
        return true;
      } else {
        const errorMsg = parseServerErrorMessage(data, 'مفتاح الترخيص غير صالح');
        dialog.showErrorBox('خطأ في الترخيص', errorMsg);
        try { await unlink(licenseFilePath); } catch (e) {}
        return await promptLicenseWindow();
      }
    } catch (apiErr) {
      if (apiErr.response?.data) {
        const errorMsg = parseServerErrorMessage(apiErr.response.data, apiErr.message);
        dialog.showErrorBox('خطأ في الترخيص', errorMsg);
        try { await unlink(licenseFilePath); } catch (e) {}
        return await promptLicenseWindow();
      }

      // Offline / Network Error: if license was previously verified, allow offline operation
      console.warn('[License] Could not reach verification server, allowing offline session for existing verified license.');
      return true;
    }
  } catch (err) {
    console.error('[License] Error reading license file:', err);
    return await promptLicenseWindow();
  }
};
