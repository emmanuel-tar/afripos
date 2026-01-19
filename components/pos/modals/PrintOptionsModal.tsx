import React, { useState } from 'react';
import { Printer, Receipt, FileText, X } from 'lucide-react';
import clsx from 'clsx';

interface PrintOptionsModalProps {
    orderId: string;
    onClose: () => void;
    onPrintInvoice: () => void;
    onPrintKitchenOrder: () => void;
    onPrintSummary: () => void;
    reprintCount?: number;
}

export const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({
    orderId,
    onClose,
    onPrintInvoice,
    onPrintKitchenOrder,
    onPrintSummary,
    reprintCount = 0
}) => {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = async (printFn: () => void, type: string) => {
        setIsPrinting(true);
        try {
            await printFn();
        } catch (error) {
            console.error(`Error printing ${type}:`, error);
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">Print Options</h3>
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">
                            Order #{orderId}
                        </p>
                        {reprintCount > 0 && (
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">
                                ⚠️ This order has been reprinted {reprintCount} time{reprintCount > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Print Options */}
                <div className="p-10 space-y-4">
                    {/* Invoice/Receipt */}
                    <button
                        onClick={() => handlePrint(onPrintInvoice, 'invoice')}
                        disabled={isPrinting}
                        className={clsx(
                            "w-full p-6 rounded-2xl border-2 transition-all flex items-center gap-4 group",
                            isPrinting
                                ? "border-slate-200 bg-slate-50 cursor-not-allowed"
                                : "border-slate-200 bg-white hover:border-indigo-600 hover:bg-indigo-50 active:scale-98"
                        )}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Receipt className="w-7 h-7" />
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-lg font-black text-slate-800">Customer Receipt</div>
                            <div className="text-xs text-slate-500 font-medium">
                                Print invoice/receipt for customer
                            </div>
                        </div>
                    </button>

                    {/* Kitchen Order */}
                    <button
                        onClick={() => handlePrint(onPrintKitchenOrder, 'kitchen order')}
                        disabled={isPrinting}
                        className={clsx(
                            "w-full p-6 rounded-2xl border-2 transition-all flex items-center gap-4 group",
                            isPrinting
                                ? "border-slate-200 bg-slate-50 cursor-not-allowed"
                                : "border-slate-200 bg-white hover:border-green-600 hover:bg-green-50 active:scale-98"
                        )}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all">
                            <Printer className="w-7 h-7" />
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-lg font-black text-slate-800">Kitchen Order Ticket</div>
                            <div className="text-xs text-slate-500 font-medium">
                                Reprint order for kitchen/bar stations
                            </div>
                        </div>
                    </button>

                    {/* Order Summary */}
                    <button
                        onClick={() => handlePrint(onPrintSummary, 'summary')}
                        disabled={isPrinting}
                        className={clsx(
                            "w-full p-6 rounded-2xl border-2 transition-all flex items-center gap-4 group",
                            isPrinting
                                ? "border-slate-200 bg-slate-50 cursor-not-allowed"
                                : "border-slate-200 bg-white hover:border-purple-600 hover:bg-purple-50 active:scale-98"
                        )}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                            <FileText className="w-7 h-7" />
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-lg font-black text-slate-800">Order Summary</div>
                            <div className="text-xs text-slate-500 font-medium">
                                Print detailed order summary for management
                            </div>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-10 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full py-5 font-black text-slate-600 uppercase tracking-widest text-xs hover:text-slate-800 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
