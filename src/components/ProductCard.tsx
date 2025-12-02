import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProductWithTotalStock } from '../types';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { WishlistButton } from './WishlistButton';
import { StarRating } from './StarRating';
import { useTheme } from '../contexts/ThemeContext';

interface ProductCardProps {
  product: ProductWithTotalStock;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { getDisplayPrice } = useCurrency();
  const { t } = useLanguage();
  const { isB2BMode } = useTheme();
  const [isAdded, setIsAdded] = useState(false);
  // Get primary image, with fallback generation if missing
  const getPrimaryImage = () => {
    if (product.media && product.media.length > 0 && product.media[0].url) {
      return product.media[0].url;
    }
    // Generate fallback placeholder if no image exists
    const nameEn = typeof product.name === 'object' ? product.name.en : product.name || 'Product';
    const fandom = product.taxonomy?.fandom || 'Other';
    const fandomColors: { [key: string]: { bg: string; text: string } } = {
      'Harry Potter': { bg: '4a0202', text: 'ffffff' },
      'Lord of the Rings': { bg: '1a1a1a', text: 'd4af37' },
      'Game of Thrones': { bg: '2c1810', text: 'c9a961' },
      'Star Wars': { bg: '000000', text: 'ffd700' },
      'Marvel Cinematic Universe': { bg: '1a1a2e', text: 'e94560' },
      'Fantastic Beasts': { bg: '2d1b1b', text: 'd4a574' },
      'DC Universe': { bg: '0a0a0a', text: '0066cc' },
      'Doctor Who': { bg: '003d6b', text: 'ffffff' },
      'Studio Ghibli': { bg: '8b9dc3', text: 'ffffff' },
    };
    const colors = fandomColors[fandom] || { bg: '1a1a2e', text: 'e94560' };
    const label = nameEn.length > 30 ? nameEn.substring(0, 30) + '...' : nameEn;
    return `https://via.placeholder.com/800x800/${colors.bg}/${colors.text}?text=${encodeURIComponent(label)}`;
  };
  const primaryImage = getPrimaryImage();

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => {
        setIsAdded(false);
    }, 2000);
  };

  const priceToDisplay = isB2BMode && product.tradePrice ? product.tradePrice : product.pricing;
  
  const ActionButton = () => {
    if (product.hasVariations) {
        return (
            <Link to={`/product/${product.id}`}
                onClick={e => e.stopPropagation()}
                className={`w-28 text-center px-4 py-2 text-sm font-bold rounded-full transform transition-all duration-300 flex items-center justify-center gap-1
                bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] hover:scale-105 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--bg-secondary] focus:ring-[--accent]`}
            >
               Select Options
            </Link>
        )
    }

    return (
         <button 
            onClick={handleAddToCart}
            disabled={isAdded || product.stock === 0}
            aria-label={`Add ${t(product.name)} to cart`}
            className={`w-32 px-4 py-2 text-sm font-bold rounded-full transform transition-all duration-300 flex items-center justify-center gap-1
                ${isAdded 
                    ? '!bg-emerald-600 !text-white opacity-100 cursor-not-allowed' 
                    : 'bg-[--accent] text-[--accent-foreground] hover:bg-[--accent-hover] hover:scale-105 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--bg-secondary] focus:ring-[--accent]'
                }
                ${product.stock === 0 ? '!bg-gray-500 !opacity-100 cursor-not-allowed' : ''}`}
            >
            {isAdded ? (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Added</span>
                </>
            ) : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
    );
  }


  return (
    <Link to={`/product/${product.id}`} className="bg-[--bg-secondary] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col h-full border border-gray-200 hover:border-[--accent]/30">
      <div className="relative overflow-hidden h-56 bg-[--bg-tertiary]">
        {primaryImage ? (
          <img 
            src={primaryImage} 
            alt={t(product.name)} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-all duration-500"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = `https://via.placeholder.com/400x400/1a1a2e/e94560?text=${encodeURIComponent(t(product.name).substring(0, 20))}`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[--bg-tertiary]">
            <span className="text-[--text-muted] text-sm">No Image</span>
          </div>
        )}
        <div className="absolute top-2 right-2 z-10">
            <WishlistButton productId={product.id} />
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold uppercase tracking-wide text-[--accent] truncate mb-2">{t(product.name)}</h3>
        {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-2">
                <StarRating rating={product.averageRating} />
                <span className="text-xs text-[--text-muted]">({product.reviewCount})</span>
            </div>
        )}
        <p className="text-[--text-muted] text-sm mb-4 flex-grow line-clamp-2">{t(product.description)}</p>
        <div className="mt-auto flex items-center justify-between">
          <p className="text-xl font-bold text-[--text-primary]">{getDisplayPrice(priceToDisplay)}</p>
          <ActionButton />
        </div>
      </div>
    </Link>
  );
};