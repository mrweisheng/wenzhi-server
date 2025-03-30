"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const winston_1 = require("winston");
require("winston-daily-rotate-file");
// 确保日志目录存在
const logDir = '/var/log/wenzhi-server';
fs_extra_1.default.ensureDirSync(logDir);
// 创建日志格式
const logFormat = winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.errors({ stack: true }), winston_1.format.splat(), winston_1.format.printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${stack ? '\n' + stack : ''}`;
}));
// 创建日志实例
const logger = (0, winston_1.createLogger)({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'wenzhi-backend' },
    transports: [
        // 控制台输出
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize(), logFormat)
        }),
        // 每日轮转文件日志
        new winston_1.transports.DailyRotateFile({
            filename: path_1.default.join(logDir, 'wenzhi-server-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        }),
        // 错误日志单独保存
        new winston_1.transports.DailyRotateFile({
            filename: path_1.default.join(logDir, 'wenzhi-server-error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            level: 'error',
            zippedArchive: true
        })
    ]
});
// 创建符号链接到最新的日志文件
logger.on('logged', function () {
    try {
        // 创建符号链接，使cat /var/log/wenzhi-server.log可以访问最新日志
        const latestLogPath = path_1.default.join(logDir, 'wenzhi-server.log');
        const currentDate = new Date().toISOString().split('T')[0];
        const todayLogPath = path_1.default.join(logDir, `wenzhi-server-${currentDate}.log`);
        // 如果文件存在，先删除符号链接
        if (fs_extra_1.default.existsSync(latestLogPath)) {
            fs_extra_1.default.unlinkSync(latestLogPath);
        }
        // 创建新的符号链接指向今天的日志文件
        if (fs_extra_1.default.existsSync(todayLogPath)) {
            fs_extra_1.default.symlinkSync(todayLogPath, latestLogPath);
        }
    }
    catch (error) {
        console.error('创建日志符号链接失败:', error);
    }
});
// 日志包装器，添加上下文信息
exports.log = {
    info: (message, meta) => {
        logger.info(message, meta);
    },
    error: (message, error) => {
        if (error instanceof Error) {
            logger.error(`${message}: ${error.message}`, { stack: error.stack });
        }
        else {
            logger.error(message, error);
        }
    },
    warn: (message, meta) => {
        logger.warn(message, meta);
    },
    debug: (message, meta) => {
        logger.debug(message, meta);
    },
    http: (message, meta) => {
        logger.http(message, meta);
    }
};
exports.default = logger;
