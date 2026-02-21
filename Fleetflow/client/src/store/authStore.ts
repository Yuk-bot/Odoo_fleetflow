import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  role: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<any>;
}

export const useAuthStore = create<AuthState>((set) => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  return {
    user: null,
    token: token,
    login: async (email: string, password: string) => {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ user, token });
    },

    register: async (email: string, password: string, name: string, role: string) => {
    const response = await axios.post('/api/auth/register', { email, password, name, role });
    return response.data;
    },

    logout: () => {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      set({ user: null, token: null });
    },
    checkAuth: async () => {
      if (!token) return;
      try {
        const response = await axios.get('/api/auth/me');
        set({ user: response.data });
      } catch {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        set({ user: null, token: null });
      }
    },
  };
});

