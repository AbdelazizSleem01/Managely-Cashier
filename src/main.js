import './init-instance.js';
import './print-data-url-fix.js';
const a0_0x1b8c3f = a0_0x31f6; (function (_0x1026eb, _0x3cc0f2) { const _0x36a902 = a0_0x31f6, _0x155800 = _0x1026eb(); while (!![]) { try { const _0x2fbce8 = parseInt(_0x36a902(0x186)) / 0x1 + -parseInt(_0x36a902(0x2cf)) / 0x2 * (-parseInt(_0x36a902(0x295)) / 0x3) + parseInt(_0x36a902(0x223)) / 0x4 * (-parseInt(_0x36a902(0x2ad)) / 0x5) + parseInt(_0x36a902(0x230)) / 0x6 + parseInt(_0x36a902(0x279)) / 0x7 * (-parseInt(_0x36a902(0x10b)) / 0x8) + parseInt(_0x36a902(0x20c)) / 0x9 * (-parseInt(_0x36a902(0x1e3)) / 0xa) + -parseInt(_0x36a902(0x1ce)) / 0xb; if (_0x2fbce8 === _0x3cc0f2) break; else _0x155800['push'](_0x155800['shift']()); } catch (_0x5b09c8) { _0x155800['push'](_0x155800['shift']()); } } }(a0_0x5961, 0x4d514)); import { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut, screen } from 'electron'; function a0_0x31f6(_0x4d8d7a, _0x3baa77) { const _0x596113 = a0_0x5961(); return a0_0x31f6 = function (_0x31f673, _0x371c23) { _0x31f673 = _0x31f673 - 0xdb; let _0x3dee2d = _0x596113[_0x31f673]; return _0x3dee2d; }, a0_0x31f6(_0x4d8d7a, _0x3baa77); } import { productsDB, categoriesDB, salesDB, cartDB, countersDB, settingsDB, customersDB, salesDataDB, statisticsDB, purchaseInvoicesDB, suppliersDB, installmentsDB, employeesDB, productsPurchaseInvoicesDB, treasuryDB, suspendedInvoicesDB, usersDB, currenciesDB } from './database.js'; import { join } from 'path'; import { runDatabaseMigrations } from './migration.js'; import { initAutoUpdater, setTransactionBusy } from './updater.js'; import { verifyLicense } from './license.js'; function a0_0x5961() { const _0x43fda0 = ['employeePagePassword', 'darwin', 'toFixed', 'SLsXh', 'markInstallmentAsPaid', 'defaultPrinter', 'export-sales-to-excel', 'roland', 'RGyCI', 'tOrUq', 'pxCqE', 'xp-80iii', 'once', 'printer\x20driver', 'delete-installment', 'لم\x20يتم\x20العثور\x20على\x20الفاتورة\x20أو\x20فشل\x20التحديث', 'الدفعة\x20غير\x20موجودة', 'pTaah', 'KHpMH', 'country', 'fXVDL', 'GupWT', 'NmoYz', 'CEAxK', 'saAQI', 'غير\x20محدد', 'redirect', 'INV\x20-\x20', 'hfpQB', 'disabled', 'remove', 'get-products-purchase-invoices', 'FBlWl', 'dueAmount', 'printToPDF', 'konica', 'DpPrY', 'ezTTD', 'get-products', 'get-sales', 'push', 'MVsUT', 'XwrHY', 'Failed\x20to\x20load\x20invoice\x20HTML:', 'closed', 'stringify', 'sort', 'vjSYL', 'كارد\x20فيزا', 'UgJBB', 'الملف\x20غير\x20موجود:\x20', 'length', 'substr', 'Error\x20reading\x20file\x20as\x20Data\x20URL:', 'message', 'kJkfK', 'update-employee', 'loadURL', 'xp-q809', 'CApVJ', 'TxaNn', 'returned', 'VDAPy', 'FmgHN', 'CUaNF', 'JvbVv', 'paid', 'code', 'تم\x20صرف\x20أكثر\x20من\x20دخل\x20اليوم', 'خطأ\x20في\x20الاتصال', 'WaJek', 'فشل\x20الطباعة:\x20', 'CYjnn', 'trim', 'YeGWk', 'oWJQs', 'get-categories', 'UqPJF', 'add-sale', 'فودافون\x20كاش', 'JUXea', 'delete-product', 'بيانات\x20فاتورة\x20شراء\x20المنتجات\x20غير\x20مكتملة', 'huKhq', 'open-page', 'items', 'suspend-invoice', 'tsc', 'paymentMethod', 'Failed\x20to\x20get\x20printer:', 'userData', 'HTML/license.html', 'YTVcg', 'SUSPENDED_', 'reduce', 'pending', 'hwFJh', 'DOAfo', 'platform', 'sales-invoice.html', 'VPkmY', 'currentUser', 'اسم\x20الفئة\x20موجود\x20بالفعل!', 'PflkC', 'MGUtL', 'cOzuB', '527118zgNVkG', 'مفتاح\x20الترخيص\x20غير\x20صالح', 'mini', 'http://ip-api.com/json/', 'update-password-hash', 'limit', 'from', 'msPpw', 'timezone', 'خطأ\x20في\x20الاتصال\x20بخادم\x20الترخيص:\x20', 'Ksqru', 'iADau', 'type', 'rcYXE', '.pdf', 'asiWh', 'jqnta', 'tCqHC', 'LYXrl', 'toISOString', 'qOruB', 'update-installment', 'Xpedm', 'fax', 'BkWGL', 'valid', 'HPaUN', 'BYZnK', 'onenote', 'send', 'license.json', 'pos', 'update', 'كلمة\x20المرور\x20غير\x20صالحة', 'description', 'GoecL', 'customerName', 'MdwDb', 'data:text/html;charset=utf-8,', 'DiDkT', 'بيانات\x20الدفعة\x20غير\x20مكتملة', 'barcode', 'supplierName', 'updateOne', 'sales_report.xlsx', 'SILPn', 'getDate', 'xp-80xv', 'salesData', 'data', 'utils', 'pyAjP', 'insertOne', 'LAlZt', 'openPath', 'SpBvc', 'drBMX', 'getPrintersAsync', '\x20-\x20', 'delete-products-purchase-invoice', 'whuGZ', 'tsqhi', 'expense', 'xjdTP', 'loadFile', 'xp-q815', 'fOWMV', 'address', 'key', 'اسم\x20المنتج', 'DJRsl', 'fYsKy', '6721143OdnLSD', 'nrfGM', 'mspeF', 'add-category', 'خطأ', 'Error\x20in\x20markInvoiceAsPaid:', 'delete-employee', 'application/pdf', 'expired', 'quantity', 'add-customer', 'البريد\x20الإلكتروني\x20وكلمة\x20المرور\x20مطلوبان.', 'application/json', 'ZpQxB', 'utf8', 'print\x20to\x20pdf', 'dymo', 'QlOCL', 'data:text/html;charset=UTF-8,', 'BwugA', 'get-treasury-summary', '30tzvLfy', 'zebra', 'mUrNJ', 'jSfsA', 'add-installment', 'PxOyT', 'Error\x20verifying\x20license:', 'ZrDWy', 'RYvPx', 'RTcMm', 'IKLqX', 'getVersion', 'log', 'markInvoiceAsPaid', 'includes', 'device\x20limit', 'handle', 'print-treasury-report', 'name', 'VALPJ', 'get-settings', 'pop', 'xps', 'add-treasury-transaction', 'delete-sale', 'TrxcH', 'aOpeU', 'API\x20Error:', 'iNKeq', 'thermal', 'المبيعات', 'print-invoice-to-pdf', 'SEqtK', 'now', 'mfpkI', 'ghUds', 'YAoZh', 'miNHh', 'mgBgo', 'close', 'oUKcN', '531666FINymw', 'get-default-printer-setting', 'digest', 'UcFUc', 'pDPct', 'object', 'Ylkyp', 'get-current-invoice-number', 'find', 'readFileAsDataURL', 'AgHuK', 'did-finish-load', 'VUxVy', 'insert', 'yoIGW', 'OQHtX', 'licensed', 'qzyvK', 'xp-80viii', 'xp-80ii', 'getAllWindows', 'pIWiy', 'barcode-', '88bHHexO', 'set-default-printer-setting', 'oWbqA', 'invoiceCounter-', 'totalAmount', 'showErrorBox', 'microsoft\x20print', 'setHours', 'kauKs', 'MRpFc', 'IRNtc', 'KLNgX', 'sdUiX', '3156606JiDjBW', 'tPMhs', 'login', ';base64,', 'receipt', 'error', 'getUserDataPath', 'aygjO', 'AUTRI', 'INV\x20-\x201\x20-\x20', 'save-sales-data', 'cnyyd', 'print-purchase-invoice', 'update-customer', 'xp-80vi', 'DhYDk', 'sender', 'VNXEf', 'treasury-report-', 'XMFcJ', 'createHash', 'OhjSh', 'VuDwB', 'PlUAj', 'uploadFile', 'resume-invoice', 'findOne', 'mhkMF', 'kGhKr', 'بيانات\x20المورد\x20غير\x20مكتملة', 'oAEQG', 'HTML/index.html', 'delete-suspended-invoice', 'toString', 'XP-80C', 'Askud', 'mUfNd', 'nShBM', 'catch', 'date', 'تم\x20إيقاف\x20مفتاح\x20الترخيص\x20من\x20قبل\x20المزود', 'JqUlb', 'deleteTreasuryTransaction', 'xp-80c', 'zfYxx', 'star', 'split', 'getTime', 'webContents', 'مفتاح\x20الترخيص\x20مطلوب!', 'update-login-credentials', 'forEach', 'add-products-purchase-invoice', 'get-all-printers', 'iQzKj', 'xp-q812', 'NVIgD', 'get-suppliers', 'avTKH', 'password', 'erelt', 'PWbqS', '_id', 'XbvDK', 'oki', 'QChnV', 'مبيعات\x20-\x20فاتورة\x20رقم\x20', 'base64', 'VuaTh', 'did-fail-load', 'HvcaI', 'getPath', 'الفاتورة\x20المعلقة\x20غير\x20موجودة', '7oohgDf', 'uXPSy', 'get-treasury-transactions', 'TMDSz', 'LKKQb', 'VHtnw', 'لم\x20يتم\x20العثور\x20على\x20أي\x20طابعات\x20متصلة.', 'update-supplier', 'mksPW', 'get-last-invoice-number', 'aoa_to_sheet', 'revenue', 'الإجمالي', 'unknown', 'xp-q811', 'dLfgt', 'add-product', 'KXCXw', 'png', 'sha256', 'amount', 'MKpLF', 'none', 'YwDYw', 'ixCbQ', 'purchaseInvoiceCounter', 'workAreaSize', 'xp-80vii', '1517283FxgJfw', 'filter', 'wWcEK', 'VQYUQ', 'تم\x20تجاوز\x20الحد\x20المسموح\x20للأجهزة\x20لهذا\x20المفتاح', 'LIkSZ', 'clear-cart', 'email', 'wpKWP', 'login-success', 'delete-supplier', 'dPLSr', 'xp-q807k', 'response', 'xp-80iv', 'image/jpeg', 'sequence', 'فشل\x20تحميل\x20نافذة\x20الترخيص', 'qqMYp', 'UFrSh', 'markInvoiceAsPaid\x20called\x20with\x20invoiceId:', 'some', 'documents', 'بيانات\x20الملف\x20غير\x20صالحة', '46555MEksxK', 'register', 'pdf', 'customerPhone', 'sDhNc', 'get-installments', 'getPrimaryDisplay', 'invoiceCounter', 'xfcNX', 'clear-password-hash', 'bixolon', 'xerox', 'update-product', 'get-next-purchase-invoice-number', 'yIkdp', 'yANUK', 'BKUgA', 'ppEwH', 'OGPeP', 'انتهت\x20صلاحية\x20المفتاح', 'بيانات\x20المبيعات\x20غير\x20مكتملة', 'QETqO', 'xp-q814', 'السعر', 'الكمية', 'SlnEu', 'productsPurchaseInvoiceCounter', 'HjLic', 'LOQTl', 'RHDWV', 'quit', 'dCKrP', 'printer', 'setDate', '2Ixlalq', 'xp-80', 'SJKEI', 'url', 'فشل\x20في\x20فتح\x20الملف:\x20', 'replace', 'BGBnZ', 'getAppPath', 'Error\x20opening\x20file\x20with\x20shell:', 'virtual', 'total', 'regionName', 'open-file-with-shell', 'YIbem', 'https://license-key-one.vercel.app/api/track-usage', 'get', 'brother', 'whenReady', 'zmctH', 'application/octet-stream', 'GGSHr', 'parse', 'كاش', 'epaCx', 'save-settings', 'createdByName', 'xp-80xi', 'yoWZn', 'EDctQ', 'التاريخ', 'Failed\x20to\x20get\x20all\x20printers:', 'LQCnm', 'LMVYq', 'arch', 'toLowerCase', 'NjFpK', 'mwkVf', 'user', 'MjphH', 'xp-80ix', 'get-sales-data', 'aEcre', 'ZRucF', 'data:', 'invoiceNumber', 'add-purchase-invoice', 'hostname', 'cLVoo', 'https://license-key-one.vercel.app/api/verify-license', 'get-suspended-invoices', 'bFNaB', 'XpbYW', 'xp-80x', 'settings', 'rciTD', 'activate', 'remove-from-cart', 'supplierId', 'ico', 'products', 'sato', 'createdAt', 'hex', 'wuBop', 'wWZTm', 'canon', '1993688hFOyKP', 'post', 'gViwY', 'الرصيد\x20أقل\x20من\x20100\x20جنيه', 'jHxza', 'OqVuW', 'QDjHO', 'GDQrh', 'oHFFa', 'city', 'price', 'FfZxC', 'fargo', 'zFpxp', 'wrWqo', 'No\x20suitable\x20printer\x20found,\x20saving\x20as\x20PDF\x20instead', 'KpDSu']; a0_0x5961 = function () { return _0x43fda0; }; return a0_0x5961(); } import { readFile } from 'fs/promises'; import { fileURLToPath, URL } from 'url'; import { dirname } from 'path'; import { createHash } from 'crypto'; import *as a0_0xa2f672 from 'xlsx'; import { writeFile, mkdir } from 'fs/promises'; import { existsSync } from 'fs'; import a0_0x310f70 from 'axios'; import a0_0x257033 from 'node-machine-id'; const { machineId } = a0_0x257033; import *as a0_0x2996c9 from 'os'; const __filename = fileURLToPath(import.meta[a0_0x1b8c3f(0x2d2)]), __dirname = dirname(__filename), licenseFilePath = join(app[a0_0x1b8c3f(0x277)](a0_0x1b8c3f(0x176)), a0_0x1b8c3f(0x1a4)), getNextCounter = async (_0x10e5db, _0x56ff7c) => { const _0x39b6bb = a0_0x1b8c3f, _0x1d10da = { 'oWJQs': function (_0x37d93f, _0x3bb8cd) { return _0x37d93f + _0x3bb8cd; } }, _0x544928 = new Date()['toISOString']()[_0x39b6bb(0x25e)]('T')[0x0]['replace'](/-/g, ''), _0x28e073 = _0x10e5db + '-' + _0x544928; let _0x19ceaf = await countersDB['findOne']({ '_id': _0x28e073 }); !_0x19ceaf && (_0x19ceaf = { '_id': _0x28e073, 'sequence': 0x0 }, await countersDB[_0x39b6bb(0x219)]({ '_id': _0x28e073, 'sequence': 0x0 })); const _0x4cc32f = _0x1d10da[_0x39b6bb(0x167)](_0x19ceaf[_0x39b6bb(0x2a5)], 0x1); return await countersDB[_0x39b6bb(0x1a6)]({ '_id': _0x28e073 }, { '$set': { 'sequence': _0x4cc32f } }, {}), _0x4cc32f; }, generateMachineId = async () => { const _0x148923 = a0_0x1b8c3f, _0x536908 = { 'nShBM': function (_0x398527) { return _0x398527(); }, 'YJtuR': 'crypto', 'mhkMF': _0x148923(0x28c), 'wWcEK': _0x148923(0x107) }; try { const _0x347d91 = await _0x536908[_0x148923(0x255)](machineId); return _0x347d91; } catch (_0x397f1b) { const _0x1410d1 = await import(_0x536908['YJtuR']), _0x1a7aa2 = _0x1410d1[_0x148923(0x244)](_0x536908[_0x148923(0x24b)]), _0x2a64ce = a0_0x2996c9[_0x148923(0xf7)]() + '-' + a0_0x2996c9[_0x148923(0xea)]() + '-' + a0_0x2996c9[_0x148923(0x17e)](); return _0x1a7aa2['update'](_0x2a64ce), _0x1a7aa2[_0x148923(0x20e)](_0x536908[_0x148923(0x297)]); } }, getLocationInfo = async () => { const _0x2475e7 = a0_0x1b8c3f, _0x55fd7c = { 'RTcMm': _0x2475e7(0x189), 'TxaNn': _0x2475e7(0x286) }; try { const _0x276414 = await a0_0x310f70[_0x2475e7(0x2de)](_0x55fd7c[_0x2475e7(0x1ec)], { 'timeout': 0x1388 }), _0x2a40fc = _0x276414[_0x2475e7(0x1b7)]; return { 'ip': _0x2a40fc['query'], 'country': _0x2a40fc[_0x2475e7(0x12f)], 'countryCode': _0x2a40fc['countryCode'], 'region': _0x2a40fc[_0x2475e7(0x2da)], 'city': _0x2a40fc[_0x2475e7(0x114)], 'timezone': _0x2a40fc[_0x2475e7(0x18e)] }; } catch (_0x83d61e) { return { 'ip': _0x55fd7c[_0x2475e7(0x158)], 'country': _0x55fd7c[_0x2475e7(0x158)], 'countryCode': _0x2475e7(0x286), 'region': _0x2475e7(0x286), 'city': _0x55fd7c[_0x2475e7(0x158)], 'timezone': 'unknown' }; } }, trackUsage = async (_0x369b1a, _0x5b13ec, _0x4c901a, _0x27f8fc, _0x137ac1) => { const _0x1f6fc2 = a0_0x1b8c3f, _0x4e8730 = { 'XwrHY': function (_0x5892a4) { return _0x5892a4(); }, 'rCqSv': _0x1f6fc2(0x1da), 'mfzii': 'Error\x20sending\x20track-usage:' }; try { const _0x2c6a15 = await _0x4e8730[_0x1f6fc2(0x146)](getLocationInfo), _0x5f568e = { 'licenseKey': _0x369b1a, 'machineId': _0x5b13ec, 'hostname': _0x4c901a, 'platform': _0x27f8fc, 'appVersion': _0x137ac1, 'location': _0x2c6a15 }; await a0_0x310f70[_0x1f6fc2(0x10c)](_0x1f6fc2(0x2dd), _0x5f568e, { 'headers': { 'Content-Type': _0x4e8730['rCqSv'] }, 'timeout': 0x2710 }); } catch (_0x327d6d) { console[_0x1f6fc2(0x235)](_0x4e8730['mfzii'], _0x327d6d['message']); } }, createWindow = async () => { const _0x1745c9 = a0_0x1b8c3f, _0x347744 = { 'BYZnK': _0x1745c9(0x170), 'CApVJ': _0x1745c9(0x17f), 'VPkmY': function (_0x256924, _0x175258, _0x376544) { return _0x256924(_0x175258, _0x376544); }, 'kauKs': function (_0x169708, _0x418230, _0x55435d) { return _0x169708(_0x418230, _0x55435d); }, 'VALPJ': 'HTML/splash.html', 'LIkSZ': 'Error\x20in\x20createWindow:' }; try { if (!await verifyLicense()) { app['quit'](); return; } try { await runDatabaseMigrations(app.getVersion()); } catch (migErr) { console.error('[Migration] Notice:', migErr); } const _0xca4297 = screen[_0x1745c9(0x2b3)](), { width: _0x305611, height: _0x2e2b7d } = _0xca4297[_0x1745c9(0x293)], _0x1f3030 = new BrowserWindow({ 'width': _0x305611, 'height': _0x2e2b7d, 'x': 0x0, 'y': 0x0, 'frame': !![], 'webPreferences': { 'preload': join(__dirname, 'preload.js') } }); _0x1f3030[_0x1745c9(0x1c6)](_0x347744[_0x1745c9(0x22b)](join, app['getAppPath'](), _0x347744[_0x1745c9(0x1f6)])), initAutoUpdater(_0x1f3030); _0x1f3030.setMenuBarVisibility(false); _0x1f3030.setAutoHideMenuBar(true); } catch (_0x28103d) { console[_0x1745c9(0x235)](_0x347744[_0x1745c9(0x29a)], _0x28103d), app[_0x1745c9(0x2cb)](); } }, printInvoiceToPDF = async (_0xcbe9c1, _0x281147, _0x12bf9f) => { const _0x31b599 = a0_0x1b8c3f, _0x230b23 = { 'SJKEI': function (_0x6fcb03, _0x2c4cc5) { return _0x6fcb03(_0x2c4cc5); }, 'KXCXw': function (_0x112d97, _0x2f9e7d) { return _0x112d97 === _0x2f9e7d; }, 'WaJek': _0x31b599(0x188), 'avTKH': function (_0xf6b5e, _0xa360e1, _0x2816cf) { return _0xf6b5e(_0xa360e1, _0x2816cf); }, 'qqMYp': _0x31b599(0x2ab) }, _0x24cfd0 = new BrowserWindow({ 'show': ![], 'webPreferences': { 'nodeIntegration': !![], 'contextIsolation': ![] } }); try { setTransactionBusy(true, 'طباعة الفاتورة PDF'); await _0x24cfd0[_0x31b599(0x155)](_0x31b599(0x1e0) + _0x230b23[_0x31b599(0x2d1)](encodeURIComponent, _0xcbe9c1)); const _0x236287 = { 'marginsType': 0x0, 'pageSize': _0x230b23[_0x31b599(0x28a)](_0x12bf9f, _0x230b23[_0x31b599(0x162)]) ? 'A6' : 'A4', 'printBackground': !![], 'printSelectionOnly': ![], 'landscape': ![], 'scale': _0x230b23[_0x31b599(0x28a)](_0x12bf9f, _0x230b23[_0x31b599(0x162)]) ? 0x1 : 0.8 }, _0x2de6ef = await _0x24cfd0['webContents']['printToPDF'](_0x236287), _0x5a915e = _0x230b23[_0x31b599(0x26a)](join, app['getPath'](_0x230b23[_0x31b599(0x2a7)]), 'invoice-' + _0x281147 + '-' + _0x12bf9f + _0x31b599(0x194)); await _0x230b23[_0x31b599(0x26a)](writeFile, _0x5a915e, _0x2de6ef); return _0x5a915e; } finally { setTransactionBusy(false); _0x24cfd0['close'](); } }, printBarcodeToPDF = async (_0x592c5f, _0x32f8dd, _0x3595fc) => { const _0x2a4cd1 = a0_0x1b8c3f, _0x1c4d60 = { 'DYPHa': function (_0x25d27c, _0x673cdc) { return _0x25d27c(_0x673cdc); }, 'SEqtK': function (_0x30a82c, _0xc70d67, _0x527017) { return _0x30a82c(_0xc70d67, _0x527017); }, 'msPpw': function (_0x51d86f, _0x34980d, _0x427461) { return _0x51d86f(_0x34980d, _0x427461); } }, _0x5547d5 = new BrowserWindow({ 'show': ![], 'webPreferences': { 'nodeIntegration': !![], 'contextIsolation': ![] } }); try { await _0x5547d5['loadURL'](_0x2a4cd1(0x1e0) + _0x1c4d60['DYPHa'](encodeURIComponent, _0x592c5f)); const _0x2dd3a1 = { 'marginsType': 0x0, 'pageSize': 'A6', 'printBackground': !![], 'printSelectionOnly': ![], 'landscape': ![], 'scale': 0x1 }, _0x1451d9 = await _0x5547d5['webContents'][_0x2a4cd1(0x13e)](_0x2dd3a1), _0x18917 = _0x1c4d60[_0x2a4cd1(0x203)](join, app[_0x2a4cd1(0x277)](_0x2a4cd1(0x2ab)), _0x2a4cd1(0x222) + _0x32f8dd + '-' + _0x3595fc + _0x2a4cd1(0x194)); return await _0x1c4d60[_0x2a4cd1(0x18d)](writeFile, _0x18917, _0x1451d9), _0x18917; } finally { _0x5547d5[_0x2a4cd1(0x20a)](); } }, printTreasuryReportToPDF = async _0x3d9570 => { const _0x41935e = a0_0x1b8c3f, _0x3d015d = { 'cLVoo': function (_0x5effff, _0x2168ef) { return _0x5effff(_0x2168ef); }, 'LQCnm': function (_0x25716b, _0x111dc7, _0x29dc90) { return _0x25716b(_0x111dc7, _0x29dc90); }, 'MjphH': _0x41935e(0x2ab), 'uYZGE': function (_0x4766b5, _0xfeb871, _0x5dee5d) { return _0x4766b5(_0xfeb871, _0x5dee5d); } }, _0x1e57c2 = new BrowserWindow({ 'show': ![], 'webPreferences': { 'nodeIntegration': !![], 'contextIsolation': ![] } }); try { await _0x1e57c2[_0x41935e(0x155)](_0x41935e(0x1e0) + _0x3d015d[_0x41935e(0xf8)](encodeURIComponent, _0x3d9570)); const _0x4e9c8e = { 'marginsType': 0x0, 'pageSize': 'A4', 'printBackground': !![], 'printSelectionOnly': ![], 'landscape': ![], 'scale': 0.8 }, _0x1ddcf9 = await _0x1e57c2[_0x41935e(0x260)][_0x41935e(0x13e)](_0x4e9c8e), _0x1c0405 = _0x3d015d[_0x41935e(0xe8)](join, app[_0x41935e(0x277)](_0x3d015d[_0x41935e(0xef)]), _0x41935e(0x242) + Date[_0x41935e(0x204)]() + _0x41935e(0x194)); return await _0x3d015d['uYZGE'](writeFile, _0x1c0405, _0x1ddcf9), _0x1c0405; } finally { _0x1e57c2[_0x41935e(0x20a)](); } }; async function getDefaultPOSPrinter() { const _0x559da5 = a0_0x1b8c3f, _0x4a9273 = { 'LAlZt': _0x559da5(0x1a5), 'xjdTP': _0x559da5(0x200), 'RGyCI': _0x559da5(0x25d), 'yoIGW': _0x559da5(0x2b7), 'UqPJF': _0x559da5(0x2df), 'JqUlb': _0x559da5(0x173), 'JUXea': _0x559da5(0x105), 'LMVYq': _0x559da5(0x1de), 'QChnV': _0x559da5(0x123), 'oUKcN': _0x559da5(0x117), 'whuGZ': _0x559da5(0x2b8), 'vCujh': 'lexmark', 'QCUMF': _0x559da5(0x13f), 'ppEwH': _0x559da5(0x25b), 'nuydS': _0x559da5(0x2d0), 'NjFpK': _0x559da5(0x21f), 'LKKQb': _0x559da5(0x127), 'pxCqE': _0x559da5(0x2a3), 'tOrUq': _0x559da5(0x23e), 'GoecL': _0x559da5(0x294), 'zmctH': _0x559da5(0x21e), 'taYLY': _0x559da5(0xf0), 'IKLqX': _0x559da5(0xe3), 'TMDSz': 'xp-80xii', 'HvcaI': 'xp-80xiv', 'ynkzC': 'xp-q807', 'XpbYW': 'xp-q808', 'BGBnZ': 'xp-q810', 'Hyzhg': _0x559da5(0x267), 'OGPeP': 'xp-q813', 'ZrDWy': _0x559da5(0x2c3), 'lCXdB': _0x559da5(0x1c7), 'gViwY': 'onenote', 'tCqHC': 'pdf', 'dHwDt': _0x559da5(0x1dd), 'DiDkT': _0x559da5(0x2cd), 'CYjnn': _0x559da5(0x129), 'Tyils': _0x559da5(0x19d), 'MdwDb': function (_0x35d74b, _0x5ae063) { return _0x35d74b > _0x5ae063; }, 'LXuSr': _0x559da5(0x175) }; try { const _0x4631bc = BrowserWindow[_0x559da5(0x220)]()[0x0], _0x4c80bc = await _0x4631bc['webContents']['getPrintersAsync'](); if (!_0x4c80bc || _0x4c80bc['length'] === 0x0) throw new Error(_0x559da5(0x27f)); const _userSet = await settingsDB.findOne({ _id: 'settings' }); if (_userSet && _userSet.defaultPrinter) { const _m = _0x4c80bc.find(_p => _p.name === _userSet.defaultPrinter); if (_m) return _m.name; } const _0x3b192a = [_0x4a9273[_0x559da5(0x1bb)], _0x559da5(0x234), _0x4a9273[_0x559da5(0x1c5)], 'epson', _0x4a9273[_0x559da5(0x124)], _0x4a9273[_0x559da5(0x21a)], _0x4a9273[_0x559da5(0x169)], 'hp', _0x559da5(0x10a), _0x559da5(0x1e4), 'citizen', _0x4a9273[_0x559da5(0x259)], _0x4a9273[_0x559da5(0x16c)], _0x4a9273[_0x559da5(0xe9)], _0x4a9273[_0x559da5(0x271)], _0x4a9273[_0x559da5(0x20b)], _0x4a9273[_0x559da5(0x1c2)], _0x4a9273['vCujh'], _0x559da5(0x270), 'ricoh', _0x4a9273['QCUMF'], 'minolta', 'xp', _0x4a9273[_0x559da5(0x2be)], _0x559da5(0x252), _0x4a9273['nuydS'], _0x4a9273[_0x559da5(0xec)], _0x4a9273[_0x559da5(0x27d)], _0x4a9273[_0x559da5(0x126)], 'xp-80v', _0x4a9273[_0x559da5(0x125)], _0x4a9273[_0x559da5(0x1a9)], _0x4a9273[_0x559da5(0xdb)], _0x4a9273['taYLY'], _0x559da5(0xfd), _0x4a9273[_0x559da5(0x1ed)], _0x4a9273[_0x559da5(0x27c)], 'xp-80xiii', _0x4a9273[_0x559da5(0x276)], _0x559da5(0x1b5), _0x559da5(0x2a1), 'XP-Q807K', _0x4a9273['ynkzC'], _0x4a9273[_0x559da5(0xfc)], _0x559da5(0x156), _0x4a9273[_0x559da5(0x2d5)], _0x559da5(0x287), _0x4a9273['Hyzhg'], _0x4a9273[_0x559da5(0x2bf)], _0x4a9273[_0x559da5(0x1ea)], _0x4a9273['lCXdB']], _0x4b1ea5 = [_0x4a9273[_0x559da5(0x10d)], _0x4a9273[_0x559da5(0x197)], _0x4a9273['dHwDt'], 'xps', _0x4a9273[_0x559da5(0x1ad)], _0x4a9273[_0x559da5(0x164)], _0x4a9273['Tyils'], _0x559da5(0x2d8), _0x559da5(0x229)]; let _0x4c7dab = _0x4c80bc['find'](_0x1e1d73 => { const _0x2f69d9 = _0x559da5, _0x1aeb4f = _0x1e1d73[_0x2f69d9(0x1f5)][_0x2f69d9(0xeb)](), _0x63da88 = _0x1e1d73[_0x2f69d9(0x1a8)][_0x2f69d9(0xeb)](), _0x50de6e = _0x4b1ea5['some'](_0x20b71a => _0x1aeb4f[_0x2f69d9(0x1f1)](_0x20b71a) || _0x63da88[_0x2f69d9(0x1f1)](_0x20b71a)); if (_0x50de6e) return ![]; return _0x3b192a[_0x2f69d9(0x2aa)](_0x4f14f2 => _0x1aeb4f[_0x2f69d9(0x1f1)](_0x4f14f2) || _0x63da88[_0x2f69d9(0x1f1)](_0x4f14f2)); }); if (!_0x4c7dab && _0x4a9273[_0x559da5(0x1ab)](_0x4c80bc[_0x559da5(0x14f)], 0x0)) { _0x4c7dab = _0x4c80bc[_0x559da5(0x214)](_0x2d2a00 => { const _0x112ce0 = _0x559da5, _0x11eb75 = _0x2d2a00['name'][_0x112ce0(0xeb)](), _0xc310aa = _0x2d2a00['description'][_0x112ce0(0xeb)](); return !_0x4b1ea5[_0x112ce0(0x2aa)](_0x394580 => _0x11eb75[_0x112ce0(0x1f1)](_0x394580) || _0xc310aa[_0x112ce0(0x1f1)](_0x394580)); }); if (!_0x4c7dab) throw new Error('لم\x20يتم\x20العثور\x20على\x20طابعة\x20مناسبة.'); } return _0x4c7dab['name']; } catch (_0x4b7736) { console[_0x559da5(0x235)](_0x4a9273['LXuSr'], _0x4b7736['message']); throw _0x4b7736; } } ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x282), async () => { const _0x7055c = a0_0x1b8c3f, _0x281043 = { 'WkUJM': function (_0x59ee37, _0x2e79a2) { return _0x59ee37 + _0x2e79a2; }, 'kJkfK': function (_0x3d8c1a, _0x4793f8) { return _0x3d8c1a > _0x4793f8; }, 'jSfsA': function (_0x5dd943, _0x54d99a, _0x356d95) { return _0x5dd943(_0x54d99a, _0x356d95); }, 'YwDYw': _0x7055c(0x2b4) }, _0x1e201b = new Date()['toISOString']()['split']('T')[0x0], _0x36f295 = await salesDB[_0x7055c(0x214)]({ 'date': { '$gte': _0x1e201b, '$lt': new Date(_0x1e201b)[_0x7055c(0x2ce)](_0x281043['WkUJM'](new Date(_0x1e201b)[_0x7055c(0x1b4)](), 0x1)) } })[_0x7055c(0x14a)]({ 'date': -0x1 })[_0x7055c(0x18b)](0x1); if (_0x281043[_0x7055c(0x153)](_0x36f295[_0x7055c(0x14f)], 0x0)) return _0x36f295[0x0]['invoiceNumber']; const _0x4eac99 = _0x1e201b[_0x7055c(0x2d4)](/-/g, ''), _0x3378aa = await _0x281043[_0x7055c(0x1e6)](getNextCounter, _0x281043[_0x7055c(0x290)], _0x4eac99); return 'INV\x20-\x20' + _0x3378aa + _0x7055c(0x1c0) + _0x4eac99; }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x213), async () => { const _0x355d3a = a0_0x1b8c3f, _0x133734 = { 'saAQI': function (_0x9557b4, _0x4f1646) { return _0x9557b4 * _0x4f1646; }, 'EjSZE': function (_0x3e25eb, _0x457b5d) { return _0x3e25eb * _0x457b5d; }, 'RHDWV': function (_0x6cc43, _0x564c22) { return _0x6cc43 < _0x564c22; } }, _0x1084e1 = new Date(), _0xca9aeb = _0x133734[_0x355d3a(0x134)](0x3, 0x3c), _0x192903 = new Date(_0x1084e1[_0x355d3a(0x25f)]() + _0x133734['EjSZE'](_0xca9aeb, 0x3c) * 0x3e8), _0x47fdc1 = _0x192903[_0x355d3a(0x199)]()['split']('T')[0x0][_0x355d3a(0x2d4)](/-/g, ''), _0x4ea5fa = new Date(_0x192903[_0x355d3a(0x199)]()['split']('T')[0x0]), _0x228d0f = new Date(_0x4ea5fa); _0x228d0f['setDate'](_0x4ea5fa['getDate']() + 0x1); const _0x5d9f43 = await salesDB['find']({ 'date': { '$gte': _0x4ea5fa['toISOString'](), '$lt': _0x228d0f[_0x355d3a(0x199)]() } })[_0x355d3a(0x14a)]({ 'date': -0x1 })[_0x355d3a(0x18b)](0x1), _0xd911e7 = _0x355d3a(0x226) + _0x47fdc1; let _0x1077b5 = await countersDB[_0x355d3a(0x24a)]({ '_id': _0xd911e7 }); if (_0x5d9f43[_0x355d3a(0x14f)] > 0x0) { const _0x193644 = _0x5d9f43[0x0][_0x355d3a(0xf5)], _0x34a3cb = parseInt(_0x193644[_0x355d3a(0x25e)]('-')[0x1]['trim']()); return (!_0x1077b5 || _0x133734[_0x355d3a(0x2ca)](_0x1077b5[_0x355d3a(0x2a5)], _0x34a3cb)) && await countersDB[_0x355d3a(0x1b1)]({ '_id': _0xd911e7 }, { '$set': { 'sequence': _0x34a3cb } }, { 'upsert': !![] }), _0x5d9f43[0x0]['invoiceNumber']; } if (!_0x1077b5) return await countersDB[_0x355d3a(0x1ba)]({ '_id': _0xd911e7, 'sequence': 0x1 }), _0x355d3a(0x239) + _0x47fdc1; return _0x355d3a(0x137) + _0x1077b5[_0x355d3a(0x2a5)] + '\x20-\x20' + _0x47fdc1; }), ipcMain[a0_0x1b8c3f(0x1f3)]('get-next-invoice-number', async () => { const _0x54d19b = a0_0x1b8c3f, _0x1191be = { 'DpPrY': function (_0x5982f2, _0x2725cd) { return _0x5982f2 + _0x2725cd; }, 'iNKeq': function (_0x16c6e2, _0x26c819) { return _0x16c6e2 * _0x26c819; }, 'MVsUT': function (_0x2f9fe3, _0x12d345) { return _0x2f9fe3(_0x12d345); } }, _0x5651ae = await salesDB[_0x54d19b(0x214)]()[_0x54d19b(0x14a)]({ 'date': -0x1 })[_0x54d19b(0x18b)](0x1), _0x343f37 = new Date(), _0x340b41 = 0x3 * 0x3c, _0x5633bb = new Date(_0x1191be[_0x54d19b(0x140)](_0x343f37[_0x54d19b(0x25f)](), _0x1191be[_0x54d19b(0x1ff)](_0x1191be[_0x54d19b(0x1ff)](_0x340b41, 0x3c), 0x3e8))), _0x3d7371 = _0x5633bb['toISOString']()[_0x54d19b(0x25e)]('T')[0x0][_0x54d19b(0x2d4)](/-/g, ''); if (_0x5651ae[_0x54d19b(0x14f)] > 0x0) { const _0x382099 = _0x5651ae[0x0][_0x54d19b(0xf5)], _0x41a737 = _0x1191be[_0x54d19b(0x145)](parseInt, _0x382099[_0x54d19b(0x25e)]('-')[0x1][_0x54d19b(0x165)]()); return _0x54d19b(0x137) + _0x1191be[_0x54d19b(0x140)](_0x41a737, 0x1) + _0x54d19b(0x1c0) + _0x3d7371; } return _0x54d19b(0x239) + _0x3d7371; }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x172), async (_0x5c4f16, _0x2cc407) => { const _0x8b300 = a0_0x1b8c3f; if (!_0x2cc407 || !_0x2cc407[_0x8b300(0x171)] || _0x2cc407[_0x8b300(0x171)][_0x8b300(0x14f)] === 0x0) throw new Error('لا\x20يمكن\x20تعليق\x20فاتورة\x20فارغة'); const _0xef62ec = { ..._0x2cc407, 'suspendedAt': new Date()[_0x8b300(0x199)](), 'id': _0x8b300(0x179) + Date[_0x8b300(0x204)]() + '_' + Math['random']()[_0x8b300(0x251)](0x24)[_0x8b300(0x150)](0x2, 0x9) }; return suspendedInvoicesDB[_0x8b300(0x219)](_0xef62ec); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0xfa), async () => { const _0x414d24 = a0_0x1b8c3f; return suspendedInvoicesDB[_0x414d24(0x214)]({})['sort']({ 'suspendedAt': -0x1 }); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x249), async (_0x5db46f, _0x33f787) => { const _0x5c7681 = a0_0x1b8c3f, _0x3b6e07 = { 'jHxza': _0x5c7681(0x278) }, _0x3aecbe = await suspendedInvoicesDB[_0x5c7681(0x24a)]({ 'id': _0x33f787 }); if (!_0x3aecbe) throw new Error(_0x3b6e07[_0x5c7681(0x10f)]); return await suspendedInvoicesDB[_0x5c7681(0x13a)]({ 'id': _0x33f787 }, {}), _0x3aecbe; }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x250), async (_0x123003, _0xe85c9b) => { const _0x1c4da8 = a0_0x1b8c3f; return suspendedInvoicesDB[_0x1c4da8(0x13a)]({ 'id': _0xe85c9b }, {}); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x202), async (_0x45316e, _0x5d9f47, _0x31b9b4, _0x482713) => { const _0xc4c5f1 = a0_0x1b8c3f, _0xa6072c = { 'wuBop': function (_0x1d0673, _0x5b264f, _0x54f2b1, _0x4f35bc) { return _0x1d0673(_0x5b264f, _0x54f2b1, _0x4f35bc); } }, _0x171792 = await _0xa6072c[_0xc4c5f1(0x108)](printInvoiceToPDF, _0x5d9f47, _0x31b9b4, _0x482713); return _0x171792; }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x236), () => { const _0x375cd9 = a0_0x1b8c3f, _0x2453f4 = { 'XbvDK': _0x375cd9(0x176) }; return app[_0x375cd9(0x277)](_0x2453f4[_0x375cd9(0x26f)]); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x1fa), async (_0x131f32, _0x2a4f14) => { const _0x3b97cf = a0_0x1b8c3f, _0x485083 = { 'wWZTm': 'بيانات\x20حركة\x20الخزنة\x20غير\x20مكتملة' }; if (!_0x2a4f14[_0x3b97cf(0x192)] || !_0x2a4f14['amount'] || !_0x2a4f14['description']) throw new Error(_0x485083[_0x3b97cf(0x109)]); return _0x2a4f14[_0x3b97cf(0x257)] = new Date()[_0x3b97cf(0x199)](), treasuryDB[_0x3b97cf(0x219)](_0x2a4f14); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x27b), async () => treasuryDB[a0_0x1b8c3f(0x214)]({})[a0_0x1b8c3f(0x14a)]({ 'date': -0x1 })), ipcMain['handle']('filter-treasury-transactions', async (_0x30d237, _0x21800e) => { const _0x54ec7c = a0_0x1b8c3f, _0x52a743 = { 'epaCx': function (_0x15c092, _0x560e60) { return _0x15c092(_0x560e60); } }; let _0x2ea482 = {}; if (_0x21800e[_0x54ec7c(0x257)]) { const _0x39f83f = new Date(_0x21800e[_0x54ec7c(0x257)]); _0x39f83f[_0x54ec7c(0x22a)](0x0, 0x0, 0x0, 0x0); const _0x3bad37 = new Date(_0x21800e['date']); _0x3bad37['setHours'](0x17, 0x3b, 0x3b, 0x3e7), _0x2ea482[_0x54ec7c(0x257)] = { '$gte': _0x39f83f[_0x54ec7c(0x199)](), '$lte': _0x3bad37[_0x54ec7c(0x199)]() }; } if (_0x21800e['type']) _0x2ea482[_0x54ec7c(0x192)] = _0x21800e[_0x54ec7c(0x192)]; if (_0x21800e[_0x54ec7c(0xee)]) _0x2ea482['user'] = _0x21800e[_0x54ec7c(0xee)]; if (_0x21800e[_0x54ec7c(0x28d)]) _0x2ea482[_0x54ec7c(0x28d)] = _0x52a743[_0x54ec7c(0xe0)](parseFloat, _0x21800e[_0x54ec7c(0x28d)]); return treasuryDB[_0x54ec7c(0x214)](_0x2ea482)[_0x54ec7c(0x14a)]({ 'date': -0x1 }); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x1e2), async () => { const _0x429f68 = a0_0x1b8c3f, _0x57f66e = { 'aOpeU': function (_0x34ab19, _0x474390) { return _0x34ab19 - _0x474390; }, 'ZRucF': function (_0x5a73bd, _0x4a5412) { return _0x5a73bd - _0x4a5412; }, 'ybJqb': function (_0x29bd60, _0x3c2a93) { return _0x29bd60 < _0x3c2a93; }, 'VDAPy': function (_0x20e7bc, _0x2af883) { return _0x20e7bc > _0x2af883; }, 'fYsKy': _0x429f68(0x160), 'sdUiX': function (_0xfa0657, _0x24986e) { return _0xfa0657 > _0x24986e; }, 'OQHtX': 'المرتجعات\x20اليوم\x20أكبر\x20من\x20الإيرادات' }, _0x29258f = await treasuryDB[_0x429f68(0x214)]({}), _0x446fc5 = _0x29258f['filter'](_0x3c9f22 => _0x3c9f22[_0x429f68(0x192)] === _0x429f68(0x284))[_0x429f68(0x17a)]((_0x2e98ae, _0x5e218d) => _0x2e98ae + parseFloat(_0x5e218d['amount']), 0x0), _0x8c3b6f = _0x29258f[_0x429f68(0x296)](_0x339eb5 => _0x339eb5[_0x429f68(0x192)] === 'expense')['reduce']((_0x41f33a, _0x3f2ea9) => _0x41f33a + parseFloat(_0x3f2ea9[_0x429f68(0x28d)]), 0x0), _0x12025b = _0x29258f[_0x429f68(0x296)](_0x5633ad => _0x5633ad[_0x429f68(0x192)] === _0x429f68(0x159))[_0x429f68(0x17a)]((_0x1344b4, _0x4e821b) => _0x1344b4 + parseFloat(_0x4e821b[_0x429f68(0x28d)]), 0x0), _0x4181e3 = _0x57f66e[_0x429f68(0x1fd)](_0x57f66e[_0x429f68(0xf3)](_0x446fc5, _0x8c3b6f), _0x12025b), _0x55cbac = new Date(); _0x55cbac[_0x429f68(0x22a)](0x0, 0x0, 0x0, 0x0); const _0x4cb41e = _0x29258f[_0x429f68(0x296)](_0x5290d0 => new Date(_0x5290d0['date']) >= _0x55cbac), _0x520d14 = _0x4cb41e[_0x429f68(0x296)](_0x630505 => _0x630505['type'] === _0x429f68(0x284))[_0x429f68(0x17a)]((_0x13b4a6, _0x2fb24b) => _0x13b4a6 + parseFloat(_0x2fb24b['amount']), 0x0), _0x2b4702 = _0x4cb41e[_0x429f68(0x296)](_0x44fb65 => _0x44fb65[_0x429f68(0x192)] === _0x429f68(0x1c4))[_0x429f68(0x17a)]((_0x4aff2d, _0x150c54) => _0x4aff2d + parseFloat(_0x150c54['amount']), 0x0), _0x145ea9 = _0x4cb41e[_0x429f68(0x296)](_0x59da99 => _0x59da99[_0x429f68(0x192)] === _0x429f68(0x159))[_0x429f68(0x17a)]((_0x4cc4f0, _0x490492) => _0x4cc4f0 + parseFloat(_0x490492[_0x429f68(0x28d)]), 0x0); return { 'balance': _0x4181e3, 'totalRevenue': _0x446fc5, 'totalExpense': _0x8c3b6f, 'totalReturned': _0x12025b, 'warnings': [_0x57f66e['ybJqb'](_0x4181e3, 0x64) ? _0x429f68(0x10e) : null, _0x57f66e[_0x429f68(0x15a)](_0x2b4702, _0x520d14) ? _0x57f66e[_0x429f68(0x1cd)] : null, _0x57f66e[_0x429f68(0x22f)](_0x145ea9, _0x520d14) ? _0x57f66e[_0x429f68(0x21b)] : null][_0x429f68(0x296)](Boolean) }; }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x1f4), async (_0x6c823c, _0x17b35d) => printTreasuryReportToPDF(_0x17b35d)), ipcMain[a0_0x1b8c3f(0x1f3)]('updateTreasuryTransaction', async (_0x5b6f63, _0x1663bf, _0x146b48) => { const _0xaaf79c = a0_0x1b8c3f; return treasuryDB[_0xaaf79c(0x1a6)]({ '_id': _0x1663bf }, { '$set': _0x146b48 }, {}); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x25a), async (_0x5e43a4, _0x498967) => { const _0x44f6cd = a0_0x1b8c3f; return treasuryDB[_0x44f6cd(0x13a)]({ '_id': _0x498967 }, {}); }); const sanitizeFileName = _0x554f13 => { const _0x5810cc = a0_0x1b8c3f; return _0x554f13['replace'](/[^a-zA-Z0-9.\-_]/g, '_')['replace'](/\s+/g, '_')[_0x5810cc(0x2d4)](/_+/g, '_')[_0x5810cc(0xeb)](); }; ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x248), async (_0x26811e, { arrayBuffer: _0x5b173e, name: _0x545446 }, _0x5b31bf) => { const _0x1a4b7b = a0_0x1b8c3f, _0x47877c = { 'csmKg': _0x1a4b7b(0x2ac), 'yoWZn': function (_0x51c721, _0x2932aa) { return _0x51c721(_0x2932aa); }, 'AKwCW': function (_0xd92b0f, _0x34acde, _0x4bbe01) { return _0xd92b0f(_0x34acde, _0x4bbe01); }, 'hwFJh': _0x1a4b7b(0x176), 'FmgHN': function (_0x57d08d, _0x30fe6d, _0x126b05) { return _0x57d08d(_0x30fe6d, _0x126b05); } }; if (!_0x5b173e || !_0x545446 || !_0x5b31bf) throw new Error(_0x47877c['csmKg']); const _0x3bbd6e = _0x47877c[_0x1a4b7b(0xe4)](sanitizeFileName, _0x545446), _0x1abb1a = _0x47877c['AKwCW'](join, app[_0x1a4b7b(0x277)](_0x47877c[_0x1a4b7b(0x17c)]), _0x5b31bf); if (!existsSync(_0x1abb1a)) await _0x47877c['AKwCW'](mkdir, _0x1abb1a, { 'recursive': !![] }); const _0x48e41b = _0x47877c[_0x1a4b7b(0x15b)](join, _0x1abb1a, _0x3bbd6e), _0x2da883 = Buffer[_0x1a4b7b(0x18c)](_0x5b173e); return await writeFile(_0x48e41b, _0x2da883), _0x47877c[_0x1a4b7b(0x15b)](join, _0x5b31bf, _0x3bbd6e); }), ipcMain['handle'](a0_0x1b8c3f(0x215), async (_0xf9bfe8, _0x1c0c81) => { const _0xd61726 = a0_0x1b8c3f, _0x1f6bf3 = { 'NVIgD': function (_0x658337, _0x528cd2, _0x53c811) { return _0x658337(_0x528cd2, _0x53c811); }, 'BwugA': _0xd61726(0x176), 'iQzKj': function (_0x2cfee4, _0x2b4192) { return _0x2cfee4(_0x2b4192); }, 'UcFUc': 'File\x20does\x20not\x20exist:', 'GDQrh': _0xd61726(0xdc), 'cOzuB': function (_0x3ff214, _0x26a25b) { return _0x3ff214 === _0x26a25b; }, 'kIeol': function (_0x338d9e, _0x4e5017) { return _0x338d9e === _0x4e5017; }, 'cSdlA': _0xd61726(0x2a4), 'yANUK': function (_0x26ca8c, _0x337b01) { return _0x26ca8c === _0x337b01; }, 'KwqBp': _0xd61726(0x28b), 'huxBV': 'image/png', 'Ylkyp': 'pdf', 'cnyyd': _0xd61726(0x1d5), 'IRNtc': function (_0x2b6ec4, _0x41db2f) { return _0x2b6ec4 === _0x41db2f; }, 'KpDSu': _0xd61726(0x103), 'QlOCL': _0xd61726(0x273) }; try { const _0x2f0f84 = _0x1f6bf3[_0xd61726(0x268)](join, app[_0xd61726(0x277)](_0x1f6bf3[_0xd61726(0x1e1)]), _0x1c0c81); if (!_0x1f6bf3[_0xd61726(0x266)](existsSync, _0x2f0f84)) { console['error'](_0x1f6bf3[_0xd61726(0x20f)], _0x2f0f84); throw new Error(_0xd61726(0x14e) + _0x2f0f84); } const _0x9ac498 = await _0x1f6bf3[_0xd61726(0x266)](readFile, _0x2f0f84), _0x57c899 = _0x1c0c81[_0xd61726(0x25e)]('.')[_0xd61726(0x1f8)]()[_0xd61726(0xeb)](); let _0x1fbbfc = _0x1f6bf3[_0xd61726(0x112)]; if (_0x1f6bf3[_0xd61726(0x185)](_0x57c899, 'jpeg') || _0x1f6bf3['kIeol'](_0x57c899, 'jpg')) _0x1fbbfc = _0x1f6bf3['cSdlA']; else { if (_0x1f6bf3[_0xd61726(0x2bc)](_0x57c899, _0x1f6bf3['KwqBp'])) _0x1fbbfc = _0x1f6bf3['huxBV']; else { if (_0x1f6bf3['yANUK'](_0x57c899, _0x1f6bf3[_0xd61726(0x212)])) _0x1fbbfc = _0x1f6bf3[_0xd61726(0x23b)]; else { if (_0x1f6bf3[_0xd61726(0x22d)](_0x57c899, _0x1f6bf3[_0xd61726(0x11b)])) _0x1fbbfc = 'image/x-icon'; } } } return _0xd61726(0xf4) + _0x1fbbfc + _0xd61726(0x233) + _0x9ac498[_0xd61726(0x251)](_0x1f6bf3[_0xd61726(0x1df)]); } catch (_0x21f62e) { console[_0xd61726(0x235)](_0xd61726(0x151), _0x21f62e[_0xd61726(0x152)]); throw _0x21f62e; } }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x289), async (_0x59b70c, _0x21d32c) => { const _0x452b73 = a0_0x1b8c3f; if (_0x21d32c[_0x452b73(0x1af)]) { const _0x44b2d5 = await productsDB['findOne']({ 'barcode': _0x21d32c[_0x452b73(0x1af)] }); if (_0x44b2d5) throw new Error('هذا\x20الباركود\x20مستخدم\x20بالفعل\x20لمنتج\x20آخر!'); } return productsDB[_0x452b73(0x219)](_0x21d32c); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x142), async () => productsDB[a0_0x1b8c3f(0x214)]({})), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x16d), async (_0x4cf5b9, _0x5421a5) => productsDB[a0_0x1b8c3f(0x13a)]({ '_id': _0x5421a5 }, {})), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x2b9), async (_0x1bd533, _0xfb1f4d, _0x4b420b) => { const _0x59d486 = a0_0x1b8c3f, _0x5266f4 = { 'bFNaB': 'هذا\x20الباركود\x20مستخدم\x20بالفعل\x20لمنتج\x20آخر!' }; if (_0x4b420b[_0x59d486(0x1af)]) { const _0x278efa = await productsDB['findOne']({ 'barcode': _0x4b420b[_0x59d486(0x1af)] }); if (_0x278efa && _0x278efa[_0x59d486(0x26e)] !== _0xfb1f4d) throw new Error(_0x5266f4[_0x59d486(0xfb)]); } return productsDB[_0x59d486(0x1a6)]({ '_id': _0xfb1f4d }, { '$set': _0x4b420b }, {}); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x1d1), async (_0x34dfa4, _0x311399) => categoriesDB[a0_0x1b8c3f(0x219)](_0x311399)), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x168), async () => categoriesDB[a0_0x1b8c3f(0x214)]({})), ipcMain['handle']('delete-category', async (_0x5f405b, _0x2d01dc) => categoriesDB[a0_0x1b8c3f(0x13a)]({ '_id': _0x2d01dc }, {})), ipcMain[a0_0x1b8c3f(0x1f3)]('update-category', async (_0x580437, _0x27592d, _0x43fd1d) => { const _0x20c330 = a0_0x1b8c3f, _0x464979 = { 'KHpMH': function (_0x56f52d, _0x3e9c15) { return _0x56f52d !== _0x3e9c15; } }, _0x2a7c26 = await categoriesDB[_0x20c330(0x24a)]({ 'name': _0x43fd1d['name'] }); if (_0x2a7c26 && _0x464979[_0x20c330(0x12e)](_0x2a7c26[_0x20c330(0x26e)], _0x27592d)) throw new Error(_0x20c330(0x182)); return categoriesDB[_0x20c330(0x1a6)]({ '_id': _0x27592d }, { '$set': _0x43fd1d }, {}); }), ipcMain[a0_0x1b8c3f(0x1f3)]('add-to-cart', async (_0x252a8d, _0x549e4d) => { const _0x5a1075 = a0_0x1b8c3f, _0x17ed61 = await cartDB['findOne']({ '_id': _0x549e4d[_0x5a1075(0x26e)] }); if (_0x17ed61) return cartDB[_0x5a1075(0x1a6)]({ '_id': _0x549e4d['_id'] }, { '$set': { 'quantity': _0x549e4d[_0x5a1075(0x1d7)] } }, {}); return cartDB['insert'](_0x549e4d); }), ipcMain[a0_0x1b8c3f(0x1f3)]('get-cart', async () => cartDB['find']({})), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x29b), async () => { return await cartDB['remove']({}, { 'multi': !![] }), { 'success': !![] }; }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x101), async (_0x90531d, _0x453b92) => cartDB['remove']({ '_id': _0x453b92 }, {})), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x1d8), async (_0x1597f6, _0x3e8678) => customersDB[a0_0x1b8c3f(0x219)](_0x3e8678)), ipcMain[a0_0x1b8c3f(0x1f3)]('get-customers', async () => customersDB[a0_0x1b8c3f(0x214)]({})), ipcMain[a0_0x1b8c3f(0x1f3)]('delete-customer', async (_0x505ce2, _0xc6b7fb) => customersDB[a0_0x1b8c3f(0x13a)]({ '_id': _0xc6b7fb }, {})), ipcMain['handle'](a0_0x1b8c3f(0x23d), async (_0x2f6d83, _0x2bc53b, _0x4bcd1e) => customersDB[a0_0x1b8c3f(0x1a6)]({ '_id': _0x2bc53b }, { '$set': _0x4bcd1e }, {})), ipcMain['handle'](a0_0x1b8c3f(0xf6), async (_0x31a637, _0x527dbd) => { const _0x4af67c = a0_0x1b8c3f, _0x241d8f = { 'QDjHO': 'بيانات\x20فاتورة\x20الشراء\x20غير\x20مكتملة' }; if (!_0x527dbd[_0x4af67c(0x1b0)] || !_0x527dbd[_0x4af67c(0x104)] || !_0x527dbd[_0x4af67c(0x227)]) throw new Error(_0x241d8f[_0x4af67c(0x111)]); return purchaseInvoicesDB['insert'](_0x527dbd); }), ipcMain['handle']('get-purchase-invoices', async () => purchaseInvoicesDB[a0_0x1b8c3f(0x214)]({})), ipcMain['handle']('delete-purchase-invoice', async (_0x3ce020, _0x205f7c) => purchaseInvoicesDB['remove']({ '_id': _0x205f7c }, {})), ipcMain['handle'](a0_0x1b8c3f(0x264), async (_0xe1d0dc, _0x451190) => { const _0x27b607 = a0_0x1b8c3f, _0x525d7b = { 'vjSYL': _0x27b607(0x16e) }; if (!_0x451190[_0x27b607(0x1b0)] || !_0x451190['supplierPhone'] || !_0x451190[_0x27b607(0xe2)] || !_0x451190['createdByPhone'] || !_0x451190['items'] || !_0x451190['totalAmount']) throw new Error(_0x525d7b[_0x27b607(0x14b)]); return productsPurchaseInvoicesDB[_0x27b607(0x219)](_0x451190); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x13b), async () => productsPurchaseInvoicesDB['find']({})), ipcMain['handle']('update-products-purchase-invoice', async (_0xc91ad5, _0x14c081, _0x51be49) => productsPurchaseInvoicesDB[a0_0x1b8c3f(0x1a6)]({ '_id': _0x14c081 }, { '$set': _0x51be49 }, {})), ipcMain['handle'](a0_0x1b8c3f(0x1c1), async (_0x2227ee, _0x11c4d7) => productsPurchaseInvoicesDB[a0_0x1b8c3f(0x13a)]({ '_id': _0x11c4d7 }, {})), ipcMain['handle']('get-next-products-purchase-invoice-number', async () => getNextCounter(a0_0x1b8c3f(0x2c7))), ipcMain['handle']('add-supplier', async (_0x550b2b, _0x313a60) => { const _0x2e4585 = a0_0x1b8c3f, _0x184f75 = { 'VUxVy': _0x2e4585(0x24d) }; if (!_0x313a60['name'] || !_0x313a60['phone'] || !_0x313a60[_0x2e4585(0x1c9)] || !_0x313a60[_0x2e4585(0x174)]) throw new Error(_0x184f75[_0x2e4585(0x218)]); return _0x313a60[_0x2e4585(0x13d)] = _0x313a60[_0x2e4585(0x13d)] || 0x0, suppliersDB[_0x2e4585(0x219)](_0x313a60); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x269), async () => suppliersDB[a0_0x1b8c3f(0x214)]({})), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x280), async (_0x4cc67f, _0x519c7d, _0x4650d6) => { return suppliersDB['update']({ '_id': _0x519c7d }, { '$set': _0x4650d6 }, {}); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x29f), async (_0x3d24f4, _0x39cc96) => { const _0x4b62ab = a0_0x1b8c3f; return suppliersDB[_0x4b62ab(0x13a)]({ '_id': _0x39cc96 }, {}); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x1f0), async (_0x3e7e0e, _0x40f2d3, _0x52c8ce) => { const _0x5e5baf = a0_0x1b8c3f, _0x1f3d51 = { 'CEAxK': _0x5e5baf(0x2a9), 'fOWMV': 'معرف\x20الفاتورة\x20غير\x20موجود', 'pgXbg': function (_0x2ea16b, _0x1da81c) { return _0x2ea16b || _0x1da81c; }, 'BkWGL': _0x5e5baf(0x1d3) }; try { console[_0x5e5baf(0x1ef)](_0x1f3d51[_0x5e5baf(0x133)], _0x40f2d3, _0x5e5baf(0xf4), _0x52c8ce); if (!_0x40f2d3) throw new Error(_0x1f3d51[_0x5e5baf(0x1c8)]); const _0x4378e7 = await productsPurchaseInvoicesDB[_0x5e5baf(0x1a6)]({ '_id': _0x40f2d3 }, { '$set': _0x52c8ce }, {}); if (_0x4378e7 === 0x0) throw new Error(_0x5e5baf(0x12b)); const _0x4c9871 = await productsPurchaseInvoicesDB[_0x5e5baf(0x24a)]({ '_id': _0x40f2d3 }); return _0x1f3d51['pgXbg'](_0x4c9871, { '_id': _0x40f2d3, ..._0x52c8ce }); } catch (_0x2c323b) { console[_0x5e5baf(0x235)](_0x1f3d51[_0x5e5baf(0x19e)], _0x2c323b); throw _0x2c323b; } }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x1e7), async (_0x2013ba, _0x416d67) => { const _0x72e908 = a0_0x1b8c3f, _0x289782 = { 'nQFGK': _0x72e908(0x1ae) }; if (!_0x416d67[_0x72e908(0x102)] || !_0x416d67[_0x72e908(0x28d)] || !_0x416d67['dueDate']) throw new Error(_0x289782['nQFGK']); return _0x416d67['status'] = _0x72e908(0x17b), _0x416d67[_0x72e908(0x106)] = new Date()[_0x72e908(0x199)](), installmentsDB[_0x72e908(0x219)](_0x416d67); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x2b2), async (_0x85fd7a, _0xfcf8fe) => { const _0x547c32 = a0_0x1b8c3f; return installmentsDB[_0x547c32(0x214)]({ 'supplierId': _0xfcf8fe })['sort']({ 'dueDate': 0x1 }); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x19b), async (_0x565730, _0x24b558, _0x14776a) => { const _0xa998de = a0_0x1b8c3f; return installmentsDB[_0xa998de(0x1a6)]({ '_id': _0x24b558 }, { '$set': _0x14776a }, {}); }), ipcMain['handle'](a0_0x1b8c3f(0x12a), async (_0x5a0141, _0x46a7b0) => { const _0x4fe9c8 = a0_0x1b8c3f; return installmentsDB[_0x4fe9c8(0x13a)]({ '_id': _0x46a7b0 }, {}); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x120), async (_0x45dbc1, _0x5b4cc3) => { const _0x29903f = a0_0x1b8c3f, _0xe335bc = { 'kGhKr': 'معرف\x20الدفعة\x20غير\x20موجود', 'huKhq': _0x29903f(0x12c), 'Ksqru': function (_0x2f64ed, _0x1016a3) { return _0x2f64ed === _0x1016a3; }, 'rciTD': function (_0x3d6924, _0x5eaa59) { return _0x3d6924 || _0x5eaa59; }, 'HjLic': _0x29903f(0x15e) }; if (!_0x5b4cc3) throw new Error(_0xe335bc[_0x29903f(0x24c)]); const _0x1530fe = await installmentsDB[_0x29903f(0x24a)]({ '_id': _0x5b4cc3 }); if (!_0x1530fe) throw new Error(_0xe335bc[_0x29903f(0x16f)]); const _0x4385a0 = await installmentsDB['update']({ '_id': _0x5b4cc3 }, { '$set': { 'status': _0x29903f(0x15e), 'paidAt': new Date()[_0x29903f(0x199)]() } }, {}); if (_0xe335bc[_0x29903f(0x190)](_0x4385a0, 0x0)) throw new Error('فشل\x20في\x20تحديث\x20حالة\x20الدفعة'); const _0x4779f4 = await installmentsDB[_0x29903f(0x24a)]({ '_id': _0x5b4cc3 }); return _0xe335bc[_0x29903f(0xff)](_0x4779f4, { '_id': _0x5b4cc3, 'status': _0xe335bc[_0x29903f(0x2c8)], 'paidAt': new Date()[_0x29903f(0x199)]() }); }), ipcMain[a0_0x1b8c3f(0x1f3)]('get-orders', async () => salesDB[a0_0x1b8c3f(0x214)]({})), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0xf1), async () => { const _0x2e93cd = a0_0x1b8c3f, _0x9e4265 = { 'GupWT': _0x2e93cd(0x1b6), 'FBlWl': function (_0x242b63, _0x5def79) { return _0x242b63 || _0x5def79; } }, _0x3dc114 = await statisticsDB['findOne']({ '_id': _0x9e4265['GupWT'] }); return _0x9e4265[_0x2e93cd(0x13c)](_0x3dc114, { '_id': _0x9e4265[_0x2e93cd(0x131)], 'daily': [], 'monthly': { 'sales': 0x0, 'month': '', 'previousSales': 0x0 }, 'yearly': { 'sales': 0x0, 'year': '', 'previousSales': 0x0 }, 'monthlyOrders': 0x0, 'yearlyOrders': 0x0 }); }), ipcMain['handle'](a0_0x1b8c3f(0x23a), async (_0x420f37, _0x243d5b) => { const _0x4dc065 = a0_0x1b8c3f, _0x16a1c3 = { 'hHlQc': function (_0x46ec66, _0x35b22e) { return _0x46ec66 !== _0x35b22e; }, 'oHFFa': _0x4dc065(0x211), 'GGSHr': _0x4dc065(0x1b6) }; if (!_0x243d5b || _0x16a1c3['hHlQc'](typeof _0x243d5b, _0x16a1c3[_0x4dc065(0x113)])) throw new Error('Invalid\x20sales\x20data\x20format'); setTransactionBusy(true, 'حفظ بيانات المبيعات الإحصائية'); try { const _0x1fb01e = await statisticsDB[_0x4dc065(0x1a6)]({ '_id': _0x16a1c3[_0x4dc065(0xdd)] }, { '$set': _0x243d5b }, { 'upsert': !![] }); return _0x1fb01e; } finally { setTransactionBusy(false); } }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0xe1), async (_0x62de9e, _0xda8dc8) => { const _0x3d7952 = a0_0x1b8c3f, _0x426743 = { 'LYXrl': 'settings' }, _0x519aa8 = { ..._0xda8dc8, '_id': _0x426743[_0x3d7952(0x198)] }; return await settingsDB[_0x3d7952(0x1a6)]({ '_id': _0x426743['LYXrl'] }, _0x519aa8, { 'upsert': !![] }), _0x519aa8; }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x1f7), async () => { const _0x41d5a8 = a0_0x1b8c3f, _0x40cb96 = await settingsDB[_0x41d5a8(0x24a)]({ '_id': 'settings' }); return _0x40cb96; }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x2ba), async () => getNextCounter(a0_0x1b8c3f(0x292))), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x16a), async (_0x4ad26a, _0x22bfe8) => {
    const _0x2184fa = a0_0x1b8c3f, _0x107b74 = { 'dLfgt': _0x2184fa(0x2c1), 'YeGWk': _0x2184fa(0xdf), 'SpBvc': _0x2184fa(0x16b), 'rcYXE': _0x2184fa(0x284) }; if (!_0x22bfe8[_0x2184fa(0x1aa)] || !_0x22bfe8['items'] || !_0x22bfe8['total']) throw new Error(_0x107b74[_0x2184fa(0x288)]); setTransactionBusy(true, 'معالجة عملية البيع وحفظ الفاتورة'); try {
        _0x22bfe8[_0x2184fa(0x257)] = _0x22bfe8[_0x2184fa(0x257)] || new Date()[_0x2184fa(0x199)](); const _0x3e83f6 = await customersDB[_0x2184fa(0x24a)]({ 'name': _0x22bfe8[_0x2184fa(0x1aa)] }); !_0x3e83f6 && await customersDB['insert']({ 'name': _0x22bfe8[_0x2184fa(0x1aa)], 'phone': _0x22bfe8[_0x2184fa(0x2b0)] || '', 'dateAdded': new Date()[_0x2184fa(0x199)]() }); let _0x15e7d8 = 'كاش';
        const pMethod = _0x22bfe8[_0x2184fa(0x174)] || 'cash';
        if (pMethod === 'split') {
            const sCash = _0x22bfe8.splitPayment?.cash != null ? parseFloat(_0x22bfe8.splitPayment.cash).toFixed(2) : '0.00';
            const sCard = _0x22bfe8.splitPayment?.card != null ? parseFloat(_0x22bfe8.splitPayment.card).toFixed(2) : '0.00';
            _0x15e7d8 = 'دفع مقسم (كاش: ' + sCash + ' ج.م + فيزا: ' + sCard + ' ج.م)';
        } else if (pMethod === 'credit') {
            _0x15e7d8 = 'آجل';
        } else if (pMethod === 'visaCard' || pMethod === 'card' || pMethod === 'visa') {
            _0x15e7d8 = 'فيزا / كارد';
        } else if (pMethod === 'vodafoneCash' || pMethod === 'wallet') {
            _0x15e7d8 = 'فودافون كاش';
        } else if (pMethod === 'cash') {
            _0x15e7d8 = 'كاش';
        } else {
            _0x15e7d8 = pMethod || 'كاش';
        }
        const _0x5a6813 = _0x2184fa(0x272) + _0x22bfe8[_0x2184fa(0xf5)] + ' (' + _0x15e7d8 + ')';
        const _0x404ceb = (await settingsDB[_0x2184fa(0x24a)]({ '_id': _0x2184fa(0xfe) }))?.[_0x2184fa(0x181)] || 'غير معروف';
        const _0x5e2840 = await treasuryDB[_0x2184fa(0x214)]({});
        if (!_0x5e2840['some'](_0x5e191c => _0x5e191c['description'] === _0x5a6813 && _0x5e191c[_0x2184fa(0xee)] === _0x404ceb)) {
            await treasuryDB[_0x2184fa(0x219)]({
                'date': new Date()[_0x2184fa(0x199)](),
                'type': _0x107b74[_0x2184fa(0x193)],
                'amount': _0x22bfe8[_0x2184fa(0x2d9)],
                'description': _0x5a6813,
                'user': _0x404ceb,
                'paymentMethod': pMethod,
                'splitPayment': pMethod === 'split' ? _0x22bfe8.splitPayment : null
            });
        }; const saleResult = await salesDB[_0x2184fa(0x219)](_0x22bfe8); return saleResult;
    } finally { setTransactionBusy(false); }
}), ipcMain[a0_0x1b8c3f(0x1f3)]('update-sale', async (_0x2ae28a, _0xed57b0, _0x181ff4) => { const _0x599223 = a0_0x1b8c3f; return salesDB[_0x599223(0x1a6)]({ '_id': _0xed57b0 }, { '$set': _0x181ff4 }, {}); }), ipcMain['handle'](a0_0x1b8c3f(0x143), async () => salesDB[a0_0x1b8c3f(0x214)]({})), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x1fb), async (_0x30bfe3, _0xedba26) => salesDB[a0_0x1b8c3f(0x13a)]({ '_id': _0xedba26 }, {})), ipcMain[a0_0x1b8c3f(0x1f3)]('print-invoice-to-pos', async (_0x1830f8, _0x452409, _0x58609b, _0x1c6a8e) => { const _0x38ae77 = a0_0x1b8c3f, _0x80190b = { 'SlnEu': _0x38ae77(0x28f), 'ghUds': function (_0x4efaa8, _0x875edd, _0x5f360d) { return _0x4efaa8(_0x875edd, _0x5f360d); }, 'SLsXh': _0x38ae77(0x147), 'mfpkI': _0x38ae77(0x217), 'fXVDL': _0x38ae77(0x275), 'Askud': _0x38ae77(0x252), 'Xpedm': function (_0x376a3c, _0x50e838) { return _0x376a3c(_0x50e838); }, 'QETqO': 'Error\x20in\x20print-invoice-to-pos:' }; try { setTransactionBusy(true, 'طباعة الفاتورة إلى طابعة الكاشير POS'); const _0x47fab7 = await getDefaultPOSPrinter() || _0x80190b[_0x38ae77(0x253)]; if (!_0x47fab7) { console['warn'](_0x38ae77(0x11a)); const _0x5bb1b0 = await printInvoiceToPDF(_0x452409, _0x58609b, _0x1c6a8e); return { 'success': ![], 'pdf': !![], 'filePath': _0x5bb1b0 }; } const _0x42b01f = new BrowserWindow({ 'show': ![], 'webPreferences': { 'nodeIntegration': !![], 'contextIsolation': ![], 'offscreen': !![] } }); await _0x42b01f[_0x38ae77(0x155)](_0x38ae77(0x1ac) + _0x80190b[_0x38ae77(0x19c)](encodeURIComponent, _0x452409)); const _0x50c3c7 = await new Promise((_0x549cab, _0x1f968f) => { const _0x21a58b = _0x38ae77, _0x3842f0 = { 'BKUgA': _0x80190b[_0x21a58b(0x2c6)], 'DxPcp': function (_0x41ddb2, _0x5405a4, _0x36d5f9) { const _0x1d25d7 = _0x21a58b; return _0x80190b[_0x1d25d7(0x206)](_0x41ddb2, _0x5405a4, _0x36d5f9); }, 'wZezT': _0x80190b[_0x21a58b(0x11f)] }; _0x42b01f['webContents']['on'](_0x80190b[_0x21a58b(0x205)], () => { const _0x3e79e2 = _0x21a58b, _0x5169dc = { 'xfcNX': 'Print\x20failed:', 'iADau': _0x3842f0[_0x3e79e2(0x2bd)] }; _0x3842f0['DxPcp'](setTimeout, () => { const _0x2bca2b = _0x3e79e2, _0x138018 = { 'TrxcH': function (_0x3d6316, _0x21895f) { return _0x3d6316(_0x21895f); }, 'VUuek': _0x5169dc[_0x2bca2b(0x2b5)] }; _0x42b01f[_0x2bca2b(0x260)]['print']({ 'silent': !![], 'deviceName': _0x47fab7, 'printBackground': !![], 'pageSize': { 'width': 0x13880, 'height': 0x61a80 }, 'margins': { 'marginType': _0x5169dc[_0x2bca2b(0x191)] }, 'headerFooterEnabled': ![], 'scaleFactor': 1.2 }, (_0x105a96, _0x4a4296) => { const _0x35c060 = _0x2bca2b; _0x42b01f['close'](), _0x105a96 ? _0x138018[_0x35c060(0x1fc)](_0x549cab, !![]) : (console[_0x35c060(0x235)](_0x138018['VUuek'], _0x4a4296), _0x138018[_0x35c060(0x1fc)](_0x1f968f, new Error(_0x35c060(0x163) + _0x4a4296))); }); }, 0x1f4); }), _0x42b01f[_0x21a58b(0x260)]['on'](_0x80190b[_0x21a58b(0x130)], (_0x4e901a, _0x54309d, _0x24504c) => { const _0x4b8ba7 = _0x21a58b; console[_0x4b8ba7(0x235)](_0x3842f0['wZezT'], _0x24504c), _0x42b01f[_0x4b8ba7(0x20a)](), _0x1f968f(new Error('فشل\x20في\x20تحميل\x20الفاتورة:\x20' + _0x24504c)); }); }); return { 'success': !![] }; } catch (_0x59f63f) { console[_0x38ae77(0x235)](_0x80190b[_0x38ae77(0x2c2)], _0x59f63f['message']); const _0x310858 = await printInvoiceToPDF(_0x452409, _0x58609b, _0x1c6a8e); return { 'success': ![], 'pdf': !![], 'filePath': _0x310858 }; } finally { setTransactionBusy(false); } }), ipcMain[a0_0x1b8c3f(0x1f3)]('print-invoice', async (_0x1eaaa6, _0x2ba8bb, _0x55136b, _0x5ef432) => { return printInvoiceToPDF(_0x2ba8bb, _0x55136b, _0x5ef432); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x23c), async (_0x20a750, _0x4b9333, _0x55adf1, _0x2b0c03) => printInvoiceToPDF(_0x4b9333, _0x55adf1, _0x2b0c03)), ipcMain[a0_0x1b8c3f(0x1f3)]('print-barcode', async (_0x138516, _0x59a195, _0x2d44ee, _0x2ccb37) => { const _0x5a7595 = a0_0x1b8c3f, _0x189ae7 = { 'pyAjP': function (_0x3184ea, _0x3d7f83, _0x14ef13, _0x2c0c39) { return _0x3184ea(_0x3d7f83, _0x14ef13, _0x2c0c39); } }, _0x24e713 = await _0x189ae7[_0x5a7595(0x1b9)](printBarcodeToPDF, _0x59a195, _0x2d44ee, _0x2ccb37); return _0x24e713; }), ipcMain[a0_0x1b8c3f(0x1f3)]('add-employee', async (_0x9c4b4c, _0x1507c8) => employeesDB[a0_0x1b8c3f(0x219)](_0x1507c8)), ipcMain[a0_0x1b8c3f(0x1f3)]('get-employees', async () => employeesDB[a0_0x1b8c3f(0x214)]({})), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x1d4), async (_0x4bd2ee, _0x1cbd1b) => employeesDB['remove']({ '_id': _0x1cbd1b }, {})), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x154), async (_0xc4d884, _0x5a30a6, _0x5d5c59) => employeesDB[a0_0x1b8c3f(0x1a6)]({ '_id': _0x5a30a6 }, { '$set': _0x5d5c59 }, {})), ipcMain['handle']('get-password-hash', async () => { const _0x1a4172 = a0_0x1b8c3f, _0x5cff7a = { 'VHtnw': _0x1a4172(0xfe) }, _0x4117cc = await settingsDB[_0x1a4172(0x24a)]({ '_id': _0x5cff7a[_0x1a4172(0x27e)] }); if (!_0x4117cc || !_0x4117cc[_0x1a4172(0x11c)]) return null; return _0x4117cc[_0x1a4172(0x11c)]; }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x18a), async (_0x2dec7c, _0x5db7dd) => { const _0x450e5a = a0_0x1b8c3f, _0x1eff3f = { 'VuaTh': function (_0x400bdd, _0xa0decd) { return _0x400bdd !== _0xa0decd; }, 'pTaah': 'string', 'CgOOo': _0x450e5a(0x1a7), 'mUfNd': function (_0x123d49, _0x3f2659) { return _0x123d49(_0x3f2659); }, 'uYCEV': 'sha256', 'dPLSr': 'hex' }; if (!_0x5db7dd || _0x1eff3f[_0x450e5a(0x274)](typeof _0x5db7dd, _0x1eff3f[_0x450e5a(0x12d)])) throw new Error(_0x1eff3f['CgOOo']); const _0x3ac45b = _0x1eff3f[_0x450e5a(0x254)](createHash, _0x1eff3f['uYCEV'])[_0x450e5a(0x1a6)](_0x5db7dd)[_0x450e5a(0x20e)](_0x1eff3f[_0x450e5a(0x2a0)]); return await settingsDB[_0x450e5a(0x1a6)]({ '_id': 'settings' }, { '$set': { 'employeePagePassword': _0x3ac45b } }, { 'upsert': !![] }), _0x3ac45b; }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x2b6), async () => { const _0x13152b = a0_0x1b8c3f; return await settingsDB['update']({ '_id': _0x13152b(0xfe) }, { '$unset': { 'employeePagePassword': '' } }, {}), !![]; }), ipcMain.handle('login', async (event, identifier, password) => { return await handleUserLogin(event, identifier, password); }), ipcMain.handle('update-login-credentials', async (event, email, password) => { return await handleLegacyUpdateLoginCredentials(email, password); }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x122), async (_0x52637f, _0x2b290e) => { const _0x58e21e = a0_0x1b8c3f, _0x2f3521 = { 'pIWiy': 'لا\x20توجد\x20مبيعات\x20لتصديرها\x20إلى\x20Excel.', 'AgHuK': _0x58e21e(0xe6), 'VuDwB': _0x58e21e(0x1cb), 'HPaUN': _0x58e21e(0x2c5), 'EDctQ': _0x58e21e(0x2c4), 'yifXD': function (_0x27be40, _0x8bde9c, _0x3d7984) { return _0x27be40(_0x8bde9c, _0x3d7984); }, 'jqnta': _0x58e21e(0x1b2) }; if (!_0x2b290e[_0x58e21e(0x14f)]) throw new Error(_0x2f3521[_0x58e21e(0x221)]); const _0x5253dd = [['رقم\x20الفاتورة', _0x2f3521[_0x58e21e(0x216)], _0x2f3521[_0x58e21e(0x246)], _0x2f3521[_0x58e21e(0x1a0)], _0x2f3521[_0x58e21e(0xe5)], _0x58e21e(0x285)]]; _0x2b290e[_0x58e21e(0x263)](_0x343489 => _0x343489['items']['forEach'](_0x24874d => _0x5253dd[_0x58e21e(0x144)]([_0x343489[_0x58e21e(0xf5)] || _0x58e21e(0x135), _0x343489[_0x58e21e(0x257)], _0x24874d[_0x58e21e(0x1f5)], _0x24874d['quantity'], _0x24874d[_0x58e21e(0x115)][_0x58e21e(0x11e)](0x2), _0x343489[_0x58e21e(0x2d9)]['toFixed'](0x2)]))); const _0x1d1a89 = a0_0xa2f672[_0x58e21e(0x1b8)][_0x58e21e(0x283)](_0x5253dd), _0x21cbcc = a0_0xa2f672[_0x58e21e(0x1b8)]['book_new'](); a0_0xa2f672[_0x58e21e(0x1b8)]['book_append_sheet'](_0x21cbcc, _0x1d1a89, _0x58e21e(0x201)); const _0x33ab30 = _0x2f3521['yifXD'](join, app['getPath']('documents'), _0x2f3521[_0x58e21e(0x196)]); return a0_0xa2f672['writeFile'](_0x21cbcc, _0x33ab30), _0x33ab30; }), ipcMain['handle'](a0_0x1b8c3f(0x2db), async (_0x379b45, _0x1de5a1) => { const _0x1f6ba4 = a0_0x1b8c3f, _0x45d20a = { 'sfKtU': _0x1f6ba4(0x2d7), 'exdJm': function (_0x315bec, _0x2713eb) { return _0x315bec + _0x2713eb; }, 'tPMhs': _0x1f6ba4(0x2d3) }; try { return await shell[_0x1f6ba4(0x1bc)](_0x1de5a1), !![]; } catch (_0x2d7a91) { console[_0x1f6ba4(0x235)](_0x45d20a['sfKtU'], _0x2d7a91); throw new Error(_0x45d20a['exdJm'](_0x45d20a[_0x1f6ba4(0x231)], _0x2d7a91[_0x1f6ba4(0x152)])); } }), ipcMain[a0_0x1b8c3f(0x1f3)]('getDefaultPOSPrinter', async () => { const _0x32e0e1 = a0_0x1b8c3f, _0x462628 = { 'aEcre': _0x32e0e1(0x27f), 'OqVuW': 'لم\x20يتم\x20العثور\x20على\x20طابعة\x20مناسبة.', 'ZpQxB': _0x32e0e1(0x175) }; try { const _0x30a406 = BrowserWindow['getAllWindows']()[0x0], _0x65a944 = await _0x30a406[_0x32e0e1(0x260)][_0x32e0e1(0x1bf)](); if (!_0x65a944 || _0x65a944[_0x32e0e1(0x14f)] === 0x0) throw new Error(_0x462628[_0x32e0e1(0xf2)]); let _0xe06553 = _0x65a944[_0x32e0e1(0x214)](_0x4dba8d => (_0x4dba8d[_0x32e0e1(0x1f5)][_0x32e0e1(0xeb)]()[_0x32e0e1(0x1f1)](_0x32e0e1(0x1a5)) || _0x4dba8d[_0x32e0e1(0x1f5)][_0x32e0e1(0xeb)]()[_0x32e0e1(0x1f1)](_0x32e0e1(0x234)) || _0x4dba8d[_0x32e0e1(0x1a8)][_0x32e0e1(0xeb)]()[_0x32e0e1(0x1f1)](_0x32e0e1(0x200))) && !_0x4dba8d[_0x32e0e1(0x1f5)][_0x32e0e1(0xeb)]()[_0x32e0e1(0x1f1)]('onenote') && !_0x4dba8d['name'][_0x32e0e1(0xeb)]()[_0x32e0e1(0x1f1)](_0x32e0e1(0x2af)) && !_0x4dba8d[_0x32e0e1(0x1f5)][_0x32e0e1(0xeb)]()[_0x32e0e1(0x1f1)]('print\x20to\x20pdf') && !_0x4dba8d[_0x32e0e1(0x1f5)][_0x32e0e1(0xeb)]()[_0x32e0e1(0x1f1)](_0x32e0e1(0x1f9)) && !_0x4dba8d[_0x32e0e1(0x1f5)]['toLowerCase']()[_0x32e0e1(0x1f1)](_0x32e0e1(0x19d))); if (!_0xe06553 && _0x65a944['length'] > 0x0) { _0xe06553 = _0x65a944[_0x32e0e1(0x214)](_0x39a31c => !_0x39a31c[_0x32e0e1(0x1f5)][_0x32e0e1(0xeb)]()[_0x32e0e1(0x1f1)](_0x32e0e1(0x1a2)) && !_0x39a31c[_0x32e0e1(0x1f5)][_0x32e0e1(0xeb)]()['includes'](_0x32e0e1(0x2af)) && !_0x39a31c[_0x32e0e1(0x1f5)]['toLowerCase']()[_0x32e0e1(0x1f1)]('xps') && !_0x39a31c[_0x32e0e1(0x1f5)][_0x32e0e1(0xeb)]()[_0x32e0e1(0x1f1)](_0x32e0e1(0x19d))); if (!_0xe06553) throw new Error(_0x462628[_0x32e0e1(0x110)]); } return _0xe06553['name']; } catch (_0x2a0a09) { console[_0x32e0e1(0x235)](_0x462628[_0x32e0e1(0x1db)], _0x2a0a09[_0x32e0e1(0x152)]); throw _0x2a0a09; } }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x265), async () => { const _0x5481b6 = a0_0x1b8c3f, _0x4d2fed = { 'RYvPx': _0x5481b6(0xe7) }; try { const _0x23d6e0 = BrowserWindow['getAllWindows']()[0x0], _0x38b388 = await _0x23d6e0['webContents']['getPrintersAsync'](); return _0x38b388 || []; } catch (_0x48a6cc) { console['error'](_0x4d2fed[_0x5481b6(0x1eb)], _0x48a6cc[_0x5481b6(0x152)]); throw _0x48a6cc; } }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x20d), async () => { const _0x1d2914 = a0_0x1b8c3f, _0xd34627 = await settingsDB['findOne']({ '_id': 'settings' }); return _0xd34627?.[_0x1d2914(0x121)] || null; }), ipcMain[a0_0x1b8c3f(0x1f3)](a0_0x1b8c3f(0x224), async (_0x3cf820, _0x3d9417) => { const _0x1b91a6 = a0_0x1b8c3f, _0x6c67ca = { 'dDIFm': 'settings' }; return await settingsDB[_0x1b91a6(0x1a6)]({ '_id': _0x6c67ca['dDIFm'] }, { '$set': { 'defaultPrinter': _0x3d9417 } }, { 'upsert': !![] }), !![]; }), app[a0_0x1b8c3f(0x2e0)]()['then'](createWindow), app['on']('window-all-closed', () => { const _0x489414 = a0_0x1b8c3f, _0x14e1ea = { 'PWbqS': function (_0x3bc005, _0x486b95) { return _0x3bc005 !== _0x486b95; }, 'DhYDk': _0x489414(0x11d) }; if (_0x14e1ea[_0x489414(0x26d)](process[_0x489414(0x17e)], _0x14e1ea[_0x489414(0x23f)])) app['quit'](); }), app['on'](a0_0x1b8c3f(0x100), () => { const _0x59a9a9 = a0_0x1b8c3f, _0x22b67e = { 'mUrNJ': function (_0x266aae, _0x4837ae) { return _0x266aae === _0x4837ae; }, 'NmoYz': function (_0x557030) { return _0x557030(); } }; if (_0x22b67e[_0x59a9a9(0x1e5)](BrowserWindow[_0x59a9a9(0x220)]()[_0x59a9a9(0x14f)], 0x0)) _0x22b67e[_0x59a9a9(0x132)](createWindow); }), ipcMain['on']('login-success', (_0x16ea3d, _0x129932) => { const _0x36604b = a0_0x1b8c3f, _0x41dbd4 = BrowserWindow['getFocusedWindow'](); if (_0x41dbd4 && _0x129932[_0x36604b(0x136)]) _0x41dbd4[_0x36604b(0x1c6)](_0x129932[_0x36604b(0x136)]); });

