import express from 'express'
import { auth } from '../middlewares/auth'
import {
  getWriters,
  getWriterById,
  createWriter,
  updateWriter,
  deleteWriter,
  batchDeleteWriters
} from '../controllers/writer'

const router = express.Router()

// 获取写手列表
router.get('/', auth, getWriters)

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

export default router 