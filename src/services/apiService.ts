import axios, { AxiosInstance } from "axios";
import { 
  Product, 
  Seller, 
  Order, 
  User, 
  ProductReview, 
  ThemeConfiguration,
  Role,
  ReturnRequest,
  Transaction,
  IntegrationSettings,
  HomePageContent,
  Carrier,
  Promotion
} from '../types';

// API Base URL - defaults to Railway backend
const BASE_URL = import.meta.env.VITE_API_URL || "https://backend-production-9a74.up.railway.app";

console.log("API Base URL:", BASE_URL);

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

// Automatically attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

/* -----------------------------------------
   AUTH API
------------------------------------------*/
export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const response = await api.post("/auth/login", data);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  register: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post("/auth/register", data);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  refresh: async () => {
    const response = await api.post("/auth/refresh");
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

/* -----------------------------------------
   USERS API
------------------------------------------*/
export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get("/users");
    return response.data;
  },
  
  getUser: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  createUser: async (data: Omit<User, 'id' | 'createdAt' | 'loyaltyPoints'>): Promise<User> => {
    const response = await api.post("/users", data);
    return response.data;
  },
  
  updateUser: async (user: User): Promise<User> => {
    const response = await api.put(`/users/${user.id}`, user);
    return response.data;
  },
  
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

/* -----------------------------------------
   ORDERS API
------------------------------------------*/
export const ordersApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get("/orders");
    return response.data;
  },
  
  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  createOrder: async (data: Order): Promise<Order> => {
    const response = await api.post("/orders", data);
    return response.data;
  },
  
  updateOrder: async (
    id: string, 
    data: { updates: Partial<Order>; notes?: string }
  ): Promise<Order> => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },
  
  deleteOrder: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },
};

/* -----------------------------------------
   PRODUCTS API
------------------------------------------*/
export const productsApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get("/products");
    return response.data;
  },
  
  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  createProduct: async (data: Omit<Product, 'id'>): Promise<Product> => {
    const response = await api.post("/products", data);
    return response.data;
  },
  
  updateProduct: async (product: Product): Promise<Product> => {
    const response = await api.put(`/products/${product.id}`, product);
    return response.data;
  },
  
  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

/* -----------------------------------------
   SELLERS API
------------------------------------------*/
export const sellersApi = {
  getSellers: async (): Promise<Seller[]> => {
    const response = await api.get("/sellers");
    return response.data;
  },
  
  getSeller: async (id: number): Promise<Seller> => {
    const response = await api.get(`/sellers/${id}`);
    return response.data;
  },
  
  createSeller: async (data: Partial<Seller>): Promise<Seller> => {
    const response = await api.post("/sellers", data);
    return response.data;
  },
  
  updateSeller: async (seller: Seller): Promise<Seller> => {
    const response = await api.put(`/sellers/${seller.id}`, seller);
    return response.data;
  },
  
  deleteSeller: async (id: number): Promise<void> => {
    await api.delete(`/sellers/${id}`);
  },
};

/* -----------------------------------------
   REVIEWS API
------------------------------------------*/
export const reviewsApi = {
  getReviews: async (): Promise<ProductReview[]> => {
    const response = await api.get("/reviews");
    return response.data;
  },
  
  getReview: async (id: number): Promise<ProductReview> => {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },
  
  createReview: async (data: Omit<ProductReview, 'id' | 'date'>): Promise<ProductReview> => {
    const response = await api.post("/reviews", data);
    return response.data;
  },
  
  updateReview: async (id: number, data: Partial<ProductReview>): Promise<ProductReview> => {
    const response = await api.put(`/reviews/${id}`, data);
    return response.data;
  },
  
  deleteReview: async (id: number): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  },
};

/* -----------------------------------------
   PLATFORM THEMES API
------------------------------------------*/
export const platformThemesApi = {
  getThemes: async (): Promise<ThemeConfiguration[]> => {
    const response = await api.get("/platform/themes");
    return response.data;
  },
  
  getTheme: async (id: string): Promise<ThemeConfiguration> => {
    const response = await api.get(`/platform/themes/${id}`);
    return response.data;
  },
  
  createTheme: async (data: ThemeConfiguration): Promise<ThemeConfiguration> => {
    const response = await api.post("/platform/themes", data);
    return response.data;
  },
  
  updateTheme: async (theme: ThemeConfiguration): Promise<ThemeConfiguration> => {
    const response = await api.put(`/platform/themes/${theme.id}`, theme);
    return response.data;
  },
  
  deleteTheme: async (id: string): Promise<void> => {
    await api.delete(`/platform/themes/${id}`);
  },
};

/* -----------------------------------------
   PROMOTIONS API
------------------------------------------*/
export const promotionsApi = {
  getPromotions: async (): Promise<Promotion[]> => {
    const response = await api.get("/promotions");
    return response.data;
  },
  
  validateCode: async (code: string) => {
    const response = await api.get(`/promotions/validate/${code}`);
    return response.data;
  },
  
  createPromotion: async (data: Omit<Promotion, 'id'>): Promise<Promotion> => {
    const response = await api.post("/promotions", data);
    return response.data;
  },
  
  updatePromotion: async (promotion: Promotion): Promise<Promotion> => {
    const response = await api.put(`/promotions/${promotion.id}`, promotion);
    return response.data;
  },
  
  deletePromotion: async (id: number): Promise<void> => {
    await api.delete(`/promotions/${id}`);
  },
};

/* -----------------------------------------
   CARRIERS API  
------------------------------------------*/
export const carriersApi = {
  getCarriers: async (): Promise<Carrier[]> => {
    const response = await api.get("/carriers");
    return response.data;
  },
};