ipcMain.handle('save-excel-dialog', async (_event, { defaultFileName, arrayBuffer }) => {
    try {
        const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        const defaultPath = join(app.getPath('documents'), defaultFileName || 'report.xlsx');
        const { canceled, filePath } = await dialog.showSaveDialog(win, {
            title: 'حفظ وتصدير ملف Excel',
            defaultPath: defaultPath,
            filters: [
                { name: 'Excel Workbook (*.xlsx)', extensions: ['xlsx'] },
                { name: 'All Files (*.*)', extensions: ['*'] }
            ]
        });
        if (canceled || !filePath) return { canceled: true };
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filePath, buffer);
        return { success: true, filePath, canceled: false };
    } catch (err) {
        console.error('Error in save-excel-dialog:', err);
        throw err;
    }
});

ipcMain.handle('show-item-in-folder', async (_event, fullPath) => {
    try {
        if (fullPath) shell.showItemInFolder(fullPath);
        return true;
    } catch (err) {
        console.error('Error in show-item-in-folder:', err);
        return false;
    }
});

ipcMain.handle('open-path', async (_event, fullPath) => {
    try {
        if (fullPath) await shell.openPath(fullPath);
        return true;
    } catch (err) {
        console.error('Error in open-path:', err);
        return false;
    }
});

