import React, { useState, useEffect } from 'react';
import { ProductMedia, ProductWithTotalStock } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductMediaGalleryProps {
    product: ProductWithTotalStock;
}

export const ProductMediaGallery: React.FC<ProductMediaGalleryProps> = ({ product }) => {
    const { t } = useLanguage();
    const [selectedMedia, setSelectedMedia] = useState<ProductMedia | null>(null);

    useEffect(() => {
        if (product && product.media.length > 0) {
            setSelectedMedia(product.media[0]);
        }
    }, [product]);

    const renderMainMedia = () => {
        if (!selectedMedia) {
            return <div className="w-full h-full bg-[--bg-tertiary] aspect-square"></div>;
        }
        switch (selectedMedia.type) {
            case 'image':
                return (
                  <img 
                    src={selectedMedia.url} 
                    alt={t(product.name)} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.src = `https://via.placeholder.com/800x800/1a1a2e/e94560?text=${encodeURIComponent(t(product.name).substring(0, 30))}`;
                    }}
                  />
                );
            case 'video':
                return <video src={selectedMedia.url} className="w-full h-full object-cover" controls autoPlay muted loop />;
            case 'image_360':
                return (
                    <div className="relative w-full h-full bg-black">
                        <img src={selectedMedia.url} alt={`360 view of ${t(product.name)}`} className="w-full h-full object-contain opacity-80" />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3.5 18v-6a8.5 8.5 0 115.02-7.912M1.5 12H3.5m19 0h-2m-17 6h2m17 0h-2M12 1.5v2m0 17v2M6.08 6.08l1.41-1.41m9.84 9.84l1.41-1.41M6.08 17.92l1.41 1.41m9.84-9.84l1.41 1.41" /></svg>
                            <p className="font-bold">360° VIEW</p>
                            <p className="text-sm">Interactive view placeholder</p>
                        </div>
                    </div>
                );
            default:
                return <img src={selectedMedia.url} alt={t(product.name)} className="w-full h-full object-cover" />;
        }
    };

    return (
        <div>
            <div className="aspect-square bg-[--bg-primary]">
                {renderMainMedia()}
            </div>
             <div className="flex gap-2 p-2 bg-[--bg-tertiary] overflow-x-auto no-scrollbar">
                {product.media.map((media, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedMedia(media)}
                        className={`w-20 h-20 shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--bg-tertiary] focus:ring-[--accent] ${selectedMedia?.url === media.url ? 'border-[--accent] scale-105' : 'border-transparent hover:border-gray-500'}`}
                    >
                        <div className="relative w-full h-full bg-[--bg-primary]">
                            <img src={media.thumbnailUrl || media.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                            {media.type === 'video' && 
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white/80" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                            }
                            {media.type === 'image_360' && 
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.5 18v-6a8.5 8.5 0 115.02-7.912M1.5 12H3.5m19 0h-2m-17 6h2m17 0h-2M12 1.5v2m0 17v2M6.08 6.08l1.41-1.41m9.84 9.84l1.41-1.41M6.08 17.92l1.41 1.41m9.84-9.84l1.41 1.41" /></svg>
                                </div>
                            }
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}