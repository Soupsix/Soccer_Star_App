import { TokenManager } from '../worldcup/auth';
import { withRetry } from '../utils/retry';
import { Logger } from '../core/logger';

export class WorldCupApiClient {
  private static apiUrl = process.env.WORLDCUP_API_URL || 'https://api.worldcup2026.com';

  /**
   * Generic request dispatcher with token injection and 401 retry interceptor.
   */
  static async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const fetchTask = async () => {
      const token = await TokenManager.getValidToken(this.apiUrl);
      
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const base = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url = `${base}${path}`;
      Logger.info(`Executing API request to ${path}...`, "WorldCupApiClient");
      
      let response = await fetch(url, { ...options, headers });

      // Handle token expiration renewal (HTTP 401)
      if (response.status === 401) {
        Logger.warn("Received 401 Unauthorized. Retrying authentication...", "WorldCupApiClient");
        const renewedToken = await TokenManager.login(this.apiUrl);
        
        const retryHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${renewedToken}`,
          'Content-Type': 'application/json',
        };
        response = await fetch(url, { ...options, headers: retryHeaders });
      }

      if (!response.ok) {
        // Tag response status so retry helper can intercept specific codes
        const err: any = new Error(`HTTP error ${response.status}: ${response.statusText}`);
        err.status = response.status;
        throw err;
      }

      return await response.json();
    };

    return withRetry(fetchTask, `WorldCupAPI:${endpoint}`);
  }
}