// ==========================================================================
// Backup & Restore Engine (نظام النسخ الاحتياطي واستعادة البيانات)
// ==========================================================================
async function collectAllDatabaseData() {
    const safeFind = async (db) => {
        try {
            if (db && typeof db.find === 'function') {
                return await db.find({});
            }
        } catch (e) {
            console.error('Error querying DB in backup:', e);
        }
        return [];
    };

    return {
        version: '1.0',
        system: 'Managely Cashier',
        timestamp: new Date().toISOString(),
        data: {
            products: await safeFind(productsDB),
            categories: await safeFind(categoriesDB),
            sales: await safeFind(salesDB),
            customers: await safeFind(customersDB),
            suppliers: await safeFind(suppliersDB),
            installments: await safeFind(installmentsDB),
            employees: await safeFind(employeesDB),
            treasury: await safeFind(treasuryDB),
            purchaseInvoices: await safeFind(purchaseInvoicesDB),
            productsPurchaseInvoices: await safeFind(productsPurchaseInvoicesDB),
            settings: await safeFind(settingsDB),
            counters: await safeFind(countersDB),
            statistics: await safeFind(statisticsDB),
            salesData: await safeFind(salesDataDB),
            suspendedInvoices: await safeFind(suspendedInvoicesDB),
            users: await safeFind(usersDB),
            currencies: await safeFind(currenciesDB)
        }
    };
}

