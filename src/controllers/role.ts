import { Request, Response } from 'express'
import pool from '../config/db'

// 获取角色列表
export const getRoles = async (req: Request, res: Response) => {
  try {
    const [roles] = await pool.query(
      'SELECT * FROM roles ORDER BY id DESC'
    )
    
    res.json({
      code: 0,
      data: roles
    })
  } catch (error) {
    console.error('Get roles error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 创建角色
export const createRole = async (req: Request, res: Response) => {
  try {
    const { role_name } = req.body

    // 检查角色名是否已存在
    const [existing]: any = await pool.query(
      'SELECT id FROM roles WHERE role_name = ?',
      [role_name]
    )

    if (existing.length > 0) {
      return res.status(400).json({
        code: 1,
        message: '角色名已存在'
      })
    }

    // 创建角色
    const [result]: any = await pool.query(
      'INSERT INTO roles (role_name) VALUES (?)',
      [role_name]
    )

    // 如果有菜单权限，添加角色菜单关系
    if (req.body.menu_ids && req.body.menu_ids.length > 0) {
      const values = req.body.menu_ids.map((menuId: number) => [result.insertId, menuId])
      await pool.query(
        'INSERT INTO role_menus (role_id, menu_id) VALUES ?',
        [values]
      )
    }

    res.json({
      code: 0,
      message: '创建成功'
    })
  } catch (error) {
    console.error('Create role error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 更新角色
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { role_name, menu_ids } = req.body

    // 检查角色名是否已存在
    const [existing]: any = await pool.query(
      'SELECT id FROM roles WHERE role_name = ? AND id != ?',
      [role_name, id]
    )

    if (existing.length > 0) {
      return res.status(400).json({
        code: 1,
        message: '角色名已存在'
      })
    }

    // 如果有角色名，则更新角色基本信息
    if (role_name) {
      await pool.query(
        'UPDATE roles SET role_name = ? WHERE id = ?',
        [role_name, id]
      )
    }

    // 更新角色菜单权限
    if (menu_ids) {
      // 先删除原有权限
      await pool.query('DELETE FROM role_menus WHERE role_id = ?', [id])
      
      // 添加新的权限
      if (menu_ids.length > 0) {
        const values = menu_ids.map((menuId: number) => [id, menuId])
        await pool.query(
          'INSERT INTO role_menus (role_id, menu_id) VALUES ?',
          [values]
        )
      }
    }

    res.json({
      code: 0,
      message: '更新成功'
    })
  } catch (error) {
    console.error('Update role error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 删除角色
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 检查是否有用户使用该角色
    const [users]: any = await pool.query(
      'SELECT id FROM users WHERE role_id = ?',
      [id]
    )

    if (users.length > 0) {
      return res.status(400).json({
        code: 1,
        message: '该角色下存在用户，无法删除'
      })
    }

    // 删除角色菜单关系
    await pool.query('DELETE FROM role_menus WHERE role_id = ?', [id])
    
    // 删除角色
    await pool.query('DELETE FROM roles WHERE id = ?', [id])

    res.json({
      code: 0,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete role error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 获取角色的菜单权限
export const getRoleMenus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const [menus]: any = await pool.query(
      `SELECT m.* FROM menus m 
       INNER JOIN role_menus rm ON m.id = rm.menu_id 
       WHERE rm.role_id = ?
       ORDER BY m.sort`,
      [id]
    )

    res.json({
      code: 0,
      data: menus
    })
  } catch (error) {
    console.error('Get role menus error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 