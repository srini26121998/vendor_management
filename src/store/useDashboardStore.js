import { create } from 'zustand';
import useTransactionStore from './useTransactionStore';
import useMasterStore from './useMasterStore';

const useDashboardStore = create(() => ({
    // We can keep some manual overrides or metadata here if needed
    // But mostly we will use selectors in the component
}));

// Selectors
export const useDashboardSummary = () => {
    const sales = useTransactionStore(state => state.sales);
    const purchases = useTransactionStore(state => state.purchases);
    const products = useMasterStore(state => state.products);

    const today = new Date().toISOString().split('T')[0];
    const salesToday = sales.filter(s => s.createdAt.startsWith(today));
    const purchasesToday = purchases.filter(p => p.createdAt.startsWith(today));

    const totalSales = salesToday.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalPurchases = purchasesToday.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    const estimatedProfit = salesToday.reduce((sum, s) => {
        const saleProfit = (s.items || []).reduce((pSum, item) => {
            return pSum + ((item.price - (item.purchasePrice || 0)) * item.qty);
        }, 0);
        return sum + saleProfit;
    }, 0);

    const lowStockCount = products.filter(p => p.stock <= 5).length;

    return {
        todaySales: totalSales,
        todayPurchases: totalPurchases,
        estimatedProfit: estimatedProfit,
        lowStockCount: lowStockCount
    };
};

export const useSalesTrend = () => {
    const sales = useTransactionStore(state => state.sales);

    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
        const dailySales = sales
            .filter(s => s.createdAt.startsWith(date))
            .reduce((sum, s) => sum + s.grandTotal, 0);

        const formattedDate = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        return { name: formattedDate, amount: dailySales };
    });
};

export const useTopProducts = () => {
    const sales = useTransactionStore(state => state.sales);
    const productMap = {};

    sales.forEach(sale => {
        (sale.items || []).forEach(item => {
            if (!productMap[item.name]) {
                productMap[item.name] = { name: item.name, sales: 0, amount: 0 };
            }
            productMap[item.name].sales += item.qty;
            productMap[item.name].amount += (item.price * item.qty);
        });
    });

    return Object.values(productMap)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
};

export const useRecentInvoices = () => {
    const sales = useTransactionStore(state => state.sales);
    return sales.slice(0, 10).map(s => ({
        id: s.id,
        customer: s.customerName || 'Walk-in',
        amount: s.grandTotal,
        status: 'Paid',
        time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: s.items?.length || 0
    }));
};

export default useDashboardStore;
