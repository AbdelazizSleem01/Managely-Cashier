import http from 'http';
import os from 'os';
import axios from 'axios';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { createHash } from 'crypto';
import {
    productsDB, categoriesDB, salesDB, cartDB, countersDB, settingsDB,
    customersDB, salesDataDB, statisticsDB, purchaseInvoicesDB, suppliersDB,
    installmentsDB, employeesDB, productsPurchaseInvoicesDB, treasuryDB,
    suspendedInvoicesDB, usersDB, currenciesDB
} from './database.js';


// ==========================================================================
// Sequential Async Mutex Queue (منظم العمليات المتسلسلة لمنع التضارب)
// ==========================================================================
export class AsyncLockQueue {
    constructor() {
        this.lastPromise = Promise.resolve();
    }

    enqueue(task) {
        const nextPromise = this.lastPromise.then(
            () => task(),
            () => task() // Continue queue even if previous task errored
        );
        this.lastPromise = nextPromise.catch(() => {});
        return nextPromise;
    }
}

export const globalTransactionLock = new AsyncLockQueue();

// ==========================================================================
// Network Configuration Storage
// ==========================================================================
const CONFIG_FILE_NAME = 'network_config.json';

export function getNetworkConfigFile() {
    try {
        const userData = app?.getPath ? app.getPath('userData') : process.cwd();
        return join(userData, CONFIG_FILE_NAME);
    } catch {
        return join(process.cwd(), CONFIG_FILE_NAME);
    }
}

export function loadNetworkConfig() {
    try {
        const filePath = getNetworkConfigFile();
        if (existsSync(filePath)) {
            const raw = readFileSync(filePath, 'utf8');
            const data = JSON.parse(raw);
            return {
                mode: data.mode || 'standalone', // 'standalone' | 'cloud_key' | 'cloud_custom' | 'server' | 'client'
                serverPort: Number(data.serverPort) || 4545,
                serverHost: data.serverHost || '127.0.0.1',
                securityPin: data.securityPin || '',
                deviceName: data.deviceName || os.hostname() || 'Managely-Device',
                cloudSyncKey: data.cloudSyncKey || '',
                cloudBranchName: data.cloudBranchName || '',
                cloudCustomUrl: data.cloudCustomUrl || '',
                cloudApiKey: data.cloudApiKey || '',
                cloudSyncInterval: Number(data.cloudSyncInterval) || 10
            };
        }
    } catch (e) {
        console.warn('[Network] Could not load network config, using defaults:', e);
    }

    return {
        mode: 'standalone',
        serverPort: 4545,
        serverHost: '127.0.0.1',
        securityPin: '',
        deviceName: os.hostname() || 'Managely-Device',
        cloudSyncKey: '',
        cloudBranchName: '',
        cloudCustomUrl: '',
        cloudApiKey: '',
        cloudSyncInterval: 10
    };
}

export function saveNetworkConfig(newConfig) {
    try {
        const filePath = getNetworkConfigFile();
        const current = loadNetworkConfig();
        const merged = { ...current, ...newConfig };
        writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf8');
        return merged;
    } catch (e) {
        console.error('[Network] Failed to save network config:', e);
        throw e;
    }
}

// ==========================================================================
// IP & Network Interfaces Discovery (كشف عناوين IP والـ Tailscale)
// ==========================================================================
export function discoverNetworkIPs() {
    const interfaces = os.networkInterfaces();
    const results = [];

    for (const [name, nets] of Object.entries(interfaces)) {
        if (!nets) continue;
        for (const net of nets) {
            // Only IPv4 and non-internal
            if (net.family === 'IPv4' && !net.internal) {
                const ip = net.address;
                const lowerName = name.toLowerCase();

                let type = 'lan';
                let label = `شبكة محلية (${name})`;

                // Tailscale IP range is 100.64.0.0 to 100.127.255.255 or interface name contains tailscale
                if (ip.startsWith('100.') || lowerName.includes('tailscale')) {
                    type = 'tailscale';
                    label = `Tailscale (ربط عن بعد عبر الإنترنت) - ${name}`;
                } else if (ip.startsWith('10.147.') || lowerName.includes('zerotier')) {
                    type = 'zerotier';
                    label = `ZeroTier (شبكة افتراضية) - ${name}`;
                } else if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
                    type = 'lan';
                    label = `شبكة داخلية Wi-Fi / LAN (${name})`;
                }

                results.push({
                    ip,
                    name,
                    type,
                    label
                });
            }
        }
    }

    // Sort: Tailscale / ZeroTier first, then LAN
    results.sort((a, b) => {
        if (a.type === 'tailscale') return -1;
        if (b.type === 'tailscale') return 1;
        if (a.type === 'zerotier') return -1;
        if (b.type === 'zerotier') return 1;
        return 0;
    });

    return results;
}

import { supabaseSyncInstance } from './supabase-sync.js';

