import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../config/db'

// 获取用户列表
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { username, role_id, status } = req.query

    let sql = `
      SELECT u.*, r.role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE 1=1
    `
    const params: any[] = []

    if (username) {
      sql += ' AND u.username LIKE ?'
      params.push(`%${username}%`)
    }

    if (role_id) {
      sql += ' AND u.role_id = ?'
      params.push(role_id)
    }

    if (status !== undefined && status !== '') {
      sql += ' AND u.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY u.id DESC'

    const [users] = await pool.query(sql, params)

    res.json({
      code: 0,
      data: users
    })
  } catch (err: any) {
    console.error('Get users error:', err)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 创建用户
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, role_id, real_name, email, status } = req.body

    // 检查用户名是否已存在
    const [existing]: any = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    )

    if (existing.length > 0) {
      return res.status(400).json({
        code: 1,
        message: '用户名已存在'
      })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    await pool.query(
      'INSERT INTO users (username, password, role_id, real_name, email, status) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, role_id, real_name, email, status]
    )

    res.json({
      code: 0,
      message: '创建成功'
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 更新用户
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { username, password, role_id, real_name, email, status } = req.body

    // 检查用户名是否已存在
    const [existing]: any = await pool.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, id]
    )

    if (existing.length > 0) {
      return res.status(400).json({
        code: 1,
        message: '用户名已存在'
      })
    }

    // 构建更新SQL
    let sql = 'UPDATE users SET username = ?, role_id = ?, real_name = ?, email = ?, status = ?'
    const params = [username, role_id, real_name, email, status]

    // 如果有密码，则更新密码
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      sql += ', password = ?'
      params.push(hashedPassword)
    }

    sql += ' WHERE id = ?'
    params.push(id)

    await pool.query(sql, params)

    res.json({
      code: 0,
      message: '更新成功'
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 删除用户
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await pool.query('DELETE FROM users WHERE id = ?', [id])

    res.json({
      code: 0,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 更新用户状态
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    await pool.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    )

    res.json({
      code: 0,
      message: '状态更新成功'
    })
  } catch (error) {
    console.error('Update user status error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 