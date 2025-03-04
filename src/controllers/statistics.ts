import { Request, Response } from 'express'
import pool from '../config/db'

// 获取系统统计数据
export const getStatistics = async (req: Request, res: Response) => {
  try {
    // 使用Promise.all并行查询各个统计数据
    const [
      [userResult],
      [menuResult],
      [roleResult],
      [writerResult],
      [orderResult]
    ]: any = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM menus'),
      pool.query('SELECT COUNT(*) as count FROM roles'),
      pool.query('SELECT COUNT(*) as count FROM writer_info'),
      pool.query('SELECT COUNT(*) as count FROM orders')
    ])

    res.json({
      code: 0,
      data: {
        userCount: userResult[0].count,
        menuCount: menuResult[0].count,
        roleCount: roleResult[0].count,
        writerCount: writerResult[0].count,
        orderCount: orderResult[0].count
      },
      message: "获取成功"
    })
  } catch (err: any) {
    console.error('Get statistics error:', err)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 