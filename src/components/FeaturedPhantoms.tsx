import React from 'react';
import { getCategoryImageUrl } from '../utils/imageUtils';

interface FeaturedFandomsProps {
    onSelectFandom: (fandom: string) => void;
    featuredFandoms: string[];
}


export const FeaturedFandoms: React.FC<FeaturedFandomsProps> = ({ onSelectFandom, featuredFandoms }) => {
    
    const handleFandomClick = (fandom: string) => {
        onSelectFandom(fandom);
        const productSection = document.getElementById('product-section');
        if (productSection) {
            productSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <section>
            <h2 className="text-4xl font-bold font-cinzel text-center text-[--accent] mb-8 tracking-wide uppercase">THE GRAND HALL OF FANDOMS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredFandoms.map(name => {
                    const categoryImageUrl = getCategoryImageUrl(name);
                    return (
                        <button 
                            key={name} 
                            onClick={() => handleFandomClick(name)}
                            className="rounded-lg overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[--accent]/20 transform hover:-translate-y-2 transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-[--bg-primary] focus:ring-[--accent]"
                        >
                            <div className="relative h-48 w-full">
                                <img 
                                    src={categoryImageUrl} 
                                    alt={name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                                    <h3 className="text-2xl text-white font-cinzel font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                        Explore
                                    </h3>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};