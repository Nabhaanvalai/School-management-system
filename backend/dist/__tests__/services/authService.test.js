"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authService_1 = require("../../services/authService");
const User_1 = require("../../models/User");
const jwtUtils_1 = require("../../utils/jwtUtils");
const passwordUtils_1 = require("../../utils/passwordUtils");
// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../utils/jwtUtils');
jest.mock('../../utils/passwordUtils');
const MockedUser = User_1.User;
const MockedJWTUtils = jwtUtils_1.JWTUtils;
const MockedPasswordUtils = passwordUtils_1.PasswordUtils;
describe('AuthService', () => {
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockUser = {
        _id: mockUserId,
        email: 'test@example.com',
        role: 'admin',
        profile: { name: 'Test Admin', employeeId: 'EMP001', department: 'IT', phone: '1234567890' },
        isActive: true,
        comparePassword: jest.fn(),
        save: jest.fn(),
        toString: () => mockUserId
    };
    const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: '15m'
    };
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mocks
        MockedJWTUtils.generateTokenPair.mockReturnValue(mockTokens);
        MockedJWTUtils.verifyRefreshToken.mockReturnValue({
            userId: mockUserId,
            tokenVersion: 1234567890
        });
        MockedJWTUtils.verifyAccessToken.mockReturnValue({
            userId: mockUserId,
            email: mockUser.email,
            role: mockUser.role
        });
    });
    describe('login', () => {
        it('should successfully authenticate valid user', async () => {
            // Setup mocks
            MockedUser.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            mockUser.comparePassword.mockResolvedValue(true);
            const result = await authService_1.AuthService.login('test@example.com', 'password123');
            expect(result.success).toBe(true);
            expect(result.user).toEqual({
                id: mockUserId,
                email: mockUser.email,
                role: mockUser.role,
                profile: mockUser.profile,
                isActive: mockUser.isActive
            });
            expect(result.tokens).toEqual(mockTokens);
            expect(MockedUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        });
        it('should fail with missing email or password', async () => {
            const result1 = await authService_1.AuthService.login('', 'password123');
            const result2 = await authService_1.AuthService.login('test@example.com', '');
            expect(result1.success).toBe(false);
            expect(result1.message).toBe('Email and password are required');
            expect(result2.success).toBe(false);
            expect(result2.message).toBe('Email and password are required');
        });
        it('should fail with non-existent user', async () => {
            MockedUser.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });
            const result = await authService_1.AuthService.login('nonexistent@example.com', 'password123');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid email or password');
        });
        it('should fail with inactive user', async () => {
            const inactiveUser = { ...mockUser, isActive: false };
            MockedUser.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(inactiveUser)
            });
            const result = await authService_1.AuthService.login('test@example.com', 'password123');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Account is deactivated. Please contact administrator.');
        });
        it('should fail with incorrect password', async () => {
            MockedUser.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            mockUser.comparePassword.mockResolvedValue(false);
            const result = await authService_1.AuthService.login('test@example.com', 'wrongpassword');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid email or password');
        });
        it('should handle database errors gracefully', async () => {
            MockedUser.findOne.mockImplementation(() => {
                throw new Error('Database error');
            });
            const result = await authService_1.AuthService.login('test@example.com', 'password123');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Authentication failed. Please try again.');
        });
    });
    describe('refreshToken', () => {
        beforeEach(() => {
            // Clear the refresh token store before each test
            authService_1.AuthService.cleanupExpiredTokens();
        });
        it('should successfully refresh valid token', async () => {
            // First, simulate a login to store a refresh token
            MockedUser.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            mockUser.comparePassword.mockResolvedValue(true);
            const loginResult = await authService_1.AuthService.login('test@example.com', 'password123');
            const refreshToken = loginResult.tokens.refreshToken;
            // Mock user lookup for refresh
            MockedUser.findById.mockResolvedValue(mockUser);
            const result = await authService_1.AuthService.refreshToken(refreshToken);
            expect(result.success).toBe(true);
            expect(result.tokens).toBeDefined();
            expect(result.tokens.accessToken).toBeDefined();
            expect(result.tokens.refreshToken).toBeDefined();
        });
        it('should fail with missing refresh token', async () => {
            const result = await authService_1.AuthService.refreshToken('');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Refresh token is required');
        });
        it('should fail with invalid refresh token', async () => {
            MockedJWTUtils.verifyRefreshToken.mockImplementation(() => {
                throw new Error('Invalid refresh token');
            });
            const result = await authService_1.AuthService.refreshToken('invalid-token');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Token refresh failed');
        });
        it('should fail with non-existent user', async () => {
            // First login to create a valid refresh token
            MockedUser.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            mockUser.comparePassword.mockResolvedValue(true);
            const loginResult = await authService_1.AuthService.login('test@example.com', 'password123');
            const refreshToken = loginResult.tokens.refreshToken;
            // Mock user not found for refresh
            MockedUser.findById.mockResolvedValue(null);
            const result = await authService_1.AuthService.refreshToken(refreshToken);
            expect(result.success).toBe(false);
            expect(result.message).toBe('User not found or inactive');
        });
    });
    describe('logout', () => {
        it('should successfully logout with valid refresh token', async () => {
            // First login to create a refresh token
            MockedUser.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            mockUser.comparePassword.mockResolvedValue(true);
            const loginResult = await authService_1.AuthService.login('test@example.com', 'password123');
            const refreshToken = loginResult.tokens.refreshToken;
            const result = await authService_1.AuthService.logout(refreshToken);
            expect(result).toBe(true);
        });
        it('should return false for empty refresh token', async () => {
            const result = await authService_1.AuthService.logout('');
            expect(result).toBe(false);
        });
        it('should return false for non-existent refresh token', async () => {
            const result = await authService_1.AuthService.logout('non-existent-token');
            expect(result).toBe(false);
        });
    });
    describe('validateAccessToken', () => {
        it('should validate valid access token', () => {
            const mockPayload = {
                userId: mockUserId,
                email: mockUser.email,
                role: mockUser.role
            };
            MockedJWTUtils.verifyAccessToken.mockReturnValue(mockPayload);
            const result = authService_1.AuthService.validateAccessToken('valid-token');
            expect(result.isValid).toBe(true);
            expect(result.payload).toEqual(mockPayload);
        });
        it('should fail validation for empty token', () => {
            const result = authService_1.AuthService.validateAccessToken('');
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Access token is required');
        });
        it('should fail validation for invalid token', () => {
            MockedJWTUtils.verifyAccessToken.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            const result = authService_1.AuthService.validateAccessToken('invalid-token');
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Invalid token');
        });
    });
    describe('getUserById', () => {
        it('should return user for valid ID', async () => {
            MockedUser.findById.mockResolvedValue(mockUser);
            const result = await authService_1.AuthService.getUserById(mockUserId);
            expect(result).toEqual(mockUser);
            expect(MockedUser.findById).toHaveBeenCalledWith(mockUserId);
        });
        it('should return null for invalid ID', async () => {
            MockedUser.findById.mockResolvedValue(null);
            const result = await authService_1.AuthService.getUserById('invalid-id');
            expect(result).toBeNull();
        });
        it('should handle database errors', async () => {
            MockedUser.findById.mockRejectedValue(new Error('Database error'));
            const result = await authService_1.AuthService.getUserById(mockUserId);
            expect(result).toBeNull();
        });
    });
    describe('changePassword', () => {
        it('should successfully change password', async () => {
            MockedPasswordUtils.validatePasswordStrength.mockReturnValue({
                isValid: true,
                messages: []
            });
            MockedUser.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            mockUser.comparePassword.mockResolvedValue(true);
            mockUser.save.mockResolvedValue(mockUser);
            const result = await authService_1.AuthService.changePassword(mockUserId, 'oldpassword', 'newpassword123');
            expect(result.success).toBe(true);
            expect(result.message).toBe('Password changed successfully');
            expect(mockUser.save).toHaveBeenCalled();
        });
        it('should fail with weak password', async () => {
            MockedPasswordUtils.validatePasswordStrength.mockReturnValue({
                isValid: false,
                messages: ['Password too weak']
            });
            const result = await authService_1.AuthService.changePassword(mockUserId, 'oldpassword', 'weak');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Password too weak');
        });
        it('should fail with incorrect current password', async () => {
            MockedPasswordUtils.validatePasswordStrength.mockReturnValue({
                isValid: true,
                messages: []
            });
            MockedUser.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            mockUser.comparePassword.mockResolvedValue(false);
            const result = await authService_1.AuthService.changePassword(mockUserId, 'wrongpassword', 'newpassword123');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Current password is incorrect');
        });
        it('should fail with non-existent user', async () => {
            MockedPasswordUtils.validatePasswordStrength.mockReturnValue({
                isValid: true,
                messages: []
            });
            MockedUser.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });
            const result = await authService_1.AuthService.changePassword('invalid-id', 'oldpassword', 'newpassword123');
            expect(result.success).toBe(false);
            expect(result.message).toBe('User not found');
        });
    });
    describe('utility methods', () => {
        it('should clean up expired tokens', () => {
            // This method doesn't return anything, just ensure it doesn't throw
            expect(() => authService_1.AuthService.cleanupExpiredTokens()).not.toThrow();
        });
        it('should return refresh token count', () => {
            const count = authService_1.AuthService.getRefreshTokenCount();
            expect(typeof count).toBe('number');
            expect(count).toBeGreaterThanOrEqual(0);
        });
        it('should revoke all user tokens', () => {
            const revokedCount = authService_1.AuthService.revokeAllUserTokens(mockUserId);
            expect(typeof revokedCount).toBe('number');
            expect(revokedCount).toBeGreaterThanOrEqual(0);
        });
    });
});
//# sourceMappingURL=authService.test.js.map