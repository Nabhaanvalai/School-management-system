import React from 'react';
import { screen } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { RoleGuard, AdminOnly, TeacherOnly, StudentOnly, AdminOrTeacher } from '../RoleGuard';
import { render, mockUsers } from '../../../test/test-utils';
import { useAuth } from '../../../context/AuthContext';

// Mock the useAuth hook
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('RoleGuard', () => {
  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;
  const FallbackComponent = () => <div data-testid="fallback-content">Fallback Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <RoleGuard allowedRoles={['admin']}>
        <TestComponent />
      </RoleGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('renders children when user has allowed role', () => {
    mockUseAuth.mockReturnValue({
      user: mockUsers.admin,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <RoleGuard allowedRoles={['admin']}>
        <TestComponent />
      </RoleGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('renders access denied when user does not have allowed role', () => {
    mockUseAuth.mockReturnValue({
      user: mockUsers.student,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <RoleGuard allowedRoles={['admin']}>
        <TestComponent />
      </RoleGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/Your current role \(student\) is not authorized/)).toBeInTheDocument();
    expect(screen.getByText('Required roles: admin')).toBeInTheDocument();
  });

  it('renders fallback component when provided and user lacks permission', () => {
    mockUseAuth.mockReturnValue({
      user: mockUsers.teacher,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <RoleGuard allowedRoles={['admin']} fallback={<FallbackComponent />}>
        <TestComponent />
      </RoleGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('allows multiple roles', () => {
    mockUseAuth.mockReturnValue({
      user: mockUsers.teacher,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <RoleGuard allowedRoles={['admin', 'teacher']}>
        <TestComponent />
      </RoleGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  describe('Convenience Components', () => {
    it('AdminOnly allows only admin users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUsers.admin,
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <AdminOnly>
          <TestComponent />
        </AdminOnly>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('AdminOnly denies non-admin users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUsers.teacher,
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <AdminOnly>
          <TestComponent />
        </AdminOnly>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('TeacherOnly allows only teacher users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUsers.teacher,
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <TeacherOnly>
          <TestComponent />
        </TeacherOnly>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('StudentOnly allows student and parent users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUsers.student,
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <StudentOnly>
          <TestComponent />
        </StudentOnly>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('AdminOrTeacher allows both admin and teacher users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUsers.teacher,
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <AdminOrTeacher>
          <TestComponent />
        </AdminOrTeacher>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('AdminOrTeacher denies student users', () => {
      mockUseAuth.mockReturnValue({
        user: mockUsers.student,
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <AdminOrTeacher>
          <TestComponent />
        </AdminOrTeacher>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });
});