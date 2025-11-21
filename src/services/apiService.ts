// // apiService.ts
// import axios from "axios";
// 
// // Auto-detect backend URL (prod or dev)
// const BASE_URL =
//   import.meta.env.VITE_API_URL ||
//   "https://hos-backend-production-31dc.up.railway.app"; // fallback to Railway
// 
// console.log("API Base URL:", BASE_URL);
// 
// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: false,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });
// 
// // -------- AUTH ----------
// export const login = (email: string, password: string) =>
//   api.post("/auth/login", { email, password });
// 
// export const register = (data: any) =>
//   api.post("/auth/register", data);
// 
// // -------- USERS ----------
// export const getUsers = () => api.get("/users");
// export const getUserById = (id: number) => api.get(`/users/${id}`);
// export const updateUser = (id: number, data: any) =>
//   api.put(`/users/${id}`, data);
// export const deleteUser = (id: number) => api.delete(`/users/${id}`);
// 
// // -------- PRODUCTS ----------
// export const getProducts = () => api.get("/products");
// export const getProduct = (id: number) => api.get(`/products/${id}`);
// export const createProduct = (data: any) => api.post("/products", data);
// export const updateProduct = (id: number, data: any) =>
//   api.put(`/products/${id}`, data);
// export const deleteProduct = (id: number) => api.delete(`/products/${id}`);
// 
// // -------- ORDERS ----------
// export const getOrders = () => api.get("/orders");
// export const getOrder = (id: number) => api.get(`/orders/${id}`);
// export const updateOrder = (id: number, data: any) =>
//   api.put(`/orders/${id}`, data);
// 
// export default api;
// import { Address, Carrier, HomePageContent, IntegrationSettings, Order, Product, Promotion, ReturnRequest, Role, Seller, ThemeConfiguration, Transaction, User, UserAddress, ShippingOption, ProductReview } from '../types';
// import { TaxRates } from '../contexts/FinancialsContext';
// import { MOCK_USERS } from '../data/users';
// import { MOCK_ROLES } from '../data/roles';
// import { MOCK_PRODUCTS } from '../data/products';
// import { MOCK_SELLERS } from '../data/sellers';
// import { MOCK_ORDERS } from '../data/orders';
// import { MOCK_RETURN_REQUESTS } from '../data/returns';
// import { MOCK_TRANSACTIONS } from '../data/transactions';
// import { MOCK_THEME_CONFIGURATIONS } from '../data/themes';
// import { INITIAL_INTEGRATION_SETTINGS } from '../data/integrations';
// import { MOCK_HOME_PAGE_CONTENT } from '../data/content';
// import { MOCK_REVIEWS } from '../data/reviews';
// import { MOCK_CARRIERS } from '../data/carriers';
// import { MOCK_PROMOTIONS } from '../data/promotions';
// import { MOCK_TRACKING_HISTORY } from '../data/tracking';
// 
// // In-memory data stores
// let users: User[] = JSON.parse(JSON.stringify(MOCK_USERS));
// let roles: Role[] = JSON.parse(JSON.stringify(MOCK_ROLES));
// let products: Product[] = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
// let sellers: Seller[] = JSON.parse(JSON.stringify(MOCK_SELLERS));
// let orders: Order[] = JSON.parse(JSON.stringify(MOCK_ORDERS));
// let returnRequests: ReturnRequest[] = JSON.parse(JSON.stringify(MOCK_RETURN_REQUESTS));
// let transactions: Transaction[] = JSON.parse(JSON.stringify(MOCK_TRANSACTIONS));
// let platformThemes: ThemeConfiguration[] = JSON.parse(JSON.stringify(MOCK_THEME_CONFIGURATIONS));
// let integrationSettings: IntegrationSettings = JSON.parse(JSON.stringify(INITIAL_INTEGRATION_SETTINGS));
// let homePageContent: HomePageContent = JSON.parse(JSON.stringify(MOCK_HOME_PAGE_CONTENT));
// let reviews: ProductReview[] = JSON.parse(JSON.stringify(MOCK_REVIEWS));
// let carriers: Carrier[] = JSON.parse(JSON.stringify(MOCK_CARRIERS));
// let promotions: Promotion[] = JSON.parse(JSON.stringify(MOCK_PROMOTIONS));
// let taxRates: TaxRates = { 'GB': 0.20, 'US': 0.08, 'CA': 0.13 };
// 
const mockApi = <T>(data: T, delay = 300): Promise<T> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), delay);
    });
};