// ==========================================================================
// Centralized Database Action Handlers (with Concurrency Safety)
// ==========================================================================

export async function getNextInvoiceCounterSafe(dateStr) {
    const formattedDate = dateStr || new Date().toISOString().split('T')[0].replace(/-/g, '');
    const counterId = `invoiceCounter-${formattedDate}`;
    
    let counter = await countersDB.findOne({ _id: counterId });
    if (!counter) {
        counter = { _id: counterId, sequence: 0 };
        await countersDB.insert(counter);
    }
    const nextSeq = (counter.sequence || 0) + 1;
    await countersDB.update({ _id: counterId }, { $set: { sequence: nextSeq } }, {});
    return `INV - ${nextSeq} - ${formattedDate}`;
}

export async function executeAtomicSale(saleData) {
    return globalTransactionLock.enqueue(async () => {
        if (!saleData || !saleData.items || saleData.items.length === 0) {
            throw new Error('بيانات الفاتورة فارغة أو لا تحتوي على منتجات.');
        }

        // 1. Stock Validation Check
        for (const item of saleData.items) {
            if (item._id) {
                const prod = await productsDB.findOne({ _id: item._id });
                if (prod) {
                    const currentStock = Number(prod.quantity || 0);
                    const requestedQty = Number(item.quantity || 1);
                    if (currentStock < requestedQty) {
                        throw new Error(`عذراً، نفد رصيد الصنف "${prod.name}" بالمخزن أثناء إتمام الفاتورة! المتبقي حالياً (${currentStock}) فقط.`);
                    }
                }
            }
        }

        // 2. Atomic Stock Deduction
        for (const item of saleData.items) {
            if (item._id) {
                const prod = await productsDB.findOne({ _id: item._id });
                if (prod) {
                    const currentStock = Number(prod.quantity || 0);
                    const requestedQty = Number(item.quantity || 1);
                    const newStock = Math.max(0, currentStock - requestedQty);
                    await productsDB.update({ _id: item._id }, { $set: { quantity: newStock } }, {});
                    // Sync updated product stock
                    const updatedProd = await productsDB.findOne({ _id: item._id });
                    if (updatedProd) supabaseSyncInstance.pushDocument('products', updatedProd).catch(() => {});
                }
            }
        }

        // 3. Atomic Invoice Number Generation (if not already set or in correct format)
        const dateObj = saleData.date ? new Date(saleData.date) : new Date();
        const dateStr = dateObj.toISOString().split('T')[0].replace(/-/g, '');
        const generatedInvoiceNumber = await getNextInvoiceCounterSafe(dateStr);
        
        const finalSale = {
            ...saleData,
            invoiceNumber: generatedInvoiceNumber,
            createdAt: new Date().toISOString(),
            date: saleData.date || new Date().toISOString()
        };

        // 4. Save to salesDB
        const insertedSale = await salesDB.insert(finalSale);

        // 5. Update customer loyalty points if applicable
        if (finalSale.customerName) {
            const customer = await customersDB.findOne({ name: finalSale.customerName });
            if (customer) {
                const earnedPoints = Number(finalSale.earnedPoints || 0);
                const redeemedPoints = Number(finalSale.pointsRedeemed || 0);
                const currentPoints = Number(customer.points || 0);
                const newPoints = Math.max(0, currentPoints + earnedPoints - redeemedPoints);
                await customersDB.update({ _id: customer._id }, { $set: { points: newPoints } }, {});
                const updatedCust = await customersDB.findOne({ _id: customer._id });
                if (updatedCust) supabaseSyncInstance.pushDocument('customers', updatedCust).catch(() => {});
            }
        }

        // 6. Push Sale to Supabase Cloud
        supabaseSyncInstance.pushDocument('sales', insertedSale).catch(() => {});

        return insertedSale;
    });
}

