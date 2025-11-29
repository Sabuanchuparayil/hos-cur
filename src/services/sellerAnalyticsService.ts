import { ProductWithTotalStock, Order, SellerAnalyticsData, BIInsight } from '../types';

/**
 * Filters orders to include only those containing at least one item from the specified seller.
 * @param sellerId - The ID of the seller.
 * @param orders - The list of all orders.
 * @returns An array of orders relevant to the seller.
 */
const getSellerOrders = (sellerId: number, orders: Order[]): Order[] => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    return safeOrders.filter(order => {
        if (!order?.items || !Array.isArray(order.items)) return false;
        // OrderItem extends Product, so it has sellerId directly
        return order.items.some(item => item?.sellerId === sellerId);
    });
};

/**
 * Generates comprehensive analytics for a specific seller.
 * @param sellerId - The ID of the seller to analyze.
 * @param allProducts - The list of all products in the store.
 * @param allOrders - The list of all orders in the store.
 * @returns A SellerAnalyticsData object.
 */
export const generateSellerAnalytics = (sellerId: number, allProducts: ProductWithTotalStock[], allOrders: Order[]): SellerAnalyticsData => {
    const safeProducts = Array.isArray(allProducts) ? allProducts : [];
    const safeOrders = Array.isArray(allOrders) ? allOrders : [];
    const sellerOrders = getSellerOrders(sellerId, safeOrders);
    const sellerProducts = safeProducts.filter(p => p?.sellerId === sellerId);

    let totalRevenue = 0;
    let totalItemsSold = 0;
    const productSales: { [productId: number]: number } = {};

    sellerOrders.forEach(order => {
        if (!order?.items || !Array.isArray(order.items)) return;
        const currency = order.currency || 'GBP';
        order.items.forEach(item => {
            // OrderItem extends Product, so it has sellerId directly
            if (item?.sellerId === sellerId) {
                const price = item?.price || (item?.pricing && typeof item.pricing === 'object' ? item.pricing[currency] : 0) || 0;
                const quantity = item?.quantity || 0;
                // Note: In a real app, you'd convert currencies to a standard one (e.g., USD)
                totalRevenue += price * quantity;
                totalItemsSold += quantity;
                // Use productId to track sales by product (productId is the foreign key to Product table)
                const productId = item?.productId;
                if (productId) {
                    productSales[productId] = (productSales[productId] || 0) + quantity;
                }
            }
        });
    });

    const averageOrderValue = sellerOrders.length > 0 ? totalRevenue / sellerOrders.length : 0;
    
    const topSellingProducts = Object.entries(productSales)
        .map(([productId, unitsSold]) => {
            const product = sellerProducts.find(p => p?.id === Number(productId));
            if (!product) return null;
            return { ...product, unitsSold };
        })
        .filter((p): p is ProductWithTotalStock & { unitsSold: number } => p !== null && p.id !== undefined) // Filter out nulls
        .sort((a, b) => (b.unitsSold || 0) - (a.unitsSold || 0))
        .slice(0, 5);

    // Mock sales data for the chart
    const salesByDay = [
        { name: 'Mon', sales: Math.random() * 500 },
        { name: 'Tue', sales: Math.random() * 500 },
        { name: 'Wed', sales: Math.random() * 500 },
        { name: 'Thu', sales: Math.random() * 500 },
        { name: 'Fri', sales: Math.random() * 500 },
        { name: 'Sat', sales: Math.random() * 500 },
        { name: 'Sun', sales: Math.random() * 500 },
    ];
    
    return {
        totalRevenue,
        totalItemsSold,
        averageOrderValue,
        topSellingProducts,
        salesByDay
    };
};


/**
 * Generates actionable business intelligence insights based on seller analytics.
 * @param analyticsData - The seller's analytics data.
 * @param currency - The user's active currency code.
 * @returns An array of BIInsight objects.
 */
export const generateBIInsights = (analyticsData: SellerAnalyticsData, currency: string): BIInsight[] => {
    const insights: BIInsight[] = [];
    
    // Insight 1: Low stock warning for top sellers
    if (analyticsData?.topSellingProducts && Array.isArray(analyticsData.topSellingProducts)) {
        analyticsData.topSellingProducts.forEach(product => {
            if (!product) return;
            const productName = typeof product.name === 'object' && product.name?.en 
                ? product.name.en 
                : (typeof product.name === 'string' ? product.name : 'Product');
            const stock = product.stock ?? 0;
            
            if (stock > 0 && stock <= 10) {
                insights.push({
                    type: 'warning',
                    message: `Your top-selling item, "${productName}", is running low on stock (${stock} left). Consider restocking soon.`
                });
            }
            if (stock === 0) {
                insights.push({
                    type: 'warning',
                    message: `Your top-selling item, "${productName}", is out of stock. Restock to avoid missing sales.`
                });
            }
        });
    }

    // Insight 2: High AOV suggestion
    if (analyticsData.averageOrderValue > 50) {
         insights.push({
            type: 'suggestion',
            message: `Your average order value is high at ~${analyticsData.averageOrderValue.toFixed(2)} ${currency}. Consider adding a small, complementary item to encourage bundling.`
        });
    }

    // Insight 3: General info for new sellers
    if (analyticsData.totalItemsSold > 0 && analyticsData.totalItemsSold < 10) {
         insights.push({
            type: 'info',
            message: 'You\'ve made your first few sales! Keep adding new products to attract more customers.'
        });
    }
    
    if (insights.length === 0) {
        insights.push({
            type: 'info',
            message: 'Your dashboard is looking good. Keep an eye on your top sellers and stock levels!'
        });
    }

    return insights;
}
