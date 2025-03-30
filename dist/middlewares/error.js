"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../config/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.log.error('请求处理错误', {
        path: req.path,
        method: req.method,
        error: err.message,
        stack: err.stack
    });
    console.error('错误时间:', new Date().toISOString());
    console.error('请求路径:', req.path);
    console.error('请求方法:', req.method);
    console.error('错误堆栈:', err.stack);
    // 区分不同类型的错误
    if (err.name === 'ConnectionError' ||
        err.code === 'PROTOCOL_CONNECTION_LOST' ||
        err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            code: 1,
            message: '数据库连接暂时不可用，请稍后重试'
        });
    }
    if (err.name === 'QueryError') {
        return res.status(500).json({
            code: 1,
            message: '数据库查询错误，请稍后重试'
        });
    }
    // 添加事务回滚错误处理
    if (err.code === 'ER_LOCK_DEADLOCK') {
        return res.status(500).json({
            code: 1,
            message: '数据库繁忙，请稍后重试'
        });
    }
    res.status(500).json({
        code: 1,
        message: '服务器内部错误，请稍后重试'
    });
};
exports.errorHandler = errorHandler;
