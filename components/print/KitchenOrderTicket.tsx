import React from 'react';
import { Order, Branch, PrintLocation, CartItem } from '../../types';

interface GroupedItems {
    location: PrintLocation;
    items: CartItem[];
}

interface KitchenOrderTicketProps {
    order: Order;
    branchSettings: Branch;
    groupedItems: GroupedItems[];
}

export const KitchenOrderTicket: React.FC<KitchenOrderTicketProps> = ({
    order,
    branchSettings,
    groupedItems
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

    return (
        <div style={{
            width: '80mm',
            padding: '10px',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            lineHeight: '1.4'
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
        .ticket-header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .ticket-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .ticket-info {
          margin-bottom: 10px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .location-section {
          margin-bottom: 15px;
          border: 2px solid #000;
          padding: 8px;
        }
        .location-header {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          background: #000;
          color: #fff;
          padding: 5px;
          margin: -8px -8px 8px -8px;
        }
        .item-row {
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px dotted #ccc;
        }
        .item-name {
          font-weight: bold;
          font-size: 14px;
        }
        .item-qty {
          font-size: 16px;
          font-weight: bold;
        }
        .item-modifiers {
          margin-left: 15px;
          font-size: 11px;
          font-style: italic;
        }
        .item-notes {
          margin-left: 15px;
          font-size: 11px;
          background: #f0f0f0;
          padding: 3px;
          margin-top: 3px;
        }
        .voided {
          text-decoration: line-through;
          opacity: 0.5;
        }
        .ticket-footer {
          text-align: center;
          border-top: 2px dashed #000;
          padding-top: 10px;
          margin-top: 10px;
          font-size: 10px;
        }
      `}</style>

            {/* Header */}
            <div className="ticket-header">
                <div className="ticket-title">KITCHEN ORDER TICKET</div>
                <div>{branchSettings.name}</div>
            </div>

            {/* Order Info */}
            <div className="ticket-info">
                <div className="info-row">
                    <strong>Order #:</strong>
                    <span>{order.id}</span>
                </div>
                <div className="info-row">
                    <strong>Table:</strong>
                    <span>{order.tableNumber || 'FAST ORDER'}</span>
                </div>
                <div className="info-row">
                    <strong>Time:</strong>
                    <span>{formatTime(order.timestamp)}</span>
                </div>
                <div className="info-row">
                    <strong>Date:</strong>
                    <span>{formatDate(order.timestamp)}</span>
                </div>
                <div className="info-row">
                    <strong>Server:</strong>
                    <span>{order.cashierName || 'N/A'}</span>
                </div>
                <div className="info-row">
                    <strong>Guests:</strong>
                    <span>{order.customerCount}</span>
                </div>
            </div>

            {/* Items grouped by location */}
            {groupedItems.map((group, idx) => (
                <div key={idx} className="location-section">
                    <div className="location-header">{group.location}</div>

                    {group.items.map((item, itemIdx) => (
                        <div key={itemIdx} className={`item-row ${item.isVoided ? 'voided' : ''}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="item-qty">{item.quantity}x</span>
                                <span className="item-name" style={{ flex: 1, marginLeft: '10px' }}>
                                    {item.name}
                                    {item.isVoided && ' [VOIDED]'}
                                </span>
                            </div>

                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <div className="item-modifiers">
                                    {item.selectedModifiers.map((mod, modIdx) => (
                                        <div key={modIdx}>+ {mod.name}</div>
                                    ))}
                                </div>
                            )}

                            {item.notes && (
                                <div className="item-notes">
                                    <strong>NOTE:</strong> {item.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))}

            {/* Footer */}
            <div className="ticket-footer">
                <div>*** PLEASE PREPARE WITH CARE ***</div>
                <div style={{ marginTop: '5px' }}>Printed: {formatTime(Date.now())}</div>
            </div>
        </div>
    );
};
