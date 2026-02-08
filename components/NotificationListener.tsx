import React, { useEffect, useRef } from 'react';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useDeviceStore } from '../stores/useDeviceStore';
import { getOrders } from '../services/db';
import { useAppStore } from '../stores/useAppStore';

const NotificationListener: React.FC = () => {
    const { user } = useAppStore();
    const { currentDevice, pendingRequests } = useDeviceStore();
    const { setReadyOrders, isAlarmActive, setPendingPairingRequests } = useNotificationStore();
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const intervalRef = useRef<number | null>(null);

    // Only active for Waiters and Admins
    const isWaiter = user?.role === 'waiter' || user?.role === 'admin' || user?.role === 'manager';
    const isHubMaster = currentDevice?.id === 'HUB-MASTER';

    useEffect(() => {
        if (!isWaiter) return;

        const checkOrders = async () => {
            const all = await getOrders();
            const readyOrders = all.filter(o => o.status === 'ready');
            setReadyOrders(readyOrders);
        };

        checkOrders();
        const pollInterval = setInterval(checkOrders, 4000); // Poll every 4 seconds

        return () => clearInterval(pollInterval);
    }, [isWaiter, setReadyOrders]);

    // Poll for pending pairing requests (Hub Master only)
    useEffect(() => {
        if (!isHubMaster) return;

        const checkPairingRequests = () => {
            const pendingIds = pendingRequests.map(r => r.id);
            setPendingPairingRequests(pendingIds);
        };

        checkPairingRequests();
        const pollInterval = setInterval(checkPairingRequests, 3000); // Poll every 3 seconds

        return () => clearInterval(pollInterval);
    }, [isHubMaster, pendingRequests, setPendingPairingRequests]);

    const playBeep = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime); // High pitch A5

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.warn("Audio alarm failed:", e);
        }
    };

    useEffect(() => {
        if (isAlarmActive && isWaiter) {
            intervalRef.current = window.setInterval(playBeep, 2000); // Beep every 2 seconds
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAlarmActive, isWaiter]);

    return null; // Headless component
};

export default NotificationListener;
