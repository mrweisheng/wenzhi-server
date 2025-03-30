"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.testConnection = exports.default = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 定义重试配置
const RETRY_CONFIG = {
    maxRetries: 5,
    retryInterval: 5000, // 5秒
    maxTimeout: 30000 // 30秒
};
// 创建连接池
const createPool = () => {
    return promise_1.default.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'wenzhi',
        waitForConnections: true,
        connectionLimit: 20, // 增加连接数
        queueLimit: 0,
        enableKeepAlive: true, // 保持连接活跃
        keepAliveInitialDelay: 10000,
        connectTimeout: 20000,
        maxIdle: 10, // 最大空闲连接数
        idleTimeout: 60000, // 空闲超时时间
        // 添加重连策略
        multipleStatements: true,
        dateStrings: true
    });
};
let pool = createPool();
exports.default = pool;
// 增强版连接测试和重连机制
const testConnection = async (retries = 0) => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功!');
        // 测试查询
        await connection.query('SELECT 1');
        console.log('✅ 数据库查询测试成功!');
        connection.release();
    }
    catch (error) {
        console.error(`❌ 数据库连接失败 (尝试 ${retries + 1}/${RETRY_CONFIG.maxRetries}):`, error);
        if (retries < RETRY_CONFIG.maxRetries) {
            console.log(`🔄 ${RETRY_CONFIG.retryInterval / 1000}秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.retryInterval));
            return testConnection(retries + 1);
        }
        else {
            console.error('❌ 达到最大重试次数，无法连接到数据库');
            throw error;
        }
    }
};
exports.testConnection = testConnection;
// 创建查询包装器
const createQueryWrapper = () => {
    return async (sql, params) => {
        let retries = 0;
        while (retries < RETRY_CONFIG.maxRetries) {
            try {
                return await pool.query(sql, params);
            }
            catch (error) {
                if (error.code === 'PROTOCOL_CONNECTION_LOST' ||
                    error.code === 'ECONNREFUSED' ||
                    error.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
                    console.error(`数据库查询错误 (尝试 ${retries + 1}/${RETRY_CONFIG.maxRetries}):`, error);
                    retries++;
                    if (retries < RETRY_CONFIG.maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.retryInterval));
                        exports.default = pool = createPool(); // 重新创建连接池
                        continue;
                    }
                }
                throw error;
            }
        }
        throw new Error('数据库查询失败：达到最大重试次数');
    };
};
// 监听连接池错误
pool.on('error', async (err) => {
    console.error('数据库连接池错误:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('正在尝试重新连接数据库...');
        exports.default = pool = createPool();
        await testConnection();
    }
});
const query = createQueryWrapper();
exports.query = query;
