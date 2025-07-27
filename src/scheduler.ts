import { autoMergeCustomerOrder } from './controllers/customerOrder'

// 定时同步客服订单到订单总表
export const scheduleCustomerOrderSync = () => {
  // 每小时执行一次同步
  setInterval(async () => {
    try {
      console.log('执行定时同步任务...')
      const result = await autoMergeCustomerOrder()
      
      if (result.success) {
        console.log(`定时同步成功: ${result.message}, 处理订单数: ${result.total}`)
      } else {
        console.error(`定时同步失败: ${result.message}`)
      }
    } catch (error) {
      console.error('定时同步任务执行错误:', error)
    }
  }, 60 * 60 * 1000) // 60分钟 = 1小时
  
  console.log('客服订单自动同步任务已启动，每小时执行一次')
}

// 立即执行一次同步（服务启动时）
export const initialCustomerOrderSync = async () => {
  try {
    console.log('服务启动，执行初始同步...')
    const result = await autoMergeCustomerOrder()
    
    if (result.success) {
      console.log(`初始同步完成: ${result.message}, 处理订单数: ${result.total}`)
    } else {
      console.error(`初始同步失败: ${result.message}`)
    }
  } catch (error) {
    console.error('初始同步错误:', error)
  }
}

// 结算状态自动修正定时任务
export const scheduleSettlementStatusSync = () => {
  // 每天凌晨2点执行
  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  
  setInterval(async () => {
    try {
      console.log('执行结算状态自动修正任务...');
      await autoFixSettlementStatus();
    } catch (error) {
      console.error('结算状态自动修正任务执行错误:', error);
    }
  }, DAY_IN_MS);
  
  console.log('结算状态自动修正任务已启动，每天凌晨2点执行一次');
}

// 自动修正结算状态
export const autoFixSettlementStatus = async () => {
  const pool = require('./config/db').default || require('./config/db');
  const BATCH_SIZE = 50; // 每批处理50条
  let offset = 0;
  let totalFixed = 0;
  let totalReverted = 0;
  let hasMore = true;

  console.log('开始自动修正结算状态...');

  while (hasMore) {
    // 查询最近7天的订单，分批处理
    const [orders] = await pool.query(
      `SELECT co.id, co.order_id, co.order_amount, co.settlement_status, co.is_fixed, o.amount
       FROM customer_orders co
       LEFT JOIN orders o ON co.order_id = o.order_id
       WHERE co.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         AND (co.settlement_status = 'Pending' OR co.settlement_status = 'Eligible')
       LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset]
    );

    if (orders.length === 0) {
      console.log('没有更多订单需要处理');
      break;
    }

    for (const order of orders) {
      const amountMatch = Math.abs(Number(order.order_amount || 0) - Number(order.amount || 0)) < 0.01;
      const isEligible = order.is_fixed === 1 && amountMatch && order.order_id;

      if (order.settlement_status === 'Pending' && isEligible) {
        // Pending → Eligible
        await pool.query(
          'UPDATE customer_orders SET settlement_status = ? WHERE id = ?',
          ['Eligible', order.id]
        );
        totalFixed++;
        console.log(`订单 ${order.order_id} 自动流转为 Eligible`);
      } else if (order.settlement_status === 'Eligible' && !isEligible) {
        // Eligible → Pending (回退)
        await pool.query(
          'UPDATE customer_orders SET settlement_status = ? WHERE id = ?',
          ['Pending', order.id]
        );
        totalReverted++;
        console.log(`订单 ${order.order_id} 回退为 Pending`);
      }
    }

    hasMore = orders.length === BATCH_SIZE;
    offset += BATCH_SIZE;
  }

  console.log(`自动修正完成：新增 Eligible ${totalFixed} 条，回退 Pending ${totalReverted} 条`);
  return { totalFixed, totalReverted };
} 