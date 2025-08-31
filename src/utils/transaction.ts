import pool from '../config/db'
import { PoolConnection } from 'mysql2/promise'

/**
 * 事务工具函数
 * 提供数据库事务的统一处理，确保操作的原子性
 * @param callback 需要在事务中执行的回调函数
 * @returns 回调函数的返回值
 */
export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection()
  await connection.beginTransaction()
  
  try {
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/**
 * 带重试机制的事务工具函数
 * 在网络不稳定或连接问题时提供重试能力
 * @param callback 需要在事务中执行的回调函数
 * @param maxRetries 最大重试次数，默认为3
 * @returns 回调函数的返回值
 */
export async function withTransactionRetry<T>(
  callback: (connection: PoolConnection) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(callback)
    } catch (error: any) {
      lastError = error
      
      // 如果是连接相关错误且还有重试机会，则继续重试
      if (attempt < maxRetries && 
          (error.code === 'PROTOCOL_CONNECTION_LOST' || 
           error.code === 'ECONNREFUSED' || 
           error.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR')) {
        console.warn(`事务执行失败，正在进行第${attempt}次重试...`, error.message)
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
      }
      
      // 其他错误或达到最大重试次数，直接抛出
      throw error
    }
  }
  
  throw lastError
}