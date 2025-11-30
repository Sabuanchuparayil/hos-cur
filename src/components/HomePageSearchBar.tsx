import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const HomePageSearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div className="mb-12">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto" role="search">
                <label htmlFor="homepage-search" className="sr-only">Search for products</label>
                <div className="relative">
                    <input
                        id="homepage-search"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for wands, robes, and magical artifacts..."
                        className="w-full bg-[--bg-secondary] border-2 border-[--border-color] rounded-full py-4 pl-6 pr-16 text-lg text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[--accent] focus:border-transparent"
                    />
                    <button type="submit" className="absolute inset-y-0 right-0 flex items-center justify-center px-5 text-[--accent] hover:text-[--accent-hover] rounded-full" aria-label="Submit search">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ color: 'var(--accent, #6633ff)' }}>
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};
