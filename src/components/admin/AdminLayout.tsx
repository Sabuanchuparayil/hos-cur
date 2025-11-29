import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Role, User, Permission } from '../../types';
import { AdminGeminiChat } from './AdminGeminiChat';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  roles: Role[];
  user: User | null;
}

const NavGroup: React.FC<{
    title: string;
    icon: React.ReactNode;
    paths: string[];
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ title, icon, paths, isOpen, onToggle, children }) => {
    const location = useLocation();
    const isActive = paths.some(path => location.pathname.startsWith(path));

    useEffect(() => {
        if (isActive && !isOpen) {
            onToggle();
        }
    }, [isActive, isOpen, onToggle]);
    
    return (
        <div className="relative">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }} 
                className={`flex items-center justify-between w-full px-4 py-2 rounded-md transition-colors ${isActive ? 'text-[--accent]' : 'text-[--text-secondary] hover:bg-[--bg-tertiary] hover:text-[--text-primary]'}`}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="font-semibold">{title}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
            </button>
            <div 
                className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pl-6 pt-2 space-y-1">
                    {children}
                </div>
            </div>
        </div>
    )
}


export const AdminLayout: React.FC<AdminLayoutProps> = ({ roles, user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const panelTitle = user?.role === 'admin' ? 'Admin Panel' : 'Seller Panel';

  // Safety checks for roles and user
  const safeRoles = Array.isArray(roles) ? roles : [];
  // User.role is the role name (e.g., 'admin'), not the role ID
  const userRole = safeRoles.find(r => r.name === user?.role);
  // For admin users, grant all permissions if role lookup fails (fallback)
  const defaultPermissions = user?.role === 'admin' ? ['*'] : [];
  const permissions = new Set(userRole?.permissions || defaultPermissions);
  
  // Helper to check permissions (handles '*' wildcard)
  const hasPermission = (permission: string): boolean => {
    return permissions.has('*') || permissions.has(permission);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Auto-open section based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin/products') || path.startsWith('/admin/bulk-upload') || path.startsWith('/admin/promotions')) {
      setOpenSection('storefront');
    } else if (path.startsWith('/admin/orders') || path.startsWith('/admin/picking-dashboard') || path.startsWith('/admin/logistics') || path.startsWith('/admin/returns') || path.startsWith('/admin/delivery-dashboard')) {
      setOpenSection('operations');
    } else if (path.startsWith('/admin/sellers') || path.startsWith('/admin/financials') || path.startsWith('/admin/banking')) {
      setOpenSection('accounts');
    } else if (path.startsWith('/admin/users') || path.startsWith('/admin/roles') || path.startsWith('/admin/content') || path.startsWith('/admin/theme') || path.startsWith('/admin/platform-themes') || path.startsWith('/admin/integrations')) {
      setOpenSection('platform');
    } else if (path.startsWith('/admin/dashboard')) {
        setOpenSection(null); // No section for dashboard
    }
  }, [location.pathname]);

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2 rounded-md transition-colors text-sm ${
      isActive
        ? 'bg-[--accent]/20 text-[--accent] font-bold'
        : 'text-[--text-secondary] hover:bg-[--bg-tertiary] hover:text-[--text-primary]'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[--bg-secondary] text-[--text-primary] p-4">
        <div className="mb-8 px-2">
            <Link to="/" className="text-2xl font-bold font-cinzel text-[--accent]">
                House of Spells
            </Link>
            <span className="block text-sm text-[--text-muted]">{panelTitle}</span>
             <Link to="/" className="mt-2 text-sm text-[--accent] hover:underline flex items-center gap-1">
                View Storefront
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </Link>
        </div>
        <nav className="flex-grow space-y-2">
            <NavLink to="/admin/dashboard" className={navLinkClasses} onClick={closeSidebar}>
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    <span className="font-semibold">Dashboard</span>
                </div>
            </NavLink>
            
            {/* Storefront Group */}
            <NavGroup 
                title="Storefront"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>}
                paths={['/admin/products', '/admin/bulk-upload', '/admin/promotions']}
                isOpen={openSection === 'storefront'}
                onToggle={() => toggleSection('storefront')}
            >
                {hasPermission('read:products') && <NavLink to="/admin/products" className={navLinkClasses} onClick={closeSidebar}>Products</NavLink>}
                {hasPermission('write:products') && <NavLink to="/admin/bulk-upload" className={navLinkClasses} onClick={closeSidebar}>Bulk Uploads</NavLink>}
                {hasPermission('read:promotions') && <NavLink to="/admin/promotions" className={navLinkClasses} onClick={closeSidebar}>Promotions</NavLink>}
            </NavGroup>

            {/* Operations Group */}
             <NavGroup 
                title="Operations"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v5a1 1 0 001 1h2.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V8a1 1 0 00-1-1h-5z" /></svg>}
                paths={['/admin/orders', '/admin/picking-dashboard', '/admin/delivery-dashboard', '/admin/logistics', '/admin/returns']}
                isOpen={openSection === 'operations'}
                onToggle={() => toggleSection('operations')}
            >
                 {hasPermission('read:orders') && <NavLink to="/admin/orders" className={navLinkClasses} onClick={closeSidebar}>Orders</NavLink>}
                 {hasPermission('access:picking_dashboard') && <NavLink to="/admin/picking-dashboard" className={navLinkClasses} onClick={closeSidebar}>Picking Dashboard</NavLink>}
                 {hasPermission('access:delivery_dashboard') && <NavLink to="/admin/delivery-dashboard" className={navLinkClasses} onClick={closeSidebar}>Delivery Dashboard</NavLink>}
                 {hasPermission('manage:logistics') && <NavLink to="/admin/logistics" className={navLinkClasses} onClick={closeSidebar}>Logistics</NavLink>}
                 <NavLink to="/admin/returns" className={navLinkClasses} onClick={closeSidebar}>Returns</NavLink>
            </NavGroup>

            {/* Accounts Group */}
             <NavGroup 
                title="Accounts"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>}
                paths={['/admin/sellers', '/admin/financials', '/admin/banking']}
                isOpen={openSection === 'accounts'}
                onToggle={() => toggleSection('accounts')}
            >
                {hasPermission('read:sellers') && <NavLink to="/admin/sellers" className={navLinkClasses} onClick={closeSidebar}>Sellers</NavLink>}
                {hasPermission('read:financials') && <NavLink to="/admin/financials" className={navLinkClasses} onClick={closeSidebar}>Financials</NavLink>}
                {user?.role === 'seller' && <NavLink to="/admin/banking" className={navLinkClasses} onClick={closeSidebar}>Banking & Payouts</NavLink>}
            </NavGroup>
            
            {/* Platform Group (Admin only) */}
            {(hasPermission('manage:roles') || hasPermission('manage:content') || hasPermission('manage:themes') || hasPermission('manage:integrations')) && (
                 <NavGroup 
                    title="Platform"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734 2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>}
                    paths={['/admin/users', '/admin/roles', '/admin/content', '/admin/platform-themes', '/admin/integrations']}
                    isOpen={openSection === 'platform'}
                    onToggle={() => toggleSection('platform')}
                >
                    {hasPermission('read:users') && <NavLink to="/admin/users" className={navLinkClasses} onClick={closeSidebar}>Users</NavLink>}
                    {hasPermission('manage:roles') && <NavLink to="/admin/roles" className={navLinkClasses} onClick={closeSidebar}>Roles</NavLink>}
                    {hasPermission('manage:content') && <NavLink to="/admin/content/home" className={navLinkClasses} onClick={closeSidebar}>Homepage Content</NavLink>}
                    {hasPermission('manage:themes') && <NavLink to="/admin/platform-themes" className={navLinkClasses} onClick={closeSidebar}>Platform Themes</NavLink>}
                    {hasPermission('manage:integrations') && <NavLink to="/admin/integrations" className={navLinkClasses} onClick={closeSidebar}>Integrations</NavLink>}
                </NavGroup>
            )}

            {/* Seller-specific Theme link */}
            {user?.role === 'seller' && (
                 <NavLink to="/admin/theme" className={navLinkClasses} onClick={closeSidebar}>
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                        <span className="font-semibold">Store Theme</span>
                    </div>
                </NavLink>
            )}
        </nav>
        <div className="mt-auto pt-4 border-t border-[--border-color]">
            {user && (
                <div className="text-sm px-2 mb-4">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-[--text-muted]">{user.email}</p>
                </div>
            )}
            <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-red-400 hover:bg-red-500/20 hover:text-red-300 font-semibold transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
            </button>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[--bg-primary]">
      {/* Static sidebar for desktop */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
                {sidebarContent}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header for mobile */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-[--bg-secondary] shadow md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="px-4 border-r border-[--border-color] text-[--text-muted] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[--accent]"
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
                <Link to="/" className="text-lg font-bold font-cinzel text-[--accent]">
                    HOS Panel
                </Link>
            </div>
          </div>
        </div>
        
        {/* Mobile sidebar */}
        {isSidebarOpen && (
            <div className="fixed inset-0 flex z-40 md:hidden" role="dialog" aria-modal="true">
                <div className="fixed inset-0 bg-black bg-opacity-75" onClick={closeSidebar} aria-hidden="true"></div>
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[--bg-secondary]">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button type="button" onClick={closeSidebar} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                            <span className="sr-only">Close sidebar</span>
                            <svg className="h-6 w-6 text-white" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    {sidebarContent}
                </div>
                <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
            </div>
        )}

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <AdminGeminiChat />
    </div>
  );
};