import { Request, Response } from 'express'
import pool from '../config/db'

// 获取写手列表
export const getWriters = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      pageSize = 10,
      writer_id,
      name,
      education,
      major,
      writing_experience,
      starred,
      processed
    } = req.query

    // 构建查询条件
    let sql = 'SELECT * FROM writer_info WHERE 1=1'
    const params: any[] = []

    if (writer_id) {
      sql += ' AND writer_id = ?'
      params.push(writer_id)
    }
    if (name) {
      sql += ' AND name LIKE ?'
      params.push(`%${name}%`)
    }
    if (education) {
      sql += ' AND education = ?'
      params.push(education)
    }
    if (major) {
      sql += ' AND major LIKE ?'
      params.push(`%${major}%`)
    }
    if (writing_experience) {
      sql += ' AND writing_experience = ?'
      params.push(writing_experience)
    }
    if (starred !== undefined) {
      sql += ' AND starred = ?'
      params.push(starred)
    }
    if (processed !== undefined) {
      sql += ' AND processed = ?'
      params.push(processed)
    }

    // 计算总数
    const [countResult]: any = await pool.query(
      `SELECT COUNT(*) as total FROM (${sql}) as t`,
      params
    )
    const total = countResult[0].total

    // 分页查询
    sql += ' ORDER BY created_time DESC LIMIT ? OFFSET ?'
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
  } catch (error) {
    console.error('Get writers error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 获取写手详情
export const getWriterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const [writers]: any = await pool.query(
      'SELECT * FROM writer_info WHERE id = ?',
      [id]
    )

    if (writers.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '写手不存在'
      })
    }

    res.json({
      code: 0,
      data: writers[0],
      message: '获取成功'
    })
  } catch (error) {
    console.error('Get writer error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 生成写手ID
async function generateWriterId(): Promise<string> {
  // 获取当前日期，格式: 240720 (年月日)
  const date = new Date()
  const dateStr = date.getFullYear().toString().slice(-2) + 
                 (date.getMonth() + 1).toString().padStart(2, '0') + 
                 date.getDate().toString().padStart(2, '0')
  
  let sequence = 1
  let writerId = ''
  let isUnique = false

  // 循环尝试直到找到唯一的writer_id
  while (!isUnique) {
    writerId = `w${dateStr}${sequence.toString().padStart(2, '0')}`
    
    // 检查是否已存在
    const [existing]: any = await pool.query(
      'SELECT id FROM writer_info WHERE writer_id = ?',
      [writerId]
    )

    if (existing.length === 0) {
      isUnique = true
    } else {
      sequence++
      if (sequence > 99) {
        throw new Error('当日写手ID序号已用尽')
      }
    }
  }

  return writerId
}

// 创建写手
export const createWriter = async (req: Request, res: Response) => {
  try {
    const writer = req.body
    
    // 自动生成writer_id
    writer.writer_id = await generateWriterId()
    writer.created_time = new Date()
    writer.created_by = (req as any).userId

    // 添加唯一性约束检查
    const [existing]: any = await pool.query(
      'SELECT id FROM writer_info WHERE writer_id = ?',
      [writer.writer_id]
    )

    if (existing.length > 0) {
      return res.status(400).json({
        code: 1,
        message: '写手ID已存在'
      })
    }

    const [result]: any = await pool.query(
      'INSERT INTO writer_info SET ?',
      writer
    )

    res.json({
      code: 0,
      data: {
        id: result.insertId,
        writer_id: writer.writer_id
      },
      message: '添加成功'
    })
  } catch (error) {
    console.error('Create writer error:', error)
    if (error.message === '当日写手ID序号已用尽') {
      return res.status(400).json({
        code: 1,
        message: error.message
      })
    }
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 更新写手
export const updateWriter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const writer = req.body
    writer.last_modified_time = new Date()
    writer.last_modified_by = (req as any).userId

    const [result]: any = await pool.query(
      'UPDATE writer_info SET ? WHERE id = ?',
      [writer, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 1,
        message: '写手不存在'
      })
    }

    res.json({
      code: 0,
      message: '更新成功'
    })
  } catch (error) {
    console.error('Update writer error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 删除写手
export const deleteWriter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const [result]: any = await pool.query(
      'DELETE FROM writer_info WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 1,
        message: '写手不存在'
      })
    }

    res.json({
      code: 0,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete writer error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 批量删除写手
export const batchDeleteWriters = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body

    await pool.query(
      'DELETE FROM writer_info WHERE id IN (?)',
      [ids]
    )

    res.json({
      code: 0,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Batch delete writers error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 