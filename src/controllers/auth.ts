import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import pool from '../config/db'

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    const [users]: any = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )

    if (users.length === 0) {
      return res.status(401).json({
        code: 1,
        message: '用户名或密码错误'
      })
    }

    const user = users[0]
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({
        code: 1,
        message: '用户名或密码错误'
      })
    }

    // 生成访问令牌和刷新令牌
    const accessToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '2h' }  // 访问令牌2小时过期
    )

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }  // 刷新令牌7天过期
    )

    // 获取用户基本信息
    const [userInfo]: any = await pool.query(
      'SELECT id, username, role_id, real_name, email, status FROM users WHERE id = ?',
      [user.id]
    )

    // 获取用户角色信息
    const [roles]: any = await pool.query(
      'SELECT r.* FROM roles r WHERE r.id = ?',
      [user.role_id]
    )

    // 获取角色的菜单权限
    const [menus]: any = await pool.query(
      `SELECT m.* FROM menus m 
       INNER JOIN role_menus rm ON m.id = rm.menu_id 
       WHERE rm.role_id = ?
       ORDER BY m.sort`,
      [user.role_id]
    )

    res.json({
      code: 0,
      data: {
        token: accessToken,
        refreshToken,
        expires: new Date(Date.now() + 2 * 60 * 60 * 1000).getTime(), // 2小时后的时间戳
        userInfo: {
          ...userInfo[0],
          role: roles[0],
          menus
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    // 获取用户基本信息
    const [users]: any = await pool.query(
      'SELECT id, username, role_id, real_name, email, status FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '用户不存在'
      })
    }

    const user = users[0]

    // 获取用户角色信息
    const [roles]: any = await pool.query(
      'SELECT r.* FROM roles r WHERE r.id = ?',
      [user.role_id]
    )

    // 获取角色的菜单权限
    const [menus]: any = await pool.query(
      `SELECT m.* FROM menus m 
       INNER JOIN role_menus rm ON m.id = rm.menu_id 
       WHERE rm.role_id = ?
       ORDER BY m.sort`,
      [user.role_id]
    )

    res.json({
      code: 0,
      data: {
        ...user,
        role: roles[0],
        menus
      }
    })
  } catch (error) {
    console.error('Get user info error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 