async function restoreDatabaseData(backupPayload) {
    if (!backupPayload || !backupPayload.data) {
        throw new Error('ملف النسخة الاحتياطية غير صالح أو تالف');
    }
    const d = backupPayload.data;

    const restoreCollection = async (db, items) => {
        try {
            if (db && Array.isArray(items)) {
                await db.remove({}, { multi: true });
                if (items.length > 0) {
                    await db.insert(items);
                }
            }
        } catch (e) {
            console.error('Error restoring collection:', e);
        }
    };

    if (d.products) await restoreCollection(productsDB, d.products);
    if (d.categories) await restoreCollection(categoriesDB, d.categories);
    if (d.sales) await restoreCollection(salesDB, d.sales);
    if (d.customers) await restoreCollection(customersDB, d.customers);
    if (d.suppliers) await restoreCollection(suppliersDB, d.suppliers);
    if (d.installments) await restoreCollection(installmentsDB, d.installments);
    if (d.employees) await restoreCollection(employeesDB, d.employees);
    if (d.treasury) await restoreCollection(treasuryDB, d.treasury);
    if (d.purchaseInvoices) await restoreCollection(purchaseInvoicesDB, d.purchaseInvoices);
    if (d.productsPurchaseInvoices) await restoreCollection(productsPurchaseInvoicesDB, d.productsPurchaseInvoices);
    if (d.settings) await restoreCollection(settingsDB, d.settings);
    if (d.counters) await restoreCollection(countersDB, d.counters);
    if (d.statistics) await restoreCollection(statisticsDB, d.statistics);
    if (d.salesData) await restoreCollection(salesDataDB, d.salesData);
    if (d.suspendedInvoices) await restoreCollection(suspendedInvoicesDB, d.suspendedInvoices);
    if (d.users) await restoreCollection(usersDB, d.users);
    if (d.currencies) await restoreCollection(currenciesDB, d.currencies);

    return {
        success: true,
        restoredAt: new Date().toISOString(),
        itemsCount: {
            products: d.products?.length || 0,
            sales: d.sales?.length || 0,
            customers: d.customers?.length || 0,
            treasury: d.treasury?.length || 0
        }
    };
}

