import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { HashRouter as Router, Route, Routes, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { Footer } from './components/Footer';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurrencyProvider, useCurrency } from './contexts/CurrencyContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LogisticsProvider } from './contexts/LogisticsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { PromotionsProvider } from './contexts/PromotionsContext';
import { FinancialsProvider } from './contexts/FinancialsContext';
import { Product, Seller, SellerTheme, ProductWithTotalStock, AuditLogEntry, Order, PayoutRecord, ReturnRequest, Theme as ThemeType, User, ThemeConfiguration, HomePageLayoutId, Role, Transaction, OrderAuditLogEntry, IntegrationSettings, HomePageContent, ProductReview } from './types';
import { ProductCardSkeleton } from './components/skeletons/ProductCardSkeleton';
import { injectThemeStyles, removeAllInjectedStyles } from './services/themeStyleService';
import { StandardHeroLayout } from './components/layouts/StandardHeroLayout';
import { FeaturedProductLayout } from './components/layouts/FeaturedProductLayout';
import { EnchantedHomepageLayout } from './components/layouts/EnchantedHomepageLayout';
import { fuzzyMatch } from './services/searchService';
import { WishlistProvider } from './contexts/WishlistContext';
import { RecentlyViewedProvider } from './contexts/RecentlyViewedContext';
import { NewsletterSignup } from './components/NewsletterSignup';
import { ChatProvider } from './contexts/ChatContext';
import { ordersApi, productsApi, sellersApi, usersApi, reviewsApi, platformThemesApi } from "./services/apiService";
import { apiService } from "./services/apiService";

