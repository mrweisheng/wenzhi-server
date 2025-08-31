import express from 'express'
import cors from 'cors'
import path from 'path'
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import roleRoutes from './routes/role'
import writerRoutes from './routes/writer'
import menuRouter from './routes/menu'
import orderRouter from './routes/order'
import statisticsRouter from './routes/statistics'
import customerOrderRouter from './routes/customerOrder'
import issueRouter from './routes/issue'
import writerRatingRouter from './routes/writerRating'
import caseRouter from './routes/case'
import { errorHandler } from './middlewares/error'
import { testConnection, query } from './config/db'
import { log } from './config/logger'
import morgan from 'morgan'
import { scheduleCustomerOrderSync, initialCustomerOrderSync, scheduleSettlementStatusSync, scheduleMissedOrderCheck, scheduleCommissionFix } from './scheduler'

const app = express()

// 优化启动流程
const startServer = async () => {
  try {
    // 先测试数据库连接
    await testConnection()
    log.info('数据库连接成功')
    
    // 配置中间件
    app.use(cors({
      origin: true, // 允许所有来源，生产环境建议设置具体的域名
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400 // 预检请求结果缓存24小时
    }))
    
    // 配置HTTP请求日志
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          log.http(message.trim())
        }
      }
    }))
    
    app.use(express.json())
    app.use(express.urlencoded({ extended: true })) // 添加对URL编码表单的支持
    
    // 配置静态文件服务
    const uploadDir = '/var/www/uploads'
    app.use('/upload', express.static(uploadDir))
    
    // 注册路由
    app.use('/api/auth', authRoutes)
    app.use('/api/users', userRoutes)
    app.use('/api/roles', roleRoutes)
    app.use('/api/writers', writerRoutes)
    app.use('/api/menus', menuRouter)
    app.use('/api/orders', orderRouter)
    app.use('/api/statistics', statisticsRouter)
    app.use('/api/customer-orders', customerOrderRouter)
    app.use('/api/issues', issueRouter)
    app.use('/api/writer-ratings', writerRatingRouter)
    app.use('/api/cases', caseRouter)
    
    // 健康检查路由
    app.get('/health', async (req, res) => {
      try {
        // 测试数据库连接
        const [result] = await query('SELECT 1')
        res.json({
          status: 'ok',
          database: 'connected',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        })
      } catch (error: any) {
        log.error('健康检查失败', error)
        res.status(503).json({
          status: 'error',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
          error: error.message
        })
      }
    })
    
    // 错误处理
    app.use(errorHandler)
    
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
    
    app.listen(PORT, '0.0.0.0', () => {
      const startupMessage = `
        ================================
        🚀 服务器启动成功!
        📡 端口: ${PORT}
        🕒 时间: ${new Date().toLocaleString()}
        ================================
      `
      console.log(startupMessage)
      log.info('服务器启动成功', { port: PORT })
      
      // 启动定时任务
      scheduleCustomerOrderSync()
      
      // 启动结算状态自动修正定时任务
      scheduleSettlementStatusSync()
      
      // 启动遗漏订单检查定时任务
      scheduleMissedOrderCheck()
      
      // 启动佣金修复定时任务
      scheduleCommissionFix()
      
      // 执行初始同步
      initialCustomerOrderSync()
    })
  } catch (error: any) {
    log.error('服务器启动失败', error)
    console.error('服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()