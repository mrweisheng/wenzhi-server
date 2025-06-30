"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const role_1 = __importDefault(require("./routes/role"));
const writer_1 = __importDefault(require("./routes/writer"));
const menu_1 = __importDefault(require("./routes/menu"));
const order_1 = __importDefault(require("./routes/order"));
const statistics_1 = __importDefault(require("./routes/statistics"));
const customerOrder_1 = __importDefault(require("./routes/customerOrder"));
const issue_1 = __importDefault(require("./routes/issue"));
const writerRating_1 = __importDefault(require("./routes/writerRating"));
const case_1 = __importDefault(require("./routes/case"));
const error_1 = require("./middlewares/error");
const db_1 = require("./config/db");
const logger_1 = require("./config/logger");
const morgan_1 = __importDefault(require("morgan"));
const scheduler_1 = require("./scheduler");
const app = (0, express_1.default)();
// 优化启动流程
const startServer = async () => {
    try {
        // 先测试数据库连接
        await (0, db_1.testConnection)();
        logger_1.log.info('数据库连接成功');
        // 配置中间件
        app.use((0, cors_1.default)({
            origin: true, // 允许所有来源，生产环境建议设置具体的域名
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
            maxAge: 86400 // 预检请求结果缓存24小时
        }));
        // 配置HTTP请求日志
        app.use((0, morgan_1.default)('combined', {
            stream: {
                write: (message) => {
                    logger_1.log.http(message.trim());
                }
            }
        }));
        app.use(express_1.default.json());
        app.use(express_1.default.urlencoded({ extended: true })); // 添加对URL编码表单的支持
        // 配置静态文件服务
        const uploadDir = '/var/www/uploads';
        app.use('/upload', express_1.default.static(uploadDir));
        // 注册路由
        app.use('/api/auth', auth_1.default);
        app.use('/api/users', user_1.default);
        app.use('/api/roles', role_1.default);
        app.use('/api/writers', writer_1.default);
        app.use('/api/menus', menu_1.default);
        app.use('/api/orders', order_1.default);
        app.use('/api/statistics', statistics_1.default);
        app.use('/api/customer-orders', customerOrder_1.default);
        app.use('/api/issues', issue_1.default);
        app.use('/api/writer-ratings', writerRating_1.default);
        app.use('/api/cases', case_1.default);
        // 健康检查路由
        app.get('/health', async (req, res) => {
            try {
                // 测试数据库连接
                const [result] = await (0, db_1.query)('SELECT 1');
                res.json({
                    status: 'ok',
                    database: 'connected',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime()
                });
            }
            catch (error) {
                logger_1.log.error('健康检查失败', error);
                res.status(503).json({
                    status: 'error',
                    database: 'disconnected',
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
            }
        });
        // 错误处理
        app.use(error_1.errorHandler);
        const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        app.listen(PORT, '0.0.0.0', () => {
            const startupMessage = `
        ================================
        🚀 服务器启动成功!
        📡 端口: ${PORT}
        🕒 时间: ${new Date().toLocaleString()}
        ================================
      `;
            console.log(startupMessage);
            logger_1.log.info('服务器启动成功', { port: PORT });
            // 启动定时任务
            (0, scheduler_1.scheduleCustomerOrderSync)();
            // 执行初始同步
            (0, scheduler_1.initialCustomerOrderSync)();
        });
    }
    catch (error) {
        logger_1.log.error('服务器启动失败', error);
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};
startServer();
