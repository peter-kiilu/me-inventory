/**
 * API Client Service
 * Handles all HTTP requests to the backend API
 */
import axios from "axios";
import type { AxiosInstance, AxiosError } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Load token from localStorage
    this.token = localStorage.getItem("token");
    if (this.token) {
      this.setAuthToken(this.token);
    }

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          this.clearAuth();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  }

  clearAuth() {
    this.token = null;
    delete this.client.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Auth
  async login(pin: string) {
    const response = await this.client.post("/auth/login", { pin });
    this.setAuthToken(response.data.access_token);
    return response.data;
  }

  // Products
  async getProducts(params?: {
    category?: string;
    skip?: number;
    limit?: number;
  }) {
    const response = await this.client.get("/products/", { params });
    return response.data;
  }

  async getProduct(id: number) {
    const response = await this.client.get(`/products/${id}`);
    return response.data;
  }

  async createProduct(data: any) {
    const response = await this.client.post("/products/", data);
    return response.data;
  }

  async updateProduct(id: number, data: any) {
    const response = await this.client.put(`/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: number) {
    const response = await this.client.delete(`/products/${id}`);
    return response.data;
  }

  async getCategories() {
    const response = await this.client.get("/products/categories/list");
    return response.data;
  }

  // Inventory
  async getInventory(params?: {
    low_stock?: boolean;
    skip?: number;
    limit?: number;
  }) {
    const response = await this.client.get("/inventory/", { params });
    return response.data;
  }

  async getProductInventory(productId: number) {
    const response = await this.client.get(`/inventory/${productId}`);
    return response.data;
  }

  async updateInventory(productId: number, data: any) {
    const response = await this.client.put(`/inventory/${productId}`, data);
    return response.data;
  }

  async adjustInventory(productId: number, adjustment: number) {
    const response = await this.client.post(
      `/inventory/${productId}/adjust`,
      null,
      {
        params: { adjustment },
      }
    );
    return response.data;
  }

  // Sales
  async getSales(params?: { days?: number; skip?: number; limit?: number }) {
    const response = await this.client.get("/sales/", { params });
    return response.data;
  }

  async getSale(id: number) {
    const response = await this.client.get(`/sales/${id}`);
    return response.data;
  }

  async createSale(data: {
    items: Array<{ product_id: number; quantity: number }>;
  }) {
    const response = await this.client.post("/sales/", data);
    return response.data;
  }

  async deleteSale(id: number, restoreInventory: boolean = true) {
    const response = await this.client.delete(`/sales/${id}`, {
      params: { restore_inventory: restoreInventory },
    });
    return response.data;
  }

  // Sync
  async addToSyncQueue(data: { transaction_type: string; payload: string }) {
    const response = await this.client.post("/sync/queue", data);
    return response.data;
  }

  async getSyncQueue(status?: string) {
    const response = await this.client.get("/sync/queue", {
      params: { status_filter: status },
    });
    return response.data;
  }

  async processSyncQueue() {
    const response = await this.client.post("/sync/process");
    return response.data;
  }

  // Analytics
  async getDashboardAnalytics(days: number = 30) {
    const response = await this.client.get("/analytics/dashboard", {
      params: { days },
    });
    return response.data;
  }

  async getLowStockReport() {
    const response = await this.client.get("/analytics/low-stock");
    return response.data;
  }

  async getRevenueTrend(days: number = 30) {
    const response = await this.client.get("/analytics/revenue-trend", {
      params: { days },
    });
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
