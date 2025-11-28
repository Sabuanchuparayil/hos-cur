import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order, Role } from '../../types';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { FulfillmentModal, FulfillmentData } from './FulfillmentModal';

interface AdminOrderDetailPageProps {
    orders: Order[];
    roles: Role[];
    onUpdateStatus: (orderId: string, updates: Partial<Pick<Order, 'status' | 'carrier' | 'trackingNumber' | 'trackingUrl' | 'shippingNotes'>>, notes?: string) => void;
}

const ALL_ORDER_STATUSES: Order['status'][] = [
    'Processing', 'Awaiting Shipment', 'Shipped', 'Partially Shipped', 'Awaiting Pickup', 'Delivered', 'Cancelled', 
    'Return Requested', 'Return Approved', 'Return Rejected', 'Return Processing', 'Return Completed'
];

export const AdminOrderDetailPage: React.FC<AdminOrderDetailPageProps> = ({ orders, roles, onUpdateStatus }) => {
    const { id } = useParams<{ id: string }>();
    const { formatPrice } = useCurrency();
    const { t } = useLanguage();
    const { user } = useAuth();

    const order = orders.find(o => o.id === id);
    const [newStatus, setNewStatus] = useState(order?.status || 'Processing');
    const [notes, setNotes] = useState('');
    const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState(false);

    // User.role is the role name (e.g., 'admin'), not the role ID
    const userRole = roles.find(r => r.name === user?.role);
    const canEdit = userRole?.permissions.includes('write:orders');
    const canViewLog = userRole?.permissions.includes('read:order_audit_log');

    const handleStatusUpdate = () => {
        if (order && newStatus !== order.status) {
            onUpdateStatus(order.id, { status: newStatus }, notes);
            setNotes('');
        }
    };
    
    const handleFulfillOrder = (data: FulfillmentData) => {
        if (order) {
            const fulfillmentNotes = `Order fulfilled with carrier: ${data.carrier}, Tracking: ${data.trackingNumber}.`;
            onUpdateStatus(order.id, {
                status: 'Shipped',
                carrier: data.carrier,
                trackingNumber: data.trackingNumber,
                trackingUrl: data.trackingUrl,
                shippingNotes: data.shippingNotes,
            }, fulfillmentNotes);
        }
        setIsFulfillmentModalOpen(false);
    };

    if (!order) {
        return (
            <div className="container mx-auto text-center py-16">
                 <h1 className="text-2xl font-bold">Order not found.</h1>
                 <Link to="/admin/orders" className="text-[--accent] hover:text-[--accent-hover] mt-4 inline-block">&larr; Back to all orders</Link>
            </div>
        );
    }
    
    return (
        <div>
            <Link to="/admin/orders" className="text-[--accent] hover:text-[--accent-hover] mb-8 inline-block">&larr; Back to all orders</Link>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 bg-[--bg-secondary] rounded-lg shadow-xl p-8 space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-cinzel font-bold text-[--text-primary]">Order <span className="font-mono">{order.id}</span></h1>
                        <p className="text-[--text-muted]">Placed on {new Date(order.date).toLocaleString()}</p>
                    </div>

                    {/* Items */}
                    <div className="border-t border-[--border-color] pt-6">
                         <h3 className="font-semibold text-[--accent] mb-4">Items Ordered</h3>
                         <div className="space-y-4">
                            {order.items.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-2 bg-[--bg-primary] rounded-md">
                                    <div className="flex items-center gap-4">
                                        <img src={item.media[0]?.url} alt={t(item.name)} className="w-16 h-16 object-cover rounded" />
                                        <div>
                                            <p className="font-bold">{t(item.name)}</p>
                                            <p className="text-sm text-[--text-muted]">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="font-semibold">{formatPrice(item.pricing[order.currency] * item.quantity, order.currency)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Customer Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[--border-color] pt-6">
                        <div>
                            <h3 className="font-semibold text-[--accent] mb-2">Customer & Shipping</h3>
                            <p className="text-[--text-secondary]">
                                {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                                <a href={`mailto:${order.shippingAddress.email}`} className="text-blue-400 hover:underline">{order.shippingAddress.email}</a><br />
                                {order.shippingAddress.addressLine1}<br />
                                {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
                                {order.shippingAddress.country}
                            </p>
                        </div>
                         <div>
                            <h3 className="font-semibold text-[--accent] mb-2">Financial Summary</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-[--text-muted]">Subtotal:</span> <span>{formatPrice(order.subtotal, order.currency)}</span></div>
                                {order.discountAmount > 0 && <div className="flex justify-between text-green-400"><span>Discount:</span> <span>- {formatPrice(order.discountAmount, order.currency)}</span></div>}
                                <div className="flex justify-between"><span className="text-[--text-muted]">Shipping:</span> <span>{formatPrice(order.shippingCost, order.currency)}</span></div>
                                <div className="flex justify-between"><span className="text-[--text-muted]">Taxes:</span> <span>{formatPrice(order.taxes, order.currency)}</span></div>
                                <div className="flex justify-between font-bold text-[--text-primary] border-t border-[--border-color] mt-1 pt-1"><span>Total:</span> <span>{formatPrice(order.total, order.currency)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-[--bg-secondary] rounded-lg shadow-xl p-6">
                        <h2 className="text-xl font-cinzel text-[--accent] mb-4">Order Management</h2>
                         {canEdit && order.status === 'Awaiting Shipment' && (
                            <button
                                onClick={() => setIsFulfillmentModalOpen(true)}
                                className="w-full mb-4 px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition"
                            >
                                Mark as Shipped & Add Tracking
                            </button>
                        )}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-[--text-muted]">Order Status</label>
                            {canEdit ? (
                                <select id="status" value={newStatus} onChange={e => setNewStatus(e.target.value as Order['status'])} className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3">
                                    {ALL_ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            ) : (
                                <p className="font-semibold text-lg mt-1">{order.status}</p>
                            )}
                        </div>
                         {canEdit && (
                            <div className="mt-4">
                                 <label htmlFor="notes" className="block text-sm font-medium text-[--text-muted]">Notes (for audit log)</label>
                                 <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md p-2" placeholder="e.g., Awaiting stock for item XYZ." />
                                <button onClick={handleStatusUpdate} disabled={newStatus === order.status} className="w-full mt-4 px-6 py-2 bg-[--accent] text-[--accent-foreground] font-bold rounded-full hover:bg-[--accent-hover] transition disabled:bg-gray-500 disabled:cursor-not-allowed">
                                    Update Status
                                </button>
                            </div>
                        )}
                    </div>

                    {canViewLog && (
                         <div className="bg-[--bg-secondary] rounded-lg shadow-xl p-6">
                             <h2 className="text-xl font-cinzel text-[--accent] mb-4">Audit Log</h2>
                             <div className="space-y-4 max-h-96 overflow-y-auto pr-2 -mr-2">
                                {[...order.auditLog].reverse().map((log, index) => (
                                    <div key={index} className="relative pl-8 border-l-2 border-[--border-color]">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[--accent] ring-4 ring-[--bg-secondary]"></div>
                                        <p className="font-semibold text-[--text-primary]">{log.newStatus}</p>
                                        <p className="text-sm text-[--text-muted]">by {log.user} on {new Date(log.timestamp).toLocaleString()}</p>
                                        {log.notes && <p className="text-sm italic text-yellow-200/70 mt-1 bg-yellow-900/30 p-2 rounded">"{log.notes}"</p>}
                                    </div>
                                ))}
                             </div>
                         </div>
                    )}
                </div>
            </div>
             {isFulfillmentModalOpen && (
                <FulfillmentModal
                    onClose={() => setIsFulfillmentModalOpen(false)}
                    onFulfill={handleFulfillOrder}
                />
            )}
        </div>
    );
};