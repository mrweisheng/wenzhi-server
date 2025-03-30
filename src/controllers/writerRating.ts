import { Request, Response } from 'express'
import pool from '../config/db'

// 添加或更新写手评分
export const rateWriter = async (req: Request, res: Response) => {
  try {
    const { writerId } = req.params
    const { score, comment } = req.body
    const qualityInspectorId = (req as any).userId

    // 验证写手是否存在
    const [writers]: any = await pool.query(
      'SELECT id FROM writer_info WHERE id = ?',
      [writerId]
    )

    if (writers.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '写手不存在'
      })
    }

    // 验证参数
    if (!score || score < 1 || score > 10) {
      return res.status(400).json({
        code: 1,
        message: '评分必须在1到10之间'
      })
    }

    if (!comment) {
      return res.status(400).json({
        code: 1,
        message: '评价内容不能为空'
      })
    }

    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0]
    
    // 检查今天是否已经评分
    const [existingRating]: any = await pool.query(
      'SELECT id FROM writer_ratings WHERE writer_id = ? AND rating_date = ?',
      [writerId, today]
    )

    if (existingRating.length > 0) {
      // 更新已有评分
      await pool.query(
        'UPDATE writer_ratings SET score = ?, comment = ?, quality_inspector_id = ? WHERE id = ?',
        [score, comment, qualityInspectorId, existingRating[0].id]
      )

      return res.json({
        code: 0,
        message: '评分更新成功',
        data: {
          id: existingRating[0].id
        }
      })
    } else {
      // 创建新评分
      const [result]: any = await pool.query(
        'INSERT INTO writer_ratings (writer_id, score, comment, quality_inspector_id, rating_date) VALUES (?, ?, ?, ?, ?)',
        [writerId, score, comment, qualityInspectorId, today]
      )

      return res.json({
        code: 0,
        message: '评分保存成功',
        data: {
          id: result.insertId
        }
      })
    }
  } catch (error) {
    console.error('Rate writer error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 获取写手评分历史
export const getWriterRatings = async (req: Request, res: Response) => {
  try {
    const { writerId } = req.params
    const { 
      start_date, 
      end_date,
      page = 1, 
      pageSize = 10 
    } = req.query

    // 验证写手是否存在
    const [writers]: any = await pool.query(
      'SELECT id, name, writer_id FROM writer_info WHERE id = ?',
      [writerId]
    )

    if (writers.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '写手不存在'
      })
    }

    // 构建查询条件
    let sql = `
      SELECT r.*, 
             u.username as inspector_username,
             u.real_name as inspector_name
      FROM writer_ratings r
      INNER JOIN users u ON r.quality_inspector_id = u.id
      WHERE r.writer_id = ?
    `
    const params: any[] = [writerId]

    if (start_date) {
      sql += ' AND r.rating_date >= ?'
      params.push(start_date)
    }

    if (end_date) {
      sql += ' AND r.rating_date <= ?'
      params.push(end_date)
    }

    // 计算总数
    const [countResult]: any = await pool.query(
      `SELECT COUNT(*) as total FROM (${sql}) as t`,
      params
    )
    const total = countResult[0].total

    // 分页查询
    sql += ' ORDER BY r.rating_date DESC, r.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))

    const [rows]: any = await pool.query(sql, params)

    // 格式化返回数据
    const formattedRatings = rows.map((row: any) => ({
      id: row.id,
      score: row.score,
      comment: row.comment,
      date: row.rating_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      quality_inspector: {
        id: row.quality_inspector_id,
        name: row.inspector_name || row.inspector_username
      }
    }))

    res.json({
      code: 0,
      message: 'success',
      data: {
        writer: {
          id: writers[0].id,
          writer_id: writers[0].writer_id,
          name: writers[0].name
        },
        total,
        list: formattedRatings
      }
    })
  } catch (error) {
    console.error('Get writer ratings error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 获取某日所有写手评分
export const getDailyRatings = async (req: Request, res: Response) => {
  try {
    const { 
      date = new Date().toISOString().split('T')[0],  // 默认为今天
      page = 1, 
      pageSize = 10 
    } = req.query

    // 构建查询
    let sql = `
      SELECT r.*,
             w.writer_id, w.name as writer_name,
             u.username as inspector_username,
             u.real_name as inspector_name
      FROM writer_ratings r
      INNER JOIN writer_info w ON r.writer_id = w.id
      INNER JOIN users u ON r.quality_inspector_id = u.id
      WHERE r.rating_date = ?
    `
    const params: any[] = [date]

    // 计算总数
    const [countResult]: any = await pool.query(
      `SELECT COUNT(*) as total FROM (${sql}) as t`,
      params
    )
    const total = countResult[0].total

    // 分页查询
    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))

    const [rows]: any = await pool.query(sql, params)

    // 格式化返回数据
    const formattedRatings = rows.map((row: any) => ({
      id: row.id,
      writer: {
        id: row.writer_id,
        writer_id: row.writer_id,
        name: row.writer_name
      },
      score: row.score,
      comment: row.comment,
      created_at: row.created_at,
      quality_inspector: {
        id: row.quality_inspector_id,
        name: row.inspector_name || row.inspector_username
      }
    }))

    res.json({
      code: 0,
      message: 'success',
      data: {
        date,
        total,
        list: formattedRatings
      }
    })
  } catch (error) {
    console.error('Get daily ratings error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 获取未评分的写手列表（今日）
export const getUnratedWriters = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const [writers]: any = await pool.query(`
      SELECT w.id, w.writer_id, w.name
      FROM writer_info w
      WHERE w.id NOT IN (
        SELECT r.writer_id
        FROM writer_ratings r
        WHERE r.rating_date = ?
      )
      ORDER BY w.name ASC
    `, [today])

    res.json({
      code: 0,
      message: 'success',
      data: writers
    })
  } catch (error) {
    console.error('Get unrated writers error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 获取指定写手当天评分
export const getWriterTodayRating = async (req: Request, res: Response) => {
  try {
    const { writerId } = req.params
    
    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0]
    
    // 验证写手是否存在
    const [writers]: any = await pool.query(
      'SELECT id, name, writer_id FROM writer_info WHERE id = ?',
      [writerId]
    )

    if (writers.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '写手不存在'
      })
    }
    
    // 查询当天评分记录
    const [rows]: any = await pool.query(`
      SELECT r.*, 
             u.username as inspector_username,
             u.real_name as inspector_name
      FROM writer_ratings r
      INNER JOIN users u ON r.quality_inspector_id = u.id
      WHERE r.writer_id = ? AND r.rating_date = ?
    `, [writerId, today])
    
    if (rows.length === 0) {
      return res.json({
        code: 0,
        message: 'success',
        data: null // 表示今天尚未评分
      })
    }
    
    // 格式化返回数据
    const rating = rows[0]
    const formattedRating = {
      id: rating.id,
      score: rating.score,
      comment: rating.comment,
      date: rating.rating_date,
      created_at: rating.created_at,
      updated_at: rating.updated_at,
      writer: {
        id: writers[0].id,
        writer_id: writers[0].writer_id,
        name: writers[0].name
      },
      quality_inspector: {
        id: rating.quality_inspector_id,
        name: rating.inspector_name || rating.inspector_username
      }
    }
    
    res.json({
      code: 0,
      message: 'success',
      data: formattedRating
    })
    
  } catch (error) {
    console.error('Get writer today rating error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 获取指定写手特定日期评分
export const getWriterRatingByDate = async (req: Request, res: Response) => {
  try {
    const { writerId } = req.params
    const { date = new Date().toISOString().split('T')[0] } = req.query  // 默认为今天
    
    // 验证写手是否存在
    const [writers]: any = await pool.query(
      'SELECT id, name, writer_id FROM writer_info WHERE id = ?',
      [writerId]
    )

    if (writers.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '写手不存在'
      })
    }
    
    // 查询指定日期评分记录
    const [rows]: any = await pool.query(`
      SELECT r.*, 
             u.username as inspector_username,
             u.real_name as inspector_name
      FROM writer_ratings r
      INNER JOIN users u ON r.quality_inspector_id = u.id
      WHERE r.writer_id = ? AND r.rating_date = ?
    `, [writerId, date])
    
    if (rows.length === 0) {
      return res.json({
        code: 0,
        message: 'success',
        data: null // 表示指定日期尚未评分
      })
    }
    
    // 格式化返回数据
    const rating = rows[0]
    const formattedRating = {
      id: rating.id,
      score: rating.score,
      comment: rating.comment,
      date: rating.rating_date,
      created_at: rating.created_at,
      updated_at: rating.updated_at,
      writer: {
        id: writers[0].id,
        writer_id: writers[0].writer_id,
        name: writers[0].name
      },
      quality_inspector: {
        id: rating.quality_inspector_id,
        name: rating.inspector_name || rating.inspector_username
      }
    }
    
    res.json({
      code: 0,
      message: 'success',
      data: formattedRating
    })
    
  } catch (error) {
    console.error('Get writer rating by date error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 