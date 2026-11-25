import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { BrowserWindow } from 'electron';
import {
    productsDB, categoriesDB, salesDB, customersDB, suppliersDB,
    treasuryDB, settingsDB, usersDB, installmentsDB, employeesDB, currenciesDB
} from './database.js';
import { loadNetworkConfig } from './network-service.js';

// Mapping of collection names to local NeDB instances
const DB_COLLECTION_MAP = {
    products: productsDB,
    categories: categoriesDB,
    sales: salesDB,
    customers: customersDB,
    suppliers: suppliersDB,
    treasury: treasuryDB,
    settings: settingsDB,
    users: usersDB,
    installments: installmentsDB,
    employees: employeesDB,
    currencies: currenciesDB
};

export class SupabaseSyncEngine {
    constructor() {
        this.isSyncing = false;
        this.pollTimer = null;
        this.lastSyncTime = null;
        this.pendingQueue = [];
        this.supabaseClient = null;
        this.realtimeChannel = null;
        this.currentCredsKey = null;
        this.lastDnsWarnTime = 0;
    }

    logSyncWarning(context, err, creds) {
        const msg = err.response?.data?.message || err.message || String(err);
        const isDns = msg.includes('ENOTFOUND') || err.code === 'ENOTFOUND';
        if (isDns) {
            const now = Date.now();
            if (now - this.lastDnsWarnTime > 60000) {
                this.lastDnsWarnTime = now;
                console.warn(`[SupabaseSync] ⚠️ خادم الكلاود غير متاح (${creds?.baseUrl || ''}): مشروع Supabase متوقف مؤقتاً (Paused) على الحساب المجاني أو لا يوجد اتصال بالإنترنت.`);
            }
            return;
        }
        console.warn(`[SupabaseSync] ${context}:`, msg);
    }

    getSupabaseCredentials() {
        const config = loadNetworkConfig();
        const mode = config.mode || 'standalone';
        
        if (mode !== 'cloud_custom' && mode !== 'cloud_key') {
            return null;
        }

        let url = (config.cloudCustomUrl || '').trim();
        let key = (config.cloudApiKey || '').trim();

        if (!url || !key) return null;

        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        // Clean trailing slash
        url = url.replace(/\/+$/, '');
        // If user entered /rest/v1 at the end, remove it to get base url
        url = url.replace(/\/rest\/v1\/?$/i, '');

        return {
            baseUrl: url,
            restEndpoint: `${url}/rest/v1/store_data`,
            apiKey: key,
            storeKey: config.cloudSyncKey || 'main_store',
            intervalSeconds: Math.max(3, config.cloudSyncInterval || 5)
        };
    }

    getHeaders(apiKey) {
        return {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Prefer': 'resolution=merge-duplicates,return=representation'
        };
    }

