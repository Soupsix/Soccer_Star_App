import { Logger } from '../core/logger';

export class TokenManager {
  private static cachedToken: string | null = null;
  private static email = process.env.WORLDCUP_API_EMAIL || 'admin@soccerstar.com';
  private static password = process.env.WORLDCUP_API_PASSWORD || 'password123';

  /**
   * Performs authentication to retrieve a new JWT token.
   */
  static async login(apiUrl: string): Promise<string> {
    Logger.info("Authenticating with World Cup API...", "TokenManager");
    
    try {
      const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const response = await fetch(`${base}/auth/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.email, password: this.password }),
      });

      if (!response.ok) {
        throw new Error(`Authentication endpoint returned HTTP status ${response.status}`);
      }

      const data: any = await response.json();
      if (!data.token) {
        throw new Error("No token returned in authentication response body.");
      }

      this.cachedToken = data.token;
      Logger.success("Authentication token acquired and cached.", "TokenManager");
      return data.token;
    } catch (error) {
      Logger.error("Failed to authenticate with World Cup API.", error, "TokenManager");
      throw error;
    }
  }

  /**
   * Retrieves a cached token if valid, or logs in again to refresh.
   */
  static async getValidToken(apiUrl: string): Promise<string> {
    if (this.cachedToken && !this.isTokenExpired(this.cachedToken)) {
      return this.cachedToken;
    }
    return this.login(apiUrl);
  }

  /**
   * Vanilla base64 decoding helper for JWT validation check.
   */
  private static isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      
      if (!payload.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      // Expired if current time exceeds expiration minus a 60-second buffer
      return (payload.exp - currentTime) < 60;
    } catch {
      return true;
    }
  }
}
