import React, { useState } from 'react';
import { AppView, User } from '../types';
import Keypad from '../components/Keypad';
import { useAppStore } from '../stores/useAppStore';
import { DEFAULT_STAFF } from '../constants';

interface LoginViewProps {
    onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
    const { view, setView, setUser, setError, error } = useAppStore();
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    // Helper to load staff (could be moved to a service)
    const getStaff = () => {
        const saved = localStorage.getItem('afripos_staff');
        return saved ? JSON.parse(saved) : DEFAULT_STAFF;
    };

    const staff = getStaff();

    const triggerError = (msg: string) => {
        setError(msg);
        setIsShaking(true);
        setTimeout(() => {
            setIsShaking(false);
            setTimeout(() => setError(null), 2500);
        }, 400);
    };

    const handleIdSubmit = () => {
        const foundStaff = staff.find((s: User) => s.id === employeeId);
        if (foundStaff) {
            setError(null);
            setView(AppView.LOGIN_PASSWORD);
        } else {
            triggerError('Invalid Staff ID');
            setEmployeeId('');
        }
    };

    const handlePasswordSubmit = () => {
        const foundStaff = staff.find((s: User) => s.id === employeeId && s.pin === password);
        if (foundStaff) {
            setUser(foundStaff);
            onLoginSuccess();
        } else {
            triggerError('Invalid Security PIN');
            setPassword('');
        }
    };

    return (
        <div className="h-full flex items-center justify-center p-4">
            <div className={`w-full max-sm ${isShaking ? 'animate-shake' : ''}`}>
                <Keypad
                    title={view === AppView.LOGIN_ID ? "Staff System ID" : "Secure Entry PIN"}
                    currentValue={view === AppView.LOGIN_ID ? employeeId : password}
                    onInput={(v) => { setError(null); view === AppView.LOGIN_ID ? setEmployeeId(prev => prev + v) : setPassword(prev => prev + v); }}
                    onClear={() => view === AppView.LOGIN_ID ? setEmployeeId('') : setPassword('')}
                    onDelete={() => view === AppView.LOGIN_ID ? setEmployeeId(prev => prev.slice(0, -1)) : setPassword(prev => prev.slice(0, -1))}
                    onSubmit={view === AppView.LOGIN_ID ? handleIdSubmit : handlePasswordSubmit}
                    maxDigits={6}
                    submitLabel={view === AppView.LOGIN_ID ? "IDENTIFY" : "AUTHENTICATE"}
                />
            </div>
        </div>
    );
};
