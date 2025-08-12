import bcrypt from 'bcryptjs';

/**
 * Password utility functions for hashing and comparing passwords
 */
export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a plain text password
   * @param password - Plain text password to hash
   * @returns Promise<string> - Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param candidatePassword - Plain text password to compare
   * @param hashedPassword - Hashed password to compare against
   * @returns Promise<boolean> - True if passwords match, false otherwise
   */
  static async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    if (!candidatePassword || !hashedPassword) {
      return false;
    }
    
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  /**
   * Generate a random password for temporary use
   * @param length - Length of the password (default: 12)
   * @returns string - Random password
   */
  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns object - Validation result with isValid boolean and messages array
   */
  static validatePasswordStrength(password: string): { isValid: boolean; messages: string[] } {
    const messages: string[] = [];
    let isValid = true;

    if (!password) {
      messages.push('Password is required');
      isValid = false;
    } else {
      if (password.length < 6) {
        messages.push('Password must be at least 6 characters long');
        isValid = false;
      }
      
      if (password.length > 128) {
        messages.push('Password must be less than 128 characters long');
        isValid = false;
      }
      
      if (!/[a-z]/.test(password)) {
        messages.push('Password must contain at least one lowercase letter');
        isValid = false;
      }
      
      if (!/[A-Z]/.test(password)) {
        messages.push('Password must contain at least one uppercase letter');
        isValid = false;
      }
      
      if (!/\d/.test(password)) {
        messages.push('Password must contain at least one number');
        isValid = false;
      }
    }

    return { isValid, messages };
  }
}