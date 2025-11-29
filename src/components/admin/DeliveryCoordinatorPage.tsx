import React, { useMemo } from 'react';
import { Order } from '../../types';
import { Link } from 'react-router-dom';

interface DeliveryCoordinatorPageProps {
    orders: Order[];
    onUpdateStatus: (orderId: string, newStatus: Order['status'], notes?: string) => void;
}

const AnalyticsCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
    <div className={`p-6 rounded-lg shadow-lg bg-opacity-10 ${color}`}>
        <h3 className="text-lg font-semibold text-[--text-muted]">{title}</h3>
        <p className="text-4xl font-bold mt-1">{value}</p>
    </div>
);

export const DeliveryCoordinatorPage: React.FC<DeliveryCoordinatorPageProps> = ({ orders, onUpdateStatus }) => {
    
    const relevantOrders = useMemo(() => {
        // FIX: Ensure orders is an array before calling filter
        const safeOrders = Array.isArray(orders) ? orders : [];
        const inTransit = safeOrders.filter(o => o?.status === 'Shipped');
        const exceptions = safeOrders.filter(o => o?.status === 'Delivery Exception');
        const awaitingPickup = safeOrders.filter(o => o?.status === 'Awaiting Pickup');
        return { inTransit, exceptions, awaitingPickup };
    }, [orders]);

    const handleMarkDelivered = (orderId: string, isPickup: boolean = false) => {
        const notes = isPickup ? 'Customer has picked up the order.' : 'Successfully delivered by carrier.';
        onUpdateStatus(orderId, 'Delivered', notes);
    };

    const OrderRow: React.FC<{ order: Order, isException?: boolean }> = ({ order, isException }) => (
        <div className="bg-[--bg-tertiary] p-3 rounded-lg grid grid-cols-12 gap-4 items-center text-sm">
            <div className="col-span-12 sm:col-span-3 lg:col-span-2 font-mono">
                <Link to={`/admin/orders/${order.id}`} className="text-blue-400 hover:underline">{order.id}</Link>
            </div>
            <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </div>
            <div className="col-span-6 sm:col-span-3 lg:col-span-3">
                {order.shippingAddress.city}, {order.shippingAddress.country}
            </div>
            <div className="col-span-12 sm:col-span-3 lg:col-span-3">
                <span className="font-semibold">{order.carrier}</span>
                <p className="text-xs text-[--text-muted] font-mono">{order.trackingNumber}</p>
            </div>
            <div className="col-span-12 sm:col-span-12 lg:col-span-2 text-right">
                {isException ? (
                     <Link to={`/admin/orders/${order.id}`} className="px-3 py-1 bg-orange-500 text-white font-bold rounded-full text-xs">Resolve</Link>
                ) : (
                    <button onClick={() => handleMarkDelivered(order.id, order.status === 'Awaiting Pickup')} className="px-3 py-1 bg-green-600 text-white font-bold rounded-full text-xs">Mark Delivered</button>
                )}
            </div>
            {isException && order.auditLog.length > 0 && (
                <div className="col-span-12 mt-1 text-xs text-orange-300 italic bg-orange-900/30 p-2 rounded">
                    <strong>Last Note:</strong> {order.auditLog[order.auditLog.length - 1].notes || 'No details provided.'}
                </div>
            )}
        </div>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold font-cinzel text-[--text-primary] mb-2">Delivery Dashboard</h1>
            <p className="text-[--text-muted] mb-8">Monitor in-transit shipments and resolve delivery issues.</p>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <AnalyticsCard title="In Transit" value={relevantOrders.inTransit.length} color="border-blue-500 bg-blue-500" />
                <AnalyticsCard title="Awaiting Pickup" value={relevantOrders.awaitingPickup.length} color="border-purple-500 bg-purple-500" />
                <AnalyticsCard title="Delivery Exceptions" value={relevantOrders.exceptions.length} color="border-red-500 bg-red-500" />
            </div>

            <div className="space-y-8">
                {/* Delivery Exceptions */}
                {relevantOrders.exceptions.length > 0 && (
                    <section className="bg-[--bg-secondary] p-4 md:p-6 rounded-lg shadow-lg border-2 border-red-500/50">
                        <h2 className="text-2xl font-bold font-cinzel text-red-400 mb-4">Delivery Exceptions</h2>
                        <div className="space-y-2">{relevantOrders.exceptions.map(order => <OrderRow key={order.id} order={order} isException />)}</div>
                    </section>
                )}

                {/* Shipments In Transit */}
                <section className="bg-[--bg-secondary] p-4 md:p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold font-cinzel text-[--text-primary] mb-4">Shipments In Transit</h2>
                    {relevantOrders.inTransit.length > 0 ? (
                        <div className="space-y-2">{relevantOrders.inTransit.map(order => <OrderRow key={order.id} order={order} />)}</div>
                    ) : (
                        <p className="text-center py-4 text-[--text-muted]">No shipments are currently in transit.</p>
                    )}
                </section>
                
                {/* Awaiting Pickup */}
                <section className="bg-[--bg-secondary] p-4 md:p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold font-cinzel text-[--text-primary] mb-4">Awaiting Customer Pickup</h2>
                     {relevantOrders.awaitingPickup.length > 0 ? (
                        <div className="space-y-2">{relevantOrders.awaitingPickup.map(order => <OrderRow key={order.id} order={order} />)}</div>
                    ) : (
                        <p className="text-center py-4 text-[--text-muted]">No orders are awaiting customer pickup.</p>
                    )}
                </section>
            </div>
        </div>
    );
};