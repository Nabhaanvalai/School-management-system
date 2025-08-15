import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';

// Mock AuthProvider for testing
interface MockAuthProviderProps {
  children: React.ReactNode;
  mockUser?: any;
  mockIsAuthenticated?: boolean;
  mockIsLoading?: boolean;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({
  children,
  mockUser = null,
  mockIsAuthenticated = false,
  mockIsLoading = false,
}) => {
  const mockAuthContext = {
    user: mockUser,
    token: mockUser ? 'mock-token' : null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
  };

  return (
    <div data-testid="mock-auth-provider">
      {React.cloneElement(children as ReactElement, { mockAuthContext })}
    </div>
  );
};

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock user objects for testing
export const mockUsers = {
  admin: {
    _id: '1',
    email: 'admin@school.com',
    role: 'admin' as const,
    profile: {
      name: 'Admin User',
      employeeId: 'EMP001',
    },
    isActive: true,
  },
  teacher: {
    _id: '2',
    email: 'teacher@school.com',
    role: 'teacher' as const,
    profile: {
      name: 'Teacher User',
      employeeId: 'EMP002',
      subjects: ['Math', 'Science'],
    },
    isActive: true,
  },
  student: {
    _id: '3',
    email: 'student@school.com',
    role: 'student' as const,
    profile: {
      name: 'Student User',
      rollNo: 'STU001',
      standard: '10',
      section: 'A',
    },
    isActive: true,
  },
};