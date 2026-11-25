import { app, BrowserWindow } from 'electron';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

const originalLoadURL = BrowserWindow.prototype.loadURL;

function decodeHtmlDataUrl(url) {
  const commaIndex = url.indexOf(',');
  if (commaIndex === -1) throw new Error('Invalid HTML data URL');

  const metadata = url.slice(0, commaIndex);
  const payload = url.slice(commaIndex + 1);
  return /;base64(?:;|$)/i.test(metadata)
    ? Buffer.from(payload, 'base64').toString('utf8')
    : decodeURIComponent(payload);
}

// Long percent-encoded invoice URLs are rejected by Chromium on some Windows
// installations. Transparently load them from a local temporary HTML file.
BrowserWindow.prototype.loadURL = async function loadURL(url, options) {
  if (typeof url !== 'string' || !url.startsWith('data:text/html')) {
    return originalLoadURL.call(this, url, options);
  }

  const tempDirectory = join(app.getPath('temp'), 'managely-print');
  await mkdir(tempDirectory, { recursive: true });

  const tempFile = join(
    tempDirectory,
    `print-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.html`
  );
  await writeFile(tempFile, decodeHtmlDataUrl(url), 'utf8');

  const removeTempFile = () => unlink(tempFile).catch(() => {});
  this.once('closed', removeTempFile);

  try {
    return await this.loadFile(tempFile);
  } catch (error) {
    this.removeListener('closed', removeTempFile);
    await removeTempFile();
    throw error;
  }
};
