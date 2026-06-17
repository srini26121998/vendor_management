import React, { forwardRef } from 'react';
import useBusinessStore from '../../store/useBusinessStore';

/**
 * GSTInvoice Component
 * 
 * A high-fidelity, GST-compliant invoice template designed for 
 * standard A4 printing. Includes all mandatory fields as per Indian law.
 */
const GSTInvoice = forwardRef(({ data }, ref) => {
    const { businessProfile } = useBusinessStore();

    if (!data) return null;

    const {
        invoiceNo = 'INV-0000',
        date = new Date().toISOString(),
        customer = {},
        items = [],
        totals = { subtotal: 0, cgst: 0, sgst: 0, igst: 0, grandTotal: 0 },
        isInterState = false,
        title = 'Tax Invoice'
    } = data;

    // Helper to format currency
    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val || 0);

    // Simple number to words conversion (simplified for brevity)
    const numberToWords = (num) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const inWords = (n) => {
            if ((n = n.toString()).length > 9) return 'Overflow';
            let nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!nArr) return '';
            let str = '';
            str += (nArr[1] != 0) ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'Crore ' : '';
            str += (nArr[2] != 0) ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'Lakh ' : '';
            str += (nArr[3] != 0) ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'Thousand ' : '';
            str += (nArr[4] != 0) ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'Hundred ' : '';
            str += (nArr[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
            return str;
        };

        const amount = Math.floor(num);
        const paisa = Math.round((num - amount) * 100);
        let result = inWords(amount) + 'Rupees ';
        if (paisa > 0) {
            result += 'and ' + inWords(paisa) + 'Paisa ';
        }
        return result + 'Only';
    };

    return (
        <div ref={ref} className="gst-invoice-print-container">
            <style>{`
                @media print {
                    @page { margin: 15mm; size: A4; }
                    body { -webkit-print-color-adjust: exact; }
                }
                .gst-invoice-print-container {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 40px;
                    background: white;
                    color: #1e293b;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    box-sizing: border-box;
                    margin: 0 auto;
                }
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 2px solid #334155;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                .logo-section h1 {
                    font-size: 28px;
                    font-weight: 900;
                    margin: 0;
                    color: #2563eb;
                    letter-spacing: -0.025em;
                }
                .logo-section p {
                    margin: 2px 0;
                    font-size: 12px;
                    color: #64748b;
                }
                .shop-details {
                    margin-top: 10px;
                    font-size: 11px;
                    line-height: 1.4;
                }
                .shop-details strong { color: #0f172a; }
                .invoice-title-section {
                    text-align: right;
                }
                .invoice-title-section h2 {
                    font-size: 24px;
                    font-weight: 800;
                    margin: 0;
                    color: #94a3b8;
                    text-transform: uppercase;
                }
                .meta-table {
                    margin-top: 15px;
                    font-size: 12px;
                    text-align: left;
                }
                .meta-table td { padding: 2px 0 2px 15px; }
                .meta-table strong { color: #0f172a; }

                .billing-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    margin-bottom: 30px;
                }
                .bill-to h3 {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #64748b;
                    margin-bottom: 8px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 4px;
                }
                .bill-to p { margin: 2px 0; font-size: 12px; }
                .bill-to .customer-name { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }

                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                }
                .items-table th {
                    background: #f8fafc;
                    padding: 10px 8px;
                    text-align: left;
                    border-bottom: 1px solid #cbd5e1;
                    font-weight: 700;
                    color: #334155;
                    text-transform: uppercase;
                    font-size: 10px;
                }
                .items-table td {
                    padding: 10px 8px;
                    border-bottom: 1px solid #f1f5f9;
                    vertical-align: top;
                }
                .items-table tr.total-row td {
                    border-top: 2px solid #334155;
                    font-weight: 700;
                    background: #f8fafc;
                }

                .summary-section {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 40px;
                    margin-top: 20px;
                }
                .amount-words {
                    font-size: 11px;
                    color: #64748b;
                }
                .amount-words strong { color: #0f172a; display: block; margin-bottom: 4px; }
                
                .totals-card {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }
                .total-line {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 13px;
                    color: #475569;
                }
                .total-line.grand {
                    margin-top: 15px;
                    padding-top: 12px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 18px;
                    font-weight: 900;
                    color: #0f172a;
                }



                .footer-section {
                    margin-top: 50px;
                    font-size: 10px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 20px;
                }
                .footer-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 40px;
                }
                .declaration {
                    color: #64748b;
                    line-height: 1.5;
                }
                .signature-box {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .signature-line {
                    margin-top: 40px;
                    border-top: 1px solid #334155;
                    padding-top: 5px;
                    font-weight: 700;
                }
            `}</style>

            <div className="invoice-header">
                <div className="logo-section">
                    <h1>{businessProfile.businessName}</h1>
                    <p>Premium Retail Solutions</p>
                    <div className="shop-details">
                        {businessProfile.address}<br />
                        <strong>GSTIN:</strong> {businessProfile.gstin} | <strong>Phone:</strong> {businessProfile.phone}<br />
                        <strong>Email:</strong> {businessProfile.email}
                    </div>
                </div>
                <div className="invoice-title-section">
                    <h2>{title}</h2>
                    <table className="meta-table">
                        <tbody>
                            <tr>
                                <td><strong>{title.includes('Invoice') ? 'Invoice' : 'Document'} No:</strong></td>
                                <td>{invoiceNo}</td>
                            </tr>
                            <tr>
                                <td><strong>Date:</strong></td>
                                <td>{new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                            </tr>
                            <tr>
                                <td><strong>State:</strong></td>
                                <td>{businessProfile.state} ({businessProfile.stateCode})</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="billing-section">
                <div className="bill-to border-right">
                    <h3>Bill To</h3>
                    <p className="customer-name">{customer.name || 'Cash Customer'}</p>
                    <p>{customer.address || 'N/A'}</p>
                    <p><strong>GSTIN:</strong> {customer.gstin || 'N/A'}</p>
                    <p><strong>State:</strong> {customer.state || 'N/A'}</p>
                </div>
                <div className="bill-to">
                    <h3>Shipping To</h3>
                    <p className="customer-name">{customer.name || 'Cash Customer'}</p>
                    <p>{customer.address || 'N/A'}</p>
                </div>
            </div>

            <table className="items-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Product Description</th>
                        <th>HSN</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Rate</th>
                        <th style={{ textAlign: 'right' }}>Taxable Val.</th>
                        {isInterState ? (
                            <th style={{ textAlign: 'right' }}>IGST</th>
                        ) : (
                            <>
                                <th style={{ textAlign: 'right' }}>CGST</th>
                                <th style={{ textAlign: 'right' }}>SGST</th>
                            </>
                        )}
                        <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                                <strong>{item.name}</strong>
                            </td>
                            <td>{item.hsn || '0000'}</td>
                            <td style={{ textAlign: 'center' }}>{item.qty}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.mrp)}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.taxableAmount)}</td>
                            {isInterState ? (
                                <td style={{ textAlign: 'right' }}>
                                    {item.igstRate || (item.gstRate || 0)}%<br />
                                    <span style={{ color: '#64748b', fontSize: '9px' }}>{formatCurrency(item.igstAmount || item.gstAmount)}</span>
                                </td>
                            ) : (
                                <>
                                    <td style={{ textAlign: 'right' }}>
                                        {item.cgstRate || (item.gstRate / 2 || 0)}%<br />
                                        <span style={{ color: '#64748b', fontSize: '9px' }}>{formatCurrency(item.cgstAmount || item.cgst)}</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {item.sgstRate || (item.gstRate / 2 || 0)}%<br />
                                        <span style={{ color: '#64748b', fontSize: '9px' }}>{formatCurrency(item.sgstAmount || item.sgst)}</span>
                                    </td>
                                </>
                            )}
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.lineTotal)}</td>
                        </tr>
                    ))}

                </tbody>
            </table>

            <div className="summary-section">
                <div className="amount-words">
                    <strong>Amount in Words:</strong>
                    {numberToWords(totals.grandTotal)}

                    <div style={{ marginTop: '20px' }}>
                        <strong>Bank Details:</strong>
                        {businessProfile.bankDetails}
                    </div>
                </div>
                <div className="totals-card">
                    <div className="total-line">
                        <span>Taxable Subtotal:</span>
                        <span>₹{formatCurrency(totals.subtotal)}</span>
                    </div>
                    {!isInterState ? (
                        <>
                            <div className="total-line">
                                <span>CGST Total:</span>
                                <span>₹{formatCurrency(totals.cgst)}</span>
                            </div>
                            <div className="total-line">
                                <span>SGST Total:</span>
                                <span>₹{formatCurrency(totals.sgst)}</span>
                            </div>
                        </>
                    ) : (
                        <div className="total-line">
                            <span>IGST Total:</span>
                            <span>₹{formatCurrency(totals.igst || totals.gstAmount)}</span>
                        </div>
                    )}
                    <div className="total-line grand">
                        <span>Grand Total:</span>
                        <span>₹{formatCurrency(totals.grandTotal)}</span>
                    </div>
                </div>
            </div>

            <div className="footer-section">
                <div className="footer-grid">
                    <div className="declaration">
                        <strong>Declaration:</strong><br />
                        We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods once sold will not be taken back.
                    </div>
                    <div className="signature-box">
                        <p>For <strong>{businessProfile.businessName}</strong></p>
                        <div className="signature-line">Authorised Signatory</div>
                    </div>
                </div>
                <p style={{ textAlign: 'center', marginTop: '30px', color: '#94a3b8' }}>
                    Thank you for your business!
                </p>
            </div>
        </div>
    );
});

GSTInvoice.displayName = 'GSTInvoice';

export default GSTInvoice;