// Lazy load heavy components for code splitting
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const CartPage = lazy(() => import('./components/CartPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const RegisterPage = lazy(() => import('./components/RegisterPage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const CheckoutPage = lazy(() => import('./components/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./components/OrderConfirmationPage'));
const OrderHistoryPage = lazy(() => import('./components/OrderHistoryPage'));
const OrderDetailPage = lazy(() => import('./components/OrderDetailPage'));
const WishlistPage = lazy(() => import('./components/WishlistPage'));
const SearchPage = lazy(() => import('./components/SearchPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const ContactPage = lazy(() => import('./components/ContactPage'));
const FAQPage = lazy(() => import('./components/FAQPage'));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./components/TermsPage'));
const ShippingPolicyPage = lazy(() => import('./components/ShippingPolicyPage'));
const ReturnsPolicyPage = lazy(() => import('./components/ReturnsPolicyPage'));
const SellerOnboardingPage = lazy(() => import('./components/SellerOnboardingPage'));
const GeminiChat = lazy(() => import('./components/GeminiChat'));

// Lazy load admin components (largest bundle)
// FIX: Handle named exports for lazy loading to prevent React error #306
// React.lazy() requires default exports, so we need to wrap named exports
const AdminLayout = lazy(() => 
  import('./components/admin/AdminLayout').then(module => ({ default: module.AdminLayout }))
);
const SellerDashboardPage = lazy(() => 
  import('./components/admin/SellerDashboardPage').then(module => ({ default: module.SellerDashboardPage }))
);
// FIX: Handle named exports for lazy loading to prevent React error #306
const AdminProductsPage = lazy(() => 
  import('./components/admin/AdminProductsPage').then(module => ({ default: module.AdminProductsPage }))
);
const AdminUsersPage = lazy(() => 
  import('./components/admin/AdminUsersPage').then(module => ({ default: module.AdminUsersPage }))
);
const AdminOrdersPage = lazy(() => 
  import('./components/admin/AdminOrdersPage').then(module => ({ default: module.AdminOrdersPage }))
);
const AdminOrderDetailPage = lazy(() => 
  import('./components/admin/AdminOrderDetailPage').then(module => ({ default: module.AdminOrderDetailPage }))
);
const AdminPromotionsPage = lazy(() => 
  import('./components/admin/AdminPromotionsPage').then(module => ({ default: module.AdminPromotionsPage }))
);
const AdminSellersPage = lazy(() => 
  import('./components/admin/AdminSellersPage').then(module => ({ default: module.AdminSellersPage }))
);
const FinancialsDashboard = lazy(() => 
  import('./components/admin/FinancialsDashboard').then(module => ({ default: module.FinancialsDashboard }))
);
const AdminReturnsPage = lazy(() => 
  import('./components/admin/AdminReturnsPage').then(module => ({ default: module.AdminReturnsPage }))
);
const AdminRolesPage = lazy(() => 
  import('./components/admin/AdminRolesPage').then(module => ({ default: module.AdminRolesPage }))
);
const AdminPlatformThemesPage = lazy(() => 
  import('./components/admin/AdminPlatformThemesPage').then(module => ({ default: module.AdminPlatformThemesPage }))
);
const ThemeManagementRouter = lazy(() => 
  import('./components/admin/ThemeManagementRouter').then(module => ({ default: module.ThemeManagementRouter }))
);
const LogisticsDashboard = lazy(() => 
  import('./components/admin/LogisticsDashboard').then(module => ({ default: module.LogisticsDashboard }))
);
const AdminIntegrationsPage = lazy(() => 
  import('./components/admin/AdminIntegrationsPage').then(module => ({ default: module.AdminIntegrationsPage }))
);
const AdminContentHomePage = lazy(() => 
  import('./components/admin/AdminContentHomePage').then(module => ({ default: module.AdminContentHomePage }))
);
const SellerPayoutsPage = lazy(() => 
  import('./components/admin/SellerPayoutsPage').then(module => ({ default: module.SellerPayoutsPage }))
);
const AdminBulkUploadPage = lazy(() => 
  import('./components/admin/AdminBulkUploadPage').then(module => ({ default: module.AdminBulkUploadPage }))
);
const PickerDashboardPage = lazy(() => 
  import('./components/admin/PickerDashboardPage').then(module => ({ default: module.PickerDashboardPage }))
);
const DeliveryCoordinatorPage = lazy(() => 
  import('./components/admin/DeliveryCoordinatorPage').then(module => ({ default: module.DeliveryCoordinatorPage }))
);

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[--bg-primary]">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[--accent]"></div>
      <p className="mt-4 text-[--text-muted]">Loading...</p>
    </div>
  </div>
);


const LAYOUTS: Record<HomePageLayoutId, React.ComponentType<any>> = {
    standard: StandardHeroLayout,
    featured: FeaturedProductLayout,
    enchanted: EnchantedHomepageLayout,
};

const HomePage: React.FC<{ products: ProductWithTotalStock[], isLoading: boolean, homePageContent: HomePageContent | null, allOrders: Order[] }> = ({ products, isLoading, homePageContent, allOrders }) => {
    const { currency, formatPrice } = useCurrency();
    const { t } = useLanguage();
    const { activeThemeConfig } = useTheme();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFandom, setSelectedFandom] = useState('All');
    const [sortOrder, setSortOrder] = useState('default');

    const PRODUCTS_PER_PAGE = 50;

    const maxPrice = useMemo(() => {
        if (products.length === 0) return 1000;
        const max = Math.ceil(Math.max(...products.map(p => p.pricing[currency] || 0)));
        return max > 0 ? max : 1000;
    }, [products, currency]);

    const [priceLimit, setPriceLimit] = useState(maxPrice);

    // Reset price limit when maxPrice changes from props
    useEffect(() => {
        setPriceLimit(maxPrice);
    }, [maxPrice]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [priceLimit, selectedFandom, sortOrder]);


    const filteredAndSortedProducts = useMemo(() => {
        let sortedProducts = products
            .filter(p => selectedFandom === 'All' || p.taxonomy.fandom === selectedFandom)
            .filter(p => (p.pricing[currency] || 0) <= priceLimit);

        switch (sortOrder) {
            case 'price-asc':
                sortedProducts.sort((a, b) => (a.pricing[currency] || 0) - (b.pricing[currency] || 0));
                break;
            case 'price-desc':
                sortedProducts.sort((a, b) => (b.pricing[currency] || 0) - (a.pricing[currency] || 0));
                break;
            case 'newest':
                sortedProducts.sort((a, b) => b.id - a.id);
                break;
            case 'rating-desc':
                sortedProducts.sort((a, b) => b.averageRating - a.averageRating);
                break;
            case 'default':
            default:
                break;
        }

        return sortedProducts;
    }, [products, priceLimit, currency, selectedFandom, sortOrder]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
        return filteredAndSortedProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
    }, [filteredAndSortedProducts, currentPage]);

    const LayoutComponent = LAYOUTS[activeThemeConfig.layout] || StandardHeroLayout;
    
    const paginationControls = totalPages > 1 ? (
        <div className="flex justify-center items-center gap-1 sm:gap-2 mt-12" role="navigation" aria-label="Pagination">
            <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-[--bg-secondary] border border-[--border-color] rounded-md hover:bg-[--bg-tertiary] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Go to previous page"
            >
                Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`hidden sm:inline-block px-4 py-2 text-sm border rounded-md transition-colors ${
                        currentPage === pageNumber
                            ? 'bg-[--accent] text-[--accent-foreground] border-[--accent] font-bold'
                            : 'bg-[--bg-secondary] border-[--border-color] hover:bg-[--bg-tertiary]'
                    }`}
                    aria-current={currentPage === pageNumber ? 'page' : undefined}
                >
                    {pageNumber}
                </button>
            ))}
             <span className="sm:hidden text-sm text-[--text-muted]">Page {currentPage} of {totalPages}</span>
            <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm bg-[--bg-secondary] border border-[--border-color] rounded-md hover:bg-[--bg-tertiary] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Go to next page"
            >
                Next
            </button>
        </div>
    ) : null;


    return (
        <LayoutComponent 
            products={paginatedProducts}
            allProducts={products}
            isLoading={isLoading}
            homePageContent={homePageContent}
            allOrders={allOrders}
            filterControls={
                <div id="product-section" className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="md:col-span-2">
                            <label htmlFor="price-filter" className="block text-sm font-medium text-[--text-muted] mb-2">
                                Filter by Price: <span>Up to {formatPrice(priceLimit, currency)}</span>
                            </label>
                            <input
                                id="price-filter"
                                type="range"
                                min={0}
                                max={maxPrice}
                                value={priceLimit}
                                onChange={(e) => setPriceLimit(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="sort-order" className="block text-sm font-medium text-[--text-muted] mb-2">Sort by</label>
                            <select 
                                id="sort-order"
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value)}
                                className="w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3 text-[--text-primary] focus:ring-[--accent] focus:border-[--accent]"
                            >
                                <option value="default">Default</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="newest">Newest Arrivals</option>
                                <option value="rating-desc">Highest Rated</option>
                            </select>
                        </div>
                    </div>
                </div>
            }
            paginationControls={paginationControls}
            onSelectFandom={setSelectedFandom}
        />
    );
};

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <NewsletterSignup />
      <Footer />
      <Suspense fallback={null}>
        <GeminiChat />
      </Suspense>
    </div>
  )
};

