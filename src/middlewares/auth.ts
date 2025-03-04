import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        code: 1,
        message: '未授权'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    ;(req as any).userId = (decoded as any).id

    next()
  } catch (error) {
    res.status(401).json({
      code: 1,
      message: '未授权'
    })
  }
} 