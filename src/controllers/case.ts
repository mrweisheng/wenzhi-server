import { Request, Response } from 'express'
import pool from '../config/db'
import path from 'path'
import fs from 'fs-extra'

// 上传目录路径
const uploadDir = '/var/www/uploads'

// 生成案例ID
async function generateCaseId(): Promise<string> {
  const [result]: any = await pool.query(
    'SELECT MAX(id) as maxId FROM cases WHERE id LIKE "CASE-%"'
  )
  
  let nextNum = 1
  if (result[0].maxId) {
    // 从最大ID中提取数字部分
    const currentNum = parseInt(result[0].maxId.split('-')[1])
    nextNum = currentNum + 1
  }
  
  // 格式化为3位数，例如：CASE-001, CASE-002
  return `CASE-${nextNum.toString().padStart(3, '0')}`
}

// 获取案例列表
export const getCases = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      pageSize = 10,
      case_type
    } = req.query

    // 构建查询条件
    let sql = `
      SELECT c.*, 
             u.username as creator_name,
             u.real_name as creator_real_name
      FROM cases c
      LEFT JOIN users u ON c.creator_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (case_type) {
      sql += ' AND c.case_type = ?'
      params.push(case_type)
    }

    // 计算总数
    const [countResult]: any = await pool.query(
      `SELECT COUNT(*) as total FROM (${sql}) as t`,
      params
    )
    const total = countResult[0].total

    // 分页查询
    sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))

    const [rows]: any = await pool.query(sql, params)

    // 格式化图片数据
    const formattedRows = rows.map((row: any) => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      creator: {
        id: row.creator_id,
        name: row.creator_real_name || row.creator_name
      }
    }))

    res.json({
      code: 0,
      data: {
        total,
        list: formattedRows
      },
      message: "获取成功"
    })
  } catch (error) {
    console.error('Get cases error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 获取案例详情
export const getCaseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const [cases]: any = await pool.query(
      `SELECT c.*, 
              u.username as creator_name,
              u.real_name as creator_real_name
       FROM cases c
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.id = ?`,
      [id]
    )

    if (cases.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '案例不存在'
      })
    }

    // 格式化图片数据
    const caseData = cases[0]
    caseData.images = caseData.images ? JSON.parse(caseData.images) : []
    caseData.creator = {
      id: caseData.creator_id,
      name: caseData.creator_real_name || caseData.creator_name
    }

    res.json({
      code: 0,
      data: caseData,
      message: "获取成功"
    })
  } catch (error) {
    console.error('Get case error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 创建案例
export const createCase = async (req: Request, res: Response) => {
  try {
    // 添加调试日志
    console.log('请求体:', req.body);
    console.log('上传的文件:', req.files);
    
    const { case_type, title, content } = req.body
    const creatorId = (req as any).userId

    // 验证必填字段
    if (!case_type || !title || !content) {
      return res.status(400).json({
        code: 1,
        message: '案例类型、标题和内容不能为空',
        debug: {
          body: req.body,
          files: req.files ? (req.files as Express.Multer.File[]).length : 0,
          contentType: req.headers['content-type']
        }
      })
    }

    // 处理上传的文件
    const files = req.files as Express.Multer.File[]
    const imageUrls = []
    
    if (files && files.length > 0) {
      for (const file of files) {
        // 提取年月和文件名，构建正确的URL路径
        const pathParts = file.path.split('/')
        const filename = pathParts[pathParts.length - 1]
        const yearMonth = pathParts[pathParts.length - 2]
        
        // 构建完整URL，直接使用Apache虚拟主机提供的路径
        const imageUrl = `http://118.31.76.202/upload/${yearMonth}/${filename}`
        imageUrls.push(imageUrl)
      }
    }

    // 生成案例ID
    const caseId = await generateCaseId()

    // 插入数据库
    await pool.query(
      'INSERT INTO cases (id, case_type, title, content, images, creator_id) VALUES (?, ?, ?, ?, ?, ?)',
      [caseId, case_type, title, content, JSON.stringify(imageUrls), creatorId]
    )

    res.json({
      code: 0,
      data: {
        id: caseId,
        images: imageUrls
      },
      message: '创建成功'
    })
  } catch (error) {
    console.error('Create case error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 创建案例 (简单版本，不上传图片)
export const createSimpleCase = async (req: Request, res: Response) => {
  try {
    // 添加调试日志
    console.log('简单创建案例请求体:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    const { case_type, title, content } = req.body
    const creatorId = (req as any).userId

    // 验证必填字段
    if (!case_type || !title || !content) {
      return res.status(400).json({
        code: 1,
        message: '案例类型、标题和内容不能为空',
        debug: {
          receivedBody: req.body,
          contentType: req.headers['content-type']
        }
      })
    }

    // 生成案例ID
    const caseId = await generateCaseId()

    // 插入数据库
    await pool.query(
      'INSERT INTO cases (id, case_type, title, content, images, creator_id) VALUES (?, ?, ?, ?, ?, ?)',
      [caseId, case_type, title, content, JSON.stringify([]), creatorId]
    )

    res.json({
      code: 0,
      data: {
        id: caseId
      },
      message: '创建成功'
    })
  } catch (error) {
    console.error('Create simple case error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 删除案例
export const deleteCase = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId
    
    // 先查询案例信息，以获取图片路径
    const [cases]: any = await pool.query(
      'SELECT * FROM cases WHERE id = ?',
      [id]
    )

    if (cases.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '案例不存在'
      })
    }

    // 删除案例记录
    const [result]: any = await pool.query(
      'DELETE FROM cases WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 1,
        message: '案例不存在或已被删除'
      })
    }

    // 尝试删除相关图片文件
    try {
      const caseData = cases[0]
      if (caseData.images) {
        const images = JSON.parse(caseData.images)
        for (const imageUrl of images) {
          // 从URL中提取文件路径
          const urlParts = imageUrl.split('/')
          const yearMonth = urlParts[urlParts.length - 2]
          const filename = urlParts[urlParts.length - 1]
          
          // 构建完整的文件路径
          const filePath = path.join('/var/www/uploads', yearMonth, filename)
          
          // 检查文件是否存在并删除
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        }
      }
    } catch (err) {
      console.error('删除图片文件失败:', err)
      // 不中断响应，即使图片删除失败
    }

    res.json({
      code: 0,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete case error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 