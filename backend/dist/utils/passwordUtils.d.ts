/**
 * Password utility functions for hashing and comparing passwords
 */
export declare class PasswordUtils {
    private static readonly SALT_ROUNDS;
    /**
     * Hash a plain text password
     * @param password - Plain text password to hash
     * @returns Promise<string> - Hashed password
     */
    static hashPassword(password: string): Promise<string>;
    /**
     * Compare a plain text password with a hashed password
     * @param candidatePassword - Plain text password to compare
     * @param hashedPassword - Hashed password to compare against
     * @returns Promise<boolean> - True if passwords match, false otherwise
     */
    static comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean>;
    /**
     * Generate a random password for temporary use
     * @param length - Length of the password (default: 12)
     * @returns string - Random password
     */
    static generateRandomPassword(length?: number): string;
    /**
     * Validate password strength
     * @param password - Password to validate
     * @returns object - Validation result with isValid boolean and messages array
     */
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        messages: string[];
    };
}
//# sourceMappingURL=passwordUtils.d.ts.map