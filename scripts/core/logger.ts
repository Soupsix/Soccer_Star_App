export enum LogLevel {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface SyncStats {
  updated: number;
  skipped: number;
  failed: number;
  durationMs: number;
}

export class Logger {
  private static formatTime(): string {
    return new Date().toISOString();
  }

  static info(message: string, context?: string): void {
    const ctx = context ? `[${context}] ` : '';
    console.log(`[${LogLevel.INFO}] ${this.formatTime()} - ${ctx}${message}`);
  }

  static success(message: string, context?: string): void {
    const ctx = context ? `[${context}] ` : '';
    console.log(`[${LogLevel.SUCCESS}] ${this.formatTime()} - ${ctx}${message}`);
  }

  static warn(message: string, context?: string): void {
    const ctx = context ? `[${context}] ` : '';
    console.warn(`[${LogLevel.WARN}] ${this.formatTime()} - ${ctx}${message}`);
  }

  static error(message: string, error?: any, context?: string): void {
    const ctx = context ? `[${context}] ` : '';
    const errDetails = error ? ` - Error: ${error.message || error}` : '';
    console.error(`[${LogLevel.ERROR}] ${this.formatTime()} - ${ctx}${message}${errDetails}`);
    if (error && error.stack) {
      console.error(error.stack);
    }
  }

  static summary(taskName: string, stats: SyncStats): void {
    const durationSec = (stats.durationMs / 1000).toFixed(2);
    console.log(`\n[${LogLevel.INFO}] Sync ${taskName}`);
    console.log(`Updated : ${stats.updated}`);
    console.log(`Skipped : ${stats.skipped}`);
    console.log(`Failed  : ${stats.failed}`);
    console.log(`Duration: ${durationSec}s\n`);
  }
}
