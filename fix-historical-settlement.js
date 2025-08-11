const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: '118.31.76.202',
  port: 3306,
  user: 'admin_user',
  password: '2wsx@WSX',
  database: 'wenzhi',
  charset: 'utf8mb4'
};

/**
 * 批量处理历史订单的结算状态
 * 处理6、7月份的订单，将符合条件的订单从Pending改为Eligible
 */
async function fixHistoricalSettlement() {
  const pool = mysql.createPool(dbConfig);
  const connection = await pool.getConnection();
  
  try {
    console.log('开始批量处理历史订单结算状态...');
    const startTime = Date.now();
    
    // 开始事务
    await connection.beginTransaction();
    
    // 查询6、7月份的所有Pending订单
    const [orders] = await connection.query(
      `SELECT co.id, co.order_id, co.order_amount, co.settlement_status, co.is_fixed, co.date,
              o.amount, o.refund_amount
       FROM customer_orders co
       LEFT JOIN orders o ON co.order_id = o.order_id
       WHERE co.date >= '2025-06-01' AND co.date <= '2025-07-31'
         AND co.settlement_status = 'Pending'
         AND co.is_fixed = 1
       ORDER BY co.date ASC`
    );
    
    console.log(`找到 ${orders.length} 条待处理的订单`);
    
    if (orders.length === 0) {
      console.log('没有找到需要处理的订单，处理完成');
      await connection.commit();
      return;
    }
    
    let eligibleCount = 0;
    let pendingCount = 0;
    const eligibleUpdates = [];
    const pendingUpdates = [];
    
    console.log('开始检查订单金额匹配情况...');
    
    for (const order of orders) {
      // 计算金额匹配
      const platformAmount = Number(order.amount || 0);
      const refundAmount = Number(order.refund_amount || 0);
      const netPlatformAmount = platformAmount - refundAmount;
      const customerAmount = Number(order.order_amount || 0);
      
      // 金额匹配（允许0.01的误差）
      const amountMatch = Math.abs(netPlatformAmount - customerAmount) <= 0.01;
      
      if (amountMatch) {
        eligibleUpdates.push(order.id);
        eligibleCount++;
        console.log(`✅ 订单 ${order.order_id}: 客服金额 ${customerAmount}, 平台净额 ${netPlatformAmount}, 匹配成功`);
      } else {
        pendingUpdates.push(order.id);
        pendingCount++;
        console.log(`❌ 订单 ${order.order_id}: 客服金额 ${customerAmount}, 平台净额 ${netPlatformAmount}, 差异 ${Math.abs(netPlatformAmount - customerAmount)}`);
      }
    }
    
    // 批量更新为Eligible
    if (eligibleUpdates.length > 0) {
      await connection.query(
        'UPDATE customer_orders SET settlement_status = ?, settlement_updated_by = 1, settlement_updated_at = NOW() WHERE id IN (?)',
        ['Eligible', eligibleUpdates]
      );
      console.log(`✅ 成功更新 ${eligibleCount} 条订单为可结算状态`);
    }
    
    // 批量更新为Pending（保持原状态，但确保数据一致性）
    if (pendingUpdates.length > 0) {
      await connection.query(
        'UPDATE customer_orders SET settlement_status = ?, settlement_updated_by = 1, settlement_updated_at = NOW() WHERE id IN (?)',
        ['Pending', pendingUpdates]
      );
      console.log(`ℹ️  保持 ${pendingCount} 条订单为未结算状态（不满足条件）`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n=== 处理结果汇总 ===');
    console.log(`总处理订单数: ${orders.length}`);
    console.log(`变更为可结算: ${eligibleCount} 条`);
    console.log(`保持未结算: ${pendingCount} 条`);
    console.log(`处理耗时: ${duration}ms`);
    
    // 提交事务
    await connection.commit();
    console.log('✅ 事务提交成功');
    
    // 输出详细信息
    if (eligibleCount > 0) {
      console.log('\n=== 已变更为可结算的订单示例 ===');
      const [sampleOrders] = await connection.query(
        `SELECT order_id, date, order_amount, is_fixed, settlement_status 
         FROM customer_orders 
         WHERE id IN (?) 
         LIMIT 5`,
        [eligibleUpdates.slice(0, 5)]
      );
      sampleOrders.forEach(order => {
        console.log(`订单号: ${order.order_id}, 日期: ${order.date}, 金额: ${order.order_amount}, 定稿: ${order.is_fixed}`);
      });
    }
    
  } catch (error) {
    console.error('批量处理失败:', error);
    // 回滚事务
    if (connection) {
      await connection.rollback();
      console.log('❌ 事务已回滚');
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

/**
 * 查询处理结果统计
 */
async function checkProcessingResults() {
  const pool = mysql.createPool(dbConfig);
  
  try {
    console.log('\n=== 6、7月份订单结算状态统计 ===');
    
    const [stats] = await pool.query(
      `SELECT 
         settlement_status,
         COUNT(*) as count,
         DATE_FORMAT(date, '%Y-%m') as month
       FROM customer_orders 
       WHERE date >= '2025-06-01' AND date <= '2025-07-31'
       GROUP BY settlement_status, DATE_FORMAT(date, '%Y-%m')
       ORDER BY month, settlement_status`
    );
    
    console.log('结算状态分布:');
    stats.forEach(stat => {
      console.log(`${stat.month} - ${stat.settlement_status}: ${stat.count} 条`);
    });
    
  } catch (error) {
    console.error('查询统计失败:', error);
  } finally {
    await pool.end();
  }
}

// 执行批量处理
async function main() {
  console.log('🚀 开始批量处理历史订单结算状态...');
  console.log('处理范围: 2025年6月-7月');
  console.log('处理条件: 已定稿且金额匹配的Pending订单');
  console.log('='.repeat(50));
  
  await fixHistoricalSettlement();
  await checkProcessingResults();
  
  console.log('\n✅ 批量处理完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  fixHistoricalSettlement,
  checkProcessingResults
};
