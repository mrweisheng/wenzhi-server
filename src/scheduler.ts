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
  // 每4小时执行一次
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  
  setInterval(async () => {
    try {
      console.log('执行结算状态自动修正任务...');
      await autoFixSettlementStatus();
    } catch (error) {
      console.error('结算状态自动修正任务执行错误:', error);
    }
  }, FOUR_HOURS_MS);
  
  console.log('结算状态自动修正任务已启动，每4小时执行一次');
}

// 自动修正结算状态
export const autoFixSettlementStatus = async () => {
  const pool = require('./config/db').default || require('./config/db');
  const BATCH_SIZE = 100; // 增加批处理大小
  let offset = 0;
  let totalFixed = 0;
  let totalReverted = 0;
  let hasMore = true;

  console.log('开始自动修正结算状态...');
  const startTime = Date.now();

  while (hasMore) {
    // 优化查询：只处理最近3天的订单，减少数据量
    const [orders] = await pool.query(
      `SELECT co.id, co.order_id, co.order_amount, co.settlement_status, co.is_fixed, o.amount
       FROM customer_orders co
       LEFT JOIN orders o ON co.order_id = o.order_id
       WHERE co.date >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
         AND (co.settlement_status = 'Pending' OR co.settlement_status = 'Eligible')
         AND co.is_fixed IS NOT NULL  -- 只处理有定稿状态的订单
       ORDER BY co.date DESC  -- 优先处理最新订单
       LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset]
    );

    if (orders.length === 0) {
      console.log('没有更多订单需要处理');
      break;
    }

    // 批量更新，减少数据库交互次数
    const eligibleUpdates = [];
    const pendingUpdates = [];

    for (const order of orders) {
      const amountMatch = Math.abs(Number(order.order_amount || 0) - Number(order.amount || 0)) < 0.01;
      const isEligible = order.is_fixed === 1 && amountMatch && order.order_id;

      if (order.settlement_status === 'Pending' && isEligible) {
        eligibleUpdates.push(order.id);
        totalFixed++;
      } else if (order.settlement_status === 'Eligible' && !isEligible) {
        pendingUpdates.push(order.id);
        totalReverted++;
      }
    }

    // 批量更新 Eligible 状态
    if (eligibleUpdates.length > 0) {
      await pool.query(
        'UPDATE customer_orders SET settlement_status = ? WHERE id IN (?)',
        ['Eligible', eligibleUpdates]
      );
    }

    // 批量更新 Pending 状态
    if (pendingUpdates.length > 0) {
      await pool.query(
        'UPDATE customer_orders SET settlement_status = ? WHERE id IN (?)',
        ['Pending', pendingUpdates]
      );
    }

    hasMore = orders.length === BATCH_SIZE;
    offset += BATCH_SIZE;
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`自动修正完成：新增 Eligible ${totalFixed} 条，回退 Pending ${totalReverted} 条，耗时 ${duration}ms`);
  return { totalFixed, totalReverted, duration };
} 