import { Request, Response } from 'express'
import pool from '../config/db'

// 获取所有菜单
export const getAllMenus = async (req: Request, res: Response) => {
  try {
    const [menus] = await pool.query(
      'SELECT * FROM menus ORDER BY sort'
    )
    
    res.json({
      code: 0,
      data: menus
    })
  } catch (err: any) {
    console.error('Get menus error:', err)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 创建菜单
export const createMenu = async (req: Request, res: Response) => {
  try {
    const { name, path, icon, sort, parent_id } = req.body

    await pool.query(
      'INSERT INTO menus (name, path, icon, sort, parent_id) VALUES (?, ?, ?, ?, ?)',
      [name, path, icon, sort, parent_id]
    )

    res.json({
      code: 0,
      message: '创建成功'
    })
  } catch (error) {
    console.error('Create menu error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 更新菜单
export const updateMenu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, icon, sort } = req.body

    // 检查菜单是否存在
    const [existing]: any = await pool.query(
      'SELECT id FROM menus WHERE id = ?',
      [id]
    )

    if (existing.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '菜单不存在'
      })
    }

    // 构建更新SQL
    const updateFields = []
    const params = []

    if (name !== undefined) {
      updateFields.push('name = ?')
      params.push(name)
    }

    if (icon !== undefined) {
      updateFields.push('icon = ?')
      params.push(icon)
    }

    if (sort !== undefined) {
      updateFields.push('sort = ?')
      params.push(sort)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        code: 1,
        message: '没有要更新的字段'
      })
    }

    params.push(id)

    // 执行更新
    await pool.query(
      `UPDATE menus SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    )

    res.json({
      code: 0,
      message: '更新成功'
    })
  } catch (error) {
    console.error('Update menu error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 删除菜单
export const deleteMenu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await pool.query('DELETE FROM menus WHERE id = ?', [id])

    res.json({
      code: 0,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete menu error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 