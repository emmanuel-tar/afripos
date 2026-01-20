

import React, { useState, useEffect, useMemo } from 'react';
import { Branch, User, Warehouse, TerminalConfig } from '../types';
import { CURRENCY, DEFAULT_STAFF, DEFAULT_BRANCHES } from '../constants';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useAppStore } from '../stores/useAppStore';

interface SettingsViewProps {
  onBack: () => void;
  currentUser: User;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, currentUser }) => {
  // Inventory Store
  const { warehouses, addWarehouse, deleteWarehouse, fetchInventory } = useInventoryStore();

  useEffect(() => {
    fetchInventory();
  }, []);

  // Persistence logic for branches
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('afripos_branches');
    return saved ? JSON.parse(saved) : DEFAULT_BRANCHES;
  });

  const [currentBranchId, setCurrentBranchId] = useState(() =>
    localStorage.getItem('afripos_current_branch_id') || 'br-1'
  );

  const [staff, setStaff] = useState<User[]>(() => {
    const saved = localStorage.getItem('afripos_staff');
    return saved ? JSON.parse(saved) : DEFAULT_STAFF;
  });

  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddWarehouse, setShowAddWarehouse] = useState(false); // NEW

  // Location Filter for Staff
  const [staffLocationFilter, setStaffLocationFilter] = useState<string>('ALL');

  const [newBranch, setNewBranch] = useState<Partial<Branch>>({
    name: '',
    vatRate: 7.5,
    serviceChargeRate: 5.0,
    currency: CURRENCY,
    enableVat: true,
    enableServiceCharge: true,
    enablePrepareLater: true
  });

  const [newStaff, setNewStaff] = useState<Partial<User>>({
    name: '',
    id: '',
    role: 'waiter',
    pin: ''
  });

  const [newWarehouse, setNewWarehouse] = useState<Partial<Warehouse>>({ // NEW
    name: '',
    address: '',
    managerId: ''
  });

  const handleAddWarehouse = async () => {
    if (!newWarehouse.name) return;
    const warehouse: Warehouse = {
      id: `wh-${Date.now()}`,
      name: newWarehouse.name,
      address: newWarehouse.address,
      managerId: newWarehouse.managerId
    };
    await addWarehouse(warehouse);
    setShowAddWarehouse(false);
    setNewWarehouse({ name: '', address: '', managerId: '' });
  };

  const handleRemoveWarehouse = async (id: string) => {
    if (confirm('Are you sure you want to remove this warehouse?')) {
      await deleteWarehouse(id);
    }
  };

  useEffect(() => {
    localStorage.setItem('afripos_branches', JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem('afripos_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('afripos_current_branch_id', currentBranchId);
  }, [currentBranchId]);

  const handleSavePin = () => {
    setPinError('');
    if (!editingStaff) return;

    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    if (newPin === editingStaff.pin) {
      setPinError('New PIN cannot be the same as old PIN');
      return;
    }

    const commonSequences = ['1234', '1111', '0000', '12345', '123456', '2222', '3333', '4444', '5555'];
    if (commonSequences.includes(newPin)) {
      setPinError('PIN is too weak (common sequence)');
      return;
    }

    setStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, pin: newPin } : s));
    setEditingStaff(null);
    setNewPin('');
    setConfirmPin('');
    alert('Security PIN updated successfully');
  };

  const updateStaffRole = (staffId: string, role: User['role']) => {
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, role } : s));
  };

  const toggleBranchFeature = (branchId: string, feature: keyof Branch) => {
    setBranches(prev => prev.map(b => {
      if (b.id === branchId) {
        return { ...b, [feature]: !b[feature] };
      }
      return b;
    }));
  };

  const handleAddBranch = () => {
    if (!newBranch.name) return;
    const branch: Branch = {
      ...newBranch as Branch,
      id: `br-${Date.now()}`
    };
    setBranches([...branches, branch]);
    setShowAddBranch(false);
    setNewBranch({ name: '', vatRate: 7.5, serviceChargeRate: 5.0, currency: CURRENCY, enableVat: true, enableServiceCharge: true, enablePrepareLater: true });
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.id || !newStaff.pin) {
      alert("All fields are required to create a staff profile.");
      return;
    }
    if (staff.some(s => s.id === newStaff.id)) {
      alert("This Staff ID is already taken. Please use a unique ID.");
      return;
    }
    const user: User = {
      ...newStaff as User,
      locationId: currentBranchId
    };
    setStaff([...staff, user]);
    setShowAddStaff(false);
    setNewStaff({ name: '', id: '', role: 'waiter', pin: '' });
  };

  const removeStaff = (staffId: string) => {
    if (staffId === currentUser.id) {
      alert("You cannot remove yourself.");
      return;
    }
    if (confirm("Are you sure you want to remove this staff member? This action is permanent.")) {
      setStaff(staff.filter(s => s.id !== staffId));
    }
  };

  const getRolePermissions = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'Full System Access, Settings, Inventory, Orders';
      case 'manager': return 'Full System Access, Inventory, Orders';
      case 'chef': return 'KDS, Inventory, Prep Management';
      case 'bartender': return 'KDS (Bar), Basic Orders';
      default: return 'Order Processing, Table Management';
    }
  };

  const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0];

  // Fixed error: Added useMemo to the React import above and using it here to filter staff by location.
  const filteredStaff = useMemo(() => {
    if (staffLocationFilter === 'ALL') return staff;
    return staff.filter(s => s.locationId === staffLocationFilter);
  }, [staff, staffLocationFilter]);

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="p-8 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
        <div>
          <button onClick={onBack} className="text-indigo-600 font-bold flex items-center gap-2 mb-2 hover:translate-x-[-4px] transition-transform">
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">System Configuration</h1>
        </div>
        <div className="flex gap-4">
          <div className="bg-indigo-50 border border-indigo-100 px-6 py-2 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
            <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">{currentBranch.name}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 max-w-7xl mx-auto w-full space-y-16">
        {/* Branch Management */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">Location Management</h2>
            <button
              onClick={() => setShowAddBranch(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
            >
              + Add New Branch
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map(branch => (
              <div
                key={branch.id}
                className={`p-8 rounded-[2.5rem] border-2 transition-all relative ${currentBranchId === branch.id ? 'border-indigo-600 bg-white shadow-2xl' : 'border-slate-200 bg-white/50 hover:border-slate-300'}`}
              >
                {currentBranchId === branch.id && (
                  <div className="absolute -top-3 left-8 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Active Branch</div>
                )}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">{branch.name}</h3>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Branch ID: {branch.id}</div>
                  </div>
                  {currentBranchId !== branch.id && (
                    <button
                      onClick={() => setCurrentBranchId(branch.id)}
                      className="text-indigo-600 font-black text-xs uppercase hover:underline"
                    >
                      Switch
                    </button>
                  )}
                </div>

                {/* Fiscal & Feature Toggles */}
                <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prepare Later Feature</span>
                    <button
                      onClick={() => toggleBranchFeature(branch.id, 'enablePrepareLater')}
                      className={`w-10 h-6 rounded-full transition-all relative ${branch.enablePrepareLater ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${branch.enablePrepareLater ? 'left-5' : 'left-1'}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enable VAT (7.5%)</span>
                    <button
                      onClick={() => toggleBranchFeature(branch.id, 'enableVat')}
                      className={`w-10 h-6 rounded-full transition-all relative ${branch.enableVat ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${branch.enableVat ? 'left-5' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">VAT Rate</div>
                    <div className="text-lg font-black text-slate-800">{branch.vatRate}%</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">S. Charge</div>
                    <div className="text-lg font-black text-slate-800">{branch.serviceChargeRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Warehouse Management */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">Inventory Warehouses</h2>
            <button
              onClick={() => setShowAddWarehouse(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
            >
              + Add Warehouse
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map(warehouse => (
              <div
                key={warehouse.id}
                className="p-8 rounded-[2.5rem] border-2 border-slate-200 bg-white/50 hover:border-slate-300 transition-all relative group"
              >
                <button
                  onClick={() => handleRemoveWarehouse(warehouse.id)}
                  className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-slate-800">{warehouse.name}</h3>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {warehouse.id}</div>
                </div>

                <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Address</div>
                    <div className="text-sm font-bold text-slate-700">{warehouse.address || 'N/A'}</div>
                  </div>
                </div>
              </div>
            ))}
            {warehouses.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                No warehouses configured. Add one to start managing stock.
              </div>
            )}
          </div>
        </section>

        {/* Staff Section */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">Staff Directory</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase mt-1 ml-4">Showing {filteredStaff.length} employees</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-3 shrink-0">
                <span className="text-[9px] font-black text-slate-400 uppercase">Filter by Location:</span>
                <select
                  value={staffLocationFilter}
                  onChange={(e) => setStaffLocationFilter(e.target.value)}
                  className="text-xs font-black text-indigo-600 uppercase bg-transparent outline-none cursor-pointer"
                >
                  <option value="ALL">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowAddStaff(true)}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-lg transition-all"
              >
                + Add Staff
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStaff.map(member => (
              <div key={member.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 relative group">
                {member.id !== currentUser.id && (
                  <button
                    onClick={() => removeStaff(member.id)}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl text-indigo-600 font-black shrink-0 shadow-inner">
                  {member.name[0]}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="text-2xl font-black text-slate-800">{member.name}</div>
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {member.id}</div>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                      {branches.find(b => b.id === member.locationId)?.name || 'Unknown'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Role</label>
                      <select
                        value={member.role}
                        onChange={(e) => updateStaffRole(member.id, e.target.value as User['role'])}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        <option value="admin">Administrator</option>
                        <option value="manager">Manager</option>
                        <option value="waiter">Waiter</option>
                        <option value="chef">Chef</option>
                        <option value="bartender">Bartender</option>
                      </select>
                      <div className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter mt-1 max-w-[150px]">
                        {getRolePermissions(member.role)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Security</label>
                      <button
                        onClick={() => setEditingStaff(member)}
                        className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Update PIN
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-16 border-t border-slate-200">
          <div className="bg-red-50 border-2 border-red-100 p-10 rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <h3 className="text-red-800 font-black text-2xl uppercase tracking-tight">Factory Reset</h3>
              <p className="text-red-600/70 text-base font-bold max-w-md">This will wipe all locally stored branches, staff roles, and order history. Use with extreme caution.</p>
            </div>
            <button
              onClick={() => { if (confirm('Are you absolutely sure? This will wipe the entire local database.')) { localStorage.clear(); window.location.reload(); } }}
              className="bg-red-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all"
            >
              Clear All Data
            </button>
          </div>
        </section>
      </div>

      {/* Add Branch Modal */}
      {showAddBranch && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-3xl font-black text-slate-800">Add New Branch</h3>
              <button onClick={() => setShowAddBranch(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Branch Name</label>
                <input
                  type="text"
                  value={newBranch.name}
                  onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="e.g. Abuja Central"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">VAT Rate (%)</label>
                  <input
                    type="number"
                    value={newBranch.vatRate}
                    onChange={e => setNewBranch({ ...newBranch, vatRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">S. Charge (%)</label>
                  <input
                    type="number"
                    value={newBranch.serviceChargeRate}
                    onChange={e => setNewBranch({ ...newBranch, serviceChargeRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleAddBranch}
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-2xl shadow-indigo-100 uppercase tracking-widest text-lg"
              >
                Register Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {showAddWarehouse && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-3xl font-black text-slate-800">Add Warehouse</h3>
              <button onClick={() => setShowAddWarehouse(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Warehouse Name</label>
                <input
                  type="text"
                  value={newWarehouse.name}
                  onChange={e => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="e.g. Main Stockroom"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Address / Location</label>
                <input
                  type="text"
                  value={newWarehouse.address}
                  onChange={e => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none"
                  placeholder="e.g. Building B, Ground Floor"
                />
              </div>
              <button
                onClick={handleAddWarehouse}
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-2xl shadow-indigo-100 uppercase tracking-widest text-lg"
              >
                Create Warehouse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-3xl font-black text-slate-800">Register Staff</h3>
              <button onClick={() => setShowAddStaff(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="e.g. Ebuka Okafor"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">System ID (Numeric)</label>
                  <input
                    type="text"
                    value={newStaff.id}
                    onChange={e => setNewStaff({ ...newStaff, id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none"
                    placeholder="e.g. 55"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Role</label>
                  <select
                    value={newStaff.role}
                    onChange={e => setNewStaff({ ...newStaff, role: e.target.value as User['role'] })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none"
                  >
                    <option value="admin">Administrator</option>
                    <option value="manager">Manager</option>
                    <option value="waiter">Waiter</option>
                    <option value="chef">Chef</option>
                    <option value="bartender">Bartender</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Initial Security PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newStaff.pin}
                  onChange={e => setNewStaff({ ...newStaff, pin: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none tracking-[1em] text-center"
                  placeholder="****"
                />
              </div>
              <button
                onClick={handleAddStaff}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black shadow-2xl uppercase tracking-widest text-lg"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Edit Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-[210] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10">
            <h3 className="text-3xl font-black text-slate-800 mb-2">Security Access</h3>
            <p className="text-slate-400 font-bold text-sm mb-10 uppercase tracking-widest">Updating: {editingStaff.name}</p>

            {pinError && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {pinError}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Security PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-5 text-3xl font-mono tracking-[1em] text-center outline-none focus:ring-4 focus:ring-indigo-100"
                  placeholder="****"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirm New PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-5 text-3xl font-mono tracking-[1em] text-center outline-none focus:ring-4 focus:ring-indigo-100"
                  placeholder="****"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => { setEditingStaff(null); setPinError(''); }} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                <button
                  onClick={handleSavePin}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-100 uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                  Verify & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
