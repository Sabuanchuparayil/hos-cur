import React from 'react';

interface FeaturedFandomsProps {
    onSelectFandom: (fandom: string) => void;
    featuredFandoms: string[];
}

const createFandomImage = (name: string, bgColor1: string, bgColor2: string) => {
    // Use placeholder.com for reliable image generation
    const fandomColors: { [key: string]: { bg: string; text: string } } = {
        'Harry Potter': { bg: '4a0202', text: 'ffffff' },
        'Lord of the Rings': { bg: '1a1a1a', text: 'd4af37' },
        'Star Wars': { bg: '000000', text: 'ffd700' },
        'Game of Thrones': { bg: '2c1810', text: 'c9a961' },
        'Marvel Cinematic Universe': { bg: '1a1a2e', text: 'e94560' },
        'Fantastic Beasts': { bg: '2d1b1b', text: 'd4a574' },
        'DC Universe': { bg: '0a0a0a', text: '0066cc' },
        'Doctor Who': { bg: '003d6b', text: 'ffffff' },
        'Studio Ghibli': { bg: '8b9dc3', text: 'ffffff' },
    };
    
    const colors = fandomColors[name] || { bg: '1a1a2e', text: 'e94560' };
    const encodedName = encodeURIComponent(name);
    return `https://via.placeholder.com/400x250/${colors.bg}/${colors.text}?text=${encodedName}`;
};

const fandomData: { [key: string]: { colors: [string, string] } } = {
    'Harry Potter': { colors: ['#4a0202', '#000000'] },
    'Lord of the Rings': { colors: ['#0a2a12', '#1a472a'] },
    'Star Wars': { colors: ['#030712', '#4B5563'] },
    'Game of Thrones': { colors: ['#1F2937', '#4B5563'] },
};
const defaultFandomData = { colors: ['#1F2937', '#4B5563'] as [string, string] };

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
                    const { colors } = fandomData[name] || defaultFandomData;
                    return (
                        <button 
                            key={name} 
                            onClick={() => handleFandomClick(name)}
                            className="rounded-lg overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[--accent]/20 transform hover:-translate-y-2 transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-[--bg-primary] focus:ring-[--accent]"
                        >
                            <div className="relative h-48 w-full bg-cover bg-center">
                                <img 
                                    src={createFandomImage(name, colors[0], colors[1])} 
                                    alt={name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback to solid color if image fails
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.style.backgroundColor = colors[0];
                                    }}
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