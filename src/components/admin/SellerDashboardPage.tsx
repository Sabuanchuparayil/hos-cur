import React, { useMemo } from 'react';
import { ProductWithTotalStock, Order, Seller, PayoutRecord, BIInsight, User } from '../../types';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { generateSellerAnalytics, generateBIInsights } from '../../services/sellerAnalyticsService';
import { AnalyticsCard } from './AnalyticsCard';
import { PlatformDashboard } from './PlatformDashboard';
import { ActionItems } from './ActionItems';

interface SellerDashboardPageProps {
  products: ProductWithTotalStock[];
  orders: Order[];
  sellers: Seller[];
  user: User | null;
}

const getStockLevelClass = (stock: number) => {
    if (stock === 0) return 'text-red-700 bg-red-100';
    if (stock <= 10) return 'text-orange-700 bg-orange-100';
    return 'text-green-700 bg-green-100';
};

const SellerDashboard: React.FC<SellerDashboardPageProps> = ({ products, orders, sellers, user }) => {
    const { currency, formatPrice } = useCurrency();
    const { t } = useLanguage();

    const currentSeller = useMemo(() => {
        if (user?.role !== 'seller' || !user?.id) return null;
        const safeSellers = Array.isArray(sellers) ? sellers : [];
        return safeSellers.find(s => s?.userId === user.id);
    }, [sellers, user]);

    const sellerAnalytics = useMemo(() => {
        if (!currentSeller) return null;
        return generateSellerAnalytics(currentSeller.id, products, orders);
    }, [currentSeller, products, orders]);

    const biInsights = useMemo(() => {
        if (!sellerAnalytics) return [];
        return generateBIInsights(sellerAnalytics, currency);
    }, [sellerAnalytics, currency]);

    const sellerActionItems = useMemo(() => {
        if (!currentSeller) return [];
        
        const items = [];
        const safeOrders = Array.isArray(orders) ? orders : [];
        const newOrders = safeOrders.filter(o => 
            o?.status === 'Awaiting Shipment' && 
            Array.isArray(o.items) && 
            o.items.some(i => i?.productId && i.productId === currentSeller.id)
        );
        if (newOrders.length > 0) {
            items.push({
                icon: '📦',
                text: <>{newOrders.length} new order{newOrders.length > 1 ? 's' : ''} to fulfill</>,
                link: '/admin/orders'
            });
        }

        const safeProducts = Array.isArray(products) ? products : [];
        const lowStockProducts = safeProducts.filter(p => 
            p?.sellerId === currentSeller.id && 
            p?.stock !== undefined && 
            p.stock > 0 && 
            p.stock <= 5
        );
        if (lowStockProducts.length > 0) {
             items.push({
                icon: '⚠️',
                text: <>{lowStockProducts.length} product{lowStockProducts.length > 1 ? 's are' : ' is'} running low on stock</>,
                link: '/admin/products'
            });
        }
        
        return items;
    }, [currentSeller, orders, products]);

    if (!currentSeller || !sellerAnalytics) {
        return <div>Loading seller data...</div>;
    }

    const safeProducts = Array.isArray(products) ? products : [];
    const sellerProducts = safeProducts.filter(p => p?.sellerId === currentSeller.id);

    return (
        <div>
            <h1 className="text-3xl font-bold font-cinzel text-[--text-primary] mb-2">
                Welcome, {currentSeller.name}
            </h1>
            <p className="text-[--text-muted] mb-8">Here's a snapshot of your store's performance.</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <AnalyticsCard
                            title={`Total Revenue (${currency})`}
                            value={formatPrice(sellerAnalytics?.totalRevenue || 0, currency)}
                            description="All-time earnings from sales"
                        />
                        <AnalyticsCard
                            title="Total Items Sold"
                            value={(sellerAnalytics?.totalItemsSold || 0).toString()}
                            description="Total units sold across all products"
                        />
                        <AnalyticsCard
                            title={`Average Order Value (${currency})`}
                            value={formatPrice(sellerAnalytics?.averageOrderValue || 0, currency)}
                            description="Average value of orders with your items"
                        />
                    </div>
                </div>
                 <div className="lg:col-span-1">
                    <ActionItems title="Action Items" items={sellerActionItems} />
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[--bg-secondary] border border-[--border-color] p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold font-cinzel text-[--text-primary] mb-4">Sales Over Time</h3>
                        <div className="bg-[--bg-tertiary] h-64 flex items-center justify-center rounded-md">
                            <p className="text-[--text-muted]">[Chart Mockup: Visualizing sales trends]</p>
                        </div>
                    </div>
                    <div className="bg-[--bg-secondary] border border-[--border-color] p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold font-cinzel text-[--text-primary] mb-4">Top 5 Selling Products</h3>
                        <ul className="space-y-1">
                            {sellerAnalytics?.topSellingProducts && Array.isArray(sellerAnalytics.topSellingProducts) && sellerAnalytics.topSellingProducts.length > 0 ? sellerAnalytics.topSellingProducts.map(p => {
                                if (!p) return null;
                                const productName = typeof p.name === 'object' && p.name?.en ? p.name.en : (typeof p.name === 'string' ? p.name : 'Product');
                                const mediaUrl = Array.isArray(p.media) && p.media.length > 0 ? p.media[0]?.url : '';
                                return (
                                    <li key={p.id}>
                                        <Link to={`/product/${p.id}`} className="flex items-center justify-between hover:bg-[--bg-tertiary] p-2 rounded-md transition-colors">
                                            <div className="flex items-center gap-4">
                                                {mediaUrl && <img src={mediaUrl} alt={productName} className="w-12 h-12 object-cover rounded" />}
                                                <div>
                                                    <p className="font-semibold text-[--text-secondary]">{t(p.name)}</p>
                                                    <p className="text-sm text-[--text-muted]">{p.sku || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-[--accent]">{(p as any).unitsSold || 0} units sold</span>
                                        </Link>
                                    </li>
                                );
                            }) : <p className="text-[--text-muted]">No sales data yet.</p>}
                        </ul>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-[--bg-secondary] border border-[--border-color] p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold font-cinzel text-[--text-primary] mb-4">Current Balance</h3>
                        <div className="space-y-2">
                            {currentSeller?.financials && typeof currentSeller.financials === 'object' && currentSeller.financials.balance && typeof currentSeller.financials.balance === 'object' && Object.keys(currentSeller.financials.balance).length > 0 ? (
                                Object.entries(currentSeller.financials.balance).map(([currency, amount]) => (
                                    (amount as number) > 0 && <p key={currency} className="text-2xl font-mono text-green-700">{formatPrice(amount as number, currency)}</p>
                                ))
                            ) : <p className="text-[--text-muted]">No outstanding balance.</p>}
                        </div>
                        <p className="text-xs text-[--text-muted] mt-4">Payouts are processed automatically on the 1st of each month.</p>
                    </div>

                    <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg border border-[--accent]/30">
                        <h3 className="text-xl font-bold font-cinzel text-[--accent] mb-4">Insights from the Crystal Ball</h3>
                        <ul className="space-y-3">
                            {Array.isArray(biInsights) && biInsights.length > 0 ? biInsights.map((insight: BIInsight, index) => {
                                if (!insight) return null;
                                return (
                                    <li key={index} className="flex items-start gap-3 text-sm">
                                        <span className="mt-1">{insight.type === 'warning' ? '⚠️' : '💡'}</span>
                                        <span className="text-[--text-secondary]">{insight.message || ''}</span>
                                    </li>
                                );
                            }) : <li className="text-[--text-muted] text-sm">No insights available.</li>}
                        </ul>
                    </div>
                    
                    <div className="bg-[--bg-secondary] border border-[--border-color] p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold font-cinzel text-[--text-primary] mb-4">Stock Overview</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {Array.isArray(sellerProducts) && sellerProducts.length > 0 ? sellerProducts.map(p => {
                                if (!p) return null;
                                return (
                                    <div key={p.id} className="flex justify-between items-center text-sm">
                                        <p className="text-[--text-secondary] truncate pr-2">{t(p.name)}</p>
                                        <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${getStockLevelClass(p.stock || 0)}`}>
                                            {p.stock || 0} units
                                        </span>
                                    </div>
                                );
                            }) : <p className="text-[--text-muted]">No products found.</p>}
                        </div>
                        <Link to="/admin/products" className="block text-center mt-4 text-sm font-semibold text-[--accent] hover:text-[--accent-hover]">
                            Manage All Products &rarr;
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SellerDashboardPage: React.FC<SellerDashboardPageProps> = ({ user, ...props }) => {

    if (user?.role === 'admin') {
        return <PlatformDashboard {...props} />;
    }
    
    if (user?.role === 'seller') {
        return <SellerDashboard user={user} {...props} />;
    }

    // A fallback for other roles who might land here.
    const actionItems = useMemo(() => {
        const items = [];
         if (user?.role === 'warehouse_operative' || user?.role === 'shipping_coordinator') {
             const newOrders = props.orders.filter(o => o.status === 'Awaiting Shipment');
             if (newOrders.length > 0) {
                 items.push({ icon: '📦', text: <>{newOrders.length} new order{newOrders.length > 1 ? 's' : ''} to fulfill</>, link: '/admin/picking-dashboard'});
             }
         }
         return items;
    }, [user, props.orders]);

    return (
        <div>
            <h1 className="text-3xl font-bold font-cinzel text-[--text-primary] mb-2">
                Welcome, {user?.name}
            </h1>
            <p className="text-[--text-muted] mb-8">Select a task from the sidebar to get started.</p>
            <div className="max-w-md">
                 <ActionItems title="Your Action Items" items={actionItems} />
            </div>
        </div>
    );
};
