// ============================================
// LOCALIZED CONTENT
// ============================================
export interface LocalizedString {
  en: string;
  es?: string;
  [key: string]: string | undefined;
}

// ============================================
// MULTI-CURRENCY
// ============================================
export type Currency = 'GBP' | 'USD' | 'EUR' | 'JPY';

export interface MultiCurrencyPrice {
  GBP?: number;
  USD?: number;
  EUR?: number;
  JPY?: number;
  [key: string]: number | undefined;
}

// ============================================
// USER & AUTH
// ============================================
export interface UserAddress {
  id?: number;
  isDefault?: boolean;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  loyaltyPoints?: number;
  role: 'admin' | 'seller' | 'customer' | 'finance_manager' | 'accountant' | 'order_manager' | 'shipping_coordinator' | 'support_agent' | 'content_moderator' | 'marketing_manager' | 'warehouse_operative' | 'logistics_coordinator' | 'customer_support_lead' | 'catalog_manager' | 'delivery_coordinator';
  createdAt?: string;
  addresses?: UserAddress[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

// ============================================
// PRODUCTS
// ============================================
export interface ProductMedia {
  type: 'image' | 'video' | 'image_360';
  url: string;
}

export interface InventoryLocation {
  centreId: string;
  name: string;
  stock: number;
}

export interface ProductVariation {
  id?: number;
  sku: string;
  name: string;
  optionValues: Record<string, string>;
  inventory: InventoryLocation[];
}

export interface ProductTaxonomy {
  fandom: string;
  subCategory: string;
}

export interface Product {
  id: number;
  name: LocalizedString;
  description: LocalizedString;
  pricing: MultiCurrencyPrice;
  rrp?: MultiCurrencyPrice;
  tradePrice?: MultiCurrencyPrice;
  media: ProductMedia[];
  taxonomy: ProductTaxonomy;
  sku: string;
  barcode?: string;
  inventory: InventoryLocation[];
  sellerId: number;
  hasVariations?: boolean;
  variations?: ProductVariation[];
  fulfillmentModel?: 'HoS Warehouse' | 'Seller Direct' | 'Dropship';
}

export interface ProductWithTotalStock extends Product {
  stock: number;
  averageRating: number;
  reviewCount: number;
}

// ============================================
// ORDERS
// ============================================
export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PaymentDetails {
  method: string;
  transactionId?: string;
  last4?: string;
}

export interface OrderAuditLogEntry {
  timestamp: string;
  user: string;
  previousStatus?: string;
  newStatus: string;
  notes?: string;
}

export interface OrderItem extends Product {
  quantity: number;
  variationId?: number;
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentDetails?: PaymentDetails;
  currency: Currency;
  subtotal: number;
  shippingCost: number;
  taxes: number;
  discountAmount?: number;
  platformFee?: { local: number; base: number };
  total: number;
  status: string;
  sellerPayout?: number;
  shippingMethod?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingNotes?: string;
  auditLog?: OrderAuditLogEntry[];
}

// ============================================
// SELLERS
// ============================================
export interface AuditLogEntry {
  action: string;
  admin: string;
  timestamp: string;
  notes?: string;
}

export interface SellerTheme {
  name?: string;
  activeTheme?: string;
  customizations?: Record<string, string>;
}

export interface SellerFinancials {
  balance: MultiCurrencyPrice;
  pendingBalance?: MultiCurrencyPrice;
  totalEarnings?: MultiCurrencyPrice;
  payoutHistory?: PayoutRecord[];
  transactionLog?: Transaction[];
  payoutProvider?: string | null;
  payoutAccountId?: string | null;
  kycStatus?: 'not_started' | 'pending' | 'verified' | 'rejected';
}

export interface SellerPerformance {
  totalSales: number;
  totalOrders?: number;
  averageRating: number;
  activeListings?: number;
}

export interface Seller {
  id: number;
  userId?: number;
  name: string;
  businessName?: string;
  contactEmail: string;
  businessAddress?: ShippingAddress;
  productCategories?: string[];
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  applicationDate?: string;
  isVerified: boolean;
  payoutsEnabled: boolean;
  theme?: SellerTheme;
  unlockedThemes?: string[];
  financials?: SellerFinancials;
  performance?: SellerPerformance;
  auditLog: AuditLogEntry[];
}

export interface PayoutRecord {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  reference?: string;
}

// ============================================
// RETURNS
// ============================================
export interface ReturnRequestItem {
  productId: number;
  quantity: number;
  variationId?: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  items?: ReturnRequestItem[];
  reason?: string;
  reasonCode?: string;
  reasonDetail?: string;
  details?: string;
  status: string;
  requestDate?: string;
  createdAt?: string;
  resolutionType?: string;
  resolutionDate?: string;
  adminNotes?: string;
  returnLabel?: string;
  refundAmount?: number;
  refundMethod?: string;
}

// ============================================
// REVIEWS
// ============================================
export interface ProductReview {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment?: string;
  isVerifiedPurchase: boolean;
  date: string;
}

// ============================================
// TRANSACTIONS
// ============================================
export interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  referenceId?: string;
  reference?: string;
  sellerId?: number;
  processedBy?: string;
  status?: string;
}

// ============================================
// PROMOTIONS
// ============================================
export interface Promotion {
  id: number;
  code: string;
  type: 'percentage' | 'fixed' | 'freeShipping';
  value?: number;
  description?: string;
  minPurchase?: number;
  maxUses?: number;
  usedCount?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  applicableTo?: string[];
}

// ============================================
// CARRIERS
// ============================================
export interface CarrierService {
  id: string;
  name: string;
  estimatedDays: number;
  price: number;
}

export interface Carrier {
  id: number;
  name: string;
  code: string;
  trackingUrl?: string;
  logo?: string;
  isActive: boolean;
  services?: CarrierService[] | string[];
  rates?: Record<string, number>;
}

// ============================================
// THEMES
// ============================================
export type Theme = 'dark' | 'light' | 'gryffindor' | 'slytherin' | 'ollivanders' | 'gringotts' | 'wholesale' | 'halloween' | 'winter' | string;

export type HomePageLayoutId = 'standard' | 'featured' | 'enchanted';

export type ProductPageLayoutId = 'classic-split' | 'image-focused-stack';

export interface ThemeHero {
  image: string;
  title: LocalizedString;
  subtitle: LocalizedString;
}

export interface ThemeConfiguration {
  id: string;
  name: string;
  description?: string;
  preview?: string;
  layout: HomePageLayoutId;
  productPageLayout?: ProductPageLayoutId;
  hero?: ThemeHero;
  price?: number;
  isDefault?: boolean;
  isCustom?: boolean;
  isPremium?: boolean;
  isAvailable?: boolean;
  cssContent?: string;
  variables?: Record<string, string>;
}

// ============================================
// HOMEPAGE CONTENT
// ============================================
export interface HomeBanner {
  id: string;
  image: string;
  title: LocalizedString;
  subtitle?: LocalizedString;
  link?: string;
  isActive: boolean;
}

export interface HomePageContent {
  heroTitle?: LocalizedString;
  heroSubtitle?: LocalizedString;
  heroImage?: string;
  featuredProductIds?: number[];
  banners?: HomeBanner[];
  announcement?: LocalizedString;
}

// ============================================
// INTEGRATIONS
// ============================================
export interface IntegrationConfig {
  enabled: boolean;
  testMode?: boolean;
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
}

export interface IntegrationSettings {
  payment?: {
    stripe?: IntegrationConfig;
    paypal?: IntegrationConfig;
  };
  shipping?: {
    royalMail?: IntegrationConfig;
    dhl?: IntegrationConfig;
  };
  analytics?: {
    googleAnalytics?: IntegrationConfig;
  };
  email?: {
    sendgrid?: IntegrationConfig;
  };
  [key: string]: Record<string, IntegrationConfig> | undefined;
}

// ============================================
// WISHLIST
// ============================================
export interface WishlistItem {
  id: number;
  productId: number;
  addedAt: string;
  product?: Product;
}

// ============================================
// LOGISTICS
// ============================================
export interface ShipmentTracking {
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
  events?: {
    timestamp: string;
    location?: string;
    description: string;
  }[];
}

// ============================================
// CHAT
// ============================================
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