ipcMain.handle('create-backup', async (_event, options = {}) => {
    try {
        const backupData = await collectAllDatabaseData();
        const jsonStr = JSON.stringify(backupData, null, 2);
        const defaultName = `managely_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.mbk`;

        if (options.manualSave !== false) {
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'حفظ نسخة احتياطية من البيانات',
                defaultPath: defaultName,
                filters: [
                    { name: 'Managely Backup (*.mbk)', extensions: ['mbk'] },
                    { name: 'JSON Backup (*.json)', extensions: ['json'] },
                    { name: 'All Files (*.*)', extensions: ['*'] }
                ]
            });
            if (canceled || !filePath) return { canceled: true };
            await writeFile(filePath, jsonStr, 'utf8');
            return { success: true, filePath, canceled: false, timestamp: backupData.timestamp };
        } else {
            const backupDir = join(app.getPath('userData'), 'backups');
            if (!existsSync(backupDir)) await mkdir(backupDir, { recursive: true });
            const autoFilePath = join(backupDir, defaultName);
            await writeFile(autoFilePath, jsonStr, 'utf8');
            return { success: true, filePath: autoFilePath, canceled: false, timestamp: backupData.timestamp };
        }
    } catch (err) {
        console.error('Error creating backup:', err);
        throw err;
    }
});

