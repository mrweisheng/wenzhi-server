import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import roleRoutes from './routes/role'
import writerRoutes from './routes/writer'
import menuRouter from './routes/menu'
import orderRouter from './routes/order'
import statisticsRouter from './routes/statistics'
import { errorHandler } from './middlewares/error'

const app = express()

app.use(cors())
app.use(express.json())

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/writers', writerRoutes)
app.use('/api/menus', menuRouter)
app.use('/api/orders', orderRouter)
app.use('/api/statistics', statisticsRouter)

// 错误处理
app.use(errorHandler)

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`)
}) 