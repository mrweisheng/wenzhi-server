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

/**
 * 每日遗漏订单检查任务
 * 处理因时序问题导致的遗漏订单（客服先录入，平台订单后同步的情况）
 */
export const dailyMissedOrderCheck = async () => {
  const pool = require('./config/db').default || require('./config/db');
  const BATCH_SIZE = 500;
  let totalFixed = 0;
  
  console.log('开始检查遗漏的自动结算订单...');
  const startTime = Date.now();
  
  try {
    // 动态导入函数，避免循环依赖
    const { checkEligibleForSettlement } = await import('./controllers/customerOrder');
    
    // 查询所有满足条件但状态仍为Pending的订单
    const [missedOrders] = await pool.query(`
      SELECT co.order_id
      FROM customer_orders co
      LEFT JOIN orders o ON co.order_id = o.order_id
      WHERE co.settlement_status = 'Pending'
        AND co.is_fixed = 1
        AND o.order_id IS NOT NULL
        AND ABS(co.order_amount - o.amount) <= 0.01
      ORDER BY co.updated_at DESC
      LIMIT ?
    `, [BATCH_SIZE]);
    
    // 批量处理遗漏订单
    for (const order of missedOrders) {
      try {
        await checkEligibleForSettlement(order.order_id);
        totalFixed++;
      } catch (error) {
        console.error(`处理遗漏订单 ${order.order_id} 失败:`, error);
      }
      
      // 每处理10个订单暂停一下，避免数据库压力
      if (totalFixed % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`遗漏订单检查完成：处理了 ${totalFixed} 个订单，耗时 ${duration}ms`);
    return { totalFixed, duration };
    
  } catch (error) {
    console.error('遗漏订单检查失败:', error);
    return { totalFixed: 0, duration: 0, error: error.message };
  }
};

// 启动遗漏订单检查定时任务
export const scheduleMissedOrderCheck = () => {
  // 每天凌晨2点执行一次
  const DAILY_MS = 24 * 60 * 60 * 1000;
  
  // 计算到明天凌晨2点的延迟时间
  const now = new Date();
  const tomorrow2AM = new Date();
  tomorrow2AM.setDate(now.getDate() + 1);
  tomorrow2AM.setHours(2, 0, 0, 0);
  const initialDelay = tomorrow2AM.getTime() - now.getTime();
  
  // 首次延迟到明天凌晨2点，然后每24小时执行一次
  setTimeout(() => {
    dailyMissedOrderCheck(); // 立即执行一次
    
    setInterval(async () => {
      try {
        console.log('执行遗漏订单检查任务...');
        await dailyMissedOrderCheck();
      } catch (error) {
        console.error('遗漏订单检查任务执行错误:', error);
      }
    }, DAILY_MS);
  }, initialDelay);
  
  console.log('遗漏订单检查任务已启动，每天凌晨2点执行');
};

/**
 * 每日佣金修复任务
 * 检查并修复符合条件但佣金为0的订单
 */
export const dailyCommissionFix = async () => {
  const pool = require('./config/db').default || require('./config/db');
  const BATCH_SIZE = 200;
  let totalFixed = 0;
  
  console.log('开始检查需要修复佣金的订单...');
  const startTime = Date.now();
  
  try {
    // 动态导入函数，避免循环依赖
    const { recalculateCustomerCommissionForOrder } = await import('./controllers/customerOrder');
    
    // 查询所有符合佣金计算条件但佣金为0的订单
    const [zeroCommissionOrders] = await pool.query(`
      SELECT co.order_id
      FROM customer_orders co
      LEFT JOIN orders o ON co.order_id = o.order_id
      WHERE co.customer_commission = 0
        AND co.is_fixed = 1
        AND (co.settlement_status = 'SelfLocked' OR co.settlement_status = 'WriterSettled')
        AND o.order_id IS NOT NULL
        AND o.customer_id IS NOT NULL
        AND (o.amount - COALESCE(o.refund_amount, 0)) > 0
      ORDER BY co.updated_at DESC
      LIMIT ?
    `, [BATCH_SIZE]);
    
    console.log(`发现 ${zeroCommissionOrders.length} 个需要修复佣金的订单`);
    
    // 批量处理需要修复佣金的订单
    for (const order of zeroCommissionOrders) {
      try {
        await recalculateCustomerCommissionForOrder(order.order_id);
        totalFixed++;
        
        // 记录修复日志
        console.log(`已修复订单 ${order.order_id} 的佣金`);
      } catch (error) {
        console.error(`修复订单 ${order.order_id} 佣金失败:`, error);
      }
      
      // 每处理10个订单暂停一下，避免数据库压力
      if (totalFixed % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`佣金修复任务完成：修复了 ${totalFixed} 个订单的佣金，耗时 ${duration}ms`);
    return { totalFixed, duration };
    
  } catch (error) {
    console.error('佣金修复任务失败:', error);
    return { totalFixed: 0, duration: 0, error: error.message };
  }
};

// 启动佣金修复定时任务
export const scheduleCommissionFix = () => {
  // 每天晚上12点执行一次
  const DAILY_MS = 24 * 60 * 60 * 1000;
  
  // 计算到今晚12点的延迟时间
  const now = new Date();
  const tonight12AM = new Date();
  tonight12AM.setHours(24, 0, 0, 0); // 设置为今晚12点（即明天0点）
  let initialDelay = tonight12AM.getTime() - now.getTime();
  
  // 如果已经过了今晚12点，则设置为明晚12点
  if (initialDelay <= 0) {
    tonight12AM.setDate(tonight12AM.getDate() + 1);
    initialDelay = tonight12AM.getTime() - now.getTime();
  }
  
  // 首次延迟到晚上12点，然后每24小时执行一次
  setTimeout(() => {
    dailyCommissionFix(); // 立即执行一次
    
    setInterval(async () => {
      try {
        console.log('执行佣金修复任务...');
        await dailyCommissionFix();
      } catch (error) {
        console.error('佣金修复任务执行错误:', error);
      }
    }, DAILY_MS);
  }, initialDelay);
  
  console.log('佣金修复任务已启动，每天晚上12点执行');
};