const mysql = require('mysql2/promise');

// 数据库配置 - 请根据你的实际配置修改
const pool = mysql.createPool({
  host: '118.31.76.202',  // 你的数据库地址
  user: 'admin_user',
  password: '2wsx@WSX',      // 你的数据库密码
  database: 'wenzhi',
  // host: 'localhost',  // 你的数据库地址
  // user: 'root',
  // password: '1qaz!QAZ2wsx@WSX',      // 你的数据库密码
  // database: 'wenzhi',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0
});

/**
 * 批量修正所有满足条件的 Pending 订单为 Eligible
 */
async function batchFixEligibleStatus() {
  const BATCH_SIZE = 100;
  let offset = 0;
  let totalFixed = 0;
  let hasMore = true;

  console.log('开始批量修正存量数据...');

  while (hasMore) {
    // 查询一批 Pending 且已定稿的订单，且 orders 表有对应订单
    const [pendingOrders] = await pool.query(
      `SELECT co.id, co.order_id, co.order_amount, o.amount, co.is_fixed
       FROM customer_orders co
       LEFT JOIN orders o ON co.order_id = o.order_id
       WHERE co.settlement_status = 'Pending'
         AND co.is_fixed = 1
         AND o.order_id IS NOT NULL
       LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset]
    );

    if (pendingOrders.length === 0) {
      console.log('没有更多订单需要处理');
      break;
    }

    console.log(`处理第 ${offset + 1} 到 ${offset + pendingOrders.length} 条订单...`);

    for (const order of pendingOrders) {
      // 金额一致判定
      const amountMatch = Math.abs(Number(order.order_amount || 0) - Number(order.amount || 0)) < 0.01;
      if (amountMatch) {
        // 满足条件，更新为 Eligible
        await pool.query(
          `UPDATE customer_orders SET settlement_status = 'Eligible' WHERE id = ?`,
          [order.id]
        );
        totalFixed++;
        console.log(`订单 ${order.order_id} 已修正为 Eligible`);
      }
    }

    hasMore = pendingOrders.length === BATCH_SIZE;
    offset += BATCH_SIZE;
  }

  console.log(`批量修正完成，共修正 ${totalFixed} 条订单`);
  return totalFixed;
}

async function runBatchFix() {
  try {
    const result = await batchFixEligibleStatus();
    console.log(`批量修正完成，共修正 ${result} 条订单`);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('批量修正失败:', error);
    await pool.end();
    process.exit(1);
  }
}

runBatchFix(); 