import { withRetry } from '../utils/retry';
import { Logger } from '../core/logger';

export class SportsDbClient {
  // Free test key '3' is standard for development
  private static apiKey = process.env.THESPORTSDB_API_KEY || '3';
  private static baseUrl = `https://www.thesportsdb.com/api/v1/json/${SportsDbClient.apiKey}`;

  /**
   * Executes a retryable GET query on TheSportsDB.
   */
  static async get(endpoint: string): Promise<any> {
    const fetchTask = async () => {
      const url = `${this.baseUrl}${endpoint}`;
      Logger.info(`Executing SportsDB API request to ${endpoint}...`, "SportsDbClient");
      
      const response = await fetch(url);
      if (!response.ok) {
        const err: any = new Error(`HTTP error ${response.status}: ${response.statusText}`);
        err.status = response.status;
        throw err;
      }

      return await response.json();
    };

    return withRetry(fetchTask, `SportsDB:${endpoint}`);
  }
}
