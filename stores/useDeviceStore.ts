import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Device, DeviceRole } from '../types';

interface DeviceState {
    currentDevice: Device | null;
    pendingRequests: Device[];
    trustedDevices: Device[];

    // Actions
    requestPairing: (name: string, type: DeviceRole, serverIp: string) => void;
    approveDevice: (deviceId: string) => void;
    rejectDevice: (deviceId: string) => void;
    revokeDevice: (deviceId: string) => void;
    resetDevice: () => void;
}

export const useDeviceStore = create<DeviceState>()(
    persist(
        (set) => ({
            currentDevice: null,
            pendingRequests: [],
            trustedDevices: [],

            requestPairing: (name, type, serverIp) => {
                const newDevice: Device = {
                    id: Math.random().toString(36).substr(2, 9),
                    name,
                    type,
                    status: 'PENDING',
                    ip: serverIp,
                    lastSeen: Date.now()
                };
                set({ currentDevice: newDevice });

                // In a real app, this would be a POST to the local server
                console.log(`[Pairing] Requesting pairing for ${name} (${type}) at ${serverIp}`);
            },

            approveDevice: (deviceId) => {
                set((state) => {
                    const device = state.pendingRequests.find(d => d.id === deviceId);
                    if (!device) return state;

                    const approvedDevice: Device = {
                        ...device,
                        status: 'APPROVED',
                        token: `token_${Math.random().toString(36).substr(2, 15)}`,
                        pairedAt: Date.now()
                    };

                    return {
                        pendingRequests: state.pendingRequests.filter(d => d.id !== deviceId),
                        trustedDevices: [...state.trustedDevices, approvedDevice]
                    };
                });
            },

            rejectDevice: (deviceId) => {
                set((state) => ({
                    pendingRequests: state.pendingRequests.filter(d => d.id !== deviceId)
                }));
            },

            revokeDevice: (deviceId) => {
                set((state) => ({
                    trustedDevices: state.trustedDevices.filter(d => d.id !== deviceId)
                }));
            },

            resetDevice: () => set({ currentDevice: null })
        }),
        {
            name: 'afripos-device-storage',
            partialize: (state) => ({
                currentDevice: state.currentDevice,
                trustedDevices: state.trustedDevices
            }),
        }
    )
);
