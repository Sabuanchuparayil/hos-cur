import axios from "axios";

import { MOCK_USERS } from "../data/users";
import { MOCK_PRODUCTS } from "../data/products";
import { MOCK_SELLERS } from "../data/sellers";
import { MOCK_CARRIERS } from "../data/carriers";
import { MOCK_PROMOTIONS } from "../data/promotions";
import { MOCK_THEME_CONFIGURATIONS } from "../data/themes";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://hos-backend-production-31dc.up.railway.app";

console.log("API Base URL:", BASE_URL);

const real = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

export const apiService = {
  fetchProducts: async () => {
    try {
      return (await real.get("/products")).data;
    } catch {
      return MOCK_PRODUCTS;
    }
  },

  fetchSellers: async () => {
    try {
      return (await real.get("/sellers")).data;
    } catch {
      return MOCK_SELLERS;
    }
  },

  fetchCarriers: async () => {
    try {
      return (await real.get("/carriers")).data;
    } catch {
      return MOCK_CARRIERS;
    }
  },

  fetchPromotions: async () => {
    try {
      return (await real.get("/promotions")).data;
    } catch {
      return MOCK_PROMOTIONS;
    }
  },

  fetchPlatformThemes: async () => {
    try {
      return (await real.get("/platform/themes")).data;
    } catch {
      console.warn("Themes API failed → using mock themes");
      return MOCK_THEME_CONFIGURATIONS;
    }
  }
};
