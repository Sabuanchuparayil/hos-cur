import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://hos-backend-production-31dc.up.railway.app";

console.log("Real API Base URL:", BASE_URL);

export const realApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" }
});

// Example passthrough endpoints (add more if needed)
export const realAuth = {
  login: (email, password) => realApi.post("/auth/login", { email, password }),
  register: (data) => realApi.post("/auth/register", data),
};

export const realData = {
  getProducts: () => realApi.get("/products"),
  getProduct: (id) => realApi.get(`/products/${id}`),
  getThemes: () => realApi.get("/platform/themes"),
};

export default realApi;
