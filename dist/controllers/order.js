"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderWriter = exports.updateOrderCustomer = exports.getOrders = void 0;
const db_1 = __importDefault(require("../config/db"));
// 获取订单列表
const getOrders = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, order_id, payment_id, status, channel, startTime, endTime } = req.query;
        // 构建查询条件
        let sql = 'SELECT * FROM orders WHERE 1=1';
        const params = [];
        if (order_id) {
            sql += ' AND order_id = ?';
            params.push(order_id);
        }
        if (payment_id) {
            sql += ' AND payment_id = ?';
            params.push(payment_id);
        }
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        if (channel) {
            sql += ' AND channel = ?';
            params.push(channel);
        }
        if (startTime) {
            sql += ' AND create_time >= ?';
            params.push(startTime);
        }
        if (endTime) {
            sql += ' AND create_time <= ?';
            params.push(endTime);
        }
        // 计算总数
        const [countResult] = await db_1.default.query(`SELECT COUNT(*) as total FROM (${sql}) as t`, params);
        const total = countResult[0].total;
        // 分页查询
        sql += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
        params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
        const [rows] = await db_1.default.query(sql, params);
        res.json({
            code: 0,
            data: {
                total,
                list: rows
            },
            message: "获取成功"
        });
    }
    catch (err) {
        console.error('Get orders error:', err);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getOrders = getOrders;
// 更新订单客服
const updateOrderCustomer = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { customer_id } = req.body;
        const userId = req.userId; // 当前登录用户ID
        // 检查当前用户是否有权限操作（必须是客服、超管或财务）
        const [currentUser] = await db_1.default.query(`SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`, [userId]);
        if (currentUser.length === 0 ||
            !(currentUser[0].role_name.includes('客服') ||
                currentUser[0].role_name.includes('超级管理员') ||
                currentUser[0].role_name.includes('财务'))) {
            return res.status(403).json({
                code: 1,
                message: '您没有权限执行此操作'
            });
        }
        // 检查订单是否存在
        const [orders] = await db_1.default.query('SELECT order_id FROM orders WHERE order_id = ?', [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '订单不存在'
            });
        }
        // 检查客服是否存在
        const [users] = await db_1.default.query(`SELECT u.id, u.username 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND r.role_name LIKE '%客服%'`, [customer_id]);
        if (users.length === 0) {
            return res.status(400).json({
                code: 1,
                message: '指定的客服不存在'
            });
        }
        // 更新订单的客服
        await db_1.default.query('UPDATE orders SET customer_id = ? WHERE order_id = ?', [customer_id, orderId]);
        res.json({
            code: 0,
            message: 'success',
            data: {
                order_id: orderId,
                customer_id: customer_id,
                customer: users[0].username
            }
        });
    }
    catch (err) {
        console.error('Update order customer error:', err);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.updateOrderCustomer = updateOrderCustomer;
// 更新订单写手
const updateOrderWriter = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { writer_id } = req.body;
        const userId = req.userId;
        // 检查当前用户是否有权限操作（必须是客服、超管或财务）
        const [currentUser] = await db_1.default.query(`SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`, [userId]);
        if (currentUser.length === 0 ||
            !(currentUser[0].role_name.includes('客服') ||
                currentUser[0].role_name.includes('超级管理员') ||
                currentUser[0].role_name.includes('财务'))) {
            return res.status(403).json({
                code: 1,
                message: '您没有权限执行此操作'
            });
        }
        // 检查订单是否存在
        const [orders] = await db_1.default.query('SELECT order_id FROM orders WHERE order_id = ?', [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '订单不存在'
            });
        }
        // 检查写手是否存在
        const [writers] = await db_1.default.query('SELECT id, name FROM writer_info WHERE id = ?', [writer_id]);
        if (writers.length === 0) {
            return res.status(400).json({
                code: 1,
                message: '指定的写手不存在'
            });
        }
        // 更新订单的写手
        await db_1.default.query('UPDATE orders SET writer_id = ? WHERE order_id = ?', [writer_id, orderId]);
        res.json({
            code: 0,
            message: 'success',
            data: {
                order_id: orderId,
                writer_id: writer_id,
                writer: writers[0].name
            }
        });
    }
    catch (err) {
        console.error('Update order writer error:', err);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.updateOrderWriter = updateOrderWriter;
