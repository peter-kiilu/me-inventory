/**
 * API Client Service
 * Handles all HTTP requests to the backend API
 */
import axios from "axios";
import type { AxiosInstance, AxiosError } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export interface UserInfo {
  user_id: number;
  username: string;
  role: "admin" | "staff";
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  role: "admin" | "staff";
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private userInfo: UserInfo | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Load token and user info from localStorage
    this.token = localStorage.getItem("token");
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      this.userInfo = JSON.parse(storedUserInfo);
    }
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
          window.location.href = "/";
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

  setUserInfo(userInfo: UserInfo) {
    this.userInfo = userInfo;
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
  }

  clearAuth() {
    this.token = null;
    this.userInfo = null;
    delete this.client.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUserInfo(): UserInfo | null {
    return this.userInfo;
  }

  isAdmin(): boolean {
    return this.userInfo?.role === "admin";
  }

  isStaff(): boolean {
    return this.userInfo?.role === "staff";
  }

  // Auth
  async login(username: string, pin: string): Promise<LoginResponse> {
    const response = await this.client.post("/auth/login", { username, pin });
    const data = response.data;
    this.setAuthToken(data.access_token);
    this.setUserInfo({
      user_id: data.user_id,
      username: data.username,
      role: data.role,
    });
    return data;
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

  async getInventorySummary() {
    const response = await this.client.get("/analytics/inventory-summary");
    return response.data;
  }

  // Users (Admin only)
  async getUsers(params?: { skip?: number; limit?: number }) {
    const response = await this.client.get("/users/", { params });
    return response.data;
  }

  async getUser(id: number) {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async createUser(data: { username: string; pin: string; role: string }) {
    const response = await this.client.post("/users/", data);
    return response.data;
  }

  async updateUser(
    id: number,
    data: { username?: string; pin?: string; role?: string; is_active?: number }
  ) {
    const response = await this.client.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: number) {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
