import React from 'react';
import { ProductWithTotalStock, Order, Seller } from '../../types';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../contexts/CurrencyContext';
import { AnalyticsCard } from './AnalyticsCard';

interface PlatformDashboardProps {
  products: ProductWithTotalStock[];
  orders: Order[];
  sellers: Seller[];
}

export const PlatformDashboard: React.FC<PlatformDashboardProps> = ({ products, orders, sellers }) => {
  const { formatPrice } = useCurrency();
  
  const safeOrders = Array.isArray(orders) ? orders : [];
  const totalPlatformRevenue = safeOrders.reduce((acc, order) => {
    // FIX: The platformFee.base is already in the platform's base currency (GBP).
    // This provides a standardized value for accurate platform-wide reporting.
    const platformFee = order?.platformFee;
    if (platformFee && typeof platformFee === 'object' && 'base' in platformFee) {
      return acc + (platformFee.base || 0);
    }
    return acc;
  }, 0);
  
  const totalOrders = safeOrders.length;
  const safeSellers = Array.isArray(sellers) ? sellers : [];
  const activeSellers = safeSellers.filter(s => s?.status === 'approved').length;

  const topSellers = [...safeSellers]
    .filter(s => s?.status === 'approved')
    .sort((a, b) => {
      const aSales = a?.performance?.totalSales || 0;
      const bSales = b?.performance?.totalSales || 0;
      return bSales - aSales;
    })
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-3xl font-bold font-cinzel text-[--text-primary] mb-2">Platform Dashboard</h1>
       <p className="text-[--text-muted] mb-8">An overview of marketplace activity.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnalyticsCard
            title={`Platform Revenue (in GBP)`}
            value={formatPrice(totalPlatformRevenue, 'GBP')}
            description="All-time platform fees from sales"
        />
        <AnalyticsCard
            title="Total Orders"
            value={totalOrders.toString()}
            description="Total orders processed on the platform"
            linkTo="/admin/orders"
        />
        <AnalyticsCard
            title="Active Sellers"
            value={activeSellers.toString()}
            description="Sellers with approved status"
            linkTo="/admin/sellers"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold font-cinzel text-[--text-primary] mb-4">Sales Over Time</h3>
          <div className="bg-[--bg-tertiary] h-64 flex items-center justify-center rounded-md">
            <p className="text-[--text-muted]">[Platform-wide Sales Chart]</p>
          </div>
        </div>
        <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold font-cinzel text-[--text-primary] mb-4">Top Performing Sellers</h3>
          <ul className="space-y-4">
            {topSellers.map(seller => (
              <li key={seller?.id || 'unknown'} className="flex items-center justify-between">
                <span className="font-semibold text-[--text-secondary]">{seller?.name || 'Unknown'}</span>
                <span className="font-bold text-green-600">{formatPrice(seller?.performance?.totalSales || 0, 'GBP')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-bold font-cinzel text-[--text-primary] mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
            <Link to="/admin/sellers" className="px-6 py-2 bg-[--accent] text-[--accent-foreground] font-bold rounded-full hover:bg-[--accent-hover] transition duration-300">Manage Sellers</Link>
            <Link to="/admin/orders" className="px-6 py-2 bg-[--bg-tertiary] text-[--text-secondary] font-semibold rounded-full hover:bg-[--border-color] transition-colors">View All Orders</Link>
            <Link to="/admin/financials" className="px-6 py-2 bg-[--bg-tertiary] text-[--text-secondary] font-semibold rounded-full hover:bg-[--border-color] transition-colors">View Financials</Link>
        </div>
      </div>
    </div>
  );
};