/* -----------------------------------------
   LEGACY API SERVICE (for backward compatibility)
------------------------------------------*/
export const apiService = {
  // Roles
  fetchRoles: async (): Promise<Role[]> => {
    const response = await api.get("/roles");
    return response.data;
  },
  
  addRole: async (role: Omit<Role, 'id'>): Promise<Role> => {
    const response = await api.post("/roles", role);
    return response.data;
  },

  // Tax Rates (Financials)
  fetchTaxRates: async (): Promise<{ [countryCode: string]: number }> => {
    try {
      const response = await api.get("/financials/tax-rates");
      return response.data;
    } catch {
      // Return default rates if endpoint doesn't exist yet
      return {
        GB: 0.20,
        US: 0.08,
        EU: 0.21,
        ROW: 0.00,
      };
    }
  },

  updateTaxRates: async (rates: { [countryCode: string]: number }) => {
    try {
      const response = await api.put("/financials/tax-rates", { rates });
      return response.data;
    } catch {
      return rates; // Fallback for now
    }
  },

  // Carriers (Logistics)
  fetchCarriers: async (): Promise<Carrier[]> => {
    return carriersApi.getCarriers();
  },

  addCarrier: async (carrier: Omit<Carrier, 'id'>): Promise<Carrier> => {
    const response = await api.post("/carriers", carrier);
    return response.data;
  },

  updateCarrier: async (carrier: Carrier): Promise<Carrier> => {
    const response = await api.put(`/carriers/${carrier.id}`, carrier);
    return response.data;
  },

  removeCarrier: async (carrierId: string): Promise<void> => {
    await api.delete(`/carriers/${carrierId}`);
  },

  // Promotions
  fetchPromotions: async (): Promise<Promotion[]> => {
    return promotionsApi.getPromotions();
  },

  addPromotion: async (promotion: Omit<Promotion, 'id'>): Promise<Promotion> => {
    return promotionsApi.createPromotion(promotion);
  },

  updatePromotion: async (promotion: Promotion): Promise<Promotion> => {
    return promotionsApi.updatePromotion(promotion);
  },

  // Platform Themes
  fetchPlatformThemes: async (): Promise<ThemeConfiguration[]> => {
    return platformThemesApi.getThemes();
  },

  // Shipping Options
  getShippingOptions: async (address: any, items: any[]): Promise<any[]> => {
    try {
      const response = await api.post("/shipping/options", { address, items });
      return response.data;
    } catch {
      // Fallback shipping options
      return [
        { id: 'standard', name: 'Standard Shipping', price: 5.99, estimatedDays: 5 },
        { id: 'express', name: 'Express Shipping', price: 12.99, estimatedDays: 2 },
      ];
    }
  },

  // Tracking Info
  getTrackingInfo: async (trackingNumber: string): Promise<any[]> => {
    try {
      const response = await api.get(`/shipping/tracking/${trackingNumber}`);
      return response.data;
    } catch {
      // Fallback tracking info
      return [
        {
          status: 'In Transit',
          location: 'Sorting Facility',
          timestamp: new Date().toISOString(),
          description: 'Package is on its way',
        },
      ];
    }
  },

  // Return Requests
  fetchReturnRequests: async (): Promise<ReturnRequest[]> => {
    const response = await api.get("/returns");
    return response.data;
  },
  
  addReturnRequest: async (request: ReturnRequest): Promise<ReturnRequest> => {
    const response = await api.post("/returns", request);
    return response.data;
  },
  
  updateReturnRequest: async (request: Partial<ReturnRequest> & { id: string }): Promise<ReturnRequest> => {
    const response = await api.put(`/returns/${request.id}`, request);
    return response.data;
  },

  // Transactions
  fetchTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get("/transactions");
    return response.data;
  },
  
  addTransaction: async (transaction: Omit<Transaction, 'id' | 'date' | 'processedBy'>): Promise<Transaction> => {
    const response = await api.post("/transactions", transaction);
    return response.data;
  },
  
  processPayout: async (data: { sellerId: number; currency: string }) => {
    const response = await api.post("/transactions/payout", data);
    return response.data;
  },

  // Integration Settings
  fetchIntegrationSettings: async (): Promise<IntegrationSettings | null> => {
    try {
      const response = await api.get("/integrations");
      return response.data;
    } catch {
      return null;
    }
  },
  
  updateIntegrationSettings: async (settings: IntegrationSettings): Promise<IntegrationSettings> => {
    const response = await api.put("/integrations", settings);
    return response.data;
  },

  // Homepage Content
  fetchHomePageContent: async (): Promise<HomePageContent | null> => {
    try {
      const response = await api.get("/content/homepage");
      return response.data;
    } catch {
      return null;
    }
  },
  
  updateHomePageContent: async (content: HomePageContent): Promise<HomePageContent> => {
    const response = await api.put("/content/homepage", content);
    return response.data;
  },

  // Theme Unlock
  unlockTheme: async (sellerId: number, themeId: string): Promise<Seller> => {
    const response = await api.post(`/sellers/${sellerId}/unlock-theme`, { themeId });
    return response.data;
  },
  
  // Themes (legacy)
  addTheme: async (theme: ThemeConfiguration): Promise<ThemeConfiguration> => {
    const response = await api.post("/platform/themes", theme);
    return response.data;
  },
  
  updateTheme: async (theme: ThemeConfiguration): Promise<ThemeConfiguration> => {
    const response = await api.put(`/platform/themes/${theme.id}`, theme);
    return response.data;
  },
};

export default api;
