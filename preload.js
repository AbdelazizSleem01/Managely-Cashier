const { contextBridge, ipcRenderer } = require('electron');
const { shell } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {
    addProduct: (product) => ipcRenderer.invoke('add-product', product),
    getProducts: () => ipcRenderer.invoke('get-products'),
    deleteProduct: (productId) => ipcRenderer.invoke('delete-product', productId),
    updateProduct: (productId, updatedProduct) => ipcRenderer.invoke('update-product', productId, updatedProduct),
    addCategory: (category) => ipcRenderer.invoke('add-category', category),
    getCategories: () => ipcRenderer.invoke('get-categories'),
    deleteCategory: (categoryId) => ipcRenderer.invoke('delete-category', categoryId),
    updateCategory: (categoryId, updatedCategory) => ipcRenderer.invoke('update-category', categoryId, updatedCategory),
    addToCart: (item) => ipcRenderer.invoke('add-to-cart', item),
    getCart: () => ipcRenderer.invoke('get-cart'),
    clearCart: () => ipcRenderer.invoke('clear-cart'),
    removeFromCart: (productId) => ipcRenderer.invoke('remove-from-cart', productId),
    addCustomer: (customer) => ipcRenderer.invoke('add-customer', customer),
    getCustomers: () => ipcRenderer.invoke('get-customers'),
    deleteCustomer: (customerId) => ipcRenderer.invoke('delete-customer', customerId),
    updateCustomer: (customerId, updatedCustomer) => ipcRenderer.invoke('update-customer', customerId, updatedCustomer),
    addPurchaseInvoice: (invoice) => ipcRenderer.invoke('add-purchase-invoice', invoice),
    getPurchaseInvoices: () => ipcRenderer.invoke('get-purchase-invoices'),
    deletePurchaseInvoice: (invoiceId) => ipcRenderer.invoke('delete-purchase-invoice', invoiceId),
    addProductsPurchaseInvoice: (invoice) => ipcRenderer.invoke('add-products-purchase-invoice', invoice),
    getProductsPurchaseInvoices: () => ipcRenderer.invoke('get-products-purchase-invoices'),
    updateProductsPurchaseInvoice: (invoiceId, updatedInvoice) => ipcRenderer.invoke('update-products-purchase-invoice', invoiceId, updatedInvoice),
    deleteProductsPurchaseInvoice: (invoiceId) => ipcRenderer.invoke('delete-products-purchase-invoice', invoiceId),
    getNextProductsPurchaseInvoiceNumber: () => ipcRenderer.invoke('get-next-products-purchase-invoice-number'),
    getOrders: () => ipcRenderer.invoke('get-orders'),
    // getUserDataPath
    getUserDataPath: () => ipcRenderer.invoke('getUserDataPath'),

    getSalesData: async () => {
        const data = await ipcRenderer.invoke('get-sales-data');
        return data || {
            _id: 'salesData',
            daily: [],
            monthly: { sales: 0, month: '', previousSales: 0 },
            yearly: { sales: 0, year: '', previousSales: 0 },
            monthlyOrders: 0,
            yearlyOrders: 0
        };
    },
    getLastInvoiceNumber: () => ipcRenderer.invoke('get-last-invoice-number'),
    getNextInvoiceNumber: () => ipcRenderer.invoke('get-next-invoice-number'),
    getCurrentInvoiceNumber: () => ipcRenderer.invoke('get-current-invoice-number'),
    saveSalesData: (salesData) => ipcRenderer.invoke('save-sales-data', salesData),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    getNextPurchaseInvoiceNumber: () => ipcRenderer.invoke('get-next-purchase-invoice-number'),
    addSale: (sale) => ipcRenderer.invoke('add-sale', sale),
    getSales: () => ipcRenderer.invoke('get-sales'),
    updateSale: (saleId, updatedSale) => ipcRenderer.invoke('update-sale', saleId, updatedSale),
    deleteSale: (saleId) => ipcRenderer.invoke('delete-sale', saleId),
    printInvoice: (invoiceHtml, invoiceNumber, type) => ipcRenderer.invoke('print-invoice', invoiceHtml, invoiceNumber, type),
    printPurchaseInvoice: (invoiceHtml, invoiceNumber, type) => ipcRenderer.invoke('print-purchase-invoice', invoiceHtml, invoiceNumber, type),
    addEmployee: (employee) => ipcRenderer.invoke('add-employee', employee),
    getEmployees: () => ipcRenderer.invoke('get-employees'),
    deleteEmployee: (employeeId) => ipcRenderer.invoke('delete-employee', employeeId),
    updateEmployee: (employeeId, updatedEmployee) => ipcRenderer.invoke('update-employee', employeeId, updatedEmployee),
    uploadFile: (fileData, destination) => ipcRenderer.invoke('uploadFile', fileData, destination),
    readFileAsDataURL: (filePath) => ipcRenderer.invoke('readFileAsDataURL', filePath),
    getDefaultPOSPrinter: () => ipcRenderer.invoke('getDefaultPOSPrinter'),
    printInvoiceToPOS: (invoiceHtml, invoiceNumber, type) => ipcRenderer.invoke('print-invoice-to-pos', invoiceHtml, invoiceNumber, type),
    printInvoiceToPDF: (invoiceHtml, invoiceNumber, type) => ipcRenderer.invoke('print-invoice-to-pdf', invoiceHtml, invoiceNumber, type),
    printBarcode: (barcodeHtml, barcodeValue, type) => ipcRenderer.invoke('print-barcode', barcodeHtml, barcodeValue, type),
    getPasswordHash: () => ipcRenderer.invoke('get-password-hash'),
    updatePasswordHash: (newPassword) => ipcRenderer.invoke('update-password-hash', newPassword),
    clearPasswordHash: () => ipcRenderer.invoke('clear-password-hash'),
    login: (email, password) => ipcRenderer.invoke('login', email, password),
    updateLoginCredentials: (email, password) => ipcRenderer.invoke('update-login-credentials', email, password),
    exportSalesToExcel: (sales) => ipcRenderer.invoke('export-sales-to-excel', sales),
    addTreasuryTransaction: (transaction) => ipcRenderer.invoke('add-treasury-transaction', transaction),
    getTreasuryTransactions: () => ipcRenderer.invoke('get-treasury-transactions'),
    deleteTreasuryTransaction: (transactionId) => ipcRenderer.invoke('deleteTreasuryTransaction', transactionId),
    updateTreasuryTransaction: (transactionId, updatedTransaction) => ipcRenderer.invoke('updateTreasuryTransaction', transactionId, updatedTransaction),
    filterTreasuryTransactions: (filters) => ipcRenderer.invoke('filter-treasury-transactions', filters),
    getTreasurySummary: () => ipcRenderer.invoke('get-treasury-summary'),
    addSupplier: (supplier) => ipcRenderer.invoke('add-supplier', supplier),
    getSuppliers: () => ipcRenderer.invoke('get-suppliers'),
    updateSupplier: (supplierId, updatedSupplier) => ipcRenderer.invoke('update-supplier', supplierId, updatedSupplier),
    deleteSupplier: (supplierId) => ipcRenderer.invoke('delete-supplier', supplierId),
    addInstallment: (installment) => ipcRenderer.invoke('add-installment', installment),
    getInstallments: (supplierId) => ipcRenderer.invoke('get-installments', supplierId),
    updateInstallment: (installmentId, updatedInstallment) => ipcRenderer.invoke('update-installment', installmentId, updatedInstallment),
    deleteInstallment: (installmentId) => ipcRenderer.invoke('delete-installment', installmentId),
    markInstallmentAsPaid: (installmentId) => ipcRenderer.invoke('markInstallmentAsPaid', installmentId),
    markInvoiceAsPaid: (invoiceId, data) => ipcRenderer.invoke('markInvoiceAsPaid', invoiceId, data),
    printTreasuryReport: (reportHtml) => ipcRenderer.invoke('print-treasury-report', reportHtml),
    onOpenPage: (callback) => ipcRenderer.on('open-page', (event, page) => callback(page)),
    getAllPrinters: () => ipcRenderer.invoke('get-all-printers'),
    getDefaultPrinterSetting: () => ipcRenderer.invoke('get-default-printer-setting'),
    setDefaultPrinterSetting: (printerName) => ipcRenderer.invoke('set-default-printer-setting', printerName),
    suspendInvoice: (invoiceData) => ipcRenderer.invoke('suspend-invoice', invoiceData),
    getSuspendedInvoices: () => ipcRenderer.invoke('get-suspended-invoices'),
    resumeInvoice: (invoiceId) => ipcRenderer.invoke('resume-invoice', invoiceId),
    deleteSuspendedInvoice: (invoiceId) => ipcRenderer.invoke('delete-suspended-invoice'),

    // Auto Updater API
    updater: {
        check: () => ipcRenderer.invoke('updater:check'),
        checkForUpdates: () => ipcRenderer.invoke('updater:check'),
        download: () => ipcRenderer.invoke('updater:download'),
        downloadUpdate: () => ipcRenderer.invoke('updater:download'),
        install: (isSilent) => ipcRenderer.invoke('updater:install', isSilent),
        quitAndInstall: (isSilent) => ipcRenderer.invoke('updater:install', isSilent),
        getVersion: () => ipcRenderer.invoke('updater:get-version'),
        getState: () => ipcRenderer.invoke('updater:get-state'),
        onStatus: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:status', handler);
            return () => ipcRenderer.removeListener('updater:status', handler);
        },
        onCheckingForUpdate: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:status', handler);
            return () => ipcRenderer.removeListener('updater:status', handler);
        },
        onAvailable: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:available', handler);
            return () => ipcRenderer.removeListener('updater:available', handler);
        },
        onUpdateAvailable: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:available', handler);
            return () => ipcRenderer.removeListener('updater:available', handler);
        },
        onNotAvailable: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:not-available', handler);
            return () => ipcRenderer.removeListener('updater:not-available', handler);
        },
        onUpdateNotAvailable: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:not-available', handler);
            return () => ipcRenderer.removeListener('updater:not-available', handler);
        },
        onProgress: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:progress', handler);
            return () => ipcRenderer.removeListener('updater:progress', handler);
        },
        onDownloadProgress: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:progress', handler);
            return () => ipcRenderer.removeListener('updater:progress', handler);
        },
        onDownloaded: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:downloaded', handler);
            return () => ipcRenderer.removeListener('updater:downloaded', handler);
        },
        onUpdateDownloaded: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:downloaded', handler);
            return () => ipcRenderer.removeListener('updater:downloaded', handler);
        },
        onError: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:error', handler);
            return () => ipcRenderer.removeListener('updater:error', handler);
        },
        onUpdateError: (callback) => {
            const handler = (_event, data) => callback(data);
            ipcRenderer.on('updater:error', handler);
            return () => ipcRenderer.removeListener('updater:error', handler);
        }
    }
});

// Live reload in development mode for renderer files (HTML, JS, CSS)
if (process.env.NODE_ENV !== 'production') {
    try {
        const fs = require('fs');
        const path = require('path');
        const rootDir = path.resolve(__dirname);
        const watchDirs = ['HTML', 'js', 'styles'];
        let reloadTimer = null;

        watchDirs.forEach((dir) => {
            const dirPath = path.join(rootDir, dir);
            if (fs.existsSync(dirPath)) {
                fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
                    if (filename && (filename.endsWith('.html') || filename.endsWith('.js') || filename.endsWith('.css'))) {
                        clearTimeout(reloadTimer);
                        reloadTimer = setTimeout(() => {
                            window.location.reload();
                        }, 120);
                    }
                });
            }
        });
    } catch (err) {
        console.warn('Live reload init warning:', err);
    }
}
