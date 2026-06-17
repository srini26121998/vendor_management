import React, { forwardRef } from 'react';

const InvoiceTemplate = forwardRef(({ data }, ref) => {
    if (!data) return null;

    const { invoiceNo, date, items, subtotal, tax, total, customer } = data;

    return (
        <div ref={ref} className="p-10 bg-white text-slate-800 font-sans">
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-primary-600 mb-1">RETAILFLOW</h1>
                    <p className="text-sm text-slate-500">Retail Billing System</p>
                    <div className="mt-4 text-xs">
                        <p>123 Business Avenue</p>
                        <p>City, State, 560001</p>
                        <p>GSTIN: 29AAAAA0000A1Z5</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold uppercase  text-slate-400">Tax Invoice</h2>
                    <div className="mt-4 text-sm flex flex-col gap-1">
                        <p><span className="font-bold">Invoice #:</span> {invoiceNo}</p>
                        <p><span className="font-bold">Date:</span> {new Date(date).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <div className="mb-10 text-sm">
                <h3 className="font-bold mb-2 uppercase text-slate-400 text-xs tracking-wider">Bill To</h3>
                <p className="font-bold text-lg">{customer?.name || 'Cash Customer'}</p>
                <p>{customer?.phone || ''}</p>
                <p>{customer?.address || ''}</p>
            </div>

            <table className="w-full mb-10">
                <thead>
                    <tr className="border-b-2 border-slate-200 text-left text-xs uppercase font-bold text-slate-500">
                        <th className="py-3">Item Description</th>
                        <th className="py-3 text-center">Qty</th>
                        <th className="py-3 text-right">Price</th>
                        <th className="py-3 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                            <td className="py-4">{item.name}</td>
                            <td className="py-4 text-center">{item.quantity}</td>
                            <td className="py-4 text-right">₹{item.price.toFixed(2)}</td>
                            <td className="py-4 text-right font-medium">₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">GST (18%):</span>
                        <span className="font-medium">₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t-2 border-slate-900 pt-3">
                        <span>Total:</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-20 pt-10 border-t border-slate-100 text-center text-xs text-slate-400">
                <p>Thank you for shopping with us!</p>
                <p className="mt-1">This is a computer generated invoice.</p>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
