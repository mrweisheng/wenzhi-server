declare module 'winston' {
  export interface Logger {
    info(message: string, meta?: any): Logger;
    error(message: string, meta?: any): Logger;
    warn(message: string, meta?: any): Logger;
    debug(message: string, meta?: any): Logger;
    http(message: string, meta?: any): Logger;
    on(event: string, callback: Function): Logger;
  }

  export function createLogger(options: any): Logger;

  export const format: any;
  export const transports: any;
} 