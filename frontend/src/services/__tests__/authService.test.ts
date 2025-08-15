import axios from 'axios';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { authService } from '../authService';
import { mockUsers } from '../../test/test-utils';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock axios.create
const mockAxiosInstance = {
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('makes POST request to login endpoint', async () => {
      const mockResponse = {
        data: {
          user: mockUsers.admin,
          token: 'mock-token',
          refreshToken: 'mock-refresh-token',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const credentials = {
        email: 'admin@school.com',
        password: 'password123',
      };

      const result = await authService.login(credentials);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/login', credentials);
      expect(result).toEqual(mockResponse.data);
    });

    it('throws error on login failure', async () => {
      const errorResponse = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
        },
      };

      mockAxiosInstance.post.mockRejectedValue(errorResponse);

      const credentials = {
        email: 'admin@school.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toEqual(errorResponse);
    });
  });

  describe('refreshToken', () => {
    it('makes POST request to refresh endpoint with stored token', async () => {
      localStorage.setItem('refreshToken', 'stored-refresh-token');

      const mockResponse = {
        data: { token: 'new-token' },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/refresh', {
        refreshToken: 'stored-refresh-token',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('throws error when no refresh token is available', async () => {
      localStorage.removeItem('refreshToken');

      await expect(authService.refreshToken()).rejects.toThrow(
        'No refresh token available'
      );
    });

    it('throws error on refresh failure', async () => {
      localStorage.setItem('refreshToken', 'invalid-refresh-token');

      const errorResponse = {
        response: {
          data: { message: 'Invalid refresh token' },
          status: 401,
        },
      };

      mockAxiosInstance.post.mockRejectedValue(errorResponse);

      await expect(authService.refreshToken()).rejects.toEqual(errorResponse);
    });
  });

  describe('logout', () => {
    it('makes POST request to logout endpoint and clears tokens', async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');

      mockAxiosInstance.post.mockResolvedValue({});

      await authService.logout();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logout');
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('clears tokens even when logout request fails', async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');

      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('token management', () => {
    it('setTokens stores tokens in localStorage', () => {
      authService.setTokens('test-token', 'test-refresh-token');

      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token');
    });

    it('getToken retrieves token from localStorage', () => {
      localStorage.setItem('token', 'stored-token');

      const token = authService.getToken();

      expect(token).toBe('stored-token');
    });

    it('getToken returns null when no token is stored', () => {
      localStorage.removeItem('token');

      const token = authService.getToken();

      expect(token).toBeNull();
    });

    it('clearTokens removes tokens from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('refreshToken', 'test-refresh-token');

      authService.clearTokens();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});