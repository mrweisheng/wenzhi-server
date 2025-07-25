"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateCommission = exports.updateOrderWriter = exports.updateOrderCustomer = exports.getOrders = void 0;
const db_1 = __importDefault(require("../config/db"));
// 获取订单列表
const getOrders = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, order_id, payment_id, status, channel, startTime, endTime } = req.query;
        // 构建查询条件
        let sql = `
      SELECT o.*, 
             u.username as customer_name,
             w.name as writer_name,
             w2.name as writer_name_2
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      LEFT JOIN writer_info w ON o.writer_id = w.id
      LEFT JOIN writer_info w2 ON o.writer_id_2 = w2.id
      WHERE 1=1
    `;
        const params = [];
        if (order_id) {
            sql += ' AND order_id = ?';
            params.push(order_id);
        }
        if (payment_id) {
            sql += ' AND payment_id = ?';
            params.push(payment_id);
        }
        if (status === '1') {
            sql += " AND o.status LIKE '%成功%'";
        }
        else if (status === '2') {
            sql += " AND (o.status NOT LIKE '%成功%' OR o.status IS NULL OR o.status = '')";
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
        const { writer_id, writer_id_2 } = req.body;
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
        // 检查第一个写手是否存在（如果有填写）
        if (writer_id) {
            const [writers] = await db_1.default.query('SELECT id, name FROM writer_info WHERE id = ?', [writer_id]);
            if (writers.length === 0) {
                return res.status(400).json({
                    code: 1,
                    message: '指定的写手不存在'
                });
            }
        }
        // 检查第二个写手是否存在（如果有填写）
        if (writer_id_2) {
            const [writers2] = await db_1.default.query('SELECT id, name FROM writer_info WHERE id = ?', [writer_id_2]);
            if (writers2.length === 0) {
                return res.status(400).json({
                    code: 1,
                    message: '指定的第二个写手不存在'
                });
            }
        }
        // 更新订单的写手
        const updateData = {};
        if (writer_id !== undefined)
            updateData.writer_id = writer_id;
        if (writer_id_2 !== undefined)
            updateData.writer_id_2 = writer_id_2;
        await db_1.default.query('UPDATE orders SET ? WHERE order_id = ?', [updateData, orderId]);
        res.json({
            code: 0,
            message: 'success',
            data: {
                order_id: orderId,
                writer_id: writer_id,
                writer_id_2: writer_id_2
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
// 全量重算客服佣金API
const recalculateCommission = async (req, res) => {
    try {
        const userId = req.userId;
        // 权限校验：仅限超级管理员和财务
        const [currentUser] = await db_1.default.query(`SELECT r.role_name FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.id = ?`, [userId]);
        if (currentUser.length === 0 ||
            !(currentUser[0].role_name.includes('超级管理员') || currentUser[0].role_name.includes('财务'))) {
            return res.status(403).json({ code: 1, message: '您没有权限执行此操作，仅限超级管理员和财务角色' });
        }
        // 只查近30天且customer_id不为空的订单，同时查询定稿状态
        const [orders] = await db_1.default.query(`SELECT o.order_id, o.amount, o.refund_amount, o.fee, o.channel, o.status, o.customer_id, o.writer_id, o.writer_id_2, o.writer_fee, o.writer_fee_2, o.fee_per_1000,
              co.is_fixed
       FROM orders o
       LEFT JOIN customer_orders co ON o.order_id = co.order_id
       WHERE o.customer_id IS NOT NULL AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`);
        console.log(`[重算客服佣金] 开始全量重算（近30天），共 ${orders.length} 条订单，时间：${new Date().toLocaleString()}`);
        // 异步处理，立即返回前端
        res.json({
            code: 0,
            message: `已接收重算请求，正在后台处理近30天内的客服佣金，请稍后刷新查看结果。本次处理订单数：${orders.length}`
        });
        // 后台异步批量处理
        setTimeout(async () => {
            let updatedCount = 0;
            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                const amount = Number(order.amount || 0);
                const refund = Number(order.refund_amount || 0);
                const channel = order.channel || '';
                const status = order.status || '';
                const customerId = order.customer_id;
                const writerId = order.writer_id;
                const writerId2 = order.writer_id_2;
                const writerFee = Number(order.writer_fee || 0);
                const writerFee2 = Number(order.writer_fee_2 || 0);
                const feePer1000 = Number(order.fee_per_1000 || 0);
                const isFixed = order.is_fixed === 1; // 是否定稿
                const netIncome = amount - refund;
                let eligible = false;
                if (customerId && netIncome > 0 && isFixed) { // 添加定稿状态判断
                    if (channel.includes('企业微信')) {
                        eligible = true;
                    }
                    else if (channel.includes('支付宝') || channel.includes('淘宝') || channel.includes('天猫')) {
                        if (status.includes('成功'))
                            eligible = true;
                    }
                }
                let commission = null;
                if (eligible) {
                    const hasWriter = (writerId || writerId2) && (writerFee > 0 || writerFee2 > 0);
                    const totalWriterFee = writerFee + writerFee2;
                    if (!hasWriter) {
                        commission = +(netIncome * 0.42).toFixed(2);
                    }
                    else {
                        if (!feePer1000) {
                            commission = +(netIncome * 0.42 - totalWriterFee).toFixed(2);
                        }
                        else {
                            const commissionBase = netIncome * 0.42;
                            if (totalWriterFee < commissionBase) {
                                commission = +(commissionBase - totalWriterFee).toFixed(2);
                            }
                            else if (totalWriterFee >= commissionBase && totalWriterFee <= netIncome * 0.5) {
                                if (feePer1000 >= 60) {
                                    commission = +(commissionBase - totalWriterFee).toFixed(2);
                                }
                                else {
                                    commission = 5.00;
                                }
                            }
                            else if (totalWriterFee > netIncome * 0.5) {
                                commission = +(commissionBase - totalWriterFee).toFixed(2);
                            }
                        }
                    }
                }
                else {
                    commission = 0;
                }
                await db_1.default.query(`UPDATE orders SET customer_commission = ? WHERE order_id = ?`, [commission, order.order_id]);
                await db_1.default.query(`UPDATE customer_orders SET customer_commission = ? WHERE order_id = ?`, [commission, order.order_id]);
                updatedCount++;
                if ((i + 1) % 100 === 0) {
                    console.log(`[重算进度] 已处理 ${i + 1} / ${orders.length} 条订单`);
                }
            }
            console.log(`[重算客服佣金] 全量重算结束（近30天），共处理 ${orders.length} 条订单，时间：${new Date().toLocaleString()}`);
        }, 10);
    }
    catch (error) {
        console.error('全量重算客服佣金错误:', error);
        res.status(500).json({ code: 1, message: '服务器错误', error: error.message });
    }
};
exports.recalculateCommission = recalculateCommission;
