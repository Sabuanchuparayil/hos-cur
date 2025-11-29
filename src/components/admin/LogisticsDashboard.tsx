import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLogistics } from '../../contexts/LogisticsContext';
import { Carrier, Order, ReturnRequest, TrackingStatus } from '../../types';
import { getTrackingInfo } from '../../services/logisticsService';
import { CarrierRatesModal } from './CarrierRatesModal';
import { CarrierFormModal } from './CarrierFormModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { RETURN_REASONS } from '../../data/reasons';

interface LogisticsDashboardProps {
    orders: Order[];
    returnRequests: ReturnRequest[];
}

const TrackingInfoDisplay: React.FC<{ trackingNumber: string }> = ({ trackingNumber }) => {
    const [history, setHistory] = useState<TrackingStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!trackingNumber) return;
        const fetchTracking = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await getTrackingInfo(trackingNumber);
                if (data && data.length > 0) {
                    setHistory(data);
                } else {
                    setError('No tracking information found for this number.');
                }
            } catch (e) {
                setError('Failed to fetch tracking information.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTracking();
    }, [trackingNumber]);

    if (isLoading) return <p className="text-[--text-muted] p-4">Loading tracking history...</p>;
    if (error) return <p className="text-red-500 p-4">{error}</p>;

    return (
        <div className="mt-4 space-y-4 p-4 max-h-96 overflow-y-auto">
            {history.map((status, index) => (
                <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-[--accent]' : 'bg-gray-600'}`}></div>
                        {index < history.length - 1 && <div className="w-px flex-grow bg-gray-600"></div>}
                    </div>
                    <div>
                        <p className={`font-semibold text-sm ${index === 0 ? 'text-[--text-primary]' : 'text-[--text-secondary]'}`}>{status.status}</p>
                        <p className="text-xs text-[--text-muted]">{status.location}</p>
                        <p className="text-xs text-gray-500">{new Date(status.timestamp).toLocaleString()}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};


export const LogisticsDashboard: React.FC<LogisticsDashboardProps> = ({ orders, returnRequests }) => {
    const { carriers, updateCarrier, addCarrier, removeCarrier } = useLogistics();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'shipments' | 'returns' | 'carriers'>('shipments');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingResult, setTrackingResult] = useState<string | null>(null);

    const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
    const [isCarrierFormOpen, setIsCarrierFormOpen] = useState(false);
    const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);

    const handleTrackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTrackingResult(trackingNumber);
    };

    const handleSaveCarrier = (carrier: Carrier) => {
        const existing = carriers.find(c => c.id === carrier.id);
        if (existing) {
            updateCarrier(carrier);
        } else {
            addCarrier(carrier);
        }
        setIsCarrierFormOpen(false);
    };

    const handleSaveRates = (carrier: Carrier) => {
        updateCarrier(carrier);
        setIsRatesModalOpen(false);
        setSelectedCarrier(null);
    };
    
    const handleDeleteCarrier = (carrierId: string) => {
        if (window.confirm('Are you sure you want to delete this carrier? This will remove all associated shipping rates.')) {
            removeCarrier(carrierId);
        }
    };
    
    // FIX: Ensure orders and returnRequests are arrays before calling filter
    const ordersToShip = useMemo(() => {
        const safeOrders = Array.isArray(orders) ? orders : [];
        return safeOrders.filter(o => o?.status === 'Awaiting Shipment' || o?.status === 'Partially Shipped');
    }, [orders]);
    const returnsInTransit = useMemo(() => {
        const safeReturns = Array.isArray(returnRequests) ? returnRequests : [];
        return safeReturns.filter(r => r?.status === 'In Transit' || r?.status === 'Approved - Awaiting Return');
    }, [returnRequests]);

    const renderContent = () => {
        switch (activeTab) {
            case 'shipments': return renderShipments();
            case 'returns': return renderReturns();
            case 'carriers': return renderCarriers();
            default: return null;
        }
    };

    const renderShipments = () => (
        <div className="bg-[--bg-secondary] p-4 md:p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold font-cinzel text-[--accent] mb-4">Orders Awaiting Shipment ({ordersToShip.length})</h3>
             {/* Desktop Table */}
             <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-[--border-color]">
                            <th className="p-3">Order ID</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Destination</th>
                            <th className="p-3">Shipping Method</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordersToShip.map(order => (
                             <tr key={order.id} className="hover:bg-[--bg-tertiary]">
                                <td className="p-3 font-mono"><Link to={`/admin/orders/${order.id}`} className="text-blue-400 hover:underline">{order.id}</Link></td>
                                <td className="p-3">{new Date(order.date).toLocaleDateString()}</td>
                                <td className="p-3">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</td>
                                <td className="p-3">{order.shippingAddress.city}, {order.shippingAddress.country}</td>
                                <td className="p-3">{order.carrier} - {order.shippingMethod}</td>
                            </tr>
                        ))}
                         {ordersToShip.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-[--text-muted]">No orders are currently awaiting shipment.</td></tr>}
                    </tbody>
                </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {ordersToShip.map(order => (
                    <div key={order.id} className="bg-[--bg-tertiary] p-3 rounded-lg space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <Link to={`/admin/orders/${order.id}`} className="font-mono text-blue-400 hover:underline">{order.id}</Link>
                            <p className="text-[--text-muted]">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                            <p className="text-xs text-[--text-muted]">{order.shippingAddress.city}, {order.shippingAddress.country}</p>
                        </div>
                        <div className="text-xs bg-[--bg-primary] p-2 rounded">
                            {order.carrier} - {order.shippingMethod}
                        </div>
                    </div>
                ))}
                {ordersToShip.length === 0 && <p className="p-4 text-center text-[--text-muted]">No orders are currently awaiting shipment.</p>}
            </div>
        </div>
    );

    const renderReturns = () => (
         <div className="bg-[--bg-secondary] p-4 md:p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold font-cinzel text-[--accent] mb-4">Incoming Returns ({returnsInTransit.length})</h3>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-[--border-color]">
                            <th className="p-3">Return ID</th>
                            <th className="p-3">Order ID</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Reason</th>
                            <th className="p-3">Tracking</th>
                        </tr>
                    </thead>
                     <tbody>
                        {returnsInTransit.map(ret => {
                            const reason = RETURN_REASONS.find(r => r.code === ret.reasonCode)?.description || 'Other';
                            return (
                                <tr key={ret.id} className="hover:bg-[--bg-tertiary]">
                                    <td className="p-3 font-mono">{ret.id}</td>
                                    <td className="p-3 font-mono">{ret.orderId}</td>
                                    <td className="p-3">{ret.status}</td>
                                    <td className="p-3">{reason}</td>
                                    <td className="p-3 font-mono">{ret.returnTrackingNumber || 'N/A'}</td>
                                </tr>
                            )
                        })}
                        {returnsInTransit.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-[--text-muted]">No returns are currently in transit.</td></tr>}
                    </tbody>
                </table>
            </div>
             {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                 {returnsInTransit.map(ret => {
                    const reason = RETURN_REASONS.find(r => r.code === ret.reasonCode)?.description || 'Other';
                    return (
                        <div key={ret.id} className="bg-[--bg-tertiary] p-3 rounded-lg space-y-2">
                             <div className="flex justify-between items-center text-xs">
                                <p className="font-mono text-[--text-primary]">{ret.id}</p>
                                <p className="text-[--text-muted]">Order: {ret.orderId}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{reason}</p>
                                <p className="text-xs text-[--text-muted]">Status: {ret.status}</p>
                            </div>
                            <div className="text-xs bg-[--bg-primary] p-2 rounded font-mono truncate">
                                Tracking: {ret.returnTrackingNumber || 'N/A'}
                            </div>
                        </div>
                    )
                })}
                {returnsInTransit.length === 0 && <p className="p-4 text-center text-[--text-muted]">No returns are currently in transit.</p>}
            </div>
        </div>
    );
    
    const renderCarriers = () => (
        <div className="bg-[--bg-secondary] p-4 md:p-6 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <h3 className="text-xl font-bold font-cinzel text-[--accent]">Shipping Carriers</h3>
                <button onClick={() => setIsCarrierFormOpen(true)} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-full text-sm hover:bg-indigo-700">Add New Carrier</button>
            </div>
            <div className="space-y-4">
                {carriers.map(carrier => (
                    <div key={carrier.id} className="bg-[--bg-tertiary] p-4 rounded-md flex flex-col sm:flex-row justify-between items-center gap-2">
                        <div>
                            <p className="font-bold text-[--text-primary]">{carrier.name}</p>
                            <p className="text-xs text-[--text-muted] font-mono">{carrier.id}</p>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                             <button onClick={() => { setSelectedCarrier(carrier); setIsRatesModalOpen(true); }} className="text-sm font-semibold text-blue-400 hover:underline">Manage Rates</button>
                             <button onClick={() => handleDeleteCarrier(carrier.id)} className="text-sm font-semibold text-red-500 hover:underline">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );


    return (
        <div>
            <h1 className="text-3xl font-bold font-cinzel text-[--text-primary] mb-8">Logistics Hub</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="mb-6 border-b border-[--border-color] overflow-x-auto">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button onClick={() => setActiveTab('shipments')} className={`${activeTab === 'shipments' ? 'border-[--accent] text-[--accent]' : 'border-transparent text-[--text-muted] hover:text-[--text-secondary]'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>
                                Outbound Shipments
                            </button>
                            <button onClick={() => setActiveTab('returns')} className={`${activeTab === 'returns' ? 'border-[--accent] text-[--accent]' : 'border-transparent text-[--text-muted] hover:text-[--text-secondary]'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>
                                Inbound Returns
                            </button>
                             <button onClick={() => setActiveTab('carriers')} className={`${activeTab === 'carriers' ? 'border-[--accent] text-[--accent]' : 'border-transparent text-[--text-muted] hover:text-[--text-secondary]'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>
                                Carriers & Rates
                            </button>
                        </nav>
                    </div>
                    {renderContent()}
                </div>

                {/* Tracking Sidebar */}
                <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg h-fit sticky top-28">
                    <h3 className="text-xl font-bold font-cinzel text-[--accent] mb-4">Track a Shipment</h3>
                    <form onSubmit={handleTrackSubmit}>
                        <label htmlFor="tracking-input" className="sr-only">Tracking Number</label>
                        <div className="flex">
                            <input
                                id="tracking-input"
                                type="text"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking number..."
                                className="w-full bg-[--bg-primary] border border-[--border-color] rounded-l-md px-3 py-2 text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[--accent]"
                            />
                            <button type="submit" className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-r-md hover:bg-gray-600">Track</button>
                        </div>
                    </form>
                    {trackingResult && <TrackingInfoDisplay trackingNumber={trackingResult} />}
                </div>
            </div>

            {isRatesModalOpen && selectedCarrier && (
                <CarrierRatesModal carrier={selectedCarrier} onClose={() => setIsRatesModalOpen(false)} onSave={handleSaveRates} />
            )}

            {isCarrierFormOpen && (
                <CarrierFormModal onClose={() => setIsCarrierFormOpen(false)} onSave={handleSaveCarrier} />
            )}
        </div>
    );
};