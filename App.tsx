import React, { useEffect, useCallback } from 'react';
import { AppView, Order } from './types';
import { LoginView } from './views/LoginView';
import MenuView from './views/MenuView';
import InventoryView from './views/InventoryView';
import FinanceView from './views/FinanceView';
import StaffView from './views/StaffView';
import CustomerView from './views/CustomerView';
import { PurchasingView } from './views/PurchasingView';
import FloorMapView from './views/FloorMapView';
import StationDisplayView from './views/StationDisplayView';
import SettingsView from './views/SettingsView';
import ManufacturingView from './views/ManufacturingView';
import ReservationsView from './views/ReservationsView';
import NotificationSettingsView from './views/NotificationSettingsView';
import SystemConfigView from './views/SystemConfigView';
import OrderDetailView from './views/OrderDetailView';
import WalletManagementView from './views/WalletManagementView';
import PublicBookingPortal from './views/PublicBookingPortal';
import BookingSelfServiceView from './views/BookingSelfServiceView';
import StaffLoginView from './views/StaffLoginView';
import TerminalBindingView from './views/TerminalBindingView';
import ShiftManagementView from './views/ShiftManagementView';
import NotificationListener from './components/NotificationListener';
import PrinterRoutingView from './views/PrinterRoutingView';
import { syncManager } from './services/syncManager';
import DashboardSidebar from './components/DashboardSidebar';
import ServerConnectionView from './views/ServerConnectionView';
import DeviceManagementView from './views/DeviceManagementView';
import { getSyncStatus } from './services/db';
import { useAppStore } from './stores/useAppStore';
import { useCartStore } from './stores/useCartStore';
import { useTerminalStore } from './stores/useTerminalStore';
import { useDeviceStore } from './stores/useDeviceStore';
import { useNotificationStore } from './stores/useNotificationStore';
import { Toaster } from 'sonner';
import { RefreshCcw, Server } from 'lucide-react';
import { migrateFromLocalStorage } from './services/offlineDb';

