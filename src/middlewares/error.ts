import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('错误时间:', new Date().toISOString())
  console.error('请求路径:', req.path)
  console.error('请求方法:', req.method)
  console.error('错误堆栈:', err.stack)

  // 区分不同类型的错误
  if (err.name === 'ConnectionError' || 
      (err as any).code === 'PROTOCOL_CONNECTION_LOST' ||
      (err as any).code === 'ECONNREFUSED') {
    return res.status(503).json({
      code: 1,
      message: '数据库连接暂时不可用，请稍后重试'
    })
  }

  if (err.name === 'QueryError') {
    return res.status(500).json({
      code: 1,
      message: '数据库查询错误，请稍后重试'
    })
  }

  // 添加事务回滚错误处理
  if ((err as any).code === 'ER_LOCK_DEADLOCK') {
    return res.status(500).json({
      code: 1,
      message: '数据库繁忙，请稍后重试'
    })
  }

  res.status(500).json({
    code: 1,
    message: '服务器内部错误，请稍后重试'
  })
} 