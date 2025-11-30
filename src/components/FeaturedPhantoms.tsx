import React from 'react';

interface FeaturedFandomsProps {
    onSelectFandom: (fandom: string) => void;
    featuredFandoms: string[];
}

const createFandomImage = (name: string, bgColor1: string, bgColor2: string) => {
    const svg = `
    <svg width="400" height="250" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g-${name.replace(/\s+/g, '')}" x1="0" x2="0" y1="0" y2="1">
          <stop stop-color="${bgColor1}" offset="0%"/>
          <stop stop-color="${bgColor2}" offset="100%"/>
        </linearGradient>
      </defs>
      <rect fill="url(#g-${name.replace(/\s+/g, '')})" width="400" height="250"/>
      <text fill="#FFFFFF" font-family="Cinzel, serif" font-size="28" dy="10.5" font-weight="bold" x="50%" y="50%" text-anchor="middle">${name}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
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
                            <div className="relative h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url('${createFandomImage(name, colors[0], colors[1])}')` }}>
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