const App: React.FC = () => {
  const { view, viewParams, setView, user, currentBranch, isOnline, setIsOnline, error, setError } = useAppStore();
  const { isBound, activeShift } = useTerminalStore();
  const { setTableNumber, clearCart } = useCartStore();

  const playErrorSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio feedback failed:", e);
    }
  }, []);

  // Role-Based Routing Logic
  useEffect(() => {
    const isAtGateway = view === AppView.STAFF_LOGIN || view === AppView.LOGIN_ID || view === AppView.LOGIN_PASSWORD;
    if (user && activeShift && isAtGateway) {
      // Automatically route based on role after shift start
      switch (user.role) {
        case 'waiter':
          setView(AppView.MENU, { initialCheckout: false });
          break;
        case 'chef':
        case 'bartender':
          setView(AppView.STATION_DISPLAY);
          break;
        case 'manager':
        case 'admin':
          setView(AppView.DASHBOARD);
          break;
        default:
          setView(AppView.DASHBOARD);
      }
    }
  }, [user, activeShift, setView, view]);

  // Sync online status and error effects
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  useEffect(() => {
    if (error) {
      playErrorSound();
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    }
  }, [error, playErrorSound]);

  // Initialize Sync Engine
  useEffect(() => {
    syncManager.startEngine();
    return () => syncManager.stopEngine();
  }, []);

  // Migrate database from localStorage to Dexie on startup
  useEffect(() => {
    migrateFromLocalStorage();
  }, []);

  const handleFastOrder = () => {
    setTableNumber('FAST');
    // clearCart(); // Don't clear cart, let session persist
    setView(AppView.MENU, { initialCheckout: false });
  };

  const handleSettleTable = (order: Order) => {
    setView(AppView.CLOSE_BILL, { tableNumber: order.tableNumber });
  };

  const onLoginSuccess = () => {
    setView(AppView.DASHBOARD);
  };

  // GATEWAY FLOW LOGIC
  const { currentDevice } = useDeviceStore();
  if (!currentDevice || currentDevice.status !== 'APPROVED') return <ServerConnectionView />;

  if (!isBound) return <TerminalBindingView />;
  if (!user) return <StaffLoginView />;
  if (!activeShift) return <ShiftManagementView />;

  const canAccessSettings = (user?.role === 'admin' || user?.role === 'manager') && currentDevice?.type === 'ADMIN';
  const canAccessInventory = (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'chef') && currentDevice?.type === 'ADMIN';
  const canAccessKDS = (user?.role === 'admin' || user?.role === 'chef' || user?.role === 'bartender') && (currentDevice?.type === 'KDS' || currentDevice?.type === 'ADMIN');
  const canAccessPOS = (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'waiter') && (currentDevice?.type === 'CASHPOINT' || currentDevice?.type === 'WAITER' || currentDevice?.type === 'ADMIN');

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col">
      {!(view === AppView.PUBLIC_BOOKING || view === AppView.BOOKING_SELF_SERVICE) && (
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="text-indigo-600 font-black text-2xl tracking-tight uppercase">AFRI<span className="text-slate-800">POS</span></div>
            {user && (
              <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs uppercase">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">{user.role}</div>
                  <div className="text-sm font-black text-slate-800 leading-tight">{user.name}</div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch:</span>
              <span className="text-xs font-black text-indigo-600">{currentBranch?.name || 'Loading...'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* Pairing Notification Bell (Hub Master Only) */}
            {currentDevice?.id === 'HUB-MASTER' && (() => {
              const { pendingPairingRequests } = useNotificationStore();
              const hasPendingRequests = pendingPairingRequests.length > 0;

              return hasPendingRequests ? (
                <button
                  onClick={() => setView(AppView.DEVICE_MANAGEMENT)}
                  className="relative flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full border border-amber-200 hover:bg-amber-100 transition-all shadow-sm animate-pulse"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <span className="text-[9px] font-black uppercase tracking-widest">{pendingPairingRequests.length} New Request{pendingPairingRequests.length !== 1 ? 's' : ''}</span>
                </button>
              ) : null;
            })()}

            {/* Local Server Sync Status */}
            {currentDevice?.id === 'HUB-MASTER' ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200">
                <Server className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Local Server Hub (Primary)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
                <RefreshCcw className="w-3 h-3 text-indigo-500" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Local Server Active</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        {error && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[60] bg-red-600 text-white px-8 py-4 rounded-[2rem] text-sm font-black shadow-2xl flex items-center gap-3 border border-red-500 animate-bounce">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {view === AppView.PUBLIC_BOOKING && <PublicBookingPortal />}
        {view === AppView.BOOKING_SELF_SERVICE && <BookingSelfServiceView />}

        {view === AppView.STAFF_LOGIN && (
          <StaffLoginView />
        )}

        {(view === AppView.LOGIN_ID || view === AppView.LOGIN_PASSWORD) && (
          <LoginView onLoginSuccess={onLoginSuccess} />
        )}

        {view === AppView.DASHBOARD && (
          <div className="h-full flex">
            <DashboardSidebar
              canAccessKDS={canAccessKDS}
              canAccessInventory={canAccessInventory}
              canAccessSettings={canAccessSettings}
            />

            <div className="flex-1 flex flex-col p-16 bg-slate-50 overflow-y-auto">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <div className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Welcome Back</div>
                  <h2 className="text-5xl font-black text-slate-800 tracking-tight">System Dashboard</h2>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 font-black uppercase tracking-widest text-xs">Active Session</div>
                  <div className="text-2xl font-black text-slate-900">{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-10">
                <button onClick={() => setView(AppView.FLOOR_MAP)} className="h-72 bg-white rounded-[3rem] border border-slate-200 shadow-xl flex flex-col items-center justify-center hover:border-indigo-600 hover:shadow-2xl transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform"></div>
                  <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-inner">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="text-2xl font-black text-slate-800">Table Service</div>
                </button>

                <button onClick={handleFastOrder} className="h-72 bg-indigo-600 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center hover:bg-indigo-700 transition-all group text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform"></div>
                  <div className="w-24 h-24 rounded-[2rem] bg-white/20 text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-all shadow-lg">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div className="text-2xl font-black uppercase tracking-tight">Quick Sell</div>
                </button>

                {canAccessKDS && (
                  <button onClick={() => setView(AppView.STATION_DISPLAY)} className="h-72 bg-slate-800 rounded-[3rem] shadow-xl flex flex-col items-center justify-center hover:bg-slate-900 transition-all group text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform"></div>
                    <div className="w-24 h-24 rounded-[2rem] bg-white/10 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-all shadow-lg">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="text-2xl font-black">Orders KDS</div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {view === AppView.FLOOR_MAP && (
          <FloorMapView
            onBack={() => setView(AppView.DASHBOARD)}
            onSelectTable={(num) => { setTableNumber(num); setView(AppView.MENU, { initialCheckout: false }); }}
            onSettleTable={handleSettleTable}
          />
        )}
        {view === AppView.STATION_DISPLAY && canAccessKDS && <StationDisplayView onBack={() => setView(AppView.DASHBOARD)} />}
        {(view === AppView.MENU || view === AppView.FLOOR_MAP) && canAccessPOS && (
          <MenuView
            tableNumber={useCartStore.getState().tableNumber || '1'}
            user={user}
            branchSettings={currentBranch!}
            initialCheckout={viewParams?.initialCheckout ?? false}
            onOrderComplete={() => { setTableNumber(''); setView(AppView.DASHBOARD); }}
            onBack={() => { setTableNumber(''); setView(AppView.DASHBOARD); }}
          />
        )}
        {view === AppView.INVENTORY && <InventoryView onBack={() => setView(AppView.DASHBOARD)} />}
        {view === AppView.SETTINGS && user && <SettingsView onBack={() => setView(AppView.DASHBOARD)} currentUser={user} />}
        {view === AppView.FINANCE && <FinanceView onBack={() => setView(AppView.DASHBOARD)} />}
        {view === AppView.HR && <StaffView onBack={() => setView(AppView.DASHBOARD)} />}
        {view === AppView.CRM && <CustomerView onBack={() => setView(AppView.DASHBOARD)} />}
        {view === AppView.PURCHASING && user && <PurchasingView onBack={() => setView(AppView.DASHBOARD)} />}
        {view === AppView.MANUFACTURING && user && <ManufacturingView onBack={() => setView(AppView.DASHBOARD)} />}
        {view === AppView.RESERVATIONS && <ReservationsView onBack={() => setView(AppView.DASHBOARD)} />}
        {view === AppView.NOTIFICATION_SETTINGS && <NotificationSettingsView onBack={() => setView(AppView.DASHBOARD)} />}
        {view === AppView.SYSTEM_CONFIG && <SystemConfigView onBack={() => setView(AppView.SETTINGS)} />}
        {view === AppView.CLOSE_BILL && <OrderDetailView onBack={() => setView(AppView.DASHBOARD)} />}
        {view === AppView.WALLET_MANAGEMENT && <WalletManagementView onBack={() => setView(AppView.DASHBOARD)} />}
        {view === AppView.PRINTER_ROUTING && <PrinterRoutingView onBack={() => setView(AppView.SETTINGS)} />}
        {view === AppView.DEVICE_MANAGEMENT && <DeviceManagementView onBack={() => setView(AppView.SETTINGS)} />}
      </div>
      <Toaster position="top-right" richColors />
      <NotificationListener />
    </div >
  );
};

export default App;
