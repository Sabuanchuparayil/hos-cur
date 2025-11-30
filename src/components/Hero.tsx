import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ThemeHero } from '../types';

export const Hero: React.FC<ThemeHero> = ({ image, title, subtitle }) => {
    const { t } = useLanguage();

    const handleExploreClick = () => {
        const productSection = document.getElementById('product-section');
        if (productSection) {
            productSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    return (
        <div 
            className="relative h-[60vh] flex items-center justify-center text-center"
            style={{ backgroundColor: '#2d2d2d' }}
        >
            <div className="relative z-10 px-4">
                <h1 className="text-5xl md:text-7xl font-normal text-white">
                    {t(title) || 'House of Spells'}
                </h1>
                <button 
                    onClick={handleExploreClick}
                    className="mt-8 px-8 py-3 bg-[--accent] text-[--accent-foreground] font-bold text-lg rounded-full hover:bg-[--accent-hover] transition duration-300 transform hover:scale-105 shadow-lg shadow-[--accent]/20">
                    Explore Collections
                </button>
            </div>
        </div>
    );
};
