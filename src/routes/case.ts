import express from 'express'
import { auth } from '../middlewares/auth'
import { checkCasePermission } from '../middlewares/role'
import { upload, formData } from '../middlewares/upload'
import {
  getCases,
  getCaseById,
  createCase,
  createSimpleCase,
  deleteCase
} from '../controllers/case'

const router = express.Router()

// 获取案例列表
router.get('/', auth, checkCasePermission, getCases)

// 获取案例详情
router.get('/:id', auth, checkCasePermission, getCaseById)

// 创建案例 (使用array('images')中间件处理图片上传，最多10张)
router.post('/', auth, checkCasePermission, (req, res, next) => {
  // 使用multer中间件并添加错误处理
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      console.error('文件上传错误:', err);
      return res.status(400).json({
        code: 1,
        message: err.message || '文件上传失败',
        error: err.toString()
      });
    }
    next();
  });
}, createCase)

// 简单创建案例 (不上传图片)
router.post('/simple', auth, checkCasePermission, createSimpleCase)

// 删除案例
router.delete('/:id', auth, checkCasePermission, deleteCase)

export default router 