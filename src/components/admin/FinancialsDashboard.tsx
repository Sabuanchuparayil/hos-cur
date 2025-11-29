import React, { useState, useMemo, useEffect } from 'react';
import { Seller, Order, Transaction } from '../../types';
import { useCurrency } from '../../contexts/CurrencyContext';
import { ManualTransactionForm } from './ManualTransactionForm';
import { FinancialsSellerDetailView } from './FinancialsSellerDetailView';
import { useFinancials } from '../../contexts/FinancialsContext';
import { TransactionDetailModal } from './TransactionDetailModal';
import { useSearchParams } from 'react-router-dom';

interface FinancialsDashboardProps {
  sellers: Seller[];
  orders: Order[];
  transactions: Transaction[];
  onProcessPayout: (sellerId: number, currency: string) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'processedBy'>) => void;
}

type ActiveTab = 'overview' | 'sellers' | 'transactions' | 'reports' | 'taxes';

const PayoutStatusBadge: React.FC<{ status: Seller['financials']['kycStatus'] }> = ({ status }) => {
    const statusMap = {
        not_started: { text: 'Not Connected', className: 'bg-gray-100 text-gray-800' },
        pending: { text: 'Pending Verification', className: 'bg-yellow-100 text-yellow-800' },
        verified: { text: 'Verified & Active', className: 'bg-green-100 text-green-800' },
        action_required: { text: 'Action Required', className: 'bg-orange-100 text-orange-800' },
        rejected: { text: 'Rejected', className: 'bg-red-100 text-red-800' },
    };
    const { text, className } = statusMap[status] || statusMap.not_started;
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${className}`}>{text}</span>;
};

export const FinancialsDashboard: React.FC<FinancialsDashboardProps> = ({ sellers, orders, transactions, onProcessPayout, onAddTransaction }) => {
  const { currency, formatPrice, currencies } = useCurrency();
  const { taxRates, updateTaxRates } = useFinancials();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reversingTransaction, setReversingTransaction] = useState<Transaction | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<Transaction | null>(null);
  
  // State for Transactions Log
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [transactionFilters, setTransactionFilters] = useState({ sellerId: 'all', type: 'all' });

  // State for all pages
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // State for taxes tab
  const [localTaxRates, setLocalTaxRates] = useState(taxRates);
  const [newTaxRule, setNewTaxRule] = useState({ country: '', rate: '' });
  
  // Effect for deep-linking to a seller
  useEffect(() => {
    const sellerId = searchParams.get('sellerId');
    if (sellerId && sellers.length > 0) {
        const seller = sellers.find(s => s.id === parseInt(sellerId, 10));
        if (seller) {
            setSelectedSeller(seller);
            setActiveTab('sellers');
        }
    }
  }, [searchParams, sellers]);


  useEffect(() => {
    setLocalTaxRates(taxRates);
  }, [taxRates]);
  
  const handleOpenReverseModal = (tx: Transaction) => {
    setReversingTransaction(tx);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setReversingTransaction(null);
  };

  const filteredOrders = useMemo(() => {
    // FIX: Ensure orders is an array before calling filter
    const safeOrders = Array.isArray(orders) ? orders : [];
    if (!dateRange.start && !dateRange.end) return safeOrders;
    return safeOrders.filter(o => {
        if (!o) return false;
        const orderDate = new Date(o.date);
        const start = dateRange.start ? new Date(dateRange.start) : null;
        const end = dateRange.end ? new Date(dateRange.end) : null;
        if (start && orderDate < start) return false;
        if (end && orderDate > end) return false;
        return true;
    });
  }, [orders, dateRange]);

  const financialSummary = useMemo(() => {
    // FIX: Ensure all arrays are safe before calling reduce
    const safeFilteredOrders = Array.isArray(filteredOrders) ? filteredOrders : [];
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const safeSellers = Array.isArray(sellers) ? sellers : [];
    
    const totalPlatformRevenue = safeFilteredOrders.reduce((acc, order) => acc + (order?.platformFee?.base || 0), 0);
    const totalSalesValue = safeFilteredOrders.reduce((acc, order) => acc + (order?.subtotal || 0), 0);
    const totalTaxesCollected = safeFilteredOrders.reduce((acc, order) => acc + (order?.taxes || 0), 0);
    const totalRefunds = safeTransactions.filter(t => t?.type === 'Refund').reduce((acc, tx) => acc + Math.abs(tx?.amount || 0), 0);
    
    const outstandingBalance = safeSellers.flatMap(s => {
        if (!s?.financials?.balance) return [];
        return Object.entries(s.financials.balance);
    }).reduce((acc, [, amount]) => acc + (amount as number || 0), 0);

    return { totalPlatformRevenue, outstandingBalance, totalSalesValue, totalTaxesCollected, totalRefunds };
  }, [filteredOrders, sellers, transactions]);

  const handleSaveTransaction = (transaction: Omit<Transaction, 'id' | 'date' | 'processedBy'>) => {
    onAddTransaction(transaction);
    closeModal();
  };
  
  const handlePayout = (sellerId: number, currency: string) => {
    if (window.confirm(`Are you sure you want to process this ${currency} payout? This action cannot be undone.`)) {
      onProcessPayout(sellerId, currency);
    }
  };
  
   const getTransactionTypeClass = (type: Transaction['type']) => {
    switch (type) {
      case 'Sale': return 'bg-green-100 text-green-800';
      case 'Payout': return 'bg-blue-100 text-blue-800';
      case 'Adjustment':
      case 'Fee':
        return 'bg-yellow-100 text-yellow-800';
      case 'Refund': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const filteredTransactions = useMemo(() => {
      return transactions
          .filter(tx => transactionFilters.sellerId === 'all' || tx.sellerId === parseInt(transactionFilters.sellerId))
          .filter(tx => transactionFilters.type === 'all' || tx.type === transactionFilters.type)
          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, transactionFilters]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const exportToCSV = () => {
    const headers = "ID,Date,Seller,Type,Amount,Currency,Description,Reference ID,Processed By\n";
    const csvContent = filteredTransactions.map(tx => {
        const sellerName = sellers.find(s => s.id === tx.sellerId)?.name.replace(/,/g, '') || 'N/A';
        return [
            tx.id,
            new Date(tx.date).toLocaleString(),
            sellerName,
            tx.type,
            tx.amount,
            tx.currency,
            `"${tx.description.replace(/"/g, '""')}"`,
            tx.referenceId || '',
            tx.processedBy || 'N/A'
        ].join(',');
    }).join('\n');

    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `transactions-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const renderContent = () => {
    if (selectedSeller) {
      return <FinancialsSellerDetailView 
                seller={selectedSeller} 
                onBack={() => setSelectedSeller(null)} 
                onReverseTransaction={handleOpenReverseModal}
                onViewDetails={setSelectedTransactionForDetail} 
             />;
    }
    
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'sellers': return renderSellers();
      case 'transactions': return renderTransactions();
      case 'reports': return renderReports();
      case 'taxes': return renderTaxes();
      default: return null;
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-[--text-muted]">Total Sales Value (Multi-Currency)</h3>
            <p className="text-4xl font-bold text-[--accent]">{formatPrice(financialSummary.totalSalesValue, currency)}</p>
        </div>
        <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-[--text-muted]">Platform Revenue (in GBP)</h3>
            <p className="text-4xl font-bold text-green-500">{formatPrice(financialSummary.totalPlatformRevenue, 'GBP')}</p>
        </div>
        <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-[--text-muted]">Total Refunds (Multi-Currency)</h3>
            <p className="text-4xl font-bold text-red-500">{formatPrice(financialSummary.totalRefunds, currency)}</p>
        </div>
        <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-[--text-muted]">Outstanding Balances (Multi-Currency)</h3>
            <p className="text-4xl font-bold text-orange-500">{formatPrice(financialSummary.outstandingBalance, currency)}</p>
        </div>
    </div>
  );
  
  const renderSellers = () => {
    const getDisabledReason = (status: Seller['financials']['kycStatus']) => {
        if (status !== 'verified') {
            return `Payouts disabled: Seller KYC status is "${status.replace('_', ' ')}".`;
        }
        return '';
    };

    return (
        <>
        <div className="md:hidden space-y-4">
            {sellers.map(seller => (
                <div key={seller.id} className="bg-[--bg-secondary] rounded-lg shadow-lg p-4 space-y-3">
                    <h3 className="font-bold text-[--text-primary] text-lg">
                        <button onClick={() => setSelectedSeller(seller)} className="hover:text-[--accent]">{seller.name}</button>
                    </h3>
                    <div className="border-t border-[--border-color] pt-3 grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-sm text-[--text-muted]">Payout Status</p>
                            <PayoutStatusBadge status={seller.financials.kycStatus} />
                        </div>
                        <div>
                            <p className="text-sm text-[--text-muted]">Current Balance</p>
                            {Object.keys(seller.financials.balance).length > 0 ? (
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    {Object.entries(seller.financials.balance).map(([c, a]) => ((a as number) > 0) && <span key={c} className="font-mono text-green-600 font-semibold">{formatPrice(a as number, c)}</span>)}
                                </div>
                            ) : <span className="text-[--text-muted] text-sm">None</span>}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-[--border-color]">
                        {Object.entries(seller.financials.balance).map(([c, a]) => ((a as number) > 0) && (
                            <button
                                key={c}
                                onClick={() => handlePayout(seller.id, c)}
                                disabled={!seller.payoutsEnabled}
                                title={getDisabledReason(seller.financials.kycStatus)}
                                className="text-xs px-3 py-1 bg-[--accent] text-[--accent-foreground] font-semibold rounded-full hover:bg-[--accent-hover] disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                Process {c} Payout
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        <div className="hidden md:block bg-[--bg-secondary] rounded-lg shadow-xl overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-[--bg-tertiary]">
                <tr>
                <th className="p-4 font-semibold text-[--text-secondary]">Seller</th>
                <th className="p-4 font-semibold text-[--text-secondary]">Current Balance</th>
                <th className="p-4 font-semibold text-[--text-secondary]">Payout Status</th>
                <th className="p-4 font-semibold text-[--text-secondary]">Actions</th>
                </tr>
            </thead>
            <tbody>
                {sellers.map(seller => (
                <tr key={seller.id} className="border-b border-[--border-color] hover:bg-[--bg-tertiary]">
                    <td className="p-4 font-bold text-[--text-primary]">
                        <button onClick={() => setSelectedSeller(seller)} className="hover:text-[--accent]">{seller.name}</button>
                    </td>
                    <td className="p-4">
                    {Object.keys(seller.financials.balance).length > 0 ? (
                        <div className="flex flex-col gap-1">
                        {Object.entries(seller.financials.balance).map(([c, a]) => ((a as number) > 0) && <span key={c} className="font-mono text-green-600 font-semibold">{formatPrice(a as number, c)}</span>)}
                        </div>
                    ) : <span className="text-[--text-muted]">No balance</span>}
                    </td>
                    <td className="p-4">
                        <PayoutStatusBadge status={seller.financials.kycStatus} />
                    </td>
                    <td className="p-4">
                    <div className="flex flex-col gap-2 items-start">
                        {Object.entries(seller.financials.balance).map(([c, a]) => ((a as number) > 0) && (
                            <button 
                                key={c} 
                                onClick={() => handlePayout(seller.id, c)} 
                                disabled={!seller.payoutsEnabled}
                                title={getDisabledReason(seller.financials.kycStatus)}
                                className="text-sm px-3 py-1 bg-[--accent] text-[--accent-foreground] font-semibold rounded-full hover:bg-[--accent-hover] transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                Process {c} Payout
                            </button>
                        ))}
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </>
    );
  }

  const renderTransactions = () => (
    <div>
        <div className="flex flex-wrap gap-4 items-center mb-6 bg-[--bg-secondary] p-4 rounded-lg border border-[--border-color]">
            <select value={transactionFilters.sellerId} onChange={e => setTransactionFilters(f => ({...f, sellerId: e.target.value}))} className="w-full sm:w-auto bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3">
                <option value="all">All Sellers</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={transactionFilters.type} onChange={e => setTransactionFilters(f => ({...f, type: e.target.value}))} className="w-full sm:w-auto bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3">
                <option value="all">All Types</option>
                <option value="Sale">Sale</option>
                <option value="Payout">Payout</option>
                <option value="Refund">Refund</option>
                <option value="Fee">Fee</option>
                <option value="Adjustment">Adjustment</option>
            </select>
            <button onClick={exportToCSV} className="ml-auto px-4 py-2 bg-green-600 text-white font-semibold rounded-full text-sm">Export CSV</button>
        </div>

        <div className="md:hidden space-y-4">
          {paginatedTransactions.map(tx => (
              <div key={tx.id} className="bg-[--bg-secondary] rounded-lg shadow-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="font-semibold text-[--text-primary]">{sellers.find(s => s.id === tx.sellerId)?.name || 'N/A'}</p>
                          <p className="text-xs text-[--text-muted]">{new Date(tx.date).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeClass(tx.type)}`}>{tx.type}</span>
                  </div>
                  <p className="text-sm text-[--text-muted] italic border-t border-[--border-color] pt-2">{tx.description}</p>
                   <p className="text-xs text-gray-500">Processed by: {tx.processedBy}</p>
                  <div className="flex justify-between items-center border-t border-[--border-color] pt-2">
                    <p className={`font-mono font-bold text-lg ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.amount >= 0 ? '+' : ''}{formatPrice(tx.amount, tx.currency)}
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => setSelectedTransactionForDetail(tx)} className="text-xs text-blue-400 hover:underline">Details</button>
                        {!tx.description.startsWith('Reversal of') && (tx.type === 'Adjustment' || tx.type === 'Fee') && (
                            <button onClick={() => handleOpenReverseModal(tx)} className="text-xs text-red-400 hover:underline">Reverse</button>
                        )}
                    </div>
                  </div>
              </div>
          ))}
        </div>
        
        <div className="hidden md:block bg-[--bg-secondary] rounded-lg shadow-xl overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[--bg-tertiary]">
                <tr>
                  <th className="p-4 font-semibold text-[--text-secondary]">Date</th>
                  <th className="p-4 font-semibold text-[--text-secondary]">Seller</th>
                  <th className="p-4 font-semibold text-[--text-secondary]">Type</th>
                  <th className="p-4 font-semibold text-[--text-secondary]">Description</th>
                  <th className="p-4 font-semibold text-[--text-secondary]">Processed By</th>
                  <th className="p-4 font-semibold text-[--text-secondary]">Amount</th>
                  <th className="p-4 font-semibold text-[--text-secondary]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map(tx => (
                    <tr key={tx.id} className="border-b border-[--border-color] hover:bg-[--bg-tertiary]">
                      <td className="p-4 text-[--text-muted] whitespace-nowrap">{new Date(tx.date).toLocaleString()}</td>
                      <td className="p-4 font-semibold text-[--text-primary]">{sellers.find(s => s.id === tx.sellerId)?.name || 'N/A'}</td>
                      <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeClass(tx.type)}`}>{tx.type}</span></td>
                      <td className="p-4 text-[--text-muted] text-sm max-w-sm truncate">{tx.description}</td>
                      <td className="p-4 text-sm text-[--text-muted]">{tx.processedBy}</td>
                      <td className={`p-4 font-mono font-semibold whitespace-nowrap ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>{tx.amount >= 0 ? '+' : ''}{formatPrice(tx.amount, tx.currency)}</td>
                       <td className="p-4">
                         <div className="flex gap-2">
                            <button onClick={() => setSelectedTransactionForDetail(tx)} className="text-xs text-blue-400 hover:underline">Details</button>
                            {!tx.description.startsWith('Reversal of') && (tx.type === 'Adjustment' || tx.type === 'Fee' || tx.type === 'Refund') && (
                                <button onClick={() => handleOpenReverseModal(tx)} className="text-xs text-red-400 hover:underline">Reverse</button>
                            )}
                         </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
        </div>
         <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-[--text-muted]">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-[--bg-tertiary] rounded disabled:opacity-50">Prev</button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-[--bg-tertiary] rounded disabled:opacity-50">Next</button>
            </div>
        </div>
    </div>
  );

  const renderReports = () => (
      <div className="space-y-8">
        <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold font-cinzel text-[--text-primary] mb-4">Revenue Over Time</h3>
            <div className="h-64 flex items-end justify-center rounded-md bg-[--bg-tertiary] p-4">
                 <p className="text-[--text-muted]">[Chart Placeholder]</p>
            </div>
        </div>
        <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold font-cinzel text-[--text-primary] mb-4">Transaction Type Breakdown</h3>
            <div className="h-64 flex items-end justify-center rounded-md bg-[--bg-tertiary] p-4">
                 <p className="text-[--text-muted]">[Pie Chart Placeholder]</p>
            </div>
        </div>
    </div>
  );

  const renderTaxes = () => {
    const handleRateChange = (country: string, value: string) => {
        const rate = parseFloat(value);
        if (!isNaN(rate) && rate >= 0 && rate <= 1) {
            setLocalTaxRates(prev => ({...prev, [country]: rate}));
        }
    };
    
    const handleSaveChanges = () => {
        updateTaxRates(localTaxRates);
        alert('Tax rates updated successfully!');
    };

    const handleAddTaxRule = () => {
        const countryCode = newTaxRule.country.trim().toUpperCase();
        const rate = parseFloat(newTaxRule.rate);

        if (!countryCode || countryCode.length !== 2) {
            alert('Please enter a valid 2-letter country code.');
            return;
        }
        if (isNaN(rate) || rate < 0 || rate > 1) {
            alert('Please enter a valid tax rate between 0 and 1 (e.g., 0.20 for 20%).');
            return;
        }
        if (localTaxRates[countryCode] !== undefined) {
            alert('A tax rule for this country already exists.');
            return;
        }

        setLocalTaxRates(prev => ({ ...prev, [countryCode]: rate }));
        setNewTaxRule({ country: '', rate: '' });
    };

    const handleRemoveTaxRule = (countryCode: string) => {
        if (window.confirm(`Are you sure you want to remove the tax rule for ${countryCode}?`)) {
            setLocalTaxRates(prev => {
                const newRates = { ...prev };
                delete newRates[countryCode];
                return newRates;
            });
        }
    };

    // FIX: Ensure filteredOrders is an array before calling reduce
    const safeFilteredOrdersForTaxes = Array.isArray(filteredOrders) ? filteredOrders : [];
    const taxesCollectedByCountry = safeFilteredOrdersForTaxes.reduce((acc, order) => {
        if (!order?.shippingAddress?.country) return acc;
        const country = order.shippingAddress.country;
        acc[country] = (acc[country] || 0) + (order?.taxes || 0);
        return acc;
    }, {} as {[key: string]: number});
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold font-cinzel text-[--text-primary] mb-4">Taxes Collected</h3>
                <p className="text-sm text-[--text-muted] mb-2">Based on current date range filters.</p>
                <ul className="space-y-2">
                    {Object.entries(taxesCollectedByCountry).map(([country, total]) => (
                        <li key={country} className="flex justify-between items-center bg-[--bg-tertiary] p-2 rounded">
                            <span className="font-semibold">{country}</span>
                            <span className="font-mono text-green-500">{formatPrice(total, currency)}</span>
                        </li>
                    ))}
                     {Object.keys(taxesCollectedByCountry).length === 0 && <p className="text-sm text-[--text-muted]">No tax data for this period.</p>}
                </ul>
            </div>
             <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold font-cinzel text-[--text-primary] mb-4">Manage Tax Rates</h3>
                 <div className="space-y-3">
                    {Object.entries(localTaxRates).map(([country, rate]) => (
                         <div key={country} className="flex items-center gap-2">
                            <div className="w-16">
                                <label className="block text-sm font-medium text-[--text-muted]">{country}</label>
                            </div>
                            <input
                                type="number"
                                value={rate}
                                onChange={e => handleRateChange(country, e.target.value)}
                                min="0" max="1" step="0.01"
                                className="block w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3"
                            />
                            <button onClick={() => handleRemoveTaxRule(country)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-[--bg-tertiary]" aria-label={`Remove tax rule for ${country}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-[--border-color]">
                    <h4 className="font-semibold text-[--accent]">Add New Tax Rule</h4>
                    <div className="flex flex-col sm:flex-row items-end gap-2 mt-2">
                        <div className="flex-none w-full sm:w-24">
                            <label htmlFor="newCountryCode" className="block text-sm font-medium text-[--text-muted]">Country Code</label>
                            <input 
                                id="newCountryCode"
                                type="text"
                                value={newTaxRule.country}
                                onChange={e => setNewTaxRule(prev => ({ ...prev, country: e.target.value }))}
                                maxLength={2}
                                placeholder="e.g., DE"
                                className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3"
                            />
                        </div>
                        <div className="flex-grow w-full">
                             <label htmlFor="newRate" className="block text-sm font-medium text-[--text-muted]">Rate (0.0 to 1.0)</label>
                             <input 
                                id="newRate"
                                type="number"
                                value={newTaxRule.rate}
                                onChange={e => setNewTaxRule(prev => ({ ...prev, rate: e.target.value }))}
                                min="0" max="1" step="0.01"
                                placeholder="e.g., 0.19"
                                className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3"
                            />
                        </div>
                        <button onClick={handleAddTaxRule} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md h-11 hover:bg-indigo-700">Add</button>
                    </div>
                </div>

                <button onClick={handleSaveChanges} className="w-full mt-6 px-6 py-2 bg-[--accent] text-[--accent-foreground] font-bold rounded-full hover:bg-[--accent-hover]">Save All Changes</button>
            </div>
        </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-cinzel text-[--text-primary]">Financials</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <input type="date" name="start" value={dateRange.start} onChange={e => setDateRange(dr => ({...dr, start: e.target.value}))} className="w-full bg-[--bg-primary] border border-[--border-color] rounded-md p-2 text-sm"/>
            <span className="text-[--text-muted]">to</span>
            <input type="date" name="end" value={dateRange.end} onChange={e => setDateRange(dr => ({...dr, end: e.target.value}))} className="w-full bg-[--bg-primary] border border-[--border-color] rounded-md p-2 text-sm"/>
        </div>
      </div>
      
      <div className="mb-6 border-b border-[--border-color] overflow-x-auto">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {(['overview', 'sellers', 'transactions', 'reports', 'taxes'] as ActiveTab[]).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSelectedSeller(null); }} className={`${activeTab === tab && !selectedSeller ? 'border-[--accent] text-[--accent]' : 'border-transparent text-[--text-muted] hover:text-[--text-secondary]'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors`}>
              {tab}
            </button>
          ))}
           <button onClick={() => setIsModalOpen(true)} className="ml-auto text-sm font-semibold text-indigo-400 hover:text-indigo-300 whitespace-nowrap">
            + Manual Entry
          </button>
        </nav>
      </div>

      <div>{renderContent()}</div>

      {isModalOpen && <ManualTransactionForm sellers={sellers} onClose={closeModal} onSave={handleSaveTransaction} reversingTransaction={reversingTransaction} />}
      {selectedTransactionForDetail && (
        <TransactionDetailModal
            transaction={selectedTransactionForDetail}
            allTransactions={transactions}
            allOrders={orders}
            sellers={sellers}
            onClose={() => setSelectedTransactionForDetail(null)}
        />
      )}
    </div>
  );
};