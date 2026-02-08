import { getUnsyncedOrders, markAsSynced } from './db';
import { SYNC_INTERVAL_MS, MOCK_SYNC_DELAY_MS, LOCAL_SERVER_URL } from '../constants';

class SyncManager {
    private intervalId: number | null = null;
    private isSyncing: boolean = false;

    public startEngine() {
        if (this.intervalId) return;

        console.log('Sync Engine Started...');
        this.intervalId = window.setInterval(() => this.performSync(), SYNC_INTERVAL_MS);
    }

    public stopEngine() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private async performSync() {
        if (this.isSyncing || !navigator.onLine) return;

        try {
            this.isSyncing = true;
            const unsynced = await getUnsyncedOrders();

            if (unsynced.length === 0) {
                this.isSyncing = false;
                return;
            }

            console.log(`[Sync] Attempting to sync ${unsynced.length} orders to ${LOCAL_SERVER_URL}...`);

            for (const order of unsynced) {
                // Simulation of a local server API call
                await new Promise(resolve => setTimeout(resolve, MOCK_SYNC_DELAY_MS));

                // In a real app: await fetch(`${LOCAL_SERVER_URL}/orders`, { method: 'POST', body: JSON.stringify(order) });

                await markAsSynced(order.id);
                console.log(`[Sync] Order ${order.id.slice(-8)} synced successfully.`);
            }

        } catch (error) {
            console.error('[Sync] Sync failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }
}

export const syncManager = new SyncManager();