    // Initialize or reconnect Realtime WebSocket connection
    initRealtime() {
        const creds = this.getSupabaseCredentials();
        if (!creds) {
            this.cleanupRealtime();
            return;
        }

        const credsSignature = `${creds.baseUrl}_${creds.storeKey}_${creds.apiKey}`;
        if (this.supabaseClient && this.currentCredsKey === credsSignature && this.realtimeChannel) {
            return; // Already connected with same credentials
        }

        this.cleanupRealtime();
        this.currentCredsKey = credsSignature;

        try {
            console.log(`[SupabaseRealtime] Connecting WebSocket to ${creds.baseUrl} for store [${creds.storeKey}]...`);
            
            this.supabaseClient = createClient(creds.baseUrl, creds.apiKey, {
                realtime: {
                    params: {
                        eventsPerSecond: 20
                    }
                }
            });

            const channelName = `sync_${creds.storeKey}`;
            this.realtimeChannel = this.supabaseClient.channel(channelName, {
                config: {
                    broadcast: { ack: false, self: false }
                }
            });

            // 1. Listen for instant Broadcast events (works immediately across all devices with <100ms latency)
            this.realtimeChannel.on('broadcast', { event: 'store-change' }, async ({ payload }) => {
                if (!payload || !payload.collection || !payload.id) return;
                console.log(`[SupabaseRealtime] ⚡ Instant broadcast received: ${payload.action} on ${payload.collection}/${payload.id}`);
                
                try {
                    const db = DB_COLLECTION_MAP[payload.collection];
                    if (db) {
                        if (payload.action === 'upsert' && payload.data) {
                            const localDoc = { ...payload.data };
                            delete localDoc._id;
                            await db.update({ _id: payload.id }, { $set: localDoc }, { upsert: true });
                            this.notifyWindows(payload.collection, payload.id);
                        } else if (payload.action === 'delete') {
                            await db.remove({ _id: payload.id }, {});
                            this.notifyWindows(payload.collection, payload.id);
                        }
                    }
                } catch (err) {
                    console.error('[SupabaseRealtime] Error processing broadcast payload:', err);
                }
            });

            // 2. Listen for direct PostgreSQL Changes on store_data table
            this.realtimeChannel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'store_data',
                    filter: `store_key=eq.${creds.storeKey}`
                },
                async (payload) => {
                    console.log(`[SupabaseRealtime] 📡 Postgres change event: ${payload.eventType}`);
                    try {
                        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
                            const row = payload.new;
                            const db = DB_COLLECTION_MAP[row.collection];
                            if (db && row.data && row.id) {
                                const localDoc = { ...row.data };
                                delete localDoc._id;
                                await db.update({ _id: row.id }, { $set: localDoc }, { upsert: true });
                                this.notifyWindows(row.collection, row.id);
                            }
                        } else if (payload.eventType === 'DELETE' && payload.old && payload.old.id) {
                            for (const db of Object.values(DB_COLLECTION_MAP)) {
                                await db.remove({ _id: payload.old.id }, {});
                            }
                        }
                    } catch (err) {
                        console.error('[SupabaseRealtime] Error processing postgres_change:', err);
                    }
                }
            );

            this.realtimeChannel.subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[SupabaseRealtime] ✅ Connected and subscribed in real-time!`);
                } else if (status === 'CHANNEL_ERROR') {
                    console.warn(`[SupabaseRealtime] Channel error:`, err?.message || err);
                }
            });

        } catch (err) {
            console.error('[SupabaseRealtime] Failed to initialize Supabase Realtime client:', err);
        }
    }

    cleanupRealtime() {
        if (this.realtimeChannel && this.supabaseClient) {
            try {
                this.supabaseClient.removeChannel(this.realtimeChannel);
            } catch {}
            this.realtimeChannel = null;
        }
        this.supabaseClient = null;
        this.currentCredsKey = null;
    }

    notifyWindows(collection, docId) {
        try {
            const wins = BrowserWindow.getAllWindows();
            for (const win of wins) {
                if (!win.isDestroyed()) {
                    win.webContents.send('data:sync-updated', { collection, docId });
                }
            }
        } catch {}
    }

    // Push a single document change to Supabase with instant WebSocket broadcast
    async pushDocument(collection, doc) {
        const creds = this.getSupabaseCredentials();
        if (!creds || !doc || !doc._id) return;

        // Ensure Realtime channel is initialized
        if (!this.realtimeChannel) {
            this.initRealtime();
        }

        const docId = String(doc._id);

        // 1. Send instant Realtime Broadcast (sub-100ms delivery to all connected devices)
        if (this.realtimeChannel) {
            this.realtimeChannel.send({
                type: 'broadcast',
                event: 'store-change',
                payload: {
                    action: 'upsert',
                    collection,
                    id: docId,
                    data: doc,
                    timestamp: Date.now()
                }
            }).catch(e => console.warn('[SupabaseRealtime] Broadcast notice:', e.message));
        }

        // 2. Persist to Supabase Database via REST API
        const payload = {
            id: docId,
            collection: collection,
            store_key: creds.storeKey,
            data: doc,
            updated_at: new Date().toISOString()
        };

        try {
            await axios.post(creds.restEndpoint, payload, {
                headers: this.getHeaders(creds.apiKey),
                timeout: 7000
            });
            console.log(`[SupabaseSync] ☁️ Pushed & synced ${collection}/${doc._id}`);
        } catch (err) {
            this.logSyncWarning(`Push failed for ${collection}/${doc._id}`, err, creds);
            this.pendingQueue.push({ action: 'push', collection, doc });
        }
    }

    // Delete a document from Supabase with instant WebSocket broadcast
    async deleteDocument(collection, docId) {
        const creds = this.getSupabaseCredentials();
        if (!creds || !docId) return;

        if (!this.realtimeChannel) {
            this.initRealtime();
        }

        // 1. Send instant Realtime Broadcast
        if (this.realtimeChannel) {
            this.realtimeChannel.send({
                type: 'broadcast',
                event: 'store-change',
                payload: {
                    action: 'delete',
                    collection,
                    id: String(docId),
                    timestamp: Date.now()
                }
            }).catch(e => console.warn('[SupabaseRealtime] Broadcast notice:', e.message));
        }

        // 2. Persist delete to database
        try {
            await axios.delete(`${creds.restEndpoint}?collection=eq.${collection}&id=eq.${encodeURIComponent(docId)}`, {
                headers: {
                    'apikey': creds.apiKey,
                    'Authorization': `Bearer ${creds.apiKey}`
                },
                timeout: 7000
            });
            console.log(`[SupabaseSync] ☁️ Deleted from cloud ${collection}/${docId}`);
        } catch (err) {
            this.logSyncWarning(`Delete failed for ${collection}/${docId}`, err, creds);
            this.pendingQueue.push({ action: 'delete', collection, docId });
        }
    }

    // Pull changes from Supabase into local NeDB
    async pullChanges() {
        const creds = this.getSupabaseCredentials();
        if (!creds || this.isSyncing) return;

        this.isSyncing = true;
        try {
            let query = `${creds.restEndpoint}?select=*`;
            if (this.lastSyncTime) {
                query += `&updated_at=gt.${encodeURIComponent(this.lastSyncTime)}`;
            }

            const res = await axios.get(query, {
                headers: {
                    'apikey': creds.apiKey,
                    'Authorization': `Bearer ${creds.apiKey}`
                },
                timeout: 10000
            });

            const rows = res.data;
            if (Array.isArray(rows) && rows.length > 0) {
                console.log(`[SupabaseSync] Pulled ${rows.length} updated items from Supabase.`);
                for (const row of rows) {
                    const db = DB_COLLECTION_MAP[row.collection];
                    if (db && row.data && row.id) {
                        const localDoc = { ...row.data };
                        delete localDoc._id;
                        await db.update({ _id: row.id }, { $set: localDoc }, { upsert: true });
                        this.notifyWindows(row.collection, row.id);
                    }
                }
            }

            this.lastSyncTime = new Date().toISOString();

            // Retry pending queue if any
            await this.flushPendingQueue();
        } catch (err) {
            this.logSyncWarning('Pull error', err, creds);
        } finally {
            this.isSyncing = false;
        }
    }

    // Full Initial Upload (رفع جميع البيانات المحلية للسحابة)
    async fullUploadLocalToCloud() {
        const creds = this.getSupabaseCredentials();
        if (!creds) throw new Error('بيانات الاتصال بـ Supabase غير مكتملة أو غير مفعلة.');

        let totalUploaded = 0;
        const batchSize = 100;

        for (const [collection, db] of Object.entries(DB_COLLECTION_MAP)) {
            if (!db || !db.find) continue;
            const docs = await db.find({});
            if (!docs || docs.length === 0) continue;

            const records = docs.map(doc => ({
                id: String(doc._id),
                collection: collection,
                store_key: creds.storeKey,
                data: doc,
                updated_at: new Date().toISOString()
            }));

            // Chunk in batches
            for (let i = 0; i < records.length; i += batchSize) {
                const chunk = records.slice(i, i + batchSize);
                await axios.post(creds.restEndpoint, chunk, {
                    headers: this.getHeaders(creds.apiKey),
                    timeout: 15000
                });
                totalUploaded += chunk.length;
            }
        }

        this.lastSyncTime = new Date().toISOString();
        return { success: true, totalUploaded };
    }

    // Full Initial Download (سحب جميع البيانات من السحابة وتحديث المحلي)
    async fullDownloadCloudToLocal() {
        const creds = this.getSupabaseCredentials();
        if (!creds) throw new Error('بيانات الاتصال بـ Supabase غير مكتملة أو غير مفعلة.');

        const res = await axios.get(`${creds.restEndpoint}?select=*`, {
            headers: {
                'apikey': creds.apiKey,
                'Authorization': `Bearer ${creds.apiKey}`
            },
            timeout: 15000
        });

        const rows = res.data;
        let totalDownloaded = 0;

        if (Array.isArray(rows) && rows.length > 0) {
            for (const row of rows) {
                const db = DB_COLLECTION_MAP[row.collection];
                if (db && row.data && row.id) {
                    const localDoc = { ...row.data };
                    delete localDoc._id;
                    await db.update({ _id: row.id }, { $set: localDoc }, { upsert: true });
                    totalDownloaded++;
                }
            }
        }

        this.lastSyncTime = new Date().toISOString();
        this.notifyWindows('all', null);
        return { success: true, totalDownloaded };
    }

    async flushPendingQueue() {
        if (this.pendingQueue.length === 0) return;
        const creds = this.getSupabaseCredentials();
        if (!creds) return;

        const queueCopy = [...this.pendingQueue];
        this.pendingQueue = [];

        for (const item of queueCopy) {
            if (item.action === 'push') {
                await this.pushDocument(item.collection, item.doc);
            } else if (item.action === 'delete') {
                await this.deleteDocument(item.collection, item.docId);
            }
        }
    }

    startPolling() {
        if (this.pollTimer) clearInterval(this.pollTimer);

        const creds = this.getSupabaseCredentials();
        if (!creds) return;

        // Initialize Realtime WebSocket channel
        this.initRealtime();

        console.log(`[SupabaseSync] Auto-sync active (Realtime WebSockets + ${creds.intervalSeconds}s Heartbeat)...`);

        // Initial pull
        this.pullChanges();

        this.pollTimer = setInterval(() => {
            this.pullChanges();
        }, creds.intervalSeconds * 1000);
    }

    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
            console.log('[SupabaseSync] Polling stopped.');
        }
        this.cleanupRealtime();
    }
}

export const supabaseSyncInstance = new SupabaseSyncEngine();