export const apiService = {
    // Auth
    login: (email, password): Promise<{ user: User, token: string }> => {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            return mockApi({ user, token: `mock_token_${user.id}` });
        }
        return Promise.reject(new Error('Invalid credentials'));
    },
    register: (name, email, password): Promise<{ user: User, token: string }> => {
        if (users.some(u => u.email === email)) {
            return Promise.reject(new Error('User already exists'));
        }
        const newUser: User = {
            id: Math.max(...users.map(u => u.id)) + 1,
            name, email, password, role: 'customer', loyaltyPoints: 0,
            createdAt: new Date().toISOString(), addresses: []
        };
        users.push(newUser);
        return mockApi({ user: newUser, token: `mock_token_${newUser.id}` });
    },
    fetchCurrentUser: (): Promise<User> => mockApi(users[2]), // Mock Harry as current user

    // Data fetching (GET)
    fetchProducts: (): Promise<Product[]> => mockApi(products),
    fetchSellers: (): Promise<Seller[]> => mockApi(sellers),
    fetchOrders: (): Promise<Order[]> => mockApi(orders),
    fetchUsers: (): Promise<User[]> => mockApi(users),
    fetchRoles: (): Promise<Role[]> => mockApi(roles),
    fetchReturnRequests: (): Promise<ReturnRequest[]> => mockApi(returnRequests),
    fetchTransactions: (): Promise<Transaction[]> => mockApi(transactions),
    fetchPlatformThemes: (): Promise<ThemeConfiguration[]> => mockApi(platformThemes),
    fetchIntegrationSettings: (): Promise<IntegrationSettings> => mockApi(integrationSettings),
    fetchHomePageContent: (): Promise<HomePageContent> => mockApi(homePageContent),
    fetchReviews: (): Promise<ProductReview[]> => mockApi(reviews),
    fetchCarriers: (): Promise<Carrier[]> => mockApi(carriers),
    fetchPromotions: (): Promise<Promotion[]> => mockApi(promotions),
    fetchTaxRates: (): Promise<TaxRates> => mockApi(taxRates),
    getTrackingInfo: (trackingNumber: string): Promise<any[]> => mockApi(MOCK_TRACKING_HISTORY[trackingNumber] || []),
    getShippingOptions: (address: Address): Promise<ShippingOption[]> => {
        const zone = address.country === 'GB' ? 'UK' : 'ROW';
        const options: ShippingOption[] = [];
        carriers.forEach(c => {
            c.rates.filter(r => r.zone === zone).forEach(r => {
                options.push({
                    carrierId: c.id,
                    carrierName: c.name,
                    method: r.method,
                    cost: r.cost,
                    estimatedDelivery: `${r.estimatedDays.min}-${r.estimatedDays.max} days`
                });
            });
        });
        return mockApi(options);
    },

    // Data mutations
    addProduct: (productData: Omit<Product, 'id'>): Promise<Product> => {
        const newProduct: Product = { ...productData, id: Math.max(...products.map(p => p.id)) + 1 };
        products.push(newProduct);
        return mockApi(newProduct);
    },
    updateProduct: (product: Product): Promise<Product> => {
        products = products.map(p => p.id === product.id ? product : p);
        return mockApi(product);
    },
    deleteProduct: (productId: number): Promise<{ success: boolean }> => {
        products = products.filter(p => p.id !== productId);
        return mockApi({ success: true });
    },

    addSeller: (sellerData: any): Promise<Seller> => {
        const newSeller: Seller = {
            ...sellerData,
            id: Math.max(...sellers.map(s => s.id), ...users.map(u => u.id)) + 1,
            theme: { name: 'dark', customizations: {} },
            status: sellerData.status || 'pending',
            applicationDate: new Date().toISOString(),
            isVerified: false,
            payoutsEnabled: false,
            performance: { totalSales: 0, averageRating: 0, activeListings: 0 },
            auditLog: [],
            financials: { balance: {}, payoutHistory: [], transactionLog: [], payoutProvider: null, payoutAccountId: null, kycStatus: 'not_started' },
            unlockedThemes: ['dark', 'light']
        };
        sellers.push(newSeller);
        return mockApi(newSeller);
    },
    updateSeller: (seller: Seller): Promise<Seller> => {
        sellers = sellers.map(s => s.id === seller.id ? seller : s);
        return mockApi(seller);
    },
    unlockTheme: (sellerId: number, themeId: string): Promise<Seller> => {
        const seller = sellers.find(s => s.id === sellerId);
        if (seller) {
            seller.unlockedThemes.push(themeId);
            return mockApi(seller);
        }
        return Promise.reject(new Error('Seller not found'));
    },

    addUser: (userData: Omit<User, 'id'>): Promise<User> => {
        const newUser: User = { ...userData, id: Math.max(...users.map(u => u.id)) + 1 };
        users.push(newUser);
        return mockApi(newUser);
    },
    updateUser: (user: User): Promise<User> => {
        users = users.map(u => u.id === user.id ? user : u);
        return mockApi(user);
    },
    deleteUser: (userId: number): Promise<{ success: boolean }> => {
        users = users.filter(u => u.id !== userId);
        return mockApi({ success: true });
    },

    addOrder: (orderData: Order): Promise<Order> => {
        orders.unshift(orderData);
        return mockApi(orderData);
    },
    updateOrder: (orderId: string, updateData: any): Promise<Order> => {
        let order = orders.find(o => o.id === orderId);
        if (order) {
            const previousStatus = order.status;
            order = { ...order, ...updateData.updates };
            if (updateData.notes) {
                order.auditLog.push({
                    timestamp: new Date().toISOString(),
                    user: 'Admin',
                    previousStatus: previousStatus,
                    newStatus: order.status,
                    notes: updateData.notes,
                });
            }
            orders = orders.map(o => o.id === orderId ? order! : o);
            return mockApi(order);
        }
        return Promise.reject(new Error('Order not found'));
    },

    addReview: (reviewData: Omit<ProductReview, 'id'>): Promise<ProductReview> => {
        const newReview: ProductReview = { ...reviewData, id: Math.max(0, ...reviews.map(r => r.id)) + 1 };
        reviews.push(newReview);
        return mockApi(newReview);
    },
    
    addReturnRequest: (requestData: ReturnRequest): Promise<ReturnRequest> => {
        returnRequests.push(requestData);
        return mockApi(requestData);
    },
    updateReturnRequest: (request: Partial<ReturnRequest> & { id: string }): Promise<ReturnRequest> => {
        let ret = returnRequests.find(r => r.id === request.id);
        if (ret) {
            ret = { ...ret, ...request };
            returnRequests = returnRequests.map(r => r.id === request.id ? ret! : r);
            return mockApi(ret);
        }
        return Promise.reject(new Error('Return request not found'));
    },

    processPayout: (payoutData: { sellerId: number, currency: string }): Promise<{ success: boolean }> => mockApi({ success: true }),
    addTransaction: (txData: Omit<Transaction, 'id' | 'date' | 'processedBy'>): Promise<Transaction> => {
        const newTx: Transaction = {
            ...txData,
            id: `txn_manual_${Date.now()}`,
            date: new Date().toISOString(),
            processedBy: 'Admin'
        };
        transactions.unshift(newTx);
        return mockApi(newTx);
    },

    addTheme: (theme: ThemeConfiguration): Promise<ThemeConfiguration> => {
        platformThemes.push(theme);
        return mockApi(theme);
    },
    updateTheme: (theme: ThemeConfiguration): Promise<ThemeConfiguration> => {
        platformThemes = platformThemes.map(t => t.id === theme.id ? theme : t);
        return mockApi(theme);
    },
    
    addRole: (role: Omit<Role, 'id'>): Promise<Role> => {
        const newRole: Role = { ...role, id: role.name.toLowerCase().replace(' ', '_') };
        roles.push(newRole);
        return mockApi(newRole);
    },
    updateTaxRates: (rates: TaxRates): Promise<TaxRates> => {
        taxRates = rates;
        return mockApi(taxRates);
    },

    updateIntegrationSettings: (settings: IntegrationSettings): Promise<IntegrationSettings> => {
        integrationSettings = settings;
        return mockApi(integrationSettings);
    },
    updateHomePageContent: (content: HomePageContent): Promise<HomePageContent> => {
        homePageContent = content;
        return mockApi(homePageContent);
    },

    updatePromotion: (promo: Promotion): Promise<Promotion> => {
        promotions = promotions.map(p => p.id === promo.id ? promo : p);
        return mockApi(promo);
    },
    addPromotion: (promoData: Omit<Promotion, 'id'>): Promise<Promotion> => {
        const newPromo: Promotion = { ...promoData, id: Math.max(0, ...promotions.map(p => p.id)) + 1 };
        promotions.push(newPromo);
        return mockApi(newPromo);
    },
    
    updateCarrier: (carrier: Carrier): Promise<Carrier> => {
        carriers = carriers.map(c => c.id === carrier.id ? carrier : c);
        return mockApi(carrier);
    },
    addCarrier: (carrierData: Omit<Carrier, 'id'>): Promise<Carrier> => {
        const newCarrier = { ...carrierData, id: carrierData.name.toLowerCase().replace(/\s/g, '-') };
        carriers.push(newCarrier);
        return mockApi(newCarrier);
    },
    removeCarrier: (carrierId: string): Promise<{ success: boolean }> => {
        carriers = carriers.filter(c => c.id !== carrierId);
        return mockApi({ success: true });
    },
};
