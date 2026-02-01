import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://element-manager-backend.onrender.com/api';

export interface Item {
  id: number;
  name: string;
}

export interface SelectedItem extends Item {
  order: number;
}

export interface ItemsResponse {
  items: Item[];
  total: number;
}

export interface SelectedItemsResponse {
  items: SelectedItem[];
  total: number;
}

export interface StateResponse {
  selectedIds: number[];
  selectedOrder: number[];
  nextId: number;
  nextOrder: number;
}

export const api = {
  getItems: async (filter: string = '', page: number = 0): Promise<ItemsResponse> => {
    const response = await axios.get(`${API_URL}/items`, {
      params: { filter, page }
    });
    return response.data;
  },

  getSelected: async (filter: string = '', page: number = 0): Promise<SelectedItemsResponse> => {
    const response = await axios.get(`${API_URL}/selected`, {
      params: { filter, page }
    });
    return response.data;
  },

  addItem: async (name: string): Promise<Item> => {
    const response = await axios.post(`${API_URL}/items`, { name });
    return response.data;
  },

  selectItem: async (id: number): Promise<SelectedItem> => {
    const response = await axios.post(`${API_URL}/select/${id}`);
    return response.data;
  },

  unselectItem: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/select/${id}`);
  },

  reorderItems: async (itemIds: number[]): Promise<void> => {
    await axios.put(`${API_URL}/reorder`, { itemIds });
  },

  getState: async (): Promise<StateResponse> => {
    const response = await axios.get(`${API_URL}/state`);
    return response.data;
  },

  saveState: async (selectedIds: number[], selectedOrder: number[]): Promise<void> => {
    await axios.post(`${API_URL}/state`, { selectedIds, selectedOrder });
  }
};