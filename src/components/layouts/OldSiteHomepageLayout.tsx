import React, { useMemo } from 'react';
import { Hero } from '../Hero';
import { ProductCard } from '../ProductCard';
import { ProductCardSkeleton } from '../skeletons/ProductCardSkeleton';
import { ProductWithTotalStock, HomePageContent, Order } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { HomePageSearchBar } from '../HomePageSearchBar';
import { FeaturedFandoms } from '../FeaturedPhantoms';

interface LayoutProps {
    products: ProductWithTotalStock[];
    isLoading: boolean;
    filterControls: React.ReactNode;
    paginationControls: React.ReactNode;
    homePageContent: HomePageContent | null;
    allOrders: Order[];
    allProducts: ProductWithTotalStock[];
}

export const OldSiteHomepageLayout: React.FC<LayoutProps> = ({ 
    products, 
    isLoading, 
    filterControls, 
    paginationControls, 
    homePageContent,
    allProducts 
}) => {
    const { activeThemeConfig } = useTheme();

    // Use CMS hero if available, otherwise fall back to the active theme's hero.
    const heroContent = homePageContent?.hero?.image && homePageContent?.hero.title.en
        ? homePageContent.hero 
        : activeThemeConfig.hero;

    // Featured fandoms from homepage content or default
    const featuredFandoms = homePageContent?.featuredPhantoms || ['Harry Potter', 'Lord of the Rings', 'Star Wars', 'Game of Thrones'];

    // Get newest products (sorted by ID descending, take 4)
    const newestProducts = useMemo(() => {
        const sorted = [...allProducts].sort((a, b) => b.id - a.id);
        return sorted.slice(0, 4);
    }, [allProducts]);

    // Get most coveted (highest rated, take 4)
    const mostCovetedProducts = useMemo(() => {
        const sorted = [...allProducts].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        return sorted.slice(0, 4);
    }, [allProducts]);

    // Get all products for "All Magical Wares" section
    const allMagicalWares = useMemo(() => {
        return allProducts.slice(0, 4);
    }, [allProducts]);

    const handleFandomSelect = (fandom: string) => {
        // This will be handled by the parent component
        console.log('Fandom selected:', fandom);
    };

    return (
        <>
            <Hero {...heroContent} />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Grand Hall of Fandoms Section */}
                <section className="mb-16">
                    <FeaturedFandoms 
                        onSelectFandom={handleFandomSelect}
                        featuredFandoms={featuredFandoms}
                    />
                </section>

                {/* Newest Enchantments Section */}
                <section className="mb-16" id="product-section">
                    <h2 className="text-4xl font-bold font-cinzel text-center text-[--accent] mb-8 tracking-wide">
                        NEWEST ENCHANTMENTS
                    </h2>
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {Array.from({ length: 4 }).map((_, index) => <ProductCardSkeleton key={index} />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {newestProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Most Coveted Treasures Section */}
                <section className="mb-16">
                    <h2 className="text-4xl font-bold font-cinzel text-center text-[--accent] mb-8 tracking-wide">
                        MOST COVETED TREASURES
                    </h2>
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {Array.from({ length: 4 }).map((_, index) => <ProductCardSkeleton key={index} />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {mostCovetedProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </section>

                {/* All Magical Wares Section */}
                <section className="mb-16">
                    <h2 className="text-4xl font-bold font-cinzel text-center text-[--accent] mb-8 tracking-wide">
                        ALL MAGICAL WARES
                    </h2>
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {Array.from({ length: 4 }).map((_, index) => <ProductCardSkeleton key={index} />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {allMagicalWares.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Search Bar */}
                <section className="mb-16">
                    <HomePageSearchBar />
                </section>

                {/* Filter Controls */}
                {filterControls}

                {/* All Products Grid */}
                <section className="mb-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {isLoading
                            ? Array.from({ length: 12 }).map((_, index) => <ProductCardSkeleton key={index} />)
                            : products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        }
                    </div>
                    {!isLoading && products.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <h3 className="text-2xl font-cinzel text-[--text-primary]">No Magical Items Found</h3>
                            <p className="text-[--text-muted] mt-2">Try adjusting your filters to find what you're looking for.</p>
                        </div>
                    )}
                </section>

                {/* Pagination */}
                {paginationControls}
            </main>
        </>
    );
};

