/**
 * Tax Calculation Logic for Purchase and Sales
 * @param {number} qty - Quantity
 * @param {number} rate - Rate per unit
 * @param {number} discount - Discount percentage (0-100)
 * @param {number} gstRate - GST percentage (0-100)
 * @returns {object} - Calculated tax components
 */
export const calculateTax = (qty, rate, discount = 0, gstRate = 0, isInterState = false) => {
    const qtyVal = parseFloat(qty) || 0;
    const rateVal = parseFloat(rate) || 0;
    const discountVal = parseFloat(discount) || 0;
    const gstRateVal = parseFloat(gstRate) || 0;

    const taxableAmount = qtyVal * rateVal * (1 - discountVal / 100);
    const gstAmount = taxableAmount * gstRateVal / 100;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
        igst = gstAmount;
    } else {
        cgst = gstAmount / 2;
        sgst = gstAmount / 2;
    }

    const lineTotal = taxableAmount + gstAmount;

    return {
        taxableAmount: parseFloat(taxableAmount.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        igst: parseFloat(igst.toFixed(2)),
        lineTotal: parseFloat(lineTotal.toFixed(2))
    };
};

export const calculateTotals = (items) => {
    return items.reduce((acc, item) => {
        acc.subtotal += item.taxableAmount || 0;
        acc.cgst += item.cgst || 0;
        acc.sgst += item.sgst || 0;
        acc.igst += item.igst || 0;
        acc.grandTotal += item.lineTotal || 0;
        return acc;
    }, { subtotal: 0, cgst: 0, sgst: 0, igst: 0, grandTotal: 0 });
};

