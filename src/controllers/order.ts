import { Request, Response } from 'express'
import pool from '../config/db'

// 获取订单列表
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      pageSize = 10,
      order_id,
      payment_id,
      status,
      channel,
      startTime,
      endTime
    } = req.query

    // 构建查询条件
    let sql = 'SELECT * FROM orders WHERE 1=1'
    const params: any[] = []

    if (order_id) {
      sql += ' AND order_id = ?'
      params.push(order_id)
    }
    if (payment_id) {
      sql += ' AND payment_id = ?'
      params.push(payment_id)
    }
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    if (channel) {
      sql += ' AND channel = ?'
      params.push(channel)
    }
    if (startTime) {
      sql += ' AND create_time >= ?'
      params.push(startTime)
    }
    if (endTime) {
      sql += ' AND create_time <= ?'
      params.push(endTime)
    }

    // 计算总数
    const [countResult]: any = await pool.query(
      `SELECT COUNT(*) as total FROM (${sql}) as t`,
      params
    )
    const total = countResult[0].total

    // 分页查询
    sql += ' ORDER BY create_time DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))

    const [rows] = await pool.query(sql, params)

    res.json({
      code: 0,
      data: {
        total,
        list: rows
      },
      message: "获取成功"
    })
  } catch (err: any) {
    console.error('Get orders error:', err)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 