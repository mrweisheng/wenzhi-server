import express from 'express'
import { auth } from '../middlewares/auth'
import { 
  getIssues, 
  getIssueById, 
  createIssue, 
  updateIssue, 
  addIssueRecord 
} from '../controllers/issue'

const router = express.Router()

// 获取问题列表
router.get('/', auth, getIssues)

// 获取问题详情
router.get('/:id', auth, getIssueById)

// 创建问题
router.post('/', auth, createIssue)

// 更新问题
router.put('/:id', auth, updateIssue)

// 添加处理记录
router.post('/:id/records', auth, addIssueRecord)

export default router 