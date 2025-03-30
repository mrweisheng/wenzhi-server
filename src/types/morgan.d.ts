declare module 'morgan' {
  import { Handler } from 'express';
  
  function morgan(format: string | Function, options?: any): Handler;
  
  namespace morgan {
    export function token(name: string, callback: Function): morgan;
  }
  
  export = morgan;
} 