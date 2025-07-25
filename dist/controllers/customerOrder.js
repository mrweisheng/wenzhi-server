"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCustomerCommission = exports.autoMergeCustomerOrder = exports.unlockCustomerOrders = exports.lockCustomerOrders = exports.mergeCustomerOrder = exports.deleteCustomerOrder = exports.updateCustomerOrder = exports.recalculateCustomerCommissionForOrder = exports.getCustomerOrderById = exports.getCustomerOrders = exports.createCustomerOrder = void 0;
const db_1 = __importDefault(require("../config/db"));
// 创建客服订单
const createCustomerOrder = async (req, res) => {
    try {
        const { order_id, date, is_fixed, order_content, word_count, fee, writer_id, fee_2, writer_id_2, exchange_time, payment_channel, store_name, new_customer, customer_name, order_amount, refund_amount, special_situation, dispatch_id, fee_per_1000 } = req.body;
        const userId = req.userId;
        // 检查当前用户是否是客服角色
        const [userRole] = await db_1.default.query(`SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`, [userId]);
        // 只允许客服角色创建订单
        if (userRole.length === 0 || !userRole[0].role_name.includes('客服')) {
            return res.status(403).json({
                code: 1,
                message: '非客服角色无权创建订单'
            });
        }
        // 检查订单号是否已存在
        const [existingOrder] = await db_1.default.query('SELECT order_id FROM customer_orders WHERE order_id = ?', [order_id]);
        if (existingOrder.length > 0) {
            return res.status(400).json({
                code: 1,
                message: '订单号已存在'
            });
        }
        // 检查派单编号唯一性（如果有填写）
        if (dispatch_id) {
            const [existingDispatch] = await db_1.default.query('SELECT id FROM customer_orders WHERE dispatch_id = ?', [dispatch_id]);
            if (existingDispatch.length > 0) {
                return res.status(400).json({
                    code: 1,
                    message: '派单编号已存在'
                });
            }
        }
        // 检查第一个写手是否存在（如果有填写）
        let processedWriterId = null;
        if (writer_id) {
            let writerIdToUse = writer_id;
            console.log('前端传入writer_id:', writer_id);
            // 如果传的是纯数字，自动查业务编号
            if (/^\d+$/.test(writer_id)) {
                const [writer] = await db_1.default.query('SELECT writer_id FROM writer_info WHERE id = ?', [writer_id]);
                if (writer.length > 0) {
                    writerIdToUse = writer[0].writer_id;
                }
            }
            console.log('最终用于校验的writerIdToUse:', writerIdToUse);
            // 校验业务编号是否存在
            const [writerCheck] = await db_1.default.query('SELECT writer_id FROM writer_info WHERE writer_id = ?', [writerIdToUse]);
            console.log('writerCheck结果:', writerCheck);
            if (!writerCheck || writerCheck.length === 0) {
                return res.status(400).json({
                    code: 1,
                    message: '指定的写手不存在'
                });
            }
            processedWriterId = writerIdToUse;
        }
        // 检查第二个写手是否存在（如果有填写）
        let processedWriterId2 = null;
        if (writer_id_2) {
            let writerIdToUse2 = writer_id_2;
            console.log('前端传入writer_id_2:', writer_id_2);
            // 如果传的是纯数字，自动查业务编号
            if (/^\d+$/.test(writer_id_2)) {
                const [writer2] = await db_1.default.query('SELECT writer_id FROM writer_info WHERE id = ?', [writer_id_2]);
                if (writer2.length > 0) {
                    writerIdToUse2 = writer2[0].writer_id;
                }
            }
            console.log('最终用于校验的writerIdToUse2:', writerIdToUse2);
            // 校验业务编号是否存在
            const [writerCheck2] = await db_1.default.query('SELECT writer_id FROM writer_info WHERE writer_id = ?', [writerIdToUse2]);
            console.log('writerCheck2结果:', writerCheck2);
            if (!writerCheck2 || writerCheck2.length === 0) {
                return res.status(400).json({
                    code: 1,
                    message: '指定的第二个写手不存在'
                });
            }
            processedWriterId2 = writerIdToUse2;
        }
        // 处理退款金额：如果为空、undefined或null，设置为0.00
        const processedRefundAmount = (refund_amount === undefined || refund_amount === null || refund_amount === '') ? 0.00 : refund_amount;
        // 创建订单，自动设置客服ID为当前用户ID
        const insertData = {
            order_id,
            date,
            is_fixed,
            order_content,
            word_count,
            fee,
            customer_id: userId, // 强制设置为当前登录的客服ID
            writer_id: processedWriterId, // 第一个写手ID
            fee_2,
            writer_id_2: processedWriterId2, // 第二个写手ID
            exchange_time,
            payment_channel,
            store_name,
            new_customer,
            customer_name,
            order_amount,
            refund_amount: processedRefundAmount,
            special_situation,
            dispatch_id: dispatch_id || null,
            fee_per_1000: (fee_per_1000 !== undefined && fee_per_1000 !== null && fee_per_1000 !== '') ? fee_per_1000 : null
        };
        const [result] = await db_1.default.query('INSERT INTO customer_orders SET ?', insertData);
        // 查找系统订单表中是否存在匹配的订单
        const [systemOrder] = await db_1.default.query('SELECT order_id FROM orders WHERE order_id = ?', [order_id]);
        // 如果在系统订单表中找到匹配的订单，则更新该订单的客服和写手信息
        if (systemOrder.length > 0) {
            // 同步客服ID和第一个写手
            if (processedWriterId) {
                await db_1.default.query('UPDATE orders SET customer_id = ?, writer_id = ? WHERE order_id = ?', [userId, processedWriterId, order_id]);
            }
            else {
                await db_1.default.query('UPDATE orders SET customer_id = ? WHERE order_id = ?', [userId, order_id]);
            }
            // 同步第二个写手（如果存在）
            if (processedWriterId2) {
                await db_1.default.query('UPDATE orders SET writer_id_2 = ? WHERE order_id = ?', [processedWriterId2, order_id]);
            }
        }
        res.json({
            code: 0,
            message: '创建成功',
            data: {
                id: result.insertId,
                order_id
            }
        });
    }
    catch (err) {
        console.error('Create customer order error:', err);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.createCustomerOrder = createCustomerOrder;
// 获取客服订单列表
const getCustomerOrders = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, order_id, date_start, date_end, customer_id, writer_id, is_fixed, dispatch_id, customer_name, fee_min, fee_max, order_amount_min, order_amount_max } = req.query;
        const userId = req.userId;
        // 获取当前用户角色信息
        const [userRole] = await db_1.default.query(`SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`, [userId]);
        const roleName = userRole[0]?.role_name || '';
        // 写手角色处理
        let myWriterId = null;
        if (roleName === '写手') {
            // 直接用username作为writer_id
            const [userInfo] = await db_1.default.query('SELECT username FROM users WHERE id = ?', [userId]);
            if (!userInfo.length || !userInfo[0].username) {
                return res.json({ code: 0, data: { total: 0, list: [] }, message: "获取成功" });
            }
            myWriterId = userInfo[0].username;
        }
        // 判断用户是否是客服角色
        const isCustomerService = roleName.includes('客服');
        // 构建查询条件
        let sql = `
      SELECT co.*, 
             u.username as customer_service_name, 
             w.name as writer_name, 
             w.writer_id as writer_biz_id,
             w2.name as writer_name_2,
             w2.writer_id as writer_biz_id_2,
             (COALESCE(co.fee, 0) + COALESCE(co.fee_2, 0)) as total_fee,
             l.username as locked_by_name
      FROM customer_orders co
      LEFT JOIN users u ON co.customer_id = u.id
      LEFT JOIN writer_info w ON co.writer_id = w.writer_id
      LEFT JOIN writer_info w2 ON co.writer_id_2 = w2.writer_id
      LEFT JOIN users l ON co.locked_by = l.id
      WHERE 1=1
    `;
        const params = [];
        // 如果是写手角色，只能查自己相关订单
        if (roleName === '写手') {
            sql += ' AND co.writer_id = ?';
            params.push(myWriterId);
        }
        else if (isCustomerService) {
            // 如果是客服角色，只查询自己的订单
            sql += ' AND co.customer_id = ?';
            params.push(userId);
        }
        // 其他查询条件
        if (order_id) {
            sql += ' AND co.order_id = ?';
            params.push(order_id);
        }
        if (date_start) {
            sql += ' AND co.date >= ?';
            params.push(date_start);
        }
        if (date_end) {
            sql += ' AND co.date <= ?';
            params.push(date_end);
        }
        if (customer_id && !isCustomerService) { // 如果是客服角色，忽略customer_id参数
            sql += ' AND co.customer_id = ?';
            params.push(customer_id);
        }
        if (writer_id) {
            sql += ' AND co.writer_id = ?';
            params.push(writer_id);
        }
        if (is_fixed !== undefined) {
            sql += ' AND co.is_fixed = ?';
            params.push(is_fixed);
        }
        if (dispatch_id) {
            sql += ' AND co.dispatch_id = ?';
            params.push(dispatch_id);
        }
        if (customer_name) {
            sql += ' AND co.customer_name LIKE ?';
            params.push(`%${customer_name}%`);
        }
        if (fee_min) {
            sql += ' AND (COALESCE(co.fee, 0) + COALESCE(co.fee_2, 0)) >= ?';
            params.push(Number(fee_min));
        }
        if (fee_max) {
            sql += ' AND (COALESCE(co.fee, 0) + COALESCE(co.fee_2, 0)) <= ?';
            params.push(Number(fee_max));
        }
        if (order_amount_min) {
            sql += ' AND co.order_amount >= ?';
            params.push(Number(order_amount_min));
        }
        if (order_amount_max) {
            sql += ' AND co.order_amount <= ?';
            params.push(Number(order_amount_max));
        }
        // 计算总数
        const [countResult] = await db_1.default.query(`SELECT COUNT(*) as total FROM (${sql}) as t`, params);
        const total = countResult[0].total;
        // 分页查询
        sql += ' ORDER BY co.date DESC, co.id DESC LIMIT ? OFFSET ?';
        params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
        const [rows] = await db_1.default.query(sql, params);
        // 替换writer_id为业务编号
        let resultRows = Array.isArray(rows)
            ? rows.map((row) => {
                const { writer_biz_id, writer_biz_id_2, ...rest } = row;
                let result = {
                    ...rest,
                    writer_id: writer_biz_id || null,
                    writer_id_2: writer_biz_id_2 || null
                };
                // 写手角色过滤部分字段
                if (roleName === '写手') {
                    delete result.order_id;
                    delete result.payment_channel;
                    delete result.store_name;
                    delete result.customer_name;
                }
                return result;
            })
            : [];
        res.json({
            code: 0,
            data: {
                total,
                list: resultRows
            },
            message: "获取成功"
        });
    }
    catch (err) {
        console.error('Get customer orders error:', err);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getCustomerOrders = getCustomerOrders;
// 通过ID查询客户订单
const getCustomerOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const [ordersResult] = await db_1.default.query(`SELECT co.*, 
        u.username as customer_service_name,
        w.name as writer_name,
        w.writer_id as writer_biz_id,
        w2.name as writer_name_2,
        w2.writer_id as writer_biz_id_2,
        l.username as locked_by_name
      FROM customer_orders co
      LEFT JOIN users u ON co.customer_id = u.id
      LEFT JOIN writer_info w ON co.writer_id = w.writer_id
      LEFT JOIN writer_info w2 ON co.writer_id_2 = w2.writer_id
      LEFT JOIN users l ON co.locked_by = l.id
      WHERE co.id = ?`, [id]);
        const orders = Array.isArray(ordersResult) ? ordersResult : [];
        if (orders.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '订单不存在'
            });
        }
        // 替换writer_id为业务编号
        const { writer_biz_id, writer_biz_id_2, ...rest } = orders[0];
        const order = {
            ...rest,
            writer_id: writer_biz_id || null,
            writer_id_2: writer_biz_id_2 || null
        };
        res.json({
            code: 0,
            data: order
        });
    }
    catch (error) {
        console.error('Get customer order error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getCustomerOrderById = getCustomerOrderById;
// 提取单条订单佣金计算函数
const recalculateCustomerCommissionForOrder = async (orderId) => {
    // 查询订单详情（同时查询orders表和customer_orders表的定稿状态）
    const [orderDetailRows] = await db_1.default.query(`SELECT o.amount, o.refund_amount, o.fee, o.channel, o.status, o.customer_id, o.writer_id, o.writer_id_2, o.writer_fee, o.writer_fee_2, o.fee_per_1000,
            co.is_fixed
     FROM orders o
     LEFT JOIN customer_orders co ON o.order_id = co.order_id
     WHERE o.order_id = ?`, [orderId]);
    const orderDetail = orderDetailRows[0];
    let commission = null;
    if (orderDetail) {
        const amount = Number(orderDetail.amount || 0);
        const refund = Number(orderDetail.refund_amount || 0);
        const netIncome = amount - refund;
        const channel = orderDetail.channel || '';
        const status = orderDetail.status || '';
        const customerId = orderDetail.customer_id;
        const writerId = orderDetail.writer_id;
        const writerId2 = orderDetail.writer_id_2;
        const writerFee = Number(orderDetail.writer_fee || 0);
        const writerFee2 = Number(orderDetail.writer_fee_2 || 0);
        const feePer1000 = Number(orderDetail.fee_per_1000 || 0);
        const isFixed = orderDetail.is_fixed === 1; // 是否定稿
        // 参与计算的订单范围
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
        if (eligible) {
            const hasWriter = (writerId || writerId2) && (writerFee > 0 || writerFee2 > 0);
            const totalWriterFee = writerFee + writerFee2;
            // 没有写手
            if (!hasWriter) {
                commission = +(netIncome * 0.42).toFixed(2);
            }
            else {
                // 有写手
                if (!feePer1000) {
                    // 未填写字数
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
        // 更新orders表
        await db_1.default.query(`UPDATE orders SET customer_commission = ? WHERE order_id = ?`, [commission, orderId]);
        // 同步到customer_orders表
        await db_1.default.query(`UPDATE customer_orders SET customer_commission = ? WHERE order_id = ?`, [commission, orderId]);
    }
};
exports.recalculateCustomerCommissionForOrder = recalculateCustomerCommissionForOrder;
// 更新客服订单
const updateCustomerOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.userId;
        // 检查订单是否存在
        const [orderInfo] = await db_1.default.query('SELECT is_locked FROM customer_orders WHERE id = ?', [id]);
        if (orderInfo.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '订单不存在'
            });
        }
        // 如果订单被锁定，检查用户权限
        if (orderInfo[0].is_locked) {
            const [currentUser] = await db_1.default.query(`SELECT r.role_name 
         FROM users u 
         INNER JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`, [userId]);
            if (currentUser.length === 0 ||
                !(currentUser[0].role_name.includes('超级管理员') ||
                    currentUser[0].role_name.includes('财务'))) {
                return res.status(403).json({
                    code: 1,
                    message: '订单已被锁定，仅限超级管理员和财务角色可以修改'
                });
            }
        }
        // 检查数据中是否有order_id，如果有，验证是否已存在
        if (updateData.order_id) {
            const [existingOrder] = await db_1.default.query('SELECT id FROM customer_orders WHERE order_id = ? AND id != ?', [updateData.order_id, id]);
            if (existingOrder && existingOrder.length > 0) {
                return res.status(400).json({
                    code: 1,
                    message: '订单号已存在'
                });
            }
        }
        // 检查派单编号唯一性（如果有填写）
        if (updateData.dispatch_id) {
            const [existingDispatch] = await db_1.default.query('SELECT id FROM customer_orders WHERE dispatch_id = ? AND id != ?', [updateData.dispatch_id, id]);
            if (existingDispatch && existingDispatch.length > 0) {
                return res.status(400).json({
                    code: 1,
                    message: '派单编号已存在'
                });
            }
        }
        // 检查第一个写手是否存在（如果有填写）
        if (updateData.writer_id) {
            // 如果传的是纯数字，自动查业务编号
            if (/^\d+$/.test(updateData.writer_id)) {
                const [writer] = await db_1.default.query('SELECT writer_id FROM writer_info WHERE id = ?', [updateData.writer_id]);
                if (writer.length > 0) {
                    updateData.writer_id = writer[0].writer_id;
                }
            }
            // 校验业务编号是否存在，并查出数字ID
            const [writerCheck] = await db_1.default.query('SELECT writer_id, id FROM writer_info WHERE writer_id = ?', [updateData.writer_id]);
            if (!writerCheck || writerCheck.length === 0) {
                return res.status(400).json({
                    code: 1,
                    message: '指定的写手不存在'
                });
            }
            // 记录数字ID用于同步到orders表
            updateData._writer_numeric_id = writerCheck[0].id;
        }
        // 检查第二个写手是否存在（如果有填写）
        if (updateData.writer_id_2) {
            if (/^\d+$/.test(updateData.writer_id_2)) {
                const [writer2] = await db_1.default.query('SELECT writer_id FROM writer_info WHERE id = ?', [updateData.writer_id_2]);
                if (writer2.length > 0) {
                    updateData.writer_id_2 = writer2[0].writer_id;
                }
            }
            const [writerCheck2] = await db_1.default.query('SELECT writer_id, id FROM writer_info WHERE writer_id = ?', [updateData.writer_id_2]);
            if (!writerCheck2 || writerCheck2.length === 0) {
                return res.status(400).json({
                    code: 1,
                    message: '指定的第二个写手不存在'
                });
            }
            updateData._writer_numeric_id_2 = writerCheck2[0].id;
        }
        // 处理退款金额：如果为空、undefined或null，设置为0.00
        if (updateData.hasOwnProperty('refund_amount')) {
            updateData.refund_amount = (updateData.refund_amount === undefined || updateData.refund_amount === null || updateData.refund_amount === '') ? 0.00 : updateData.refund_amount;
        }
        // 如果更新了写手或客服信息，同步到订单总表
        if (updateData.writer_id !== undefined || updateData.writer_id_2 !== undefined || updateData.customer_id !== undefined) {
            // 获取订单号
            const [orderInfo] = await db_1.default.query('SELECT order_id, customer_id, writer_id, writer_id_2 FROM customer_orders WHERE id = ?', [id]);
            if (orderInfo.length > 0) {
                const order = orderInfo[0];
                // 检查订单总表是否存在该订单
                const [systemOrder] = await db_1.default.query('SELECT order_id FROM orders WHERE order_id = ?', [order.order_id]);
                if (systemOrder.length > 0) {
                    // 同步客服ID和第一个写手
                    if (updateData._writer_numeric_id) {
                        await db_1.default.query('UPDATE orders SET customer_id = ?, writer_id = ? WHERE order_id = ?', [updateData.customer_id || order.customer_id, updateData._writer_numeric_id, order.order_id]);
                    }
                    else {
                        await db_1.default.query('UPDATE orders SET customer_id = ? WHERE order_id = ?', [updateData.customer_id || order.customer_id, order.order_id]);
                    }
                    // 同步第二个写手（如果存在）
                    if (updateData._writer_numeric_id_2) {
                        await db_1.default.query('UPDATE orders SET writer_id_2 = ? WHERE order_id = ?', [updateData._writer_numeric_id_2, order.order_id]);
                    }
                }
            }
        }
        if (updateData.hasOwnProperty('fee_per_1000')) {
            updateData.fee_per_1000 = (updateData.fee_per_1000 !== undefined && updateData.fee_per_1000 !== null && updateData.fee_per_1000 !== '') ? updateData.fee_per_1000 : null;
        }
        // 删除临时字段，防止拼进SQL
        delete updateData._writer_numeric_id;
        delete updateData._writer_numeric_id_2;
        // 更新订单
        await db_1.default.query('UPDATE customer_orders SET ? WHERE id = ?', [updateData, id]);
        // 自动同步稿费等字段到 orders 表
        const [orderRow] = await db_1.default.query('SELECT order_id FROM customer_orders WHERE id = ?', [id]);
        if (orderRow && orderRow.length > 0) {
            const orderId = orderRow[0].order_id;
            // 构建需要同步的字段
            const updateFields = [];
            const updateValues = [];
            if (updateData.fee !== undefined) {
                updateFields.push('writer_fee = ?');
                updateValues.push(updateData.fee);
            }
            if (updateData.fee_2 !== undefined) {
                updateFields.push('writer_fee_2 = ?');
                updateValues.push(updateData.fee_2);
            }
            if (updateData.fee_per_1000 !== undefined) {
                updateFields.push('fee_per_1000 = ?');
                updateValues.push(updateData.fee_per_1000);
            }
            if (updateFields.length > 0) {
                updateValues.push(orderId);
                // 只在 orders 表有该 order_id 时才更新
                const [ordersCheck] = await db_1.default.query('SELECT order_id FROM orders WHERE order_id = ?', [orderId]);
                if (ordersCheck && ordersCheck.length > 0) {
                    await db_1.default.query(`UPDATE orders SET ${updateFields.join(', ')} WHERE order_id = ?`, updateValues);
                }
            }
            // 自动重算客服佣金
            await (0, exports.recalculateCustomerCommissionForOrder)(orderId);
        }
        res.json({
            code: 0,
            message: '更新成功'
        });
    }
    catch (error) {
        console.error('Update customer order error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.updateCustomerOrder = updateCustomerOrder;
// 删除客服订单
const deleteCustomerOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // 检查订单是否存在
        const [orderInfo] = await db_1.default.query('SELECT is_locked FROM customer_orders WHERE id = ?', [id]);
        if (orderInfo.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '订单不存在'
            });
        }
        // 如果订单被锁定，检查用户权限
        if (orderInfo[0].is_locked) {
            const [currentUser] = await db_1.default.query(`SELECT r.role_name 
         FROM users u 
         INNER JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`, [userId]);
            if (currentUser.length === 0 ||
                !(currentUser[0].role_name.includes('超级管理员') ||
                    currentUser[0].role_name.includes('财务'))) {
                return res.status(403).json({
                    code: 1,
                    message: '订单已被锁定，仅限超级管理员和财务角色可以删除'
                });
            }
        }
        // 删除订单
        await db_1.default.query('DELETE FROM customer_orders WHERE id = ?', [id]);
        res.json({
            code: 0,
            message: '删除成功'
        });
    }
    catch (error) {
        console.error('Delete customer order error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.deleteCustomerOrder = deleteCustomerOrder;
// 手动合并客服订单到订单总表
const mergeCustomerOrder = async (req, res) => {
    try {
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
        // 查找所有符合条件的订单进行合并
        // 条件：客服订单表中有记录，且订单总表中也有相同订单号的记录
        // 且订单总表中客服ID或写手ID至少有一个为空，或者第二个写手需要更新，或者佣金需要更新
        const [orderPairs] = await db_1.default.query(`SELECT co.order_id, co.customer_id, co.writer_id, co.writer_id_2, 
              co.fee as writer_fee, co.fee_2 as writer_fee_2,
              co.fee_per_1000,
              w.id as writer_numeric_id, w2.id as writer_numeric_id_2,
              w.writer_id as writer_biz_id, w2.writer_id as writer_biz_id_2,
              o.customer_id as existing_customer_id, o.writer_id as existing_writer_id, o.writer_id_2 as existing_writer_id_2,
              o.writer_fee as existing_writer_fee, o.writer_fee_2 as existing_writer_fee_2,
              o.fee_per_1000 as existing_fee_per_1000
       FROM customer_orders co
       INNER JOIN orders o ON co.order_id = o.order_id
       LEFT JOIN writer_info w ON co.writer_id = w.writer_id
       LEFT JOIN writer_info w2 ON co.writer_id_2 = w2.writer_id
       WHERE (o.customer_id IS NULL OR o.writer_id IS NULL OR 
              (co.writer_id_2 IS NOT NULL AND o.writer_id_2 IS NULL) OR
              (co.fee IS NOT NULL AND o.writer_fee IS NULL) OR
              (co.fee_2 IS NOT NULL AND o.writer_fee_2 IS NULL) OR
              (co.fee_per_1000 IS NOT NULL AND o.fee_per_1000 IS NULL))`);
        if (orderPairs.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '没有符合条件的订单需要合并'
            });
        }
        // 批量更新所有需要合并的订单
        const mergedOrders = [];
        const mergedOrderIds = [];
        for (const order of orderPairs) {
            // 检查需要更新哪些字段
            const needsCustomerUpdate = !order.existing_customer_id && order.customer_id;
            const needsWriterUpdate = !order.existing_writer_id && order.writer_numeric_id;
            const needsWriter2Update = !order.existing_writer_id_2 && order.writer_numeric_id_2;
            const needsWriterFeeUpdate = !order.existing_writer_fee && order.writer_fee;
            const needsWriterFee2Update = !order.existing_writer_fee_2 && order.writer_fee_2;
            const needsFeePer1000Update = !order.existing_fee_per_1000 && order.fee_per_1000;
            // 构建更新字段
            const updateFields = [];
            const updateValues = [];
            if (needsCustomerUpdate) {
                updateFields.push('customer_id = ?');
                updateValues.push(order.customer_id);
            }
            if (needsWriterUpdate) {
                updateFields.push('writer_id = ?');
                updateValues.push(order.writer_numeric_id);
            }
            if (needsWriter2Update) {
                updateFields.push('writer_id_2 = ?');
                updateValues.push(order.writer_numeric_id_2);
            }
            if (needsWriterFeeUpdate) {
                updateFields.push('writer_fee = ?');
                updateValues.push(order.writer_fee);
            }
            if (needsWriterFee2Update) {
                updateFields.push('writer_fee_2 = ?');
                updateValues.push(order.writer_fee_2);
            }
            if (needsFeePer1000Update) {
                updateFields.push('fee_per_1000 = ?');
                updateValues.push(order.fee_per_1000);
            }
            // 执行更新
            if (updateFields.length > 0) {
                updateValues.push(order.order_id);
                await db_1.default.query(`UPDATE orders SET ${updateFields.join(', ')} WHERE order_id = ?`, updateValues);
                mergedOrderIds.push(order.id);
            }
            mergedOrders.push({
                order_id: order.order_id,
                customer_id: order.customer_id,
                writer_id: order.writer_biz_id || null,
                writer_id_2: order.writer_biz_id_2 || null,
                writer_fee: order.writer_fee,
                writer_fee_2: order.writer_fee_2,
                fee_per_1000: order.fee_per_1000,
                updated_fields: {
                    customer_id: needsCustomerUpdate,
                    writer_id: needsWriterUpdate,
                    writer_id_2: needsWriter2Update,
                    writer_fee: needsWriterFeeUpdate,
                    writer_fee_2: needsWriterFee2Update,
                    fee_per_1000: needsFeePer1000Update
                }
            });
            // 佣金计算逻辑（新版）- 添加定稿状态判断
            const [orderDetailRows] = await db_1.default.query(`SELECT o.amount, o.refund_amount, o.fee, o.channel, o.status, o.customer_id, o.writer_id, o.writer_id_2, o.writer_fee, o.writer_fee_2, o.fee_per_1000,
                co.is_fixed
         FROM orders o
         LEFT JOIN customer_orders co ON o.order_id = co.order_id
         WHERE o.order_id = ?`, [order.order_id]);
            const orderDetail = orderDetailRows[0];
            let commission = null;
            if (orderDetail) {
                const amount = Number(orderDetail.amount || 0);
                const refund = Number(orderDetail.refund_amount || 0);
                const netIncome = amount - refund;
                const channel = orderDetail.channel || '';
                const status = orderDetail.status || '';
                const customerId = orderDetail.customer_id;
                const writerId = orderDetail.writer_id;
                const writerId2 = orderDetail.writer_id_2;
                const writerFee = Number(orderDetail.writer_fee || 0);
                const writerFee2 = Number(orderDetail.writer_fee_2 || 0);
                const feePer1000 = Number(orderDetail.fee_per_1000 || 0);
                const isFixed = orderDetail.is_fixed === 1; // 是否定稿
                // 参与计算的订单范围
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
                if (eligible) {
                    const hasWriter = (writerId || writerId2) && (writerFee > 0 || writerFee2 > 0);
                    const totalWriterFee = writerFee + writerFee2;
                    // 没有写手
                    if (!hasWriter) {
                        commission = +(netIncome * 0.42).toFixed(2);
                    }
                    else {
                        // 有写手
                        if (!feePer1000) {
                            // 未填写字数
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
                // 更新orders表
                await db_1.default.query(`UPDATE orders SET customer_commission = ? WHERE order_id = ?`, [commission, order.order_id]);
                // 同步到customer_orders表
                await db_1.default.query(`UPDATE customer_orders SET customer_commission = ? WHERE order_id = ?`, [commission, order.order_id]);
            }
        }
        // 合并后，批量更新已同步的客服订单is_merged=1
        if (mergedOrderIds.length > 0) {
            await db_1.default.query(`UPDATE customer_orders SET is_merged = 1 WHERE id IN (?)`, [mergedOrderIds]);
        }
        res.json({
            code: 0,
            message: '合并成功',
            data: {
                total: mergedOrders.length,
                merged_orders: mergedOrders
            }
        });
    }
    catch (error) {
        console.error('Merge customer order error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.mergeCustomerOrder = mergeCustomerOrder;
// 锁定客服订单（单个或批量）
const lockCustomerOrders = async (req, res) => {
    try {
        const { order_ids } = req.body; // 订单ID数组
        const userId = req.userId;
        if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
            return res.status(400).json({
                code: 1,
                message: '请提供要锁定的订单ID列表'
            });
        }
        // 检查当前用户是否有权限操作（必须是超管或财务）
        const [currentUser] = await db_1.default.query(`SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`, [userId]);
        if (currentUser.length === 0 ||
            !(currentUser[0].role_name.includes('超级管理员') ||
                currentUser[0].role_name.includes('财务'))) {
            return res.status(403).json({
                code: 1,
                message: '您没有权限执行此操作，仅限超级管理员和财务角色'
            });
        }
        // 检查订单是否存在且未被锁定
        const [existingOrders] = await db_1.default.query('SELECT id, order_id, is_locked FROM customer_orders WHERE id IN (?)', [order_ids]);
        if (existingOrders.length !== order_ids.length) {
            return res.status(400).json({
                code: 1,
                message: '部分订单不存在'
            });
        }
        // 检查是否有已锁定的订单
        const lockedOrders = existingOrders.filter((order) => order.is_locked);
        if (lockedOrders.length > 0) {
            return res.status(400).json({
                code: 1,
                message: `以下订单已被锁定，无法重复锁定: ${lockedOrders.map((o) => o.order_id).join(', ')}`
            });
        }
        // 批量锁定订单
        await db_1.default.query('UPDATE customer_orders SET is_locked = 1, locked_by = ?, locked_at = NOW() WHERE id IN (?)', [userId, order_ids]);
        res.json({
            code: 0,
            message: '锁定成功',
            data: {
                locked_count: order_ids.length,
                locked_orders: existingOrders.map((order) => ({
                    id: order.id,
                    order_id: order.order_id
                }))
            }
        });
    }
    catch (error) {
        console.error('Lock customer orders error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.lockCustomerOrders = lockCustomerOrders;
// 解锁客服订单（单个或批量）
const unlockCustomerOrders = async (req, res) => {
    try {
        const { order_ids } = req.body; // 订单ID数组
        const userId = req.userId;
        if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
            return res.status(400).json({
                code: 1,
                message: '请提供要解锁的订单ID列表'
            });
        }
        // 检查当前用户是否有权限操作（必须是超管或财务）
        const [currentUser] = await db_1.default.query(`SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`, [userId]);
        if (currentUser.length === 0 ||
            !(currentUser[0].role_name.includes('超级管理员') ||
                currentUser[0].role_name.includes('财务'))) {
            return res.status(403).json({
                code: 1,
                message: '您没有权限执行此操作，仅限超级管理员和财务角色'
            });
        }
        // 检查订单是否存在且已被锁定
        const [existingOrders] = await db_1.default.query('SELECT id, order_id, is_locked FROM customer_orders WHERE id IN (?)', [order_ids]);
        if (existingOrders.length !== order_ids.length) {
            return res.status(400).json({
                code: 1,
                message: '部分订单不存在'
            });
        }
        // 检查是否有未锁定的订单
        const unlockedOrders = existingOrders.filter((order) => !order.is_locked);
        if (unlockedOrders.length > 0) {
            return res.status(400).json({
                code: 1,
                message: `以下订单未被锁定，无法解锁: ${unlockedOrders.map((o) => o.order_id).join(', ')}`
            });
        }
        // 批量解锁订单
        await db_1.default.query('UPDATE customer_orders SET is_locked = 0, locked_by = NULL, locked_at = NULL WHERE id IN (?)', [order_ids]);
        res.json({
            code: 0,
            message: '解锁成功',
            data: {
                unlocked_count: order_ids.length,
                unlocked_orders: existingOrders.map((order) => ({
                    id: order.id,
                    order_id: order.order_id
                }))
            }
        });
    }
    catch (error) {
        console.error('Unlock customer orders error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.unlockCustomerOrders = unlockCustomerOrders;
// 自动同步客服订单到订单总表（用于定时任务）
const autoMergeCustomerOrder = async () => {
    try {
        console.log('开始自动同步客服订单到订单总表...');
        // 查找所有符合条件的订单进行合并
        // 条件：客服订单表中有记录，且订单总表中也有相同订单号的记录
        // 且订单总表中客服ID或写手ID至少有一个为空，或者第二个写手需要更新，或者佣金需要更新
        const [orderPairs] = await db_1.default.query(`SELECT co.order_id, co.customer_id, co.writer_id, co.writer_id_2, 
              co.fee as writer_fee, co.fee_2 as writer_fee_2,
              co.fee_per_1000,
              w.id as writer_numeric_id, w2.id as writer_numeric_id_2,
              w.writer_id as writer_biz_id, w2.writer_id as writer_biz_id_2,
              o.customer_id as existing_customer_id, o.writer_id as existing_writer_id, o.writer_id_2 as existing_writer_id_2,
              o.writer_fee as existing_writer_fee, o.writer_fee_2 as existing_writer_fee_2,
              o.fee_per_1000 as existing_fee_per_1000
       FROM customer_orders co
       INNER JOIN orders o ON co.order_id = o.order_id
       LEFT JOIN writer_info w ON co.writer_id = w.writer_id
       LEFT JOIN writer_info w2 ON co.writer_id_2 = w2.writer_id
       WHERE (o.customer_id IS NULL OR o.writer_id IS NULL OR 
              (co.writer_id_2 IS NOT NULL AND o.writer_id_2 IS NULL) OR
              (co.fee IS NOT NULL AND o.writer_fee IS NULL) OR
              (co.fee_2 IS NOT NULL AND o.writer_fee_2 IS NULL) OR
              (co.fee_per_1000 IS NOT NULL AND o.fee_per_1000 IS NULL))`);
        if (orderPairs.length === 0) {
            console.log('没有符合条件的订单需要同步');
            return {
                success: true,
                message: '没有符合条件的订单需要同步',
                total: 0,
                merged_orders: []
            };
        }
        // 批量更新所有需要合并的订单
        const mergedOrders = [];
        const mergedOrderIds = [];
        for (const order of orderPairs) {
            // 检查需要更新哪些字段
            const needsCustomerUpdate = !order.existing_customer_id && order.customer_id;
            const needsWriterUpdate = !order.existing_writer_id && order.writer_numeric_id;
            const needsWriter2Update = !order.existing_writer_id_2 && order.writer_numeric_id_2;
            const needsWriterFeeUpdate = !order.existing_writer_fee && order.writer_fee;
            const needsWriterFee2Update = !order.existing_writer_fee_2 && order.writer_fee_2;
            const needsFeePer1000Update = !order.existing_fee_per_1000 && order.fee_per_1000;
            // 构建更新字段
            const updateFields = [];
            const updateValues = [];
            if (needsCustomerUpdate) {
                updateFields.push('customer_id = ?');
                updateValues.push(order.customer_id);
            }
            if (needsWriterUpdate) {
                updateFields.push('writer_id = ?');
                updateValues.push(order.writer_numeric_id);
            }
            if (needsWriter2Update) {
                updateFields.push('writer_id_2 = ?');
                updateValues.push(order.writer_numeric_id_2);
            }
            if (needsWriterFeeUpdate) {
                updateFields.push('writer_fee = ?');
                updateValues.push(order.writer_fee);
            }
            if (needsWriterFee2Update) {
                updateFields.push('writer_fee_2 = ?');
                updateValues.push(order.writer_fee_2);
            }
            if (needsFeePer1000Update) {
                updateFields.push('fee_per_1000 = ?');
                updateValues.push(order.fee_per_1000);
            }
            // 执行更新
            if (updateFields.length > 0) {
                updateValues.push(order.order_id);
                await db_1.default.query(`UPDATE orders SET ${updateFields.join(', ')} WHERE order_id = ?`, updateValues);
                mergedOrderIds.push(order.id);
            }
            mergedOrders.push({
                order_id: order.order_id,
                customer_id: order.customer_id,
                writer_id: order.writer_biz_id || null,
                writer_id_2: order.writer_biz_id_2 || null,
                writer_fee: order.writer_fee,
                writer_fee_2: order.writer_fee_2,
                fee_per_1000: order.fee_per_1000,
                updated_fields: {
                    customer_id: needsCustomerUpdate,
                    writer_id: needsWriterUpdate,
                    writer_id_2: needsWriter2Update,
                    writer_fee: needsWriterFeeUpdate,
                    writer_fee_2: needsWriterFee2Update,
                    fee_per_1000: needsFeePer1000Update
                }
            });
            // 佣金计算逻辑（新版）- 添加定稿状态判断
            const [orderDetailRows] = await db_1.default.query(`SELECT o.amount, o.refund_amount, o.fee, o.channel, o.status, o.customer_id, o.writer_id, o.writer_id_2, o.writer_fee, o.writer_fee_2, o.fee_per_1000,
                co.is_fixed
         FROM orders o
         LEFT JOIN customer_orders co ON o.order_id = co.order_id
         WHERE o.order_id = ?`, [order.order_id]);
            const orderDetail = orderDetailRows[0];
            let commission = null;
            if (orderDetail) {
                const amount = Number(orderDetail.amount || 0);
                const refund = Number(orderDetail.refund_amount || 0);
                const netIncome = amount - refund;
                const channel = orderDetail.channel || '';
                const status = orderDetail.status || '';
                const customerId = orderDetail.customer_id;
                const writerId = orderDetail.writer_id;
                const writerId2 = orderDetail.writer_id_2;
                const writerFee = Number(orderDetail.writer_fee || 0);
                const writerFee2 = Number(orderDetail.writer_fee_2 || 0);
                const feePer1000 = Number(orderDetail.fee_per_1000 || 0);
                const isFixed = orderDetail.is_fixed === 1; // 是否定稿
                // 参与计算的订单范围
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
                if (eligible) {
                    const hasWriter = (writerId || writerId2) && (writerFee > 0 || writerFee2 > 0);
                    const totalWriterFee = writerFee + writerFee2;
                    // 没有写手
                    if (!hasWriter) {
                        commission = +(netIncome * 0.42).toFixed(2);
                    }
                    else {
                        // 有写手
                        if (!feePer1000) {
                            // 未填写字数
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
                // 更新orders表
                await db_1.default.query(`UPDATE orders SET customer_commission = ? WHERE order_id = ?`, [commission, order.order_id]);
                // 同步到customer_orders表
                await db_1.default.query(`UPDATE customer_orders SET customer_commission = ? WHERE order_id = ?`, [commission, order.order_id]);
            }
        }
        // 合并后，批量更新已同步的客服订单is_merged=1
        if (mergedOrderIds.length > 0) {
            await db_1.default.query(`UPDATE customer_orders SET is_merged = 1 WHERE id IN (?)`, [mergedOrderIds]);
        }
        console.log(`自动同步完成，共处理 ${mergedOrders.length} 个订单`);
        return {
            success: true,
            message: '自动同步成功',
            total: mergedOrders.length,
            merged_orders: mergedOrders
        };
    }
    catch (error) {
        console.error('自动同步客服订单错误:', error);
        return {
            success: false,
            message: '自动同步失败',
            error: error.message
        };
    }
};
exports.autoMergeCustomerOrder = autoMergeCustomerOrder;
// 导出客服佣金明细API
const exportCustomerCommission = async (req, res) => {
    try {
        const userId = req.userId;
        const { start, end } = req.query;
        console.log('[导出客服佣金] 入参:', { userId, start, end });
        // 权限校验：仅限超级管理员和财务
        const [currentUser] = await db_1.default.query(`SELECT r.role_name FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.id = ?`, [userId]);
        if (currentUser.length === 0 ||
            !(currentUser[0].role_name.includes('超级管理员') || currentUser[0].role_name.includes('财务'))) {
            console.log('[导出客服佣金] 权限不足:', currentUser);
            return res.status(403).json({ code: 1, message: '您没有权限执行此操作，仅限超级管理员和财务角色' });
        }
        if (!start || !end) {
            console.log('[导出客服佣金] 缺少时间参数');
            return res.status(400).json({ code: 1, message: '请提供导出时间周期（start, end）' });
        }
        // 1. 查询所有明细订单
        const [orders] = await db_1.default.query(`SELECT co.id, co.order_id, co.date, co.customer_id, u.username AS customer_service_name, co.customer_commission,
              co.writer_id, w1.name AS writer_name, co.fee, w1.alipay_name AS writer_alipay_name, w1.alipay_account AS writer_alipay_account,
              co.writer_id_2, w2.name AS writer_name_2, co.fee_2, w2.alipay_name AS writer2_alipay_name, w2.alipay_account AS writer2_alipay_account
       FROM customer_orders co
       LEFT JOIN users u ON co.customer_id = u.id
       LEFT JOIN writer_info w1 ON co.writer_id = w1.writer_id
       LEFT JOIN writer_info w2 ON co.writer_id_2 = w2.writer_id
       WHERE co.date >= ? AND co.date <= ?
         AND co.customer_commission IS NOT NULL
         AND co.customer_commission != ''
         AND co.customer_commission <> 0
         AND co.customer_commission <> 0.00
       ORDER BY co.date ASC`, [start, end]);
        // 2. 汇总全局总和
        const [summaryRows] = await db_1.default.query(`SELECT COUNT(*) AS order_count,
              SUM(customer_commission) AS customer_commission_total,
              SUM(COALESCE(fee,0) + COALESCE(fee_2,0)) AS writer_fee_total
       FROM customer_orders
       WHERE date >= ? AND date <= ?
         AND customer_commission IS NOT NULL
         AND customer_commission != ''
         AND customer_commission <> 0
         AND customer_commission <> 0.00`, [start, end]);
        const summary = summaryRows[0] || { order_count: 0, customer_commission_total: 0, writer_fee_total: 0 };
        // 3. 客服汇总
        const [customerSummary] = await db_1.default.query(`SELECT co.customer_id, u.username AS customer_service_name,
              COUNT(*) AS order_count,
              SUM(co.customer_commission) AS customer_commission_total
       FROM customer_orders co
       LEFT JOIN users u ON co.customer_id = u.id
       WHERE co.date >= ? AND co.date <= ?
         AND co.customer_commission IS NOT NULL
         AND co.customer_commission != ''
         AND co.customer_commission <> 0
         AND co.customer_commission <> 0.00
       GROUP BY co.customer_id, u.username`, [start, end]);
        // 4. 写手汇总（合并写手1/2）
        const [writerSummary] = await db_1.default.query(`SELECT w.writer_id, w.name AS writer_name, w.alipay_name, w.alipay_account,
              SUM(t.fee) AS writer_fee_total, COUNT(*) AS order_count
       FROM (
         SELECT writer_id, fee FROM customer_orders
         WHERE date >= ? AND date <= ?
           AND customer_commission IS NOT NULL
           AND customer_commission != ''
           AND customer_commission <> 0
           AND customer_commission <> 0.00
           AND writer_id IS NOT NULL AND writer_id != ''
         UNION ALL
         SELECT writer_id_2 AS writer_id, fee_2 AS fee FROM customer_orders
         WHERE date >= ? AND date <= ?
           AND customer_commission IS NOT NULL
           AND customer_commission != ''
           AND customer_commission <> 0
           AND customer_commission <> 0.00
           AND writer_id_2 IS NOT NULL AND writer_id_2 != ''
       ) t
       LEFT JOIN writer_info w ON t.writer_id = w.writer_id
       GROUP BY w.writer_id, w.name, w.alipay_name, w.alipay_account
       HAVING writer_fee_total IS NOT NULL AND writer_fee_total != 0
       ORDER BY writer_fee_total DESC`, [start, end, start, end]);
        res.json({
            code: 0,
            data: {
                orders,
                summary,
                customer_summary: customerSummary,
                writer_summary: writerSummary
            }
        });
    }
    catch (error) {
        console.error('Export customer commission error:', error);
        res.status(500).json({ code: 1, message: '服务器错误' });
    }
};
exports.exportCustomerCommission = exportCustomerCommission;
