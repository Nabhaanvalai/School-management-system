"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passwordUtils_1 = require("../../utils/passwordUtils");
describe('PasswordUtils', () => {
    describe('hashPassword', () => {
        it('should hash a valid password', async () => {
            const password = 'testPassword123';
            const hashedPassword = await passwordUtils_1.PasswordUtils.hashPassword(password);
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.length).toBeGreaterThan(0);
        });
        it('should throw error for password shorter than 6 characters', async () => {
            const shortPassword = '12345';
            await expect(passwordUtils_1.PasswordUtils.hashPassword(shortPassword))
                .rejects.toThrow('Password must be at least 6 characters long');
        });
        it('should throw error for empty password', async () => {
            await expect(passwordUtils_1.PasswordUtils.hashPassword(''))
                .rejects.toThrow('Password must be at least 6 characters long');
        });
        it('should produce different hashes for the same password', async () => {
            const password = 'testPassword123';
            const hash1 = await passwordUtils_1.PasswordUtils.hashPassword(password);
            const hash2 = await passwordUtils_1.PasswordUtils.hashPassword(password);
            expect(hash1).not.toBe(hash2);
        });
    });
    describe('comparePassword', () => {
        it('should return true for matching passwords', async () => {
            const password = 'testPassword123';
            const hashedPassword = await passwordUtils_1.PasswordUtils.hashPassword(password);
            const isMatch = await passwordUtils_1.PasswordUtils.comparePassword(password, hashedPassword);
            expect(isMatch).toBe(true);
        });
        it('should return false for non-matching passwords', async () => {
            const password = 'testPassword123';
            const wrongPassword = 'wrongPassword456';
            const hashedPassword = await passwordUtils_1.PasswordUtils.hashPassword(password);
            const isMatch = await passwordUtils_1.PasswordUtils.comparePassword(wrongPassword, hashedPassword);
            expect(isMatch).toBe(false);
        });
        it('should return false for empty candidate password', async () => {
            const password = 'testPassword123';
            const hashedPassword = await passwordUtils_1.PasswordUtils.hashPassword(password);
            const isMatch = await passwordUtils_1.PasswordUtils.comparePassword('', hashedPassword);
            expect(isMatch).toBe(false);
        });
        it('should return false for empty hashed password', async () => {
            const password = 'testPassword123';
            const isMatch = await passwordUtils_1.PasswordUtils.comparePassword(password, '');
            expect(isMatch).toBe(false);
        });
    });
    describe('generateRandomPassword', () => {
        it('should generate password with default length of 12', () => {
            const password = passwordUtils_1.PasswordUtils.generateRandomPassword();
            expect(password.length).toBe(12);
        });
        it('should generate password with specified length', () => {
            const length = 16;
            const password = passwordUtils_1.PasswordUtils.generateRandomPassword(length);
            expect(password.length).toBe(length);
        });
        it('should generate different passwords on multiple calls', () => {
            const password1 = passwordUtils_1.PasswordUtils.generateRandomPassword();
            const password2 = passwordUtils_1.PasswordUtils.generateRandomPassword();
            expect(password1).not.toBe(password2);
        });
        it('should generate password with valid characters only', () => {
            const password = passwordUtils_1.PasswordUtils.generateRandomPassword(100);
            const validChars = /^[a-zA-Z0-9!@#$%^&*]+$/;
            expect(validChars.test(password)).toBe(true);
        });
    });
    describe('validatePasswordStrength', () => {
        it('should validate a strong password', () => {
            const strongPassword = 'StrongPass123';
            const result = passwordUtils_1.PasswordUtils.validatePasswordStrength(strongPassword);
            expect(result.isValid).toBe(true);
            expect(result.messages).toHaveLength(0);
        });
        it('should reject password shorter than 6 characters', () => {
            const shortPassword = 'Abc1';
            const result = passwordUtils_1.PasswordUtils.validatePasswordStrength(shortPassword);
            expect(result.isValid).toBe(false);
            expect(result.messages).toContain('Password must be at least 6 characters long');
        });
        it('should reject password longer than 128 characters', () => {
            const longPassword = 'A'.repeat(129) + 'a1';
            const result = passwordUtils_1.PasswordUtils.validatePasswordStrength(longPassword);
            expect(result.isValid).toBe(false);
            expect(result.messages).toContain('Password must be less than 128 characters long');
        });
        it('should reject password without lowercase letter', () => {
            const password = 'PASSWORD123';
            const result = passwordUtils_1.PasswordUtils.validatePasswordStrength(password);
            expect(result.isValid).toBe(false);
            expect(result.messages).toContain('Password must contain at least one lowercase letter');
        });
        it('should reject password without uppercase letter', () => {
            const password = 'password123';
            const result = passwordUtils_1.PasswordUtils.validatePasswordStrength(password);
            expect(result.isValid).toBe(false);
            expect(result.messages).toContain('Password must contain at least one uppercase letter');
        });
        it('should reject password without number', () => {
            const password = 'PasswordABC';
            const result = passwordUtils_1.PasswordUtils.validatePasswordStrength(password);
            expect(result.isValid).toBe(false);
            expect(result.messages).toContain('Password must contain at least one number');
        });
        it('should reject empty password', () => {
            const result = passwordUtils_1.PasswordUtils.validatePasswordStrength('');
            expect(result.isValid).toBe(false);
            expect(result.messages).toContain('Password is required');
        });
        it('should return multiple validation messages for weak password', () => {
            const weakPassword = 'abc';
            const result = passwordUtils_1.PasswordUtils.validatePasswordStrength(weakPassword);
            expect(result.isValid).toBe(false);
            expect(result.messages.length).toBeGreaterThan(1);
            expect(result.messages).toContain('Password must be at least 6 characters long');
            expect(result.messages).toContain('Password must contain at least one uppercase letter');
            expect(result.messages).toContain('Password must contain at least one number');
        });
    });
});
//# sourceMappingURL=passwordUtils.test.js.map