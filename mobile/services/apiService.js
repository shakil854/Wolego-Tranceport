import { getApiBaseUrl } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function request(endpoint, options = {}) {
  const baseUrl = await getApiBaseUrl();
  const token = await AsyncStorage.getItem("wolego_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = token;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

export const apiService = {
  // Auth
  login: async (username, password) => {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  changePassword: async (payload) => {
    return request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  verifyActionPassword: async (password, username, id) => {
    return request("/auth/verify-password", {
      method: "POST",
      body: JSON.stringify({ password, username, id }),
    });
  },

  changeActionPassword: async (payload) => {
    return request("/auth/change-action-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Parties
  getParties: async () => {
    return request("/parties");
  },

  saveParty: async (partyData) => {
    return request("/parties", {
      method: "POST",
      body: JSON.stringify(partyData),
    });
  },

  deleteParty: async (id) => {
    return request(`/parties/${id}`, {
      method: "DELETE",
    });
  },

  // LR Entries
  getLREntries: async () => {
    return request("/lr-entries");
  },

  saveLREntry: async (lrData) => {
    const isEdit = !!lrData.id;
    return request(isEdit ? `/lr-entries/${lrData.id}` : "/lr-entries", {
      method: isEdit ? "PUT" : "POST",
      body: JSON.stringify(lrData),
    });
  },

  deleteLREntry: async (id) => {
    return request(`/lr-entries/${id}`, {
      method: "DELETE",
    });
  },

  // Trucks
  getTrucks: async () => {
    return request("/trucks");
  },

  saveTruck: async (truckData) => {
    return request("/trucks", {
      method: "POST",
      body: JSON.stringify(truckData),
    });
  },

  deleteTruck: async (id) => {
    return request(`/trucks/${id}`, {
      method: "DELETE",
    });
  },

  // Truck Payments
  getTruckPayments: async () => {
    return request("/truck-payments");
  },

  saveTruckPayment: async (paymentData) => {
    return request("/truck-payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  },

  deleteTruckPayment: async (id) => {
    return request(`/truck-payments/${id}`, {
      method: "DELETE",
    });
  },

  // Party Orders
  getPartyOrders: async () => {
    return request("/party-orders");
  },

  savePartyOrder: async (orderData) => {
    return request("/party-orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  updatePartyOrderStatus: async (id, status) => {
    return request(`/party-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  deletePartyOrder: async (id) => {
    return request(`/party-orders/${id}`, {
      method: "DELETE",
    });
  },

  // Truck Orders
  getTruckOrders: async () => {
    return request("/truck-orders");
  },

  saveTruckOrder: async (orderData) => {
    return request("/truck-orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  updateTruckOrderStatus: async (id, status) => {
    return request(`/truck-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  deleteTruckOrder: async (id) => {
    return request(`/truck-orders/${id}`, {
      method: "DELETE",
    });
  },
};
