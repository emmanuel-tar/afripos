import { create } from 'zustand';
import {
    NotificationTemplate,
    BranchNotificationSetting,
    NotificationLog,
    NotificationEvent,
    NotificationChannel,
    Reservation,
    Branch
} from '../types';
import { notificationDb } from '../services/notificationDb';

interface NotificationState {
    templates: NotificationTemplate[];
    settings: BranchNotificationSetting[];
    logs: NotificationLog[];
    isLoading: boolean;

    // Actions
    fetchNotifications: () => Promise<void>;

    // Template Actions
    saveTemplate: (template: NotificationTemplate) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;

    // Setting Actions
    saveSetting: (setting: BranchNotificationSetting) => Promise<void>;

    // Send Logic (Mock)
    sendNotification: (
        event: NotificationEvent,
        reservation: Reservation,
        branch: Branch
    ) => Promise<boolean>;

    dispatchNotification: (
        template: NotificationTemplate,
        reservation: Reservation,
        branch: Branch
    ) => Promise<boolean>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    templates: [],
    settings: [],
    logs: [],
    isLoading: false,

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            let [templates, settings, logs] = await Promise.all([
                notificationDb.getTemplates(),
                notificationDb.getSettings(),
                notificationDb.getLogs()
            ]);

            if (templates.length === 0) {
                const defaults: NotificationTemplate[] = [
                    { id: 'def-1', event: 'RESERVATION_CREATED', channel: 'WHATSAPP', content: 'Hi {{customer_name}}, your table for {{party_size}} on {{reservation_date}} at {{reservation_time}} is confirmed at {{branch_name}}! See you soon.', isActive: true },
                    { id: 'def-2', event: 'RESERVATION_CREATED', channel: 'SMS', content: 'Confirmed: Table for {{party_size}} on {{reservation_date}} @ {{reservation_time}}. {{branch_name}}.', isActive: true },
                    { id: 'def-3', event: 'RESERVATION_CONFIRMED', channel: 'WHATSAPP', content: 'Great news {{customer_name}}! Your reservation at {{branch_name}} for today at {{reservation_time}} has been approved. See you then!', isActive: true },
                    { id: 'def-4', event: 'RESERVATION_CANCELLED', channel: 'WHATSAPP', content: 'Hi {{customer_name}}, your reservation for {{reservation_date}} at {{branch_name}} has been cancelled as requested.', isActive: true },
                    { id: 'def-5', event: 'NO_SHOW', channel: 'SMS', content: 'Hi {{customer_name}}, we missed you today at {{branch_name}}. Your reservation was marked as a no-show. Feel free to rebook anytime!', isActive: true },
                    { id: 'def-6', event: 'RESERVATION_SEATED', channel: 'WHATSAPP', content: 'Welcome to {{branch_name}}, {{customer_name}}! We hope you enjoy your meal. Let us know if you need anything!', isActive: true }
                ];
                for (const t of defaults) {
                    await notificationDb.saveTemplate(t);
                }
                templates = defaults;
            }

            set({ templates, settings, logs, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            set({ isLoading: false });
        }
    },

    saveTemplate: async (template) => {
        await notificationDb.saveTemplate(template);
        const templates = await notificationDb.getTemplates();
        set({ templates });
    },

    deleteTemplate: async (id) => {
        await notificationDb.deleteTemplate(id);
        const templates = await notificationDb.getTemplates();
        set({ templates });
    },

    saveSetting: async (setting) => {
        await notificationDb.saveSetting(setting);
        const settings = await notificationDb.getSettings();
        set({ settings });
    },

    sendNotification: async (event, reservation, branch) => {
        const { templates, settings } = get();
        const branchSetting = settings.find(s => s.branchId === branch.id);

        // 1. Check if event is enabled for this branch
        if (branchSetting && !branchSetting.enabledEvents.includes(event)) {
            console.log(`Notification for ${event} is disabled for branch ${branch.name}`);
            return false;
        }

        const preferredChannel = branchSetting?.preferredChannel || 'WHATSAPP';

        // 2. Resolve Template
        const template = templates.find(t => t.event === event && t.channel === preferredChannel && t.isActive);

        if (!template) {
            console.error(`No active template found for ${event} on ${preferredChannel}`);
            if (branchSetting?.fallbackToSms && preferredChannel === 'WHATSAPP') {
                // Try SMS fallback logic recursively or directly
                const smsTemplate = templates.find(t => t.event === event && t.channel === 'SMS' && t.isActive);
                if (smsTemplate) {
                    return await get().dispatchNotification(smsTemplate, reservation, branch);
                }
            }
            return false;
        }

        return await get().dispatchNotification(template, reservation, branch);
    },

    // Helper to render and log
    dispatchNotification: async (template: NotificationTemplate, reservation: Reservation, branch: Branch) => {
        const content = renderTemplate(template.content, reservation, branch);

        // Mocking dynamic delivery success/failure
        const isSuccess = Math.random() > 0.05; // 95% success rate for mock

        const log: NotificationLog = {
            id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            customerId: reservation.customerId,
            customerName: reservation.customerName,
            reservationId: reservation.id,
            channel: template.channel,
            event: template.event,
            status: isSuccess ? 'SENT' : 'FAILED',
            content,
            errorMessage: isSuccess ? undefined : 'Provider timeout (Mock Error)'
        };

        await notificationDb.saveLog(log);
        set(state => ({ logs: [log, ...state.logs] }));

        return isSuccess;
    }
}));

// Template Placeholder Parser
const renderTemplate = (content: string, reservation: Reservation, branch: Branch) => {
    let rendered = content;
    const placeholders: Record<string, string> = {
        '{{customer_name}}': reservation.customerName,
        '{{reservation_date}}': reservation.date,
        '{{reservation_time}}': reservation.time,
        '{{party_size}}': reservation.partySize.toString(),
        '{{table_name}}': reservation.tableName || 'N/A',
        '{{branch_name}}': branch.name,
        '{{contact_phone}}': branch.id // This should ideally be a branch phone from branch object
    };

    Object.entries(placeholders).forEach(([key, value]) => {
        rendered = rendered.replace(new RegExp(key, 'g'), value);
    });

    return rendered;
};
