/**
 * Enhanced Token Storage Management for Browser Environments
 *
 * This module provides centralized, persistent token management that works
 * across multiple SDK instances and handles browser storage properly.
 */

export interface StoredTokenData {
  token: string;
  expiresAt: number | null;
  issuedAt: number;
  userId?: string;
}

/**
 * Centralized token storage manager
 */
export class TokenStorageManager {
  private static readonly STORAGE_KEY = 'altus4_auth_data';
  private static readonly MEMORY_KEY = '__altus4_token_memory__';

  /**
   * Save token data to both memory and localStorage
   */
  static saveToken(token: string, expiresIn?: number, userId?: string): void {
    const now = Date.now();
    const tokenData: StoredTokenData = {
      token,
      expiresAt: expiresIn ? now + expiresIn * 1000 : null,
      issuedAt: now,
      userId,
    };

    // Store in memory (shared across all SDK instances in the same page)
    if (typeof window !== 'undefined') {
      (window as any)[this.MEMORY_KEY] = tokenData;
    }

    // Store in localStorage for persistence across page refreshes
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokenData));
        // Keep legacy key for backward compatibility
        localStorage.setItem('altus4_token', token);
      } catch (e) {
        console.warn('Failed to save token to localStorage:', e);
      }
    }
  }

  /**
   * Get token data from memory first, then localStorage
   */
  static getTokenData(): StoredTokenData | null {
    // First, try memory (fastest and most current)
    if (typeof window !== 'undefined') {
      const memoryData = (window as any)[this.MEMORY_KEY];
      if (memoryData && this.isValidTokenData(memoryData)) {
        return memoryData;
      }
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const tokenData = JSON.parse(stored) as StoredTokenData;
          if (this.isValidTokenData(tokenData)) {
            // Update memory with localStorage data
            (window as any)[this.MEMORY_KEY] = tokenData;
            return tokenData;
          }
        }
      } catch (e) {
        console.warn('Failed to parse stored token data:', e);
      }
    }

    return null;
  }

  /**
   * Get just the token string for API requests
   */
  static getToken(): string | null {
    const tokenData = this.getTokenData();
    if (!tokenData) {
      return null;
    }

    // Check if token is expired
    if (tokenData.expiresAt && Date.now() >= tokenData.expiresAt) {
      console.warn('Stored token is expired');
      this.clearToken();
      return null;
    }

    return tokenData.token;
  }

  /**
   * Check if token exists and is not expired
   */
  static hasValidToken(): boolean {
    const token = this.getToken();
    return token !== null;
  }

  /**
   * Check if token is expiring soon (within 5 minutes)
   */
  static isTokenExpiringSoon(): boolean {
    const tokenData = this.getTokenData();
    if (!tokenData?.expiresAt) {
      return false;
    }

    const fiveMinutes = 5 * 60 * 1000;
    return tokenData.expiresAt - Date.now() < fiveMinutes;
  }

  /**
   * Get time until token expires (in seconds)
   */
  static getTimeToExpiry(): number {
    const tokenData = this.getTokenData();
    if (!tokenData?.expiresAt) {
      return 0;
    }

    return Math.max(0, Math.floor((tokenData.expiresAt - Date.now()) / 1000));
  }

  /**
   * Clear all token data
   */
  static clearToken(): void {
    // Clear memory
    if (typeof window !== 'undefined') {
      delete (window as any)[this.MEMORY_KEY];
    }

    // Clear localStorage
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem('altus4_token'); // Legacy cleanup
      } catch (e) {
        console.warn('Failed to clear token from localStorage:', e);
      }
    }
  }

  /**
   * Update token data without changing the token itself
   * Useful for updating expiry times after refresh
   */
  static updateTokenData(updates: Partial<StoredTokenData>): void {
    const current = this.getTokenData();
    if (!current) {
      return;
    }

    const updated = { ...current, ...updates };
    this.saveToken(
      updated.token,
      updated.expiresAt ? Math.floor((updated.expiresAt - Date.now()) / 1000) : undefined,
      updated.userId
    );
  }

  /**
   * Validate token data structure
   */
  private static isValidTokenData(data: any): data is StoredTokenData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.token === 'string' &&
      data.token.length > 0 &&
      typeof data.issuedAt === 'number'
    );
  }

  /**
   * Debug helper to log current token state (development only)
   */
  static debugTokenState(): void {
    if (process.env['NODE_ENV'] !== 'development') {
      return;
    }

    const tokenData = this.getTokenData();
    console.group('🔍 Token Storage Debug');
    if (tokenData) {
      console.log('Token exists:', !!tokenData.token);
      console.log(
        'Expires at:',
        tokenData.expiresAt ? new Date(tokenData.expiresAt).toLocaleString() : 'Never'
      );
      console.log('Time to expiry:', `${this.getTimeToExpiry()}s`);
      console.log('Is expired:', tokenData.expiresAt ? Date.now() >= tokenData.expiresAt : false);
      console.log('Is expiring soon:', this.isTokenExpiringSoon());
      console.log('User ID:', tokenData.userId || 'Unknown');
    } else {
      console.log('No token data found');
    }
    console.groupEnd();
  }
}
