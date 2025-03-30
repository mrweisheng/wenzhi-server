"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatistics = void 0;
const db_1 = require("../config/db");
// 获取系统统计数据
const getStatistics = async (req, res) => {
    try {
        // 获取用户总数
        const [userCount] = await (0, db_1.query)('SELECT COUNT(*) as count FROM users');
        // 获取菜单总数
        const [menuCount] = await (0, db_1.query)('SELECT COUNT(*) as count FROM menus');
        // 获取角色总数
        const [roleCount] = await (0, db_1.query)('SELECT COUNT(*) as count FROM roles');
        // 获取写手总数
        const [writerCount] = await (0, db_1.query)('SELECT COUNT(*) as count FROM writer_info');
        // 获取订单总数
        const [orderCount] = await (0, db_1.query)('SELECT COUNT(*) as count FROM orders');
        // 获取最近7天的订单金额统计（基于最后一笔订单时间）
        const [sevenDaysAmount] = await (0, db_1.query)(`
      WITH last_order_date AS (
        SELECT MAX(create_time) as max_date
        FROM orders
      )
      SELECT 
        DATE_FORMAT(create_time, '%Y-%m-%d') as date,
        COALESCE(SUM(amount), 0) as amount
      FROM orders 
      WHERE create_time >= DATE_SUB(
        (SELECT max_date FROM last_order_date),
        INTERVAL 6 DAY
      )
      GROUP BY DATE_FORMAT(create_time, '%Y-%m-%d')
      ORDER BY date ASC
    `);
        // 获取各渠道订单数统计
        const [channelOrders] = await (0, db_1.query)(`
      SELECT 
        channel,
        COUNT(*) as count
      FROM orders
      GROUP BY channel
    `);
        // 处理渠道订单数据
        const channelOrdersMap = channelOrders.reduce((acc, curr) => {
            acc[curr.channel] = curr.count;
            return acc;
        }, {});
        // 处理7天订单金额数据
        const formattedSevenDaysAmount = sevenDaysAmount.map((item) => ({
            date: item.date,
            amount: Number(item.amount) || 0
        }));
        res.json({
            code: 0,
            data: {
                userCount: userCount[0].count,
                menuCount: menuCount[0].count,
                roleCount: roleCount[0].count,
                writerCount: writerCount[0].count,
                orderCount: orderCount[0].count,
                sevenDaysAmount: formattedSevenDaysAmount,
                channelOrders: channelOrdersMap
            },
            message: "获取成功"
        });
    }
    catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getStatistics = getStatistics;