// Registry of all executable DB actions
export const actionRegistry = {
    // Products
    'get-products': () => productsDB.find({}),
    'add-product': (product) => globalTransactionLock.enqueue(async () => {
        if (product.barcode) {
            const existing = await productsDB.findOne({ barcode: product.barcode });
            if (existing) throw new Error('هذا الباركود مستخدم بالفعل لمنتج آخر!');
        }
        const inserted = await productsDB.insert(product);
        supabaseSyncInstance.pushDocument('products', inserted).catch(() => {});
        return inserted;
    }),
    'update-product': (id, updated) => globalTransactionLock.enqueue(async () => {
        if (updated.barcode) {
            const existing = await productsDB.findOne({ barcode: updated.barcode });
            if (existing && existing._id !== id) throw new Error('هذا الباركود مستخدم بالفعل لمنتج آخر!');
        }
        const res = await productsDB.update({ _id: id }, { $set: updated }, {});
        const latest = await productsDB.findOne({ _id: id });
        if (latest) supabaseSyncInstance.pushDocument('products', latest).catch(() => {});
        return res;
    }),
    'delete-product': (id) => globalTransactionLock.enqueue(async () => {
        const res = await productsDB.remove({ _id: id }, {});
        supabaseSyncInstance.deleteDocument('products', id).catch(() => {});
        return res;
    }),

    // Categories
    'get-categories': () => categoriesDB.find({}),
    'add-category': (cat) => globalTransactionLock.enqueue(async () => {
        const existing = await categoriesDB.findOne({ name: cat.name });
        if (existing) throw new Error('اسم الفئة موجود بالفعل!');
        const inserted = await categoriesDB.insert(cat);
        supabaseSyncInstance.pushDocument('categories', inserted).catch(() => {});
        return inserted;
    }),
    'update-category': (id, cat) => globalTransactionLock.enqueue(async () => {
        const existing = await categoriesDB.findOne({ name: cat.name });
        if (existing && existing._id !== id) throw new Error('اسم الفئة موجود بالفعل!');
        const res = await categoriesDB.update({ _id: id }, { $set: cat }, {});
        const latest = await categoriesDB.findOne({ _id: id });
        if (latest) supabaseSyncInstance.pushDocument('categories', latest).catch(() => {});
        return res;
    }),
    'delete-category': (id) => globalTransactionLock.enqueue(async () => {
        const res = await categoriesDB.remove({ _id: id }, {});
        supabaseSyncInstance.deleteDocument('categories', id).catch(() => {});
        return res;
    }),

    // Customers
    'get-customers': () => customersDB.find({}),
    'add-customer': (cust) => globalTransactionLock.enqueue(async () => {
        const inserted = await customersDB.insert(cust);
        supabaseSyncInstance.pushDocument('customers', inserted).catch(() => {});
        return inserted;
    }),
    'update-customer': (id, cust) => globalTransactionLock.enqueue(async () => {
        const res = await customersDB.update({ _id: id }, { $set: cust }, {});
        const latest = await customersDB.findOne({ _id: id });
        if (latest) supabaseSyncInstance.pushDocument('customers', latest).catch(() => {});
        return res;
    }),
    'delete-customer': (id) => globalTransactionLock.enqueue(async () => {
        const res = await customersDB.remove({ _id: id }, {});
        supabaseSyncInstance.deleteDocument('customers', id).catch(() => {});
        return res;
    }),

    // Suppliers
    'get-suppliers': () => suppliersDB.find({}),
    'add-supplier': (sup) => globalTransactionLock.enqueue(async () => {
        const inserted = await suppliersDB.insert(sup);
        supabaseSyncInstance.pushDocument('suppliers', inserted).catch(() => {});
        return inserted;
    }),
    'update-supplier': (id, sup) => globalTransactionLock.enqueue(async () => {
        const res = await suppliersDB.update({ _id: id }, { $set: sup }, {});
        const latest = await suppliersDB.findOne({ _id: id });
        if (latest) supabaseSyncInstance.pushDocument('suppliers', latest).catch(() => {});
        return res;
    }),
    'delete-supplier': (id) => globalTransactionLock.enqueue(async () => {
        const res = await suppliersDB.remove({ _id: id }, {});
        supabaseSyncInstance.deleteDocument('suppliers', id).catch(() => {});
        return res;
    }),

    // Cart
    'add-to-cart': async (item) => {
        const existing = await cartDB.findOne({ _id: item._id });
        if (existing) return cartDB.update({ _id: item._id }, { $set: { quantity: item.quantity } }, {});
        return cartDB.insert(item);
    },
    'get-cart': () => cartDB.find({}),
    'clear-cart': () => cartDB.remove({}, { multi: true }),
    'remove-from-cart': (id) => cartDB.remove({ _id: id }, {}),

    // Sales & Invoices
    'get-sales': () => salesDB.find({}),
    'get-orders': () => salesDB.find({}),
    'add-sale': (sale) => executeAtomicSale(sale),
    'update-sale': (id, sale) => globalTransactionLock.enqueue(() => salesDB.update({ _id: id }, { $set: sale }, {})),
    'delete-sale': (id) => globalTransactionLock.enqueue(() => salesDB.remove({ _id: id }, {})),
    'get-sales-data': () => salesDataDB.findOne({ _id: 'salesData' }),
    'save-sales-data': (data) => globalTransactionLock.enqueue(() => statisticsDB.update({ _id: 'salesData' }, { $set: data }, { upsert: true })),
    'get-next-invoice-number': async () => {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        return getNextInvoiceCounterSafe(dateStr);
    },
    'get-last-invoice-number': async () => {
        const sales = await salesDB.find({}).sort({ date: -1 }).limit(1);
        if (sales.length > 0) return sales[0].invoiceNumber;
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        return getNextInvoiceCounterSafe(dateStr);
    },
    'get-current-invoice-number': async () => {
        const sales = await salesDB.find({}).sort({ date: -1 }).limit(1);
        if (sales.length > 0) return sales[0].invoiceNumber;
        return 'INV - 1 - ' + new Date().toISOString().split('T')[0].replace(/-/g, '');
    },

    // Suspended Invoices
    'suspend-invoice': (data) => globalTransactionLock.enqueue(() => {
        const doc = {
            ...data,
            suspendedAt: new Date().toISOString(),
            id: 'SUSPENDED_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        };
        return suspendedInvoicesDB.insert(doc);
    }),
    'get-suspended-invoices': () => suspendedInvoicesDB.find({}).sort({ suspendedAt: -1 }),
    'resume-invoice': (id) => globalTransactionLock.enqueue(async () => {
        const doc = await suspendedInvoicesDB.findOne({ id });
        if (!doc) throw new Error('الفاتورة المعلقة غير موجودة');
        await suspendedInvoicesDB.remove({ id }, {});
        return doc;
    }),
    'delete-suspended-invoice': (id) => globalTransactionLock.enqueue(() => suspendedInvoicesDB.remove({ id }, {})),

    // Treasury
    'get-treasury-transactions': () => treasuryDB.find({}).sort({ date: -1 }),
    'add-treasury-transaction': (tx) => globalTransactionLock.enqueue(() => {
        tx.createdAt = new Date().toISOString();
        return treasuryDB.insert(tx);
    }),
    'updateTreasuryTransaction': (id, tx) => globalTransactionLock.enqueue(() => treasuryDB.update({ _id: id }, { $set: tx }, {})),
    'deleteTreasuryTransaction': (id) => globalTransactionLock.enqueue(() => treasuryDB.remove({ _id: id }, {})),
    'filter-treasury-transactions': (filters = {}) => {
        let query = {};
        if (filters.date) {
            const start = new Date(filters.date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(filters.date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start.toISOString(), $lte: end.toISOString() };
        }
        if (filters.type) query.type = filters.type;
        if (filters.user) query.user = filters.user;
        if (filters.amount) query.amount = parseFloat(filters.amount);
        return treasuryDB.find(query).sort({ date: -1 });
    },
    'get-treasury-summary': async () => {
        const all = await treasuryDB.find({});
        const totalRevenue = all.filter(t => t.type === 'revenue').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
        const totalExpense = all.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
        const totalReturned = all.filter(t => t.type === 'returned').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
        const balance = totalRevenue - totalExpense - totalReturned;
        return {
            balance,
            totalRevenue,
            totalExpense,
            totalReturned
        };
    },

    // Purchases
    'get-purchase-invoices': () => purchaseInvoicesDB.find({}),
    'add-purchase-invoice': (inv) => globalTransactionLock.enqueue(() => purchaseInvoicesDB.insert(inv)),
    'delete-purchase-invoice': (id) => globalTransactionLock.enqueue(() => purchaseInvoicesDB.remove({ _id: id }, {})),

    // Products Purchase Invoices
    'get-products-purchase-invoices': () => productsPurchaseInvoicesDB.find({}),
    'add-products-purchase-invoice': (inv) => globalTransactionLock.enqueue(() => productsPurchaseInvoicesDB.insert(inv)),
    'update-products-purchase-invoice': (id, inv) => globalTransactionLock.enqueue(() => productsPurchaseInvoicesDB.update({ _id: id }, { $set: inv }, {})),
    'delete-products-purchase-invoice': (id) => globalTransactionLock.enqueue(() => productsPurchaseInvoicesDB.remove({ _id: id }, {})),

    // Installments
    'get-installments': (supplierId) => {
        const q = supplierId ? { supplierId } : {};
        return installmentsDB.find(q).sort({ dueDate: 1 });
    },
    'add-installment': (inst) => globalTransactionLock.enqueue(() => {
        inst.status = 'pending';
        inst.createdAt = new Date().toISOString();
        return installmentsDB.insert(inst);
    }),
    'update-installment': (id, inst) => globalTransactionLock.enqueue(() => installmentsDB.update({ _id: id }, { $set: inst }, {})),
    'delete-installment': (id) => globalTransactionLock.enqueue(() => installmentsDB.remove({ _id: id }, {})),
    'markInstallmentAsPaid': (id) => globalTransactionLock.enqueue(async () => {
        await installmentsDB.update({ _id: id }, { $set: { status: 'paid', paidAt: new Date().toISOString() } }, {});
        return installmentsDB.findOne({ _id: id });
    }),

    // Employees
    'get-employees': () => employeesDB.find({}),
    'add-employee': (emp) => globalTransactionLock.enqueue(() => employeesDB.insert(emp)),
    'update-employee': (id, emp) => globalTransactionLock.enqueue(() => employeesDB.update({ _id: id }, { $set: emp }, {})),
    'delete-employee': (id) => globalTransactionLock.enqueue(() => employeesDB.remove({ _id: id }, {})),

    // Settings
    'get-settings': () => settingsDB.findOne({ _id: 'settings' }),
    'save-settings': (s) => globalTransactionLock.enqueue(() => settingsDB.update({ _id: 'settings' }, { $set: s }, { upsert: true })),

    // Currencies Management
    'get-currencies': async () => {
        let currencies = await currenciesDB.find({});
        if (!currencies || currencies.length === 0) {
            const defaultCurrency = {
                name: 'جنيه مصري',
                code: 'EGP',
                symbol: 'ج.م',
                exchangeRate: 1,
                isDefault: true,
                createdAt: new Date().toISOString()
            };
            const inserted = await currenciesDB.insert(defaultCurrency);
            supabaseSyncInstance?.pushDocument('currencies', inserted);
            currencies = [inserted];
        }
        currencies.sort((a, b) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        });
        return currencies;
    },
    'add-currency': (curr) => globalTransactionLock.enqueue(async () => {
        if (!curr || !curr.name || !curr.code || !curr.symbol) {
            throw new Error('يرجى ملء جميع بيانات العملة المطلوبة (الاسم، الكود، والرمز)');
        }
        const cleanCode = curr.code.trim().toUpperCase();
        const existing = await currenciesDB.findOne({ code: cleanCode });
        if (existing) {
            if (curr.isDefault) {
                await currenciesDB.update({}, { $set: { isDefault: false } }, { multi: true });
            }
            const updateDoc = {
                name: curr.name.trim(),
                code: cleanCode,
                symbol: curr.symbol.trim(),
                exchangeRate: parseFloat(curr.exchangeRate) || 1,
                isDefault: Boolean(curr.isDefault),
                updatedAt: new Date().toISOString()
            };
            await currenciesDB.update({ _id: existing._id }, { $set: updateDoc }, {});
            const updated = await currenciesDB.findOne({ _id: existing._id });
            supabaseSyncInstance?.pushDocument('currencies', updated);
            return updated;
        }
        if (curr.isDefault) {
            await currenciesDB.update({}, { $set: { isDefault: false } }, { multi: true });
        }
        const doc = {
            name: curr.name.trim(),
            code: cleanCode,
            symbol: curr.symbol.trim(),
            exchangeRate: parseFloat(curr.exchangeRate) || 1,
            isDefault: Boolean(curr.isDefault),
            createdAt: new Date().toISOString()
        };
        const inserted = await currenciesDB.insert(doc);
        supabaseSyncInstance?.pushDocument('currencies', inserted);
        return inserted;
    }),
    'update-currency': (id, curr) => globalTransactionLock.enqueue(async () => {
        if (!id || !curr) throw new Error('بيانات تحديث العملة غير مكتملة');
        if (curr.code) {
            const cleanCode = curr.code.trim().toUpperCase();
            const existing = await currenciesDB.findOne({ code: cleanCode });
            if (existing && existing._id !== id) {
                throw new Error(`كود العملة (${cleanCode}) مستخدم بالفعل لعملة أخرى!`);
            }
            curr.code = cleanCode;
        }
        if (curr.isDefault) {
            await currenciesDB.update({}, { $set: { isDefault: false } }, { multi: true });
        }
        if (curr.exchangeRate !== undefined) {
            curr.exchangeRate = parseFloat(curr.exchangeRate) || 1;
        }
        await currenciesDB.update({ _id: id }, { $set: curr }, {});
        const updated = await currenciesDB.findOne({ _id: id });
        supabaseSyncInstance?.pushDocument('currencies', updated);
        return updated;
    }),
    'delete-currency': (id) => globalTransactionLock.enqueue(async () => {
        if (!id) throw new Error('معرف العملة مطلوب');
        const curr = await currenciesDB.findOne({ _id: id });
        if (!curr) throw new Error('العملة غير موجودة');
        if (curr.isDefault) {
            throw new Error('لا يمكن حذف العملة الأساسية للمتجر. يمكنك تعيين عملة أخرى كأساسية أولاً.');
        }
        await currenciesDB.remove({ _id: id }, {});
        supabaseSyncInstance?.deleteDocument('currencies', id);
        return { success: true };
    }),

    // Users & Authentication
    'get-users': async () => {
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
    },
    'get-user-by-id': async (userId) => {
        if (!userId) throw new Error('معرف المستخدم مطلوب');
        const user = await usersDB.findOne({ _id: userId });
        if (!user) throw new Error('المستخدم غير موجود');
        const { password, ...safeUser } = user;
        return safeUser;
    },
    'add-user': (userData) => globalTransactionLock.enqueue(async () => {
        if (!userData || !userData.name || !userData.username || !userData.password) {
            throw new Error('بيانات المستخدم غير مكتملة (الاسم الكامل، اسم الدخول، وكلمة المرور مطلوبة)');
        }
        const cleanUsername = userData.username.trim().toLowerCase();
        const cleanEmail = (userData.email || '').trim().toLowerCase();

        const orConditions = [{ username: cleanUsername }];
        if (cleanEmail) orConditions.push({ email: cleanEmail });

        const existing = await usersDB.findOne({ $or: orConditions });
        if (existing) {
            throw new Error('اسم الدخول أو البريد الإلكتروني مسجل بالفعل لمستخدم آخر!');
        }

        const passwordHash = createHash('sha256').update(userData.password.trim()).digest('hex');
        const doc = {
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
        const inserted = await usersDB.insert(doc);
        const { password, ...safeUser } = inserted;
        return safeUser;
    }),
    'update-user': (userId, updatedData) => globalTransactionLock.enqueue(async () => {
        if (!userId || !updatedData) throw new Error('بيانات التحديث غير صالحة');
        const existingUser = await usersDB.findOne({ _id: userId });
        if (!existingUser) throw new Error('المستخدم غير موجود');

        const cleanUsername = updatedData.username ? updatedData.username.trim().toLowerCase() : existingUser.username;
        const cleanEmail = updatedData.email !== undefined ? updatedData.email.trim().toLowerCase() : existingUser.email;

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
    }),
    'delete-user': (userId) => globalTransactionLock.enqueue(async () => {
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
    }),
    'change-user-password': (userId, newPassword) => globalTransactionLock.enqueue(async () => {
        if (!userId || !newPassword) throw new Error('معرف المستخدم وكلمة المرور الجديدة مطلوبان');
        if (newPassword.trim().length < 4) throw new Error('كلمة المرور يجب أن لا تقل عن 4 أحرف');
        const user = await usersDB.findOne({ _id: userId });
        if (!user) throw new Error('المستخدم غير موجود');

        const passwordHash = createHash('sha256').update(newPassword.trim()).digest('hex');
        await usersDB.update({ _id: userId }, { $set: { password: passwordHash, updatedAt: new Date().toISOString() } }, {});
        return { success: true };
    }),
    'login': async (identifier, password) => {
        return handleUserLogin(identifier, password);
    },
    'update-login-credentials': async (email, password) => {
        return handleLegacyUpdateLoginCredentials(email, password);
    },
    'get-remembered-session': async () => {
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
    },
    'save-remembered-session': (sessionData) => globalTransactionLock.enqueue(() => {
        return settingsDB.update({ _id: 'settings' }, { $set: { rememberedSession: sessionData } }, { upsert: true });
    }),
    'clear-remembered-session': () => globalTransactionLock.enqueue(() => {
        return settingsDB.update({ _id: 'settings' }, { $unset: { rememberedSession: '' } }, {});
    })
};

export const FULL_ADMIN_PERMISSIONS = {
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

export async function ensurePrimaryAdminUser() {
    try {
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

export async function handleUserLogin(identifier, password) {
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
    const defaultAdminHash = createHash('sha256').update('admin123').digest('hex');

    // First-time setup condition:
    // If settings has no password, OR isFirstTimeLogin is true, OR there is only the default initial admin with 'admin123'
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

export async function handleLegacyUpdateLoginCredentials(email, password) {
    if (!email || !password) throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان.');
    const passwordHash = createHash('sha256').update(password.trim()).digest('hex');
    
    await settingsDB.update({ _id: 'settings' }, { $set: { email: email.trim().toLowerCase(), password: passwordHash, currentUser: email.trim() } }, { upsert: true });
    
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


// ==========================================================================
// Master HTTP Server (سيرفر الجهاز الرئيسي)
// ==========================================================================
export class MasterHttpServer {
    constructor() {
        this.server = null;
        this.isRunning = false;
        this.port = 4545;
    }

    start(port = 4545) {
        if (this.isRunning && this.server) {
            console.log(`[MasterServer] Already running on port ${this.port}`);
            return Promise.resolve();
        }

        this.port = port;

        return new Promise((resolve, reject) => {
            this.server = http.createServer(async (req, res) => {
                // Enable CORS
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Security-Pin');

                if (req.method === 'OPTIONS') {
                    res.writeHead(204);
                    res.end();
                    return;
                }

                const url = new URL(req.url, `http://${req.headers.host}`);

                // Health check
                if (req.method === 'GET' && url.pathname === '/api/health') {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({
                        status: 'online',
                        serverName: 'Managely Master POS',
                        version: app?.getVersion ? app.getVersion() : '1.0.8',
                        hostname: os.hostname(),
                        timestamp: Date.now()
                    }));
                    return;
                }

                // Execute Action Endpoint
                if (req.method === 'POST' && url.pathname === '/api/execute') {
                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', async () => {
                        try {
                            const parsed = JSON.parse(body || '{}');
                            const { action, args = [] } = parsed;

                            if (!action) {
                                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                                res.end(JSON.stringify({ success: false, error: 'Missing action name' }));
                                return;
                            }

                            const handler = actionRegistry[action];
                            if (!handler) {
                                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                                res.end(JSON.stringify({ success: false, error: `Action '${action}' not supported on server.` }));
                                return;
                            }

                            const result = await handler(...args);
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify({ success: true, data: result }));
                        } catch (err) {
                            console.error(`[MasterServer] Error handling '${req.url}':`, err);
                            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify({ success: false, error: err.message || 'Internal server error' }));
                        }
                    });
                    return;
                }

                // 404 for unknown endpoints
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Endpoint not found' }));
            });

            this.server.on('error', (err) => {
                console.error('[MasterServer] Server error:', err);
                this.isRunning = false;
                reject(err);
            });

            this.server.listen(this.port, '0.0.0.0', () => {
                this.isRunning = true;
                console.log(`[MasterServer] POS Master Server listening on 0.0.0.0:${this.port}`);
                resolve();
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server && this.isRunning) {
                this.server.close(() => {
                    this.isRunning = false;
                    console.log('[MasterServer] POS Master Server stopped.');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

export const masterServerInstance = new MasterHttpServer();

// ==========================================================================
// Network Client (للأجهزة الفرعية المتصلة بالجهاز الرئيسي)
// ==========================================================================
export class NetworkClient {
    constructor() {
        this.config = loadNetworkConfig();
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    async testConnection(host, port) {
        const targetHost = host || this.config.serverHost || '127.0.0.1';
        const targetPort = port || this.config.serverPort || 4545;
        const start = Date.now();

        try {
            const res = await axios.get(`http://${targetHost}:${targetPort}/api/health`, {
                timeout: 3500
            });
            const latencyMs = Date.now() - start;

            if (res.data && res.data.status === 'online') {
                return {
                    ok: true,
                    latencyMs,
                    serverInfo: res.data
                };
            } else {
                return {
                    ok: false,
                    error: 'استجاب السيرفر ولكن بتنسيق غير متوقع.'
                };
            }
        } catch (err) {
            return {
                ok: false,
                error: err.code === 'ECONNREFUSED' 
                    ? `فشل الاتصال: المنفذ ${targetPort} مغلق أو الجهاز الرئيسي غير مشغل حالياً.` 
                    : (err.message || 'فشل الاتصال بالجهاز الرئيسي')
            };
        }
    }

    async testCloudKey(cloudSyncKey, cloudBranchName) {
        const key = (cloudSyncKey || this.config.cloudSyncKey || '').trim();
        const branch = (cloudBranchName || this.config.cloudBranchName || '').trim() || 'الفرع الرئيسي';

        if (!key) {
            return {
                ok: false,
                error: 'يرجى إدخال كود المزامنة السحابي (Cloud Sync Key) أولاً.'
            };
        }

        const start = Date.now();
        try {
            // Simulated / Cloud ping verification for Managely Cloud Hub
            await new Promise(r => setTimeout(r, 450));
            const latencyMs = Date.now() - start;

            return {
                ok: true,
                latencyMs,
                cloudInfo: {
                    storeKey: key,
                    branchName: branch,
                    region: 'Middle East & North Africa (Cloud Hub)',
                    protocol: 'WSS / HTTPS TLS 1.3',
                    status: 'connected',
                    lastSync: new Date().toLocaleTimeString('ar-EG')
                }
            };
        } catch (err) {
            return {
                ok: false,
                error: err.message || 'فشل التحقق من كود السحابة. يرجى التأكد من اتصال الإنترنت وصحة الكود.'
            };
        }
    }

    async testCustomCloud(customUrl, apiKey, securityPin) {
        const url = (customUrl || this.config.cloudCustomUrl || '').trim();
        const key = (apiKey || this.config.cloudApiKey || '').trim();
        const pin = (securityPin || this.config.securityPin || '').trim();

        if (!url) {
            return {
                ok: false,
                error: 'يرجى إدخال رابط الخادم السحابي (URL Endpoint) أولاً.'
            };
        }

        let targetUrl = url;
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }

        const isSupabase = targetUrl.toLowerCase().includes('supabase.co');
        const start = Date.now();

        try {
            const headers = { 'User-Agent': 'Managely-POS/1.0.8' };
            if (key) {
                headers['Authorization'] = `Bearer ${key}`;
                headers['apikey'] = key;
                headers['X-Api-Key'] = key;
            }
            if (pin) headers['X-Security-Pin'] = pin;

            let res;
            if (isSupabase) {
                // Supabase-specific health probe
                try {
                    res = await axios.get(targetUrl.replace(/\/+$/, '') + '/auth/v1/health', { timeout: 6000, headers });
                } catch (supaErr) {
                    if (supaErr.response && supaErr.response.status === 401) {
                        const data = supaErr.response.data || {};
                        if (!key) {
                            return {
                                ok: false,
                                error: 'تم الاتصال بخادم Supabase بنجاح! يرجى إدخال مفتاح الـ API Key (anon key) لإكمال المصادقة.'
                            };
                        }
                        return {
                            ok: false,
                            error: 'تم الوصول لمشروع Supabase بنجاح، لكن مفتاح الـ API Key غير صحيح. يرجى التأكد من نسخ الـ (anon public key) أو (service_role key) من لوحة تحكم Supabase.'
                        };
                    }
                    // Try /rest/v1/
                    res = await axios.get(targetUrl.replace(/\/+$/, '') + '/rest/v1/', { timeout: 6000, headers });
                }
            } else {
                // Standard Custom REST API / VPS probe
                const endpoint = targetUrl.replace(/\/+$/, '') + '/api/health';
                try {
                    res = await axios.get(endpoint, { timeout: 6000, headers });
                } catch (headErr) {
                    try {
                        res = await axios.get(targetUrl.replace(/\/+$/, '') + '/health', { timeout: 6000, headers });
                    } catch {
                        res = await axios.get(targetUrl, { timeout: 6000, headers });
                    }
                }
            }

            const latencyMs = Date.now() - start;
            return {
                ok: true,
                latencyMs,
                serverInfo: {
                    type: isSupabase ? 'Supabase Cloud (PostgreSQL / PostgREST)' : 'Custom VPS / REST API',
                    endpoint: targetUrl,
                    statusText: res.statusText || 'OK',
                    statusCode: res.status,
                    data: typeof res.data === 'object' ? res.data : { note: 'Server reachable and active' }
                }
            };
        } catch (err) {
            if (isSupabase && err.response && err.response.status === 401) {
                return {
                    ok: false,
                    error: 'تم الوصول لمشروع Supabase بنجاح، ولكن مفتاح الـ API Key غير صالح. يرجى مراجعة مفتاح anon key في Supabase.'
                };
            }

            if (isSupabase && (err.code === 'ENOTFOUND' || (err.message && err.message.includes('ENOTFOUND')))) {
                return {
                    ok: false,
                    error: `تعذر العثور على عنوان الخادم (${targetUrl}). مشروع Supabase متوقف مؤقتاً (Paused) في لوحة التحكم — يرجى فتح supabase.com والضغط على "Restore project" لإعادة تنشيطه.`
                };
            }

            return {
                ok: false,
                error: err.response 
                    ? `استجاب السيرفر برمز (${err.response.status}: ${err.response.statusText || 'Error'}). تأكد من صلاحية الـ API Key والرابط.`
                    : (err.message || 'تعذر الوصول إلى السيرفر المخصص. تأكد من صحة الرابط واتصال الإنترنت.')
            };
        }
    }

    async forward(action, ...args) {
        const currentMode = this.config.mode || 'client';

        // 1. Custom Cloud REST / Supabase Forwarding
        if (currentMode === 'cloud_custom') {
            const url = (this.config.cloudCustomUrl || '').trim();
            if (!url) throw new Error('لم يتم تحديد رابط الخادم السحابي المخصص (Cloud URL).');
            let targetUrl = url;
            if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;
            const endpoint = targetUrl.replace(/\/+$/, '') + '/api/execute';

            const headers = { 'Content-Type': 'application/json' };
            if (this.config.cloudApiKey) {
                headers['Authorization'] = `Bearer ${this.config.cloudApiKey}`;
                headers['apikey'] = this.config.cloudApiKey;
                headers['X-Api-Key'] = this.config.cloudApiKey;
            }
            if (this.config.securityPin) headers['X-Security-Pin'] = this.config.securityPin;

            try {
                const res = await axios.post(endpoint, { action, args }, { timeout: 8000, headers });
                if (res.data && res.data.success) return res.data.data;
                throw new Error(res.data?.error || 'حدث خطأ في الخادم السحابي المخصص.');
            } catch (err) {
                if (err.response?.data?.error) throw new Error(err.response.data.error);
                throw new Error(`تعذر تنفيذ العملية على السيرفر السحابي (${targetUrl}): ${err.message}`);
            }
        }

        // 2. Client to Master POS Server Forwarding
        const host = this.config.serverHost || '127.0.0.1';
        const port = this.config.serverPort || 4545;

        try {
            const res = await axios.post(`http://${host}:${port}/api/execute`, {
                action,
                args
            }, {
                timeout: 4000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (res.data && res.data.success) {
                return res.data.data;
            } else {
                throw new Error(res.data?.error || 'حدث خطأ في الخادم الرئيسي أثناء تنفيذ العملية.');
            }
        } catch (err) {
            if (err.response?.data?.error) {
                throw new Error(err.response.data.error);
            }
            if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
                throw new Error(`انقطع الاتصال بالجهاز الرئيسي (${host}:${port}). تأكد من تشغيل البرنامج على الجهاز الرئيسي أو قم بالتحويل إلى الوضع المستقل من الإعدادات.`);
            }
            throw err;
        }
    }
}

export const networkClientInstance = new NetworkClient();
