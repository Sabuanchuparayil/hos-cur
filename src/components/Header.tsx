import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useWishlist } from '../contexts/WishlistContext';

export const Header: React.FC = () => {
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const { currency, setCurrency, currencies } = useCurrency();
  const { language, setLanguage, languages, t } = useLanguage();
  const navigate = useNavigate();

  // Menu states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeSwitcherOpen, setIsThemeSwitcherOpen] = useState(false);
  

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `text-[--text-secondary] hover:text-[--accent] transition-colors px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'text-[--accent]' : ''
    }`;

  const mobileNavLinkClasses = ({isActive}: {isActive: boolean}) => 
    `block px-3 py-2 rounded-md text-base font-medium ${
      isActive ? 'bg-[--bg-tertiary] text-[--accent]' : 'text-[--text-secondary] hover:bg-[--bg-tertiary] hover:text-[--text-primary]'
    }`;
    
  const actionIcons = (
     <div className="flex items-center space-x-4">
      {user?.role === 'customer' && (
        <Link to="/wishlist" className="relative text-[--text-secondary] hover:text-[--accent] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {wishlist.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {wishlist.length}
            </span>
          )}
        </Link>
      )}
      <Link to="/cart" className="relative text-[--text-secondary] hover:text-[--accent] transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Link>
    </div>
  );

  return (
    <header className="bg-[--bg-primary] sticky top-0 z-50 shadow-lg shadow-[--accent]/10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold font-cinzel text-[--accent]">
              House of Spells
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 ml-auto">
             <div className="relative">
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent text-sm text-[--text-muted] hover:text-[--accent] focus:outline-none"
                  aria-label="Select language"
                >
                  {Object.entries(languages).map(([key, name]) => <option key={key} value={key} className="bg-[--bg-secondary] text-[--text-primary]">{name}</option>)}
                </select>
              </div>
             <div className="relative">
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent text-sm text-[--text-muted] hover:text-[--accent] focus:outline-none"
                  aria-label="Select currency"
                >
                  {Object.keys(currencies).map(c => <option key={c} value={c} className="bg-[--bg-secondary] text-[--text-primary]">{c}</option>)}
                </select>
              </div>
            {user ? (
              <>
                <div className="relative">
                  <button 
                      onClick={() => setIsThemeSwitcherOpen(!isThemeSwitcherOpen)}
                      className="text-[--text-secondary] hover:text-[--accent] transition-colors"
                      aria-label="Open theme switcher"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                  </button>
                  {isThemeSwitcherOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-[--bg-secondary] rounded-md shadow-lg p-4 z-50 border border-[--border-color]">
                      <ThemeSwitcher />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center text-[--text-secondary] hover:text-[--accent]">
                    <span className="mr-2">{user.name}</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[--bg-secondary] rounded-md shadow-lg py-1 z-50 border border-[--border-color]">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-[--text-secondary] hover:bg-[--bg-primary]" onClick={() => setIsProfileOpen(false)}>My Profile</Link>
                      <Link to="/orders" className="block px-4 py-2 text-sm text-[--text-secondary] hover:bg-[--bg-primary]" onClick={() => setIsProfileOpen(false)}>My Orders</Link>
                      {user && user.role !== 'customer' && (
                          <Link to="/admin" className="block px-4 py-2 text-sm text-[--text-secondary] hover:bg-[--bg-primary]" onClick={() => setIsProfileOpen(false)}>
                              Admin Dashboard
                          </Link>
                      )}
                      <div className="border-t border-[--border-color]/50 my-1"></div>
                      <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white">Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <NavLink to="/login" className={navLinkClasses}>Login</NavLink>
                <NavLink to="/register" className="px-4 py-2 bg-[--accent] text-[--bg-primary] text-sm font-bold rounded-full hover:bg-[--accent-hover] transition-all duration-300">Register</NavLink>
              </div>
            )}
            <div className="ml-4">{actionIcons}</div>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            {actionIcons}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-[--text-muted] hover:text-[--text-primary] bg-[--bg-secondary] hover:bg-[--bg-tertiary] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[--accent]"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
          </div>
        </div>
      </nav>

      <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-screen border-t border-[--border-color]' : 'max-h-0'}`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             {user ? (
               <>
                 <NavLink to="/profile" className={mobileNavLinkClasses} onClick={() => setIsMenuOpen(false)}>Profile</NavLink>
                 <NavLink to="/orders" className={mobileNavLinkClasses} onClick={() => setIsMenuOpen(false)}>My Orders</NavLink>
                 {user.role === 'customer' && (
                    <NavLink to="/wishlist" className={mobileNavLinkClasses} onClick={() => setIsMenuOpen(false)}>My Wishlist ({wishlist.length})</NavLink>
                 )}
                  <NavLink to="/cart" className={mobileNavLinkClasses} onClick={() => setIsMenuOpen(false)}>My Cart ({itemCount})</NavLink>
                 <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-[--bg-tertiary] hover:text-red-300">Logout</button>
               </>
            ) : (
              <>
                <NavLink to="/login" className={mobileNavLinkClasses} onClick={() => setIsMenuOpen(false)}>Login</NavLink>
                <NavLink to="/register" className={mobileNavLinkClasses} onClick={() => setIsMenuOpen(false)}>Register</NavLink>
              </>
            )}
          </div>
      </div>
    </header>
  );
};