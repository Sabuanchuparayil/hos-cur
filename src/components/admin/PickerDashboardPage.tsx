import React, { useMemo } from 'react';
import { Order, ProductWithTotalStock } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface PickerDashboardPageProps {
    orders: Order[];
    products: ProductWithTotalStock[];
}

export const PickerDashboardPage: React.FC<PickerDashboardPageProps> = ({ orders, products }) => {
    const { t } = useLanguage();

    const ordersToPick = useMemo(() => {
        // FIX: Ensure orders is an array before calling filter
        const safeOrders = Array.isArray(orders) ? orders : [];
        return safeOrders.filter(o => o?.status === 'Awaiting Shipment');
    }, [orders]);

    return (
        <div>
            <h1 className="text-3xl font-bold font-cinzel text-[--text-primary] mb-2">Picking Dashboard</h1>
            <p className="text-[--text-muted] mb-8">
                Orders that are paid and awaiting shipment. Pick the items below to prepare them for dispatch.
            </p>

            {ordersToPick.length === 0 ? (
                <div className="text-center p-12 bg-[--bg-secondary] rounded-lg shadow-lg">
                    <h2 className="text-2xl font-cinzel text-[--text-primary]">All Caught Up!</h2>
                    <p className="text-[--text-muted] mt-2">There are no orders currently awaiting shipment.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {ordersToPick.map(order => (
                        <div key={order.id} className="bg-[--bg-secondary] rounded-lg shadow-xl border border-[--border-color] overflow-hidden">
                            <div className="p-4 bg-[--bg-tertiary] flex flex-col sm:flex-row justify-between sm:items-center">
                                <div>
                                    <h3 className="font-bold text-lg font-cinzel text-[--accent]">
                                        <Link to={`/admin/orders/${order.id}`} className="hover:underline">
                                            Order {order.id}
                                        </Link>
                                    </h3>
                                    <p className="text-xs text-[--text-muted]">{new Date(order.date).toLocaleString()}</p>
                                </div>
                                <div className="text-sm mt-2 sm:mt-0">
                                    <p className="font-semibold text-right">{order.items.reduce((sum, item) => sum + item.quantity, 0)} Items</p>
                                    <p className="text-xs text-[--text-muted] text-right">
                                        Ship to: {order.shippingAddress.city}, {order.shippingAddress.country}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="p-4 space-y-3">
                                {order.items.map(item => {
                                    const productDetails = products.find(p => p.id === item.id);
                                    if (!productDetails) return null;

                                    return (
                                        <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-[--bg-primary] p-3 rounded-md">
                                            <div className="col-span-2 sm:col-span-1">
                                                <img src={item.media[0]?.url} alt={t(item.name)} className="w-12 h-12 object-cover rounded" />
                                            </div>
                                            <div className="col-span-10 sm:col-span-6">
                                                <p className="font-semibold text-sm text-[--text-primary]">{t(item.name)}</p>
                                                <p className="text-xs text-[--text-muted] font-mono">SKU: {item.sku}</p>
                                            </div>
                                            <div className="col-span-6 sm:col-span-2 text-center">
                                                <p className="text-xs text-[--text-muted]">Quantity</p>
                                                <p className="font-bold text-lg text-[--accent]">{item.quantity}</p>
                                            </div>
                                            <div className="col-span-6 sm:col-span-3">
                                                 <p className="text-xs text-[--text-muted]">Locations</p>
                                                {productDetails.inventory.map(loc => (
                                                    <div key={loc.centreId} className="text-sm font-semibold text-[--text-secondary]">
                                                        {loc.name}: <span className="text-green-400">{loc.stock} in stock</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};