
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Table, TableStatus } from '../types';
import { MOCK_TABLES } from '../constants';

interface TableState {
    tables: Table[];
    isLoading: boolean;

    // Actions
    addTable: (table: Table) => void;
    updateTable: (table: Table) => void;
    deleteTable: (id: string) => void;

    // Table Operations
    assignTable: (tableId: string, staffId: string) => void;
    updateTableStatus: (tableId: string, status: TableStatus) => void;

    // Advanced Operations
    transferTable: (fromTableId: string, toTableId: string) => void;
    joinTables: (primaryTableId: string, secondaryTableId: string) => void;
    unjoinTable: (tableId: string) => void;

    // Helper to init if empty
    initializeTables: () => void;
}

export const useTableStore = create<TableState>()(
    persist(
        (set, get) => ({
            tables: [],
            isLoading: false,

            initializeTables: () => {
                const currentTables = get().tables;
                if (currentTables.length === 0) {
                    set({ tables: MOCK_TABLES });
                }
            },

            addTable: (table) => set((state) => ({
                tables: [...state.tables, table]
            })),

            updateTable: (updatedTable) => set((state) => ({
                tables: state.tables.map((t) => (t.id === updatedTable.id ? updatedTable : t))
            })),

            deleteTable: (id) => set((state) => ({
                tables: state.tables.filter((t) => t.id !== id)
            })),

            assignTable: (tableId, staffId) => set((state) => ({
                tables: state.tables.map((t) =>
                    t.id === tableId ? { ...t, assignedStaffId: staffId } : t
                )
            })),

            updateTableStatus: (tableId, status) => set((state) => ({
                tables: state.tables.map((t) =>
                    t.id === tableId ? { ...t, status } : t
                )
            })),

            transferTable: (fromTableId, toTableId) => {
                const state = get();
                const fromTable = state.tables.find(t => t.id === fromTableId);
                const toTable = state.tables.find(t => t.id === toTableId);

                if (!fromTable || !toTable) return;
                if (toTable.status === 'occupied') {
                    console.error("Target table is occupied");
                    return;
                }

                // In a real app, we would also need to update the Order's tableNumber in the DB.
                // For now, we update the local status. The Order logic is handled in the View/Controller.

                set((state) => ({
                    tables: state.tables.map(t => {
                        if (t.id === fromTableId) return { ...t, status: 'available', assignedStaffId: undefined, joinedWith: undefined };
                        if (t.id === toTableId) return { ...t, status: fromTable.status, assignedStaffId: fromTable.assignedStaffId, joinedWith: fromTable.joinedWith };
                        return t;
                    })
                }));
            },

            joinTables: (primaryId, secondaryId) => set((state) => {
                const primary = state.tables.find(t => t.id === primaryId);
                // const secondary = state.tables.find(t => t.id === secondaryId);

                if (!primary) return {};

                const currentJoined = primary.joinedWith || [];
                if (currentJoined.includes(secondaryId)) return {};

                return {
                    tables: state.tables.map(t => {
                        if (t.id === primaryId) {
                            return { ...t, joinedWith: [...currentJoined, secondaryId] };
                        }
                        if (t.id === secondaryId) {
                            // Mark secondary as 'occupied' or special status? 
                            // Or just keep it as is but visual indication?
                            // Let's mark it as occupied if primary is.
                            return { ...t, status: primary.status };
                        }
                        return t;
                    })
                };
            }),

            unjoinTable: (tableId) => set((state) => ({
                tables: state.tables.map(t => {
                    if (t.id === tableId) return { ...t, joinedWith: [] };
                    // Also need to remove this ID from any other table's joinedWith list
                    return {
                        ...t,
                        joinedWith: t.joinedWith?.filter(id => id !== tableId)
                    };
                })
            })),

        }),
        {
            name: 'afripos-tables-storage',
        }
    )
);
