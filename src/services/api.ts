// api.ts → unified API wrapper for real backend + mock fallback
import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://hos-backend-production-31dc.up.railway.app";

console.log("API Base URL:", BASE_URL);

export const real = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" }
});

// MOCK imports
import { MOCK_PRODUCTS } from "../data/products";
import { MOCK_THEME_CONFIGURATIONS } from "../data/themes";

export const API = {
  // REAL BACKEND CALLS
  fetchPlatformThemes: async () => {
    try {
      const r = await real.get("/platform/themes");
      return r.data;
    } catch {
      return MOCK_THEME_CONFIGURATIONS;
    }
  },

  fetchProducts: async () => {
    try {
      const r = await real.get("/products");
      return r.data;
    } catch {
      return MOCK_PRODUCTS;
    }
  }
};
