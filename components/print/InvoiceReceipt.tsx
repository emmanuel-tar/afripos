import React from 'react';
import { Order, Branch } from '../../types';

interface InvoiceReceiptProps {
    order: Order;
    branchSettings: Branch;
}

export const InvoiceReceipt: React.FC<InvoiceReceiptProps> = ({
    order,
    branchSettings
}) => {
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return `${branchSettings.currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div style={{
            width: '80mm',
            padding: '10px',
            fontFamily: "'Courier New', monospace",
            fontSize: '11px',
            lineHeight: '1.3'
        }}>
            <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        .receipt-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .receipt-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .receipt-subtitle {
          font-size: 10px;
        }
        .receipt-info {
          margin-bottom: 8px;
          font-size: 10px;
        }
        .info-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .items-section {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 8px 0;
          margin: 8px 0;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .item-name {
          flex: 1;
        }
        .item-qty {
          width: 30px;
          text-align: center;
        }
        .item-price {
          width: 60px;
          text-align: right;
        }
        .item-modifier {
          margin-left: 10px;
          font-size: 10px;
          font-style: italic;
        }
        .totals-section {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #000;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .grand-total {
          font-size: 16px;
          font-weight: bold;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 5px 0;
          margin-top: 5px;
        }
        .payment-section {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed #000;
        }
        .receipt-footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 8px;
          border-top: 2px dashed #000;
          font-size: 10px;
        }
        .voided {
          text-decoration: line-through;
          opacity: 0.5;
        }
      `}</style>

            {/* Header */}
            <div className="receipt-header">
                <div className="receipt-title">{branchSettings.name}</div>
                <div className="receipt-subtitle">CUSTOMER RECEIPT</div>
            </div>

            {/* Order Info */}
            <div className="receipt-info">
                <div className="info-line">
                    <span>Receipt #:</span>
                    <strong>{order.id}</strong>
                </div>
                <div className="info-line">
                    <span>Date:</span>
                    <span>{formatDate(order.timestamp)}</span>
                </div>
                <div className="info-line">
                    <span>Time:</span>
                    <span>{formatTime(order.timestamp)}</span>
                </div>
                {order.tableNumber && (
                    <div className="info-line">
                        <span>Table:</span>
                        <span>{order.tableNumber}</span>
                    </div>
                )}
                <div className="info-line">
                    <span>Server:</span>
                    <span>{order.cashierName || 'N/A'}</span>
                </div>
                <div className="info-line">
                    <span>Guests:</span>
                    <span>{order.customerCount}</span>
                </div>
            </div>

            {/* Items */}
            <div className="items-section">
                <div style={{ fontWeight: 'bold', marginBottom: '5px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
                    <div className="item-row">
                        <span className="item-name">ITEM</span>
                        <span className="item-qty">QTY</span>
                        <span className="item-price">PRICE</span>
                    </div>
                </div>

                {order.items.map((item, idx) => {
                    const modifiersTotal = item.selectedModifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
                    const itemTotal = (item.price + modifiersTotal) * item.quantity;

                    return (
                        <div key={idx} style={{ marginBottom: '8px' }}>
                            <div className={`item-row ${item.isVoided ? 'voided' : ''}`}>
                                <span className="item-name">
                                    {item.name}
                                    {item.isVoided && ' [VOID]'}
                                </span>
                                <span className="item-qty">{item.quantity}</span>
                                <span className="item-price">{formatCurrency(itemTotal)}</span>
                            </div>

                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <div className="item-modifier">
                                    {item.selectedModifiers.map((mod, modIdx) => (
                                        <div key={modIdx}>+ {mod.name} ({formatCurrency(mod.price)})</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Totals */}
            <div className="totals-section">
                <div className="total-row">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                </div>

                {order.discount > 0 && (
                    <div className="total-row" style={{ color: '#666' }}>
                        <span>Discount ({order.discount}%):</span>
                        <span>-{formatCurrency(order.subtotal * (order.discount / 100))}</span>
                    </div>
                )}

                {order.vatAmount && order.vatAmount > 0 && (
                    <div className="total-row">
                        <span>VAT ({branchSettings.vatRate}%):</span>
                        <span>{formatCurrency(order.vatAmount)}</span>
                    </div>
                )}

                {order.serviceChargeAmount && order.serviceChargeAmount > 0 && (
                    <div className="total-row">
                        <span>Service Charge ({branchSettings.serviceChargeRate}%):</span>
                        <span>{formatCurrency(order.serviceChargeAmount)}</span>
                    </div>
                )}

                {order.tipAmount && order.tipAmount > 0 && (
                    <div className="total-row">
                        <span>Tip ({order.tipPercent}%):</span>
                        <span>{formatCurrency(order.tipAmount)}</span>
                    </div>
                )}

                <div className="total-row grand-total">
                    <strong>TOTAL:</strong>
                    <strong>{formatCurrency(order.total)}</strong>
                </div>
            </div>

            {/* Payment Info */}
            <div className="payment-section">
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>PAYMENT DETAILS</div>

                {order.payments && order.payments.length > 0 ? (
                    order.payments.map((payment, idx) => (
                        <div key={idx} style={{ marginBottom: '5px' }}>
                            <div className="total-row">
                                <span>{payment.method}:</span>
                                <span>{formatCurrency(payment.amount)}</span>
                            </div>

                            {payment.method === 'CASH' && payment.cashTendered && (
                                <>
                                    <div className="total-row" style={{ fontSize: '10px', marginLeft: '10px' }}>
                                        <span>Cash Tendered:</span>
                                        <span>{formatCurrency(payment.cashTendered)}</span>
                                    </div>
                                    {payment.changeGiven && payment.changeGiven > 0 && (
                                        <div className="total-row" style={{ fontSize: '10px', marginLeft: '10px', fontWeight: 'bold' }}>
                                            <span>Change:</span>
                                            <span>{formatCurrency(payment.changeGiven)}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {payment.reference && (
                                <div style={{ fontSize: '9px', marginLeft: '10px', color: '#666' }}>
                                    Ref: {payment.reference}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="total-row">
                        <span>{order.paymentMethod}:</span>
                        <span>{formatCurrency(order.total)}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="receipt-footer">
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    THANK YOU FOR YOUR PATRONAGE!
                </div>
                <div>Please visit us again</div>
                <div style={{ marginTop: '8px', fontSize: '9px' }}>
                    This serves as your official receipt
                </div>
                {order.reprintCount && order.reprintCount > 0 && (
                    <div style={{ marginTop: '5px', fontSize: '9px', fontStyle: 'italic' }}>
                        REPRINT #{order.reprintCount}
                    </div>
                )}
            </div>
        </div>
    );
};
