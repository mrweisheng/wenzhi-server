declare module 'winston-daily-rotate-file' {
  import * as winston from 'winston';
  
  interface DailyRotateFileTransportOptions {
    filename?: string;
    datePattern?: string;
    level?: string;
    maxSize?: string;
    maxFiles?: string;
    zippedArchive?: boolean;
  }
  
  class DailyRotateFileTransport extends winston.transports.File {
    constructor(options?: DailyRotateFileTransportOptions);
  }
  
  export = DailyRotateFileTransport;
} 