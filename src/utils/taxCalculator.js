export const calculateTax = (amount, rate = 18) => {
    return (amount * rate) / 100;
};

export const calculateTotal = (amount, taxRate = 18) => {
    const tax = calculateTax(amount, taxRate);
    return amount + tax;
};
