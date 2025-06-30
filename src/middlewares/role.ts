import { Request, Response, NextFunction } from 'express'
import pool from '../config/db'

// 检查用户是否具有质检角色或超管主管角色
export const checkRatingPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId
    
    // 获取用户角色
    const [roles]: any = await pool.query(
      `SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    )

    if (roles.length === 0) {
      return res.status(403).json({
        code: 1,
        message: '没有权限执行此操作，请先登录'
      })
    }

    const roleName = roles[0].role_name
    
    // 检查用户是否有权限（超级管理员、主管或质检）
    if (roleName.includes('超级管理员') || 
        roleName.includes('主管') || 
        roleName.includes('质检')) {
      next()
    } else {
      return res.status(403).json({
        code: 1,
        message: '没有权限执行此操作，仅限质检人员、主管及超级管理员'
      })
    }
  } catch (error) {
    console.error('Check rating permission error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 检查案例管理权限中间件
export const checkCasePermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId

    // 查询用户角色
    const [userRoles]: any = await pool.query(
      `SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    )

    if (userRoles.length === 0) {
      return res.status(403).json({
        code: 1,
        message: '没有权限执行此操作，仅限超级管理员、主管、客服及质检人员'
      })
    }

    const roleName = userRoles[0].role_name

    // 判断是否有权限（超管、主管、客服或质检角色）
    if (
      roleName.includes('超级管理员') || 
      roleName.includes('主管') || 
      roleName.includes('客服') || 
      roleName.includes('质检')
    ) {
      next()
    } else {
      return res.status(403).json({
        code: 1,
        message: '没有权限执行此操作，仅限超级管理员、主管、客服及质检人员'
      })
    }
  } catch (error) {
    console.error('Check case permission error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 检查客服订单锁定操作权限中间件（仅限超级管理员和财务角色）
export const checkCustomerOrderLockPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId

    // 查询用户角色
    const [userRoles]: any = await pool.query(
      `SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    )

    if (userRoles.length === 0) {
      return res.status(403).json({
        code: 1,
        message: '没有权限执行此操作，仅限超级管理员和财务角色'
      })
    }

    const roleName = userRoles[0].role_name

    // 判断是否有权限（超管或财务角色）
    if (
      roleName.includes('超级管理员') || 
      roleName.includes('财务')
    ) {
      next()
    } else {
      return res.status(403).json({
        code: 1,
        message: '没有权限执行此操作，仅限超级管理员和财务角色'
      })
    }
  } catch (error) {
    console.error('Check customer order lock permission error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 检查修改锁定订单权限中间件
export const checkLockedOrderModifyPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId
    const orderId = req.params.id || req.body.order_id

    if (!orderId) {
      return res.status(400).json({
        code: 1,
        message: '订单ID不能为空'
      })
    }

    // 查询用户角色
    const [userRoles]: any = await pool.query(
      `SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    )

    if (userRoles.length === 0) {
      return res.status(403).json({
        code: 1,
        message: '没有权限执行此操作'
      })
    }

    const roleName = userRoles[0].role_name

    // 检查订单是否被锁定
    const [orderInfo]: any = await pool.query(
      'SELECT is_locked FROM customer_orders WHERE id = ?',
      [orderId]
    )

    if (orderInfo.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '订单不存在'
      })
    }

    // 如果订单被锁定，只有超级管理员和财务角色可以修改
    if (orderInfo[0].is_locked) {
      if (!roleName.includes('超级管理员') && !roleName.includes('财务')) {
        return res.status(403).json({
          code: 1,
          message: '订单已被锁定，仅限超级管理员和财务角色可以修改'
        })
      }
    }

    next()
  } catch (error) {
    console.error('Check locked order modify permission error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 