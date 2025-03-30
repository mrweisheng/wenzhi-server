import fs from 'fs-extra'
import path from 'path'
import { createLogger, format, transports } from 'winston'
import 'winston-daily-rotate-file'

// 确保日志目录存在
const logDir = '/var/log/wenzhi-server'
fs.ensureDirSync(logDir)

// 创建日志格式
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${stack ? '\n' + stack : ''}`
  })
)

// 创建日志实例
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'wenzhi-backend' },
  transports: [
    // 控制台输出
    new transports.Console({
      format: format.combine(
        format.colorize(),
        logFormat
      )
    }),
    
    // 每日轮转文件日志
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'wenzhi-server-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // 错误日志单独保存
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'wenzhi-server-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      zippedArchive: true
    })
  ]
})

// 创建符号链接到最新的日志文件
logger.on('logged', function() {
  try {
    // 创建符号链接，使cat /var/log/wenzhi-server.log可以访问最新日志
    const latestLogPath = path.join(logDir, 'wenzhi-server.log')
    const currentDate = new Date().toISOString().split('T')[0]
    const todayLogPath = path.join(logDir, `wenzhi-server-${currentDate}.log`)
    
    // 如果文件存在，先删除符号链接
    if (fs.existsSync(latestLogPath)) {
      fs.unlinkSync(latestLogPath)
    }
    
    // 创建新的符号链接指向今天的日志文件
    if (fs.existsSync(todayLogPath)) {
      fs.symlinkSync(todayLogPath, latestLogPath)
    }
  } catch (error) {
    console.error('创建日志符号链接失败:', error)
  }
})

// 日志包装器，添加上下文信息
export const log = {
  info: (message: string, meta?: any) => {
    logger.info(message, meta)
  },
  error: (message: string, error?: any) => {
    if (error instanceof Error) {
      logger.error(`${message}: ${error.message}`, { stack: error.stack })
    } else {
      logger.error(message, error)
    }
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta)
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta)
  },
  http: (message: string, meta?: any) => {
    logger.http(message, meta)
  }
}

export default logger 