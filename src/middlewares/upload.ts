import multer from 'multer'
import path from 'path'
import fs from 'fs-extra'
import { Request } from 'express'

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'upload')
fs.ensureDirSync(uploadDir)

// 配置存储
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    const now = new Date()
    const targetDir = path.join(
      uploadDir, 
      `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`
    )
    // 确保目标目录存在
    fs.ensureDirSync(targetDir)
    cb(null, targetDir)
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    // 生成文件名: 时间戳 + 随机数 + 原始扩展名
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 10000)
    const ext = path.extname(file.originalname)
    cb(null, `${timestamp}_${randomNum}${ext}`)
  }
})

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 只接受图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('只能上传图片文件!'))
  }
}

// 创建multer实例
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 限制文件大小为2MB
    files: 10 // 一次最多上传10个文件
  }
})

// 对于没有文件但仍需处理表单数据的请求
export const formData = multer()

// 生成公网可访问的URL
export const getPublicUrl = (filename: string): string => {
  // 基于服务器IP和相对路径构建URL
  const baseUrl = `http://118.31.76.202:3000/uploads`
  return `${baseUrl}/${filename}`
} 