ipcMain.handle('auto-backup', async () => {
    try {
        const backupData = await collectAllDatabaseData();
        const jsonStr = JSON.stringify(backupData, null, 2);
        const backupDir = join(app.getPath('userData'), 'backups');
        if (!existsSync(backupDir)) await mkdir(backupDir, { recursive: true });
        const defaultName = `auto_shift_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.mbk`;
        const autoFilePath = join(backupDir, defaultName);
        await writeFile(autoFilePath, jsonStr, 'utf8');
        return { success: true, filePath: autoFilePath, timestamp: backupData.timestamp };
    } catch (err) {
        console.error('Auto backup error:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('restore-backup', async () => {
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: 'اختيار ملف النسخة الاحتياطية للاستعادة',
            properties: ['openFile'],
            filters: [
                { name: 'Managely Backup (*.mbk;*.json)', extensions: ['mbk', 'json'] },
                { name: 'All Files (*.*)', extensions: ['*'] }
            ]
        });
        if (canceled || !filePaths || filePaths.length === 0) return { canceled: true };
        const content = await readFile(filePaths[0], 'utf8');
        const backupObj = JSON.parse(content);
        const result = await restoreDatabaseData(backupObj);
        return { ...result, filePath: filePaths[0], canceled: false };
    } catch (err) {
        console.error('Error restoring backup:', err);
        throw err;
    }
});

ipcMain.handle('get-backups', async () => {
    try {
        const backupDir = join(app.getPath('userData'), 'backups');
        if (!existsSync(backupDir)) return [];
        const { readdir, stat } = await import('fs/promises');
        const files = await readdir(backupDir);
        const result = [];
        for (const file of files) {
            if (file.endsWith('.mbk') || file.endsWith('.json')) {
                const fPath = join(backupDir, file);
                const s = await stat(fPath);
                result.push({
                    name: file,
                    path: fPath,
                    size: s.size,
                    createdAt: s.birthtime || s.mtime
                });
            }
        }
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return result.slice(0, 15);
    } catch (err) {
        console.error('Error listing backups:', err);
        return [];
    }
});

// ==========================================================================
// Bulk Products Import Engine (استيراد المنتجات المجمعة من Excel / CSV)
// ==========================================================================
ipcMain.handle('import-products-batch', async (_event, { products, duplicateStrategy = 'update', autoCreateCategories = true }) => {
    try {
        if (!Array.isArray(products) || products.length === 0) {
            throw new Error('لا توجد منتجات صالحة للاستيراد في الملف.');
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let newCategoriesCount = 0;
        const errors = [];

        // 1. Collect all existing categories & products for fast lookup
        const existingCategories = await categoriesDB.find({});
        const categoryMap = new Map();
        existingCategories.forEach(c => {
            if (c.name) categoryMap.set(c.name.trim().toLowerCase(), c);
        });

        const allExistingProducts = await productsDB.find({});
        const barcodeMap = new Map();
        const nameMap = new Map();
        allExistingProducts.forEach(p => {
            if (p.barcode) barcodeMap.set(p.barcode.toString().trim(), p);
            if (p.name) nameMap.set(p.name.trim().toLowerCase(), p);
        });

        // 2. Process each product
        for (let i = 0; i < products.length; i++) {
            const raw = products[i];
            const rowIndex = raw.rowIndex || (i + 1);

            const name = (raw.name || raw['اسم المنتج'] || raw['الاسم'] || '').toString().trim();
            if (!name) {
                errors.push(`صف #${rowIndex}: تم تخطيه لعدم وجود اسم للمنتج.`);
                skippedCount++;
                continue;
            }

            const categoryName = (raw.category || raw['الفئة'] || raw['التصنيف'] || 'عام').toString().trim() || 'عام';
            const price = parseFloat(raw.price ?? raw['سعر البيع'] ?? raw['سعر البيع (ج.م)'] ?? raw['السعر'] ?? 0) || 0;
            const purchasePrice = parseFloat(raw.purchasePrice ?? raw['سعر الشراء'] ?? raw['سعر الشراء (ج.م)'] ?? raw['التكلفة'] ?? 0) || 0;
            const quantity = parseInt(raw.quantity ?? raw['الكمية بالمخزون'] ?? raw['الكمية'] ?? raw['العدد'] ?? 0, 10) || 0;
            const barcode = (raw.barcode ?? raw['كود الباركود / SKU'] ?? raw['الباركود'] ?? raw['كود المنتج'] ?? '').toString().trim();
            const description = (raw.description ?? raw['وصف المنتج'] ?? raw['الوصف'] ?? raw['ملاحظات المنتج'] ?? raw['ملاحظات'] ?? '').toString().trim();
            const image = (raw.image ?? raw['صورة المنتج'] ?? '').toString().trim();

            // Auto-create category if not present
            if (autoCreateCategories && categoryName && !categoryMap.has(categoryName.toLowerCase())) {
                const newCat = {
                    name: categoryName,
                    createdAt: new Date().toISOString()
                };
                const insertedCat = await categoriesDB.insert(newCat);
                categoryMap.set(categoryName.toLowerCase(), insertedCat);
                newCategoriesCount++;
            }

            // Check if product already exists (by barcode, or by name if no barcode)
            let existingProd = null;
            if (barcode && barcodeMap.has(barcode)) {
                existingProd = barcodeMap.get(barcode);
            } else if (!barcode && nameMap.has(name.toLowerCase())) {
                existingProd = nameMap.get(name.toLowerCase());
            }

            if (existingProd) {
                if (duplicateStrategy === 'skip') {
                    skippedCount++;
                    continue;
                } else {
                    // Update existing product: update price and add quantity
                    const updatePayload = {
                        name: name || existingProd.name,
                        category: categoryName || existingProd.category,
                        price: price > 0 ? price : existingProd.price,
                        purchasePrice: purchasePrice > 0 ? purchasePrice : (existingProd.purchasePrice || 0),
                        quantity: (parseInt(existingProd.quantity, 10) || 0) + quantity,
                        description: description || existingProd.description || '',
                        updatedAt: new Date().toISOString()
                    };
                    if (barcode) updatePayload.barcode = barcode;
                    if (image) updatePayload.image = image;

                    await productsDB.update({ _id: existingProd._id }, { $set: updatePayload }, {});
                    updatedCount++;
                }
            } else {
                // Insert new product
                const newProduct = {
                    name,
                    category: categoryName,
                    price,
                    purchasePrice,
                    quantity,
                    barcode: barcode || '',
                    description,
                    image: image || '',
                    createdAt: new Date().toISOString()
                };
                const inserted = await productsDB.insert(newProduct);
                if (barcode) barcodeMap.set(barcode, inserted);
                nameMap.set(name.toLowerCase(), inserted);
                addedCount++;
            }
        }

        return {
            success: true,
            totalRows: products.length,
            addedCount,
            updatedCount,
            skippedCount,
            newCategoriesCount,
            errors
        };
    } catch (err) {
        console.error('Error in import-products-batch:', err);
        throw err;
    }
});

// ==========================================================================
// Multi-User & Granular Permissions Management Engine (نظام إدارة المستخدمين والصلاحيات)
// ==========================================================================

const FULL_ADMIN_PERMISSIONS = {
    pages: {
        home: true,
        salesInvoice: true,
        sales: true,
        products: true,
        categories: true,
        customers: true,
        suppliers: true,
        purchaseInvoices: true,
        productsPurchaseInvoices: true,
        returns: true,
        treasury: true,
        statistics: true,
        employees: true,
        printerSettings: true,
        settings: true,
        users: true
    },
    actions: {
        canApplyDiscount: true,
        canChangePrice: true,
        canDeleteCartItem: true,
        canSuspendInvoice: true,
        canDeleteSale: true,
        canExportSales: true,
        canAddProduct: true,
        canEditProduct: true,
        canDeleteProduct: true,
        canImportProducts: true,
        canExportProducts: true,
        canAddTreasuryIncome: true,
        canAddTreasuryExpense: true,
        canDeleteTreasuryTransaction: true,
        canCreateBackup: true,
        canRestoreBackup: true,
        canManageUsers: true
    }
};

async function ensurePrimaryAdminUser() {
    try {
        // Step 1: Normalize any existing records in usersDB
        const existingUsers = await usersDB.find({});
        for (const u of existingUsers) {
            let changed = false;
            const updates = {};
            if (!u.password && u.passwordHash) {
                updates.password = u.passwordHash;
                changed = true;
            }
            if (!u.username) {
                updates.username = (u.email || 'admin').toLowerCase();
                changed = true;
            }
            if (!u.status) {
                updates.status = u.isActive === false ? 'inactive' : 'active';
                changed = true;
            }
            if (u.role === 'super_admin' || u.isSuperAdmin) {
                updates.role = 'admin';
                updates.roleName = 'مدير عام';
                updates.isSuperAdmin = true;
                changed = true;
            }
            if (!u.permissions || !u.permissions.pages || !u.permissions.actions) {
                updates.permissions = JSON.parse(JSON.stringify(FULL_ADMIN_PERMISSIONS));
                changed = true;
            }
            if (changed) {
                await usersDB.update({ _id: u._id }, { $set: updates }, {});
            }
        }

        const usersCount = await usersDB.count({});
        if (usersCount > 0) return;

        const settings = await settingsDB.findOne({ _id: 'settings' });
        let adminUsername = 'admin';
        let adminEmail = 'admin@managely.com';
        let passwordHash = createHash('sha256').update('admin123').digest('hex');

        if (settings && settings.email) {
            adminUsername = settings.email.toLowerCase();
            adminEmail = settings.email.toLowerCase();
            if (settings.password) {
                passwordHash = settings.password;
            }
        }

        const primaryAdmin = {
            _id: 'admin_primary_' + Date.now(),
            name: 'المدير العام (الرئيسي)',
            username: adminUsername,
            email: adminEmail,
            phone: settings?.phoneNumbers?.[0] || '',
            password: passwordHash,
            role: 'admin',
            roleName: 'مدير عام',
            status: 'active',
            isSuperAdmin: true,
            permissions: JSON.parse(JSON.stringify(FULL_ADMIN_PERMISSIONS)),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await usersDB.insert(primaryAdmin);
        console.log('[Users] Initialized primary Super Admin user.');
    } catch (err) {
        console.error('[Users] Error ensuring primary admin user:', err);
    }
}

async function handleUserLogin(event, identifier, password) {
    if (!identifier || !password) {
        throw new Error('البريد الإلكتروني أو اسم المستخدم وكلمة المرور مطلوبان.');
    }

    await ensurePrimaryAdminUser();

    const cleanIdentifier = identifier.trim().toLowerCase();
    const inputHash = createHash('sha256').update(password.trim()).digest('hex');

    let user = await usersDB.findOne({
        $or: [
            { username: cleanIdentifier },
            { email: cleanIdentifier }
        ]
    });

    const settings = await settingsDB.findOne({ _id: 'settings' });
    const allUsers = await usersDB.find({});

    // First-time setup condition:
    // If settings has no password, OR isFirstTimeLogin is true, OR there is only the default initial admin with 'admin123'
    const defaultAdminHash = createHash('sha256').update('admin123').digest('hex');
    const isFirstTimeSetup = !settings?.password || 
                             settings?.isFirstTimeLogin === true || 
                             (allUsers.length === 1 && (allUsers[0].username === 'admin' || allUsers[0].email === 'admin@managely.com') && allUsers[0].password === defaultAdminHash);

    if (isFirstTimeSetup) {
        if (!user) {
            user = allUsers.find(u => u.isSuperAdmin || u.role === 'admin') || allUsers[0];
        }
        if (user && (user.isSuperAdmin || allUsers.length === 1)) {
            await usersDB.update({ _id: user._id }, {
                $set: {
                    name: user.name || 'المدير العام',
                    username: cleanIdentifier,
                    email: cleanIdentifier,
                    password: inputHash,
                    status: 'active',
                    isSuperAdmin: true,
                    role: 'admin',
                    roleName: 'مدير عام',
                    permissions: JSON.parse(JSON.stringify(FULL_ADMIN_PERMISSIONS)),
                    updatedAt: new Date().toISOString()
                }
            }, {});
            await settingsDB.update({ _id: 'settings' }, {
                $set: {
                    email: cleanIdentifier,
                    password: inputHash,
                    currentUser: user.name || cleanIdentifier,
                    isFirstTimeLogin: false
                }
            }, { upsert: true });

            user.username = cleanIdentifier;
            user.email = cleanIdentifier;
            user.password = inputHash;
            user.status = 'active';
            user.isSuperAdmin = true;
            user.role = 'admin';
            user.permissions = JSON.parse(JSON.stringify(FULL_ADMIN_PERMISSIONS));
        }
    }

    // Fallback search
    if (!user) {
        if (settings && (settings.email?.toLowerCase() === cleanIdentifier || cleanIdentifier === 'admin')) {
            if (settings.password === inputHash || !settings.password) {
                user = allUsers.find(u => u.isSuperAdmin || u.role === 'admin') || allUsers[0];
            }
        }
    }

    if (!user) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }

    if (user.status === 'inactive') {
        throw new Error('هذا الحساب معطل حالياً من قبل إدارة النظام. يرجى التواصل مع المسؤول.');
    }

    const storedHash = user.password || user.passwordHash;

    if (storedHash !== inputHash) {
        // If settings.password matches, sync
        if (settings?.password === inputHash && (user.isSuperAdmin || user.role === 'admin')) {
            await usersDB.update({ _id: user._id }, { $set: { password: inputHash } }, {});
            user.password = inputHash;
        } else {
            // Check legacy placeholder hash or single user fallback
            const isLegacyPlaceholder = !storedHash || storedHash === defaultAdminHash;
            if (isLegacyPlaceholder && (user.isSuperAdmin || allUsers.length === 1)) {
                await usersDB.update({ _id: user._id }, { $set: { password: inputHash, status: 'active' } }, {});
                await settingsDB.update({ _id: 'settings' }, { $set: { email: cleanIdentifier, password: inputHash, currentUser: user.name || cleanIdentifier } }, { upsert: true });
                user.password = inputHash;
            } else {
                throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
            }
        }
    }

    // Update active session metadata
    await settingsDB.update({ _id: 'settings' }, { $set: { currentUser: user.name || user.username } }, { upsert: true });
    await usersDB.update({ _id: user._id }, { $set: { lastLoginAt: new Date().toISOString() } }, {});

    const { password: _p, passwordHash: _ph, ...safeUser } = user;
    if (!safeUser.permissions) {
        safeUser.permissions = JSON.parse(JSON.stringify(FULL_ADMIN_PERMISSIONS));
    }
    return {
        success: true,
        user: safeUser
    };
}

async function handleLegacyUpdateLoginCredentials(email, password) {
    if (!email || !password) throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان.');
    const passwordHash = createHash('sha256').update(password.trim()).digest('hex');
    
    // Update settingsDB
    await settingsDB.update({ _id: 'settings' }, { $set: { email: email.trim().toLowerCase(), password: passwordHash, currentUser: email.trim() } }, { upsert: true });
    
    // Update primary super admin in usersDB
    await ensurePrimaryAdminUser();
    const superAdmin = await usersDB.findOne({ isSuperAdmin: true }) || await usersDB.findOne({ role: 'admin' });
    if (superAdmin) {
        await usersDB.update({ _id: superAdmin._id }, {
            $set: {
                username: email.trim().toLowerCase(),
                email: email.trim().toLowerCase(),
                password: passwordHash,
                updatedAt: new Date().toISOString()
            }
        }, {});
    }
    return true;
}

// User CRUD IPC Handlers
ipcMain.handle('get-users', async () => {
    try {
        await ensurePrimaryAdminUser();
        const users = await usersDB.find({});
        users.sort((a, b) => {
            if (a.isSuperAdmin) return -1;
            if (b.isSuperAdmin) return 1;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        return users.map(u => {
            const { password, ...safeUser } = u;
            return safeUser;
        });
    } catch (err) {
        console.error('Error in get-users:', err);
        throw err;
    }
});

ipcMain.handle('get-user-by-id', async (_event, userId) => {
    try {
        if (!userId) throw new Error('معرف المستخدم مطلوب');
        const user = await usersDB.findOne({ _id: userId });
        if (!user) throw new Error('المستخدم غير موجود');
        const { password, ...safeUser } = user;
        return safeUser;
    } catch (err) {
        console.error('Error in get-user-by-id:', err);
        throw err;
    }
});

ipcMain.handle('add-user', async (_event, userData) => {
    try {
        if (!userData || !userData.name || !userData.username || !userData.password) {
            throw new Error('بيانات المستخدم غير مكتملة (الاسم الكامل، اسم الدخول، وكلمة المرور مطلوبة)');
        }

        const cleanUsername = userData.username.trim().toLowerCase();
        const cleanEmail = (userData.email || '').trim().toLowerCase();

        // Validate duplicates
        const orConditions = [{ username: cleanUsername }];
        if (cleanEmail) orConditions.push({ email: cleanEmail });

        const existing = await usersDB.findOne({ $or: orConditions });
        if (existing) {
            throw new Error('اسم الدخول أو البريد الإلكتروني مسجل بالفعل لمستخدم آخر!');
        }

        const passwordHash = createHash('sha256').update(userData.password.trim()).digest('hex');
        const newUser = {
            name: userData.name.trim(),
            username: cleanUsername,
            email: cleanEmail,
            phone: (userData.phone || '').trim(),
            password: passwordHash,
            role: userData.role || 'custom',
            roleName: userData.roleName || 'مخصص',
            status: userData.status === 'inactive' ? 'inactive' : 'active',
            isSuperAdmin: false,
            permissions: userData.permissions || JSON.parse(JSON.stringify(FULL_ADMIN_PERMISSIONS)),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const inserted = await usersDB.insert(newUser);
        const { password, ...safeUser } = inserted;
        return safeUser;
    } catch (err) {
        console.error('Error in add-user:', err);
        throw err;
    }
});

ipcMain.handle('update-user', async (_event, userId, updatedData) => {
    try {
        if (!userId || !updatedData) throw new Error('بيانات التحديث غير صالحة');
        const existingUser = await usersDB.findOne({ _id: userId });
        if (!existingUser) throw new Error('المستخدم غير موجود');

        const cleanUsername = updatedData.username ? updatedData.username.trim().toLowerCase() : existingUser.username;
        const cleanEmail = updatedData.email !== undefined ? updatedData.email.trim().toLowerCase() : existingUser.email;

        // Check for duplicates
        if (cleanUsername !== existingUser.username || (cleanEmail && cleanEmail !== existingUser.email)) {
            const orConditions = [{ username: cleanUsername }];
            if (cleanEmail) orConditions.push({ email: cleanEmail });

            const duplicate = await usersDB.findOne({
                _id: { $ne: userId },
                $or: orConditions
            });
            if (duplicate) throw new Error('اسم الدخول أو البريد الإلكتروني مسجل بالفعل لمستخدم آخر!');
        }

        const isSuper = !!existingUser.isSuperAdmin;
        const updatePayload = {
            name: updatedData.name ? updatedData.name.trim() : existingUser.name,
            username: cleanUsername,
            email: cleanEmail,
            phone: updatedData.phone !== undefined ? updatedData.phone.trim() : existingUser.phone,
            role: isSuper ? 'admin' : (updatedData.role || existingUser.role),
            roleName: isSuper ? 'مدير عام' : (updatedData.roleName || existingUser.roleName),
            status: isSuper ? 'active' : (updatedData.status || existingUser.status),
            permissions: isSuper ? existingUser.permissions : (updatedData.permissions || existingUser.permissions),
            updatedAt: new Date().toISOString()
        };

        if (updatedData.password && updatedData.password.trim() !== '') {
            updatePayload.password = createHash('sha256').update(updatedData.password.trim()).digest('hex');
        }

        await usersDB.update({ _id: userId }, { $set: updatePayload }, {});
        const updated = await usersDB.findOne({ _id: userId });
        const { password, ...safeUser } = updated;
        return safeUser;
    } catch (err) {
        console.error('Error in update-user:', err);
        throw err;
    }
});

ipcMain.handle('delete-user', async (_event, userId) => {
    try {
        if (!userId) throw new Error('معرف المستخدم مطلوب');
        const user = await usersDB.findOne({ _id: userId });
        if (!user) throw new Error('المستخدم غير موجود');
        if (user.isSuperAdmin) {
            throw new Error('لا يمكن حذف حساب المدير العام الأساسي للنظام!');
        }

        const adminsCount = await usersDB.count({ role: 'admin', status: 'active', _id: { $ne: userId } });
        if (user.role === 'admin' && adminsCount === 0) {
            throw new Error('لا يمكن حذف هذا المستخدم لأنه المدير النشط الوحيد المتبقي!');
        }

        await usersDB.remove({ _id: userId }, {});
        return { success: true };
    } catch (err) {
        console.error('Error in delete-user:', err);
        throw err;
    }
});

ipcMain.handle('change-user-password', async (_event, userId, newPassword) => {
    try {
        if (!userId || !newPassword) throw new Error('معرف المستخدم وكلمة المرور الجديدة مطلوبان');
        if (newPassword.trim().length < 4) throw new Error('كلمة المرور يجب أن لا تقل عن 4 أحرف');
        const user = await usersDB.findOne({ _id: userId });
        if (!user) throw new Error('المستخدم غير موجود');

        const passwordHash = createHash('sha256').update(newPassword.trim()).digest('hex');
        await usersDB.update({ _id: userId }, { $set: { password: passwordHash, updatedAt: new Date().toISOString() } }, {});
        return { success: true };
    } catch (err) {
        console.error('Error in change-user-password:', err);
        throw err;
    }
});

// Remembered Session / Auto-Login IPC Handlers
ipcMain.handle('get-remembered-session', async () => {
    try {
        const settings = await settingsDB.findOne({ _id: 'settings' });
        if (settings && settings.rememberedSession) {
            const session = settings.rememberedSession;
            if (session.expiresAt && Date.now() > session.expiresAt) {
                await settingsDB.update({ _id: 'settings' }, { $unset: { rememberedSession: '' } }, {});
                return null;
            }
            return session;
        }
        return null;
    } catch (e) {
        console.error('[Session] Error getting remembered session:', e);
        return null;
    }
});

ipcMain.handle('save-remembered-session', async (_event, sessionData) => {
    try {
        await settingsDB.update(
            { _id: 'settings' },
            { $set: { rememberedSession: sessionData } },
            { upsert: true }
        );
        return true;
    } catch (e) {
        console.error('[Session] Error saving remembered session:', e);
        return false;
    }
});

ipcMain.handle('clear-remembered-session', async () => {
    try {
        await settingsDB.update(
            { _id: 'settings' },
            { $unset: { rememberedSession: '' } },
            {}
        );
        return true;
    } catch (e) {
        console.error('[Session] Error clearing remembered session:', e);
        return false;
    }
});

// ==========================================================================
// Network & Multi-Device Sync Engine (نظام الربط الشبكي ومزامنة الأجهزة عن بعد)
// ==========================================================================
import {
    loadNetworkConfig,
    saveNetworkConfig,
    discoverNetworkIPs,
    masterServerInstance,
    networkClientInstance,
    actionRegistry
} from './network-service.js';

import { supabaseSyncInstance } from './supabase-sync.js';

// Auto-start or configure on startup
(async function initNetworkSystem() {
    try {
        const netConfig = loadNetworkConfig();
        if (netConfig.mode === 'server') {
            console.log(`[Network] Starting POS Master Server on port ${netConfig.serverPort || 4545}...`);
            await masterServerInstance.start(netConfig.serverPort || 4545);
        } else if (netConfig.mode === 'client' || netConfig.mode === 'cloud_custom' || netConfig.mode === 'cloud_key') {
            console.log(`[Network] Configured for ${netConfig.mode} mode.`);
            networkClientInstance.updateConfig(netConfig);
        }

        if (netConfig.mode === 'cloud_custom' || netConfig.mode === 'cloud_key') {
            supabaseSyncInstance.startPolling();
        }
    } catch (err) {
        console.error('[Network] Init error:', err);
    }
})();

// Network Configuration & Control Handlers
ipcMain.handle('network:get-config', async () => {
    try {
        const config = loadNetworkConfig();
        const ips = discoverNetworkIPs();
        let isServerOnline = masterServerInstance.isRunning;
        let clientStatus = null;

        if (config.mode === 'client') {
            clientStatus = await networkClientInstance.testConnection();
        } else if (config.mode === 'cloud_key') {
            clientStatus = await networkClientInstance.testCloudKey(config.cloudSyncKey, config.cloudBranchName);
        } else if (config.mode === 'cloud_custom') {
            clientStatus = await networkClientInstance.testCustomCloud(config.cloudCustomUrl, config.cloudApiKey, config.securityPin);
        }

        return {
            config,
            ips,
            isServerRunning: isServerOnline,
            clientStatus
        };
    } catch (err) {
        console.error('Error in network:get-config:', err);
        throw err;
    }
});

ipcMain.handle('network:save-config', async (_event, newConfig) => {
    try {
        const updated = saveNetworkConfig(newConfig);
        
        if (updated.mode === 'server') {
            await masterServerInstance.start(updated.serverPort || 4545);
        } else {
            await masterServerInstance.stop();
        }

        networkClientInstance.updateConfig(updated);

        if (updated.mode === 'cloud_custom' || updated.mode === 'cloud_key') {
            supabaseSyncInstance.startPolling();
        } else {
            supabaseSyncInstance.stopPolling();
        }

        return { success: true, config: updated };
    } catch (err) {
        console.error('Error in network:save-config:', err);
        throw err;
    }
});

ipcMain.handle('network:sync-upload-all', async () => {
    try {
        return await supabaseSyncInstance.fullUploadLocalToCloud();
    } catch (err) {
        console.error('Error in network:sync-upload-all:', err);
        throw err;
    }
});

ipcMain.handle('network:sync-download-all', async () => {
    try {
        return await supabaseSyncInstance.fullDownloadCloudToLocal();
    } catch (err) {
        console.error('Error in network:sync-download-all:', err);
        throw err;
    }
});

ipcMain.handle('network:test-connection', async (_event, host, port) => {
    try {
        return await networkClientInstance.testConnection(host, port);
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('network:test-cloud-key', async (_event, cloudSyncKey, cloudBranchName) => {
    try {
        return await networkClientInstance.testCloudKey(cloudSyncKey, cloudBranchName);
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('network:test-custom-cloud', async (_event, customUrl, apiKey, securityPin) => {
    try {
        return await networkClientInstance.testCustomCloud(customUrl, apiKey, securityPin);
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('network:get-ips', async () => {
    return discoverNetworkIPs();
});

// Dynamic Data Router: If in Client or Custom Cloud Mode, delegate to Remote/Cloud Server
const NETWORK_ROUTED_CHANNELS = [
    'get-products', 'add-product', 'update-product', 'delete-product',
    'get-categories', 'add-category', 'update-category', 'delete-category',
    'add-to-cart', 'get-cart', 'clear-cart', 'remove-from-cart',
    'get-customers', 'add-customer', 'update-customer', 'delete-customer',
    'get-suppliers', 'add-supplier', 'update-supplier', 'delete-supplier',
    'get-sales', 'get-orders', 'add-sale', 'update-sale', 'delete-sale',
    'get-sales-data', 'save-sales-data', 'get-last-invoice-number', 'get-next-invoice-number', 'get-current-invoice-number',
    'suspend-invoice', 'get-suspended-invoices', 'resume-invoice', 'delete-suspended-invoice',
    'get-treasury-transactions', 'add-treasury-transaction', 'updateTreasuryTransaction', 'deleteTreasuryTransaction', 'filter-treasury-transactions', 'get-treasury-summary',
    'get-purchase-invoices', 'add-purchase-invoice', 'delete-purchase-invoice', 'get-next-purchase-invoice-number',
    'get-products-purchase-invoices', 'add-products-purchase-invoice', 'update-products-purchase-invoice', 'delete-products-purchase-invoice', 'get-next-products-purchase-invoice-number',
    'get-installments', 'add-installment', 'update-installment', 'delete-installment', 'markInstallmentAsPaid',
    'get-employees', 'add-employee', 'update-employee', 'delete-employee',
    'get-settings', 'save-settings',
    'get-currencies', 'add-currency', 'update-currency', 'delete-currency',
    'get-users', 'get-user-by-id', 'add-user', 'update-user', 'delete-user', 'change-user-password', 'login',
    'get-remembered-session', 'save-remembered-session', 'clear-remembered-session'
];

for (const channel of NETWORK_ROUTED_CHANNELS) {
    const handler = actionRegistry[channel];
    if (handler) {
        try {
            ipcMain.removeHandler(channel);
        } catch {}
        ipcMain.handle(channel, async (_event, ...args) => {
            const netConfig = loadNetworkConfig();
            if (netConfig.mode === 'client') {
                return networkClientInstance.forward(channel, ...args);
            }
            return handler(...args);
        });
    }
}

// Dynamic App Version Handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('getAppVersion', () => app.getVersion());

// ==========================================================================
// Enhanced POS Printer & Electronic PDF Invoicing System
// ==========================================================================
const VIRTUAL_PRINTER_PATTERNS = [
    'pdf', 'onenote', 'xps', 'fax', 'virtual', 'printer driver',
    'anydesk', 'cutepdf', 'pdfcreator', 'microsoft print', 'adobe pdf',
    'foxit', 'send to onenote'
];

function isVirtualPrinter(name, desc) {
    const target = ((name || '') + ' ' + (desc || '')).toLowerCase();
    return VIRTUAL_PRINTER_PATTERNS.some(pat => target.includes(pat));
}

async function resolvePOSPrinter() {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return null;
    let printers = [];
    try {
        printers = await win.webContents.getPrintersAsync();
    } catch (e) {
        console.error('[Printer] Error getting printers:', e);
        return null;
    }
    if (!printers || printers.length === 0) return null;

    // Check user preference in settingsDB
    let userSet = null;
    try {
        userSet = await settingsDB.findOne({ _id: 'settings' });
    } catch {}
    const pref = userSet?.defaultPrinter;

    // Explicit PDF export mode or unset
    if (!pref || pref === '__PDF_EXPORT__' || pref === 'none' || pref === 'pdf') {
        return null;
    }

    // If user explicitly chose a printer, check if it exists and is NOT virtual
    const found = printers.find(p => p.name === pref);
    if (found) {
        if (isVirtualPrinter(found.name, found.description)) {
            console.warn(`[Printer] Configured printer "${pref}" is a virtual/system driver. Falling back to PDF export.`);
            return null;
        }
        return found.name;
    }

    // Auto-detect a real physical POS/Thermal printer
    const POS_PATTERNS = [
        'pos', 'thermal', 'receipt', 'epson', 'bixolon', 'citizen', 'star',
        'tsc', 'dymo', 'zebra', 'sato', 'xprinter', 'xp-', 'xp 80', 'xp80',
        '80c', 'q80', 'xp', 'bar code', 'cashier'
    ];

    const matchedPos = printers.find(p => {
        if (isVirtualPrinter(p.name, p.description)) return false;
        const target = (p.name + ' ' + (p.description || '')).toLowerCase();
        return POS_PATTERNS.some(pat => target.includes(pat));
    });

    if (matchedPos) return matchedPos.name;

    // If no explicit POS pattern, check for ANY physical printer that is not virtual
    const physical = printers.find(p => !isVirtualPrinter(p.name, p.description));
    return physical ? physical.name : null;
}

async function renderInvoiceToPDFFile(invoiceHtml, invoiceNumber, type = 'mini') {
    const win = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    try {
        setTransactionBusy(true, 'تصدير الفاتورة PDF');
        await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(invoiceHtml));
        const options = {
            marginsType: 0,
            pageSize: type === 'mini' ? 'A6' : 'A4',
            printBackground: true,
            printSelectionOnly: false,
            landscape: false,
            scale: type === 'mini' ? 1 : 0.8
        };
        const pdfBuffer = await win.webContents.printToPDF(options);

        const safeInvNum = String(invoiceNumber || 'INV')
            .replace(/[\/\\:*?"<>|]/g, '_')
            .trim();

        const docsPath = app.getPath('documents');
        const invoicesDir = join(docsPath, 'فواتير مانيجلي');
        if (!existsSync(invoicesDir)) {
            await mkdir(invoicesDir, { recursive: true });
        }

        const fileName = `فاتورة-${safeInvNum}.pdf`;
        const targetPath = join(invoicesDir, fileName);
        await writeFile(targetPath, pdfBuffer);

        // Also save a direct copy in docsPath so if user checks Documents directly, it's there
        const directDocsPath = join(docsPath, fileName);
        try {
            await writeFile(directDocsPath, pdfBuffer);
        } catch {}

        // If Windows OneDrive is used, also save to local C:\\Users\\<user>\\Documents if different
        try {
            const homeDocs = join(app.getPath('home'), 'Documents');
            if (homeDocs.toLowerCase() !== docsPath.toLowerCase()) {
                if (existsSync(homeDocs)) {
                    await writeFile(join(homeDocs, fileName), pdfBuffer);
                    const localSub = join(homeDocs, 'فواتير مانيجلي');
                    if (!existsSync(localSub)) await mkdir(localSub, { recursive: true });
                    await writeFile(join(localSub, fileName), pdfBuffer);
                }
            }
        } catch {}

        return targetPath;
    } finally {
        setTransactionBusy(false);
        win.close();
    }
}

// Override / Re-register Printer & Invoicing Handlers
try { ipcMain.removeHandler('getDefaultPOSPrinter'); } catch {}
ipcMain.handle('getDefaultPOSPrinter', async () => {
    return await resolvePOSPrinter();
});

try { ipcMain.removeHandler('print-invoice-to-pos'); } catch {}
ipcMain.handle('print-invoice-to-pos', async (_event, invoiceHtml, invoiceNumber, type) => {
    try {
        const printerName = await resolvePOSPrinter();

        if (printerName) {
            console.log(`[Printer] Attempting print to physical POS printer: ${printerName}`);
            const printWin = new BrowserWindow({
                show: false,
                webPreferences: { nodeIntegration: true, contextIsolation: false }
            });
            try {
                setTransactionBusy(true, 'طباعة الفاتورة إلى طابعة الكاشير');
                await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(invoiceHtml));
                
                const printSuccess = await new Promise((resolve) => {
                    printWin.webContents.print({
                        silent: true,
                        printBackground: true,
                        deviceName: printerName
                    }, (success, failureReason) => {
                        if (!success) {
                            console.warn(`[Printer] Print failed on ${printerName}:`, failureReason);
                        }
                        resolve(success);
                    });
                });

                if (printSuccess) {
                    return { success: true, printerName };
                }
            } finally {
                setTransactionBusy(false);
                printWin.close();
            }
        }

        // No physical POS printer available or print failed -> Render PDF & Auto-open!
        console.log('[Printer] No physical printer found or printing was bypassed. Generating PDF invoice...');
        const pdfPath = await renderInvoiceToPDFFile(invoiceHtml, invoiceNumber, type);
        
        try {
            await shell.openPath(pdfPath);
        } catch (openErr) {
            console.error('[Printer] Could not open PDF automatically:', openErr);
        }

        return {
            success: false,
            pdf: true,
            filePath: pdfPath,
            invoiceNumber
        };
    } catch (err) {
        console.error('[Printer] Error in print-invoice-to-pos:', err);
        throw err;
    }
});

try { ipcMain.removeHandler('print-invoice-to-pdf'); } catch {}
ipcMain.handle('print-invoice-to-pdf', async (_event, invoiceHtml, invoiceNumber, type) => {
    const pdfPath = await renderInvoiceToPDFFile(invoiceHtml, invoiceNumber, type);
    try {
        await shell.openPath(pdfPath);
    } catch (e) {
        console.error('[Printer] Could not open PDF automatically:', e);
    }
    return pdfPath;
});

try { ipcMain.removeHandler('get-all-printers'); } catch {}
ipcMain.handle('get-all-printers', async () => {
    try {
        const win = BrowserWindow.getAllWindows()[0];
        if (!win) return [];
        const list = await win.webContents.getPrintersAsync();
        return list.map(p => ({
            name: p.name,
            description: p.description,
            status: p.status,
            isDefault: p.isDefault,
            isVirtual: isVirtualPrinter(p.name, p.description)
        }));
    } catch (err) {
        console.error('Error in get-all-printers:', err);
        return [];
    }
});

try { ipcMain.removeHandler('get-default-printer-setting'); } catch {}
ipcMain.handle('get-default-printer-setting', async () => {
    try {
        const userSet = await settingsDB.findOne({ _id: 'settings' });
        return userSet?.defaultPrinter || '__PDF_EXPORT__';
    } catch {
        return '__PDF_EXPORT__';
    }
});

try { ipcMain.removeHandler('set-default-printer-setting'); } catch {}
ipcMain.handle('set-default-printer-setting', async (_event, printerName) => {
    try {
        await settingsDB.update({ _id: 'settings' }, { $set: { defaultPrinter: printerName } }, { upsert: true });
        return true;
    } catch (err) {
        console.error('Error in set-default-printer-setting:', err);
        throw err;
    }
});





