import express from 'express'
import { auth } from '../middlewares/auth'
import {
  getWriters,
  getWriterById,
  createWriter,
  updateWriter,
  deleteWriter,
  batchDeleteWriters,
  getWriterList,
  openCreateWriter
} from '../controllers/writer'
import {
  rateWriter,
  getWriterRatings,
  getWriterTodayRating,
  getWriterRatingByDate
} from '../controllers/writerRating'
import { checkRatingPermission } from '../middlewares/role'
import { writerOpenLimiter } from '../middlewares/rateLimit'

const router = express.Router()

// 获取写手列表
router.get('/', auth, getWriters)

// 获取写手简要列表
router.get('/list', auth, getWriterList)

// 获取写手详情
router.get('/:id', auth, getWriterById)

// 创建写手
router.post('/', auth, createWriter)

// 更新写手
router.put('/:id', auth, updateWriter)

// 删除写手
router.delete('/:id', auth, deleteWriter)

// 批量删除写手
router.delete('/', auth, batchDeleteWriters)

// 写手评分相关路由
router.post('/:writerId/ratings', auth, checkRatingPermission, rateWriter)
router.get('/:writerId/ratings', auth, getWriterRatings)
router.get('/:writerId/today-rating', auth, getWriterTodayRating)
router.get('/:writerId/rating-by-date', auth, getWriterRatingByDate)

// 新增：开放注册写手（无token限制，带IP限流）
router.post('/open', writerOpenLimiter, openCreateWriter)

export default router 