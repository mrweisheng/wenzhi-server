import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack)
  res.status(500).json({
    code: 1,
    message: '服务器内部错误'
  })
} 