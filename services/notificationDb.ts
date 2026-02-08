import { db } from './offlineDb';
import { NotificationTemplate, BranchNotificationSetting, NotificationLog } from '../types';

export const notificationDb = {
    // Templates
    getTemplates: async () => {
        return await db.notificationTemplates.toArray();
    },
    saveTemplate: async (template: NotificationTemplate) => {
        return await db.notificationTemplates.put(template);
    },
    deleteTemplate: async (id: string) => {
        return await db.notificationTemplates.delete(id);
    },

    // Settings
    getSettings: async () => {
        return await db.notificationSettings.toArray();
    },
    saveSetting: async (setting: BranchNotificationSetting) => {
        return await db.notificationSettings.put(setting);
    },
    getSettingByBranch: async (branchId: string) => {
        return await db.notificationSettings.where('branchId').equals(branchId).first();
    },

    // Logs
    getLogs: async () => {
        return await db.notificationLogs.toArray();
    },
    saveLog: async (log: NotificationLog) => {
        return await db.notificationLogs.put(log);
    },
    clearLogs: async () => {
        return await db.notificationLogs.clear();
    }
};
