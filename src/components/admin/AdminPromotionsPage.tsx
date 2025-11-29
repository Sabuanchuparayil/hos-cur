import React, { useState } from 'react';
import { Promotion } from '../../types';
import { usePromotions } from '../../contexts/PromotionsContext';
import { PromotionForm } from './PromotionForm';
import { useCurrency } from '../../contexts/CurrencyContext';

export const AdminPromotionsPage: React.FC = () => {
    const { promotions, addPromotion, updatePromotion } = usePromotions();
    const { currency, formatPrice } = useCurrency();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | undefined>(undefined);
    
    // FIX: Ensure promotions is always an array
    const safePromotions = Array.isArray(promotions) ? promotions : [];

    const handleOpenModalForAdd = () => {
        setEditingPromotion(undefined);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (promotion: Promotion) => {
        setEditingPromotion(promotion);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPromotion(undefined);
    };

    const getPromotionValue = (p: Promotion) => {
        if (p.type === 'PERCENTAGE' || p.type === 'PRODUCT_SPECIFIC_PERCENTAGE') {
            return `${p.value || 0}%`;
        }
        if (p.type === 'FREE_SHIPPING') return 'Free Shipping';
        // FIX: Check if value is null/undefined before calling formatPrice
        if (p.value == null) return formatPrice(0, currency);
        return formatPrice(p.value, currency); // Assuming fixed amount is in base currency for now
    };

    const getTargetingInfo = (p: Promotion) => {
        if (p.applicableCategory) return `Category: ${p.applicableCategory}`;
        if (p.applicableProductIds && p.applicableProductIds.length > 0) return `Product IDs: ${p.applicableProductIds.join(', ')}`;
        return 'All Products';
    }

    const noPromotionsMessage = (
        <div className="text-center p-8 text-[--text-muted] bg-[--bg-secondary] rounded-lg">
            No promotions have been created yet.
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-cinzel text-[--text-primary]">Manage Promotions</h1>
                <button
                    onClick={handleOpenModalForAdd}
                    className="px-6 py-2 bg-[--accent] text-[--accent-foreground] font-bold rounded-full hover:bg-[--accent-hover] transition duration-300 transform hover:scale-105"
                >
                    Add New Promotion
                </button>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
                {safePromotions.length > 0 ? safePromotions.map(p => (
                    <div key={p.id} className="bg-[--bg-secondary] rounded-lg shadow-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <p className="font-mono font-bold text-[--accent] text-lg">{p.code}</p>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {p.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <p className="text-sm text-[--text-muted] border-b border-t border-[--border-color] py-2">{p.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <p className="text-[--text-muted]">Value</p>
                                <p className="font-semibold text-[--text-primary]">{getPromotionValue(p)}</p>
                            </div>
                            <div>
                                <p className="text-[--text-muted]">Usage</p>
                                <p className="font-semibold text-[--text-primary]">{p.usageCount} / {p.maxUsage || '∞'}</p>
                            </div>
                            <div>
                                <p className="text-[--text-muted]">Dates</p>
                                <p className="font-semibold text-[--text-primary] text-ellipsis overflow-hidden whitespace-nowrap">{p.startDate || p.endDate ? `${p.startDate || '...'} to ${p.endDate || '...'}` : 'Always'}</p>
                            </div>
                             <div>
                                <p className="text-[--text-muted]">Targeting</p>
                                <p className="font-semibold text-[--text-primary] truncate">{getTargetingInfo(p)}</p>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button onClick={() => handleOpenModalForEdit(p)} className="text-[--accent] hover:text-[--accent-hover] font-semibold">Edit</button>
                        </div>
                    </div>
                )) : noPromotionsMessage}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-[--bg-secondary] rounded-lg shadow-xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[--bg-tertiary]">
                        <tr>
                            <th className="p-4 font-semibold text-[--text-secondary]">Code</th>
                            <th className="p-4 font-semibold text-[--text-secondary]">Description</th>
                            <th className="p-4 font-semibold text-[--text-secondary]">Value</th>
                            <th className="p-4 font-semibold text-[--text-secondary]">Status</th>
                            <th className="p-4 font-semibold text-[--text-secondary]">Dates</th>
                            <th className="p-4 font-semibold text-[--text-secondary]">Usage</th>
                            <th className="p-4 font-semibold text-[--text-secondary]">Targeting</th>
                            <th className="p-4 font-semibold text-[--text-secondary]">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safePromotions.length > 0 ? safePromotions.map(p => (
                            <tr key={p.id} className="border-b border-[--border-color] hover:bg-[--bg-tertiary]">
                                <td className="p-4 font-mono font-bold text-[--accent]">{p.code}</td>
                                <td className="p-4 text-[--text-muted] max-w-xs truncate">{p.description}</td>
                                <td className="p-4 font-semibold text-[--text-primary]">{getPromotionValue(p)}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {p.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-[--text-muted]">
                                    {p.startDate || p.endDate ? `${p.startDate || '...'} to ${p.endDate || '...'}` : 'Always'}
                                </td>
                                <td className="p-4 text-sm text-[--text-muted]">
                                    {p.usageCount} / {p.maxUsage || '∞'}
                                </td>
                                 <td className="p-4 text-sm text-[--text-muted]">{getTargetingInfo(p)}</td>
                                <td className="p-4">
                                    <button onClick={() => handleOpenModalForEdit(p)} className="text-[--accent] hover:text-[--accent-hover] font-semibold">Edit</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={8} className="text-center p-8 text-[--text-muted]">No promotions have been created yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <PromotionForm
                    promotion={editingPromotion}
                    onClose={handleCloseModal}
                    onAddPromotion={addPromotion}
                    onUpdatePromotion={updatePromotion}
                />
            )}
        </div>
    );
};