import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/authService';
import { mockUsers } from '../../test/test-utils';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getToken: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

const mockAuthService = authService as any;

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with default state', () => {
    mockAuthService.getToken.mockReturnValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('initializes with existing token and validates it', async () => {
    mockAuthService.getToken.mockReturnValue('existing-token');
    mockAuthService.refreshToken.mockResolvedValue({ token: 'new-token' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockAuthService.refreshToken).toHaveBeenCalled();
  });

  it('clears tokens when validation fails', async () => {
    mockAuthService.getToken.mockReturnValue('invalid-token');
    mockAuthService.refreshToken.mockRejectedValue(new Error('Token invalid'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockAuthService.clearTokens).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles successful login', async () => {
    const mockResponse = {
      user: mockUsers.admin,
      token: 'new-token',
      refreshToken: 'new-refresh-token',
    };

    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.login.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: 'admin@school.com',
        password: 'password123',
      });
    });

    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'admin@school.com',
      password: 'password123',
    });
    expect(mockAuthService.setTokens).toHaveBeenCalledWith('new-token', 'new-refresh-token');
    expect(result.current.user).toEqual(mockUsers.admin);
    expect(result.current.token).toBe('new-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles login failure', async () => {
    const loginError = new Error('Invalid credentials');
    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.login.mockRejectedValue(loginError);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.login({
          email: 'admin@school.com',
          password: 'wrongpassword',
        });
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles logout', async () => {
    // First login
    const mockResponse = {
      user: mockUsers.admin,
      token: 'token',
      refreshToken: 'refresh-token',
    };

    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.login.mockResolvedValue(mockResponse);
    mockAuthService.logout.mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: 'admin@school.com',
        password: 'password123',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Then logout
    await act(async () => {
      await result.current.logout();
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles logout even when service fails', async () => {
    // First login
    const mockResponse = {
      user: mockUsers.admin,
      token: 'token',
      refreshToken: 'refresh-token',
    };

    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.login.mockResolvedValue(mockResponse);
    mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: 'admin@school.com',
        password: 'password123',
      });
    });

    // Logout should still clear state even if service fails
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles token refresh', async () => {
    mockAuthService.getToken.mockReturnValue('old-token');
    mockAuthService.refreshToken.mockResolvedValue({ token: 'new-token' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refreshToken();
    });

    expect(mockAuthService.refreshToken).toHaveBeenCalled();
    expect(mockAuthService.setTokens).toHaveBeenCalledWith('new-token', 'old-token');
    expect(result.current.token).toBe('new-token');
  });

  it('handles refresh token failure', async () => {
    mockAuthService.getToken.mockReturnValue('old-token');
    mockAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.refreshToken();
      })
    ).rejects.toThrow('Refresh failed');

    expect(mockAuthService.clearTokens).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});