const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: User['role'][] }> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if(allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = (user.role === 'admin' || user.role === 'seller') ? '/admin' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
};


const AppContent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [platformThemes, setPlatformThemes] = useState<ThemeConfiguration[]>([]);
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings | null>(null);
  const [homePageContent, setHomePageContent] = useState<HomePageContent | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  
  const { activeThemeConfig, setPreviewThemeId } = useTheme();
  const { user, users, addUser, adminUpdateUser, deleteUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const themeClass = isAdminRoute
    ? 'admin-dashboard'
    : `theme-${activeThemeConfig.id}`;

  // Inject custom theme styles into the document head
  useEffect(() => {
      if(platformThemes.length === 0) return;
      removeAllInjectedStyles(); // Clear old styles on change
      platformThemes.forEach(theme => {
          if (theme.isCustom && theme.cssContent) {
              injectThemeStyles(theme.id, theme.cssContent);
          }
      });
      return () => removeAllInjectedStyles();
  }, [platformThemes]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Use Promise.allSettled to handle partial failures gracefully
        // Some endpoints require auth and will fail for anonymous users
        const results = await Promise.allSettled([
          productsApi.getProducts().catch(err => {
            console.error("Failed to fetch products:", err);
            return [];
          }),
          sellersApi.getSellers().catch(err => {
            console.error("Failed to fetch sellers:", err);
            return [];
          }),
          ordersApi.getOrders().catch(err => {
            console.error("Failed to fetch orders:", err);
            return [];
          }),
          apiService.fetchRoles().catch(err => {
            console.error("Failed to fetch roles:", err);
            return [];
          }),
          apiService.fetchReturnRequests().catch(err => {
            console.error("Failed to fetch return requests:", err);
            return [];
          }),
          apiService.fetchTransactions().catch(err => {
            console.error("Failed to fetch transactions:", err);
            return [];
          }),
          platformThemesApi.getThemes().catch(err => {
            console.error("Failed to fetch themes:", err);
            return [];
          }),
          apiService.fetchIntegrationSettings().catch(err => {
            console.error("Failed to fetch integration settings:", err);
            return null;
          }),
          apiService.fetchHomePageContent().catch(err => {
            console.error("Failed to fetch homepage content:", err);
            return null;
          }),
          reviewsApi.getReviews().catch(err => {
            console.error("Failed to fetch reviews:", err);
            return [];
          }),
        ]);

        // Extract values, using fallback for failed requests OR null responses
        const getValue = <T,>(result: PromiseSettledResult<T>, fallback: T): T => 
          result.status === 'fulfilled' && result.value != null ? result.value : fallback;

        setProducts(getValue(results[0], []));
        setSellers(getValue(results[1], []));
        setOrders(getValue(results[2], []));
        setRoles(getValue(results[3], []));
        setReturnRequests(getValue(results[4], []));
        setTransactions(getValue(results[5], []));
        setPlatformThemes(getValue(results[6], []));
        setIntegrationSettings(getValue(results[7], null));
        setHomePageContent(getValue(results[8], null));
        setReviews(getValue(results[9], []));

      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        // Set safe defaults to prevent crashes
        setProducts([]);
        setSellers([]);
        setOrders([]);
        setRoles([]);
        setReturnRequests([]);
        setTransactions([]);
        setPlatformThemes([]);
        setIntegrationSettings(null);
        setHomePageContent(null);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const productsWithDerivedData = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    return products.map(product => {
      try {
        const productReviews = reviews.filter(r => r.productId === product.id);
        const reviewCount = productReviews.length;
        const averageRating = reviewCount > 0
          ? productReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          : 0;
        
        // FIX: Add null safety checks for inventory to prevent crashes
        let stock = 0;
        if (product.hasVariations && product.variations && Array.isArray(product.variations)) {
          stock = product.variations.reduce((total, v) => {
            if (!v || !v.inventory || !Array.isArray(v.inventory)) return total;
            return total + v.inventory.reduce((sum, loc) => {
              return sum + (loc?.stock || 0);
            }, 0);
          }, 0);
        } else if (product.inventory && Array.isArray(product.inventory)) {
          stock = product.inventory.reduce((sum, loc) => {
            return sum + (loc?.stock || 0);
          }, 0);
        }

        return {
          ...product,
          stock,
          averageRating,
          reviewCount,
        };
      } catch (error) {
        console.error("Error processing product:", product.id, error);
        // Return product with safe defaults to prevent crashes
        return {
          ...product,
          stock: 0,
          averageRating: 0,
          reviewCount: 0,
        };
      }
    });
  }, [products, reviews]);

  const addProduct = async (productData: Omit<Product, 'id' | 'sellerId'> & { sellerId?: number }) => {
    try {
        // FIX: The apiService expects a sellerId, but the productData type allows it to be optional.
        // The form validation should ensure a sellerId is present before submission,
        // so we cast the type to satisfy the API contract.
        const newProduct = await productsApi.createProduct(productData as Omit<Product, 'id'>);
        setProducts(prev => [...prev, newProduct]);
    } catch (error) {
        console.error("Failed to add product:", error);
        alert("Error: Could not add product.");
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
        const savedProduct = await productsApi.updateProduct(updatedProduct);
        setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
    } catch (error) {
        console.error("Failed to update product:", error);
        alert("Error: Could not update product.");
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
        await productsApi.deleteProduct(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Error: Could not delete product.");
    }
  };

  const addSeller = async (application: Omit<Seller, 'id' | 'theme' | 'status' | 'applicationDate' | 'isVerified' | 'performance' | 'auditLog' | 'financials' | 'unlockedThemes' | 'payoutsEnabled'>) => {
    try {
        const newSeller = await sellersApi.createSeller(application);
        setSellers(prev => [...prev, newSeller]);
    } catch (error) {
        console.error("Failed to add seller:", error);
        alert("Error: Could not submit seller application.");
    }
  };
  
  const adminAddSeller = async (sellerData: Pick<Seller, 'name' | 'businessName' | 'contactEmail' | 'type' | 'status'>) => {
    try {
        const newSeller = await sellersApi.createSeller(sellerData);
        setSellers(prev => [...prev, newSeller]);
    } catch (error) {
        console.error("Failed to add seller:", error);
        alert("Error: Could not add seller.");
    }
  };
  
  const adminUpdateSeller = async (updatedSeller: Seller) => {
    try {
        const savedSeller = await sellersApi.updateSeller(updatedSeller);
        setSellers(prev => prev.map(s => s.id === savedSeller.id ? savedSeller : s));
    } catch (error) {
        console.error("Failed to update seller:", error);
        alert("Error: Could not update seller.");
    }
  };

  const updateSellerStatus = async (sellerId: number, status: 'approved' | 'rejected') => {
    const seller = sellers.find(s => s.id === sellerId);
    if (!seller) return;
    const newLogEntry: AuditLogEntry = {
        action: status,
        admin: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
    };
    await adminUpdateSeller({ ...seller, status, auditLog: [...seller.auditLog, newLogEntry] });
  };
  
  const toggleSellerVerification = async (sellerId: number) => {
    const seller = sellers.find(s => s.id === sellerId);
    if (!seller) return;
    const newVerifiedStatus = !seller.isVerified;
    const newLogEntry: AuditLogEntry = {
        action: newVerifiedStatus ? 'verified' : 'unverified',
        admin: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
    };
    await adminUpdateSeller({ ...seller, isVerified: newVerifiedStatus, auditLog: [...seller.auditLog, newLogEntry] });
  };

  const updateSellerTheme = async (sellerId: number, theme: SellerTheme) => {
    const seller = sellers.find(s => s.id === sellerId);
    if (seller) {
        await adminUpdateSeller({ ...seller, theme });
    }
  };
  
  const unlockThemeForSeller = async (sellerId: number, theme: ThemeConfiguration) => {
    try {
        const updatedSeller = await apiService.unlockTheme(sellerId, theme.id);
        setSellers(prev => prev.map(s => s.id === updatedSeller.id ? updatedSeller : s));
        alert(`Theme unlocked! ${theme.price} GBP has been deducted from the balance.`);
    } catch (error) {
        console.error("Failed to unlock theme:", error);
        alert("Failed to unlock theme. The seller may have insufficient balance.");
    }
  };

  const addOrder = async (order: Order) => {
    try {
        const newOrder = await ordersApi.createOrder(order);
        setOrders(prev => [newOrder, ...prev]);
        // Transactions should be created on the backend when an order is created.
        // We'll fetch updated transactions to reflect the change.
        apiService.fetchTransactions().then(setTransactions);
        sellersApi.getSellers().then(setSellers); // Refresh seller balance
    } catch (error) {
        console.error("Failed to add order:", error);
        alert("Error: Could not place order.");
    }
  };

  const addReview = async (reviewData: Omit<ProductReview, 'id' | 'isVerifiedPurchase' | 'userName' | 'userId'>) => {
    try {
        // FIX: The apiService expects a full review object. We enrich the reviewData
        // with user information and verification status before sending it.
        if (!user) {
            alert('You must be logged in to submit a review.');
            return;
        }

        // The backend should ultimately verify this, but we can determine it here to satisfy the type.
        const hasPurchased = orders.some(order => 
            order.shippingAddress.email === user.email &&
            order.items.some(item => item.id === reviewData.productId) &&
            order.status === 'Delivered'
        );

        const newReview = await reviewsApi.createReview({
            ...reviewData,
            userId: user.id,
            userName: user.name,
            isVerifiedPurchase: hasPurchased,
        });
        setReviews(prev => [newReview, ...prev]);
        // Loyalty points should be handled by the backend.
        // Refresh user data if needed.
        if (user) {
            adminUpdateUser({ ...user, loyaltyPoints: (user.loyaltyPoints || 0) + 10 }); // Optimistic update
        }
    } catch (error) {
        console.error("Failed to add review:", error);
        alert("Error: Could not submit review.");
    }
  };

  const updateOrderStatus = async (
    orderId: string, 
    updates: Partial<Pick<Order, 'status' | 'carrier' | 'trackingNumber' | 'trackingUrl' | 'shippingNotes'>>, 
    notes?: string
  ) => {
    try {
        const updatedOrder = await ordersApi.updateOrder(orderId, { updates, notes });
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    } catch (error) {
        console.error("Failed to update order status:", error);
        alert("Error: Could not update order status.");
    }
  };
  
  const processSellerPayout = async (sellerId: number, currency: string) => {
    try {
        const result = await apiService.processPayout({ sellerId, currency });
        if (result.success) {
            // Refresh seller and transaction data
            sellersApi.getSellers().then(setSellers);
            apiService.fetchTransactions().then(setTransactions);
        }
    } catch (error) {
        console.error("Failed to process payout:", error);
        alert("Error: Could not process payout.");
    }
  };
  
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date' | 'processedBy'>) => {
    try {
        const newTransaction = await apiService.addTransaction(transaction);
        setTransactions(prev => [newTransaction, ...prev]);
        // Refresh seller balance
        sellersApi.getSellers().then(setSellers);
    } catch (error) {
        console.error("Failed to add transaction:", error);
        alert("Error: Could not add manual transaction.");
    }
  };

  const addReturnRequest = async (request: ReturnRequest) => {
    try {
        const newRequest = await apiService.addReturnRequest(request);
        setReturnRequests(prev => [...prev, newRequest]);
        // Update the order status locally for immediate feedback
        setOrders(prev => prev.map(o => o.id === newRequest.orderId ? { ...o, status: 'Return Requested' } : o));
    } catch (error) {
        console.error("Failed to add return request:", error);
        alert("Error: Could not submit return request.");
    }
  };

  const updateReturnRequest = async (updatedRequest: Partial<ReturnRequest> & { id: string }) => {
    try {
        const savedRequest = await apiService.updateReturnRequest(updatedRequest);
        setReturnRequests(prev => prev.map(r => r.id === savedRequest.id ? savedRequest : r));
        // Refresh related orders and transactions if a refund was processed
        if (savedRequest.status.startsWith('Completed') || savedRequest.status.startsWith('Rejected')) {
            ordersApi.getOrders().then(setOrders);
            apiService.fetchTransactions().then(setTransactions);
            sellersApi.getSellers().then(setSellers);
        }
    } catch (error) {
        console.error("Failed to update return request:", error);
        alert("Error: Could not update return request.");
    }
  };
  
  const addTheme = async (theme: ThemeConfiguration) => {
    try {
        const newTheme = await apiService.addTheme(theme);
        setPlatformThemes(prev => [...prev, newTheme]);
    } catch (error) {
        console.error("Failed to add theme:", error);
        alert("Error: Could not add theme.");
    }
  };
  
  const updateTheme = async (updatedTheme: ThemeConfiguration) => {
    try {
        const savedTheme = await apiService.updateTheme(updatedTheme);
        setPlatformThemes(prev => prev.map(t => t.id === savedTheme.id ? savedTheme : t));
    } catch (error) {
        console.error("Failed to update theme:", error);
        alert("Error: Could not update theme.");
    }
  };

  const addRole = async (role: Omit<Role, 'id'>) => {
    try {
        const newRole = await apiService.addRole(role);
        setRoles(prev => [...prev, newRole]);
    } catch (error) {
        console.error("Failed to add role:", error);
        alert("Error: Could not add role.");
    }
  };
  
  const updateIntegrationSettings = async (settings: IntegrationSettings) => {
    try {
      const savedSettings = await apiService.updateIntegrationSettings(settings);
      setIntegrationSettings(savedSettings);
    } catch (error) {
        console.error("Failed to update integration settings:", error);
        alert("Error: Could not update integration settings.");
    }
  };
  
  const updateHomePageContent = async (content: HomePageContent) => {
    try {
        const savedContent = await apiService.updateHomePageContent(content);
        setHomePageContent(savedContent);
    } catch (error) {
        console.error("Failed to update homepage content:", error);
        alert("Error: Could not update homepage content.");
    }
  }

  return (
    <div className={`${themeClass} bg-[--bg-primary] min-h-screen text-[--text-primary]`}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage products={productsWithDerivedData} isLoading={isLoading} homePageContent={homePageContent} allOrders={orders} />} />
            <Route path="search" element={<SearchPage products={productsWithDerivedData} />} />
            <Route path="product/:id" element={<ProductDetail products={productsWithDerivedData} sellers={sellers} isLoading={isLoading} reviews={reviews} orders={orders} onAddReview={addReview} />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="privacy" element={<PrivacyPolicyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="shipping-policy" element={<ShippingPolicyPage />} />
            <Route path="returns-policy" element={<ReturnsPolicyPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="seller-onboarding" element={<SellerOnboardingPage onAddSeller={addSeller} />} />
            <Route path="checkout" element={<ProtectedRoute allowedRoles={['customer']}><CheckoutPage onAddOrder={addOrder} /></ProtectedRoute>} />
            <Route path="order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="profile" element={<ProtectedRoute allowedRoles={['customer']}><ProfilePage /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute allowedRoles={['customer']}><OrderHistoryPage orders={orders} /></ProtectedRoute>} />
            <Route path="orders/:id" element={<ProtectedRoute allowedRoles={['customer']}><OrderDetailPage orders={orders} returnRequests={returnRequests} onAddReturnRequest={addReturnRequest} /></ProtectedRoute>} />
            <Route path="wishlist" element={<ProtectedRoute allowedRoles={['customer']}><WishlistPage products={productsWithDerivedData} /></ProtectedRoute>} />
        </Route>
        
        <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin', 'seller', 'finance_manager', 'accountant', 'order_manager', 'shipping_coordinator', 'support_agent', 'content_moderator', 'marketing_manager', 'warehouse_operative', 'logistics_coordinator', 'customer_support_lead', 'catalog_manager', 'delivery_coordinator']}>
                {isLoading ? (
                    <div className="min-h-screen flex items-center justify-center bg-[--bg-primary]">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[--accent]"></div>
                            <p className="mt-4 text-[--text-muted]">Loading admin panel...</p>
                        </div>
                    </div>
                ) : (
                    <AdminLayout user={user} roles={roles || []}/>
                )}
            </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SellerDashboardPage user={user} products={productsWithDerivedData || []} orders={orders || []} sellers={sellers || []} />} />
          <Route path="products" element={
            <AdminProductsPage 
              products={productsWithDerivedData} 
              sellers={sellers}
              onAddProduct={addProduct}
              onUpdateProduct={updateProduct}
              onDeleteProduct={deleteProduct} 
            />
          } />
          <Route path="bulk-upload" element={
            <ProtectedRoute allowedRoles={['admin', 'seller', 'content_moderator', 'catalog_manager']}>
                <AdminBulkUploadPage
                    products={productsWithDerivedData}
                    onAddProduct={addProduct}
                    onUpdateProduct={updateProduct}
                />
            </ProtectedRoute>
          } />
          <Route path="sellers" element={
            <AdminRoute>
              <AdminSellersPage 
                sellers={sellers}
                onUpdateSellerStatus={updateSellerStatus} 
                onToggleSellerVerification={toggleSellerVerification}
                onAddSeller={adminAddSeller}
                onUpdateSeller={adminUpdateSeller}
              />
            </AdminRoute>
          } />
          <Route path="users" element={
              <AdminRoute>
                <AdminUsersPage 
                    users={users} 
                    onAddUser={addUser} 
                    onUpdateUser={adminUpdateUser} 
                    onDeleteUser={deleteUser}
                />
              </AdminRoute>
          } />
           <Route path="roles" element={
              <AdminRoute>
                <AdminRolesPage 
                    roles={roles}
                    users={users}
                    onAddRole={addRole}
                />
              </AdminRoute>
          } />
          <Route path="orders" element={<AdminOrdersPage orders={orders} />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage orders={orders} onUpdateStatus={updateOrderStatus} roles={roles}/>} />
          <Route path="picking-dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'warehouse_operative', 'shipping_coordinator']}>
                  <PickerDashboardPage orders={orders} products={productsWithDerivedData} />
              </ProtectedRoute>
          } />
           <Route path="delivery-dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'delivery_coordinator']}>
                  <DeliveryCoordinatorPage orders={orders} onUpdateStatus={updateOrderStatus} />
              </ProtectedRoute>
          } />
          <Route path="promotions" element={
            <ProtectedRoute allowedRoles={['admin', 'marketing_manager']}>
                <AdminPromotionsPage />
            </ProtectedRoute>
          } />
          <Route path="returns" element={<AdminReturnsPage returnRequests={returnRequests} orders={orders} onUpdateReturnRequest={updateReturnRequest} />} />
          <Route path="financials" element={
             <ProtectedRoute allowedRoles={['admin', 'finance_manager', 'accountant']}>
              <FinancialsDashboard
                sellers={sellers} 
                orders={orders} 
                transactions={transactions}
                onProcessPayout={processSellerPayout} 
                onAddTransaction={addTransaction}
              />
             </ProtectedRoute>
          } />
          <Route path="banking" element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerPayoutsPage sellers={sellers} onUpdateSeller={adminUpdateSeller} />
            </ProtectedRoute>
          } />
          <Route path="logistics" element={
            <ProtectedRoute allowedRoles={['admin', 'shipping_coordinator', 'logistics_coordinator']}>
              <LogisticsDashboard orders={orders} returnRequests={returnRequests} />
            </ProtectedRoute>
          } />
          <Route path="content/home" element={
            <ProtectedRoute allowedRoles={['admin', 'marketing_manager']}>
              <AdminContentHomePage content={homePageContent} onUpdateContent={updateHomePageContent} allProducts={productsWithDerivedData} />
            </ProtectedRoute>
          } />
           <Route path="integrations" element={
            <AdminRoute>
              <AdminIntegrationsPage settings={integrationSettings} onUpdate={updateIntegrationSettings} />
            </AdminRoute>
          } />
          <Route path="theme" element={
            <ThemeManagementRouter
              sellers={sellers} 
              onUpdateSellerTheme={updateSellerTheme} 
              onPreviewThemeChange={setPreviewThemeId}
              platformThemes={platformThemes}
              onUnlockTheme={unlockThemeForSeller}
            />
          } />
          <Route path="platform-themes" element={
            <AdminRoute>
              <AdminPlatformThemesPage 
                themes={platformThemes} 
                onAddTheme={addTheme} 
                onUpdateTheme={updateTheme} 
              />
            </AdminRoute>
          } />
        </Route>
      </Routes>
    </div>
  );
}


function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <LogisticsProvider>
            <PromotionsProvider>
              <CartProvider>
                <WishlistProvider>
                  <RecentlyViewedProvider>
                    <ThemeProvider>
                      <FinancialsProvider>
                        <ChatProvider>
                          <Router>
                            <AppContent />
                          </Router>
                        </ChatProvider>
                      </FinancialsProvider>
                    </ThemeProvider>
                  </RecentlyViewedProvider>
                </WishlistProvider>
              </CartProvider>
            </PromotionsProvider>
          </LogisticsProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
