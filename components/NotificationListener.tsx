import React, { useEffect, useRef } from 'react';
import { useNotificationStore } from '../stores/useNotificationStore';
import { getOrders } from '../services/db';
import { useAppStore } from '../stores/useAppStore';

const NotificationListener: React.FC = () => {
    const { user } = useAppStore();
    const { setReadyOrders, isAlarmActive } = useNotificationStore();
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const intervalRef = useRef<number | null>(null);

    // Only active for Waiters and Admins
    const isWaiter = user?.role === 'waiter' || user?.role === 'admin' || user?.role === 'manager';

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
