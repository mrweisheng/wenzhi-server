import rateLimit from 'express-rate-limit'

export const writerOpenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每个IP每分钟最多10次
  message: {
    code: 1,
    message: '请求过于频繁，请稍后再试'
  }
}) 