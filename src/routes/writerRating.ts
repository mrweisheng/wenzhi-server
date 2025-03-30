import express from 'express'
import { auth } from '../middlewares/auth'
import { checkRatingPermission } from '../middlewares/role'
import {
  rateWriter,
  getWriterRatings,
  getDailyRatings,
  getUnratedWriters
} from '../controllers/writerRating'

const router = express.Router()

// 获取未评分的写手列表（今日）
router.get('/unrated', auth, checkRatingPermission, getUnratedWriters)

// 获取某日所有写手评分
router.get('/daily', auth, getDailyRatings)

// 添加或更新写手评分
router.post('/:writerId/ratings', auth, checkRatingPermission, rateWriter)

// 获取写手评分历史
router.get('/:writerId/ratings', auth, getWriterRatings)

export default router 