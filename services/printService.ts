import { Order, CartItem, Branch, PrintLocation } from '../types';
import { createRoot } from 'react-dom/client';

interface GroupedItems {
    location: PrintLocation;
    items: CartItem[];
}

/**
 * Group cart items by their print location
 */
export const groupItemsByLocation = (items: CartItem[]): GroupedItems[] => {
    const grouped = new Map<PrintLocation, CartItem[]>();

    items.forEach(item => {
        if (item.isVoided) return; // Skip voided items

        const location = item.printLocation || 'KITCHEN'; // Default to KITCHEN if not specified
        const existing = grouped.get(location) || [];
        grouped.set(location, [...existing, item]);
    });

    return Array.from(grouped.entries()).map(([location, items]) => ({
        location,
        items
    }));
};

/**
 * Open a print window with the given content
 */
const openPrintWindow = (content: HTMLElement, title: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');

        if (!printWindow) {
            console.error('Failed to open print window. Please check popup blocker settings.');
            resolve(false);
            return;
        }

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; }
          </style>
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `);
        printWindow.document.close();

        const printRoot = printWindow.document.getElementById('print-root');
        if (printRoot) {
            printRoot.appendChild(content);
        }

        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
            resolve(true);
        }, 250);
    });
};

/**
 * Print kitchen order tickets grouped by location
 */
export const printKitchenOrder = async (
    order: Order,
    branchSettings: Branch
): Promise<boolean> => {
    try {
        const grouped = groupItemsByLocation(order.items);

        if (grouped.length === 0) {
            console.warn('No items to print');
            return false;
        }

        // Filter printers that are enabled in branch settings
        const activePrinters = branchSettings.printers?.filter(p => p.enabled) || [];

        // Match grouped items to their respective printers
        const printerTasks = activePrinters.filter(p =>
            grouped.some(g => g.location === p.location)
        );

        if (printerTasks.length === 0) {
            console.warn('No active printers found for these locations');
            return true; // Return true as we "handled" it even if no physical print
        }

        const { KitchenOrderTicket } = await import('../components/print/KitchenOrderTicket');

        // Simulate sending to multiple printers
        for (const printer of printerTasks) {
            const printerSpecificItems = grouped.filter(g => g.location === printer.location);
            console.log(`Sending ticket to ${printer.name} (Station: ${printer.location})`);

            const container = document.createElement('div');
            const root = createRoot(container);

            await new Promise((resolve) => {
                root.render(
                    KitchenOrderTicket({
                        order,
                        branchSettings,
                        groupedItems: printerSpecificItems
                    })
                );

                setTimeout(async () => {
                    // In a real environment, we'd use a native bridge here
                    // Here we just simulate the success for each printer
                    console.log(`Print successful on ${printer.name}`);
                    root.unmount();
                    resolve(true);
                }, 100);
            });
        }

        return true;
    } catch (error) {
        console.error('Error printing kitchen order:', error);
        return false;
    }
};

/**
 * Print customer invoice/receipt
 */
export const printInvoice = async (
    order: Order,
    branchSettings: Branch
): Promise<boolean> => {
    try {
        const { InvoiceReceipt } = await import('../components/print/InvoiceReceipt');

        const container = document.createElement('div');
        const root = createRoot(container);

        return new Promise((resolve) => {
            root.render(
                InvoiceReceipt({
                    order,
                    branchSettings
                })
            );

            // Wait for React to render
            setTimeout(async () => {
                const success = await openPrintWindow(container, `Invoice - ${order.id}`);
                root.unmount();
                resolve(success);
            }, 100);
        });
    } catch (error) {
        console.error('Error printing invoice:', error);
        return false;
    }
};

/**
 * Print order summary for management
 */
export const printOrderSummary = async (
    order: Order,
    branchSettings: Branch
): Promise<boolean> => {
    // For now, use the same invoice template
    // Can be customized later for management-specific details
    return printInvoice(order, branchSettings);
};
