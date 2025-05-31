"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicUrl = exports.formData = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// 确保上传目录存在
const uploadDir = '/var/www/uploads';
fs_extra_1.default.ensureDirSync(uploadDir);
// 配置存储
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const now = new Date();
        const targetDir = path_1.default.join(uploadDir, `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`);
        // 确保目标目录存在
        fs_extra_1.default.ensureDirSync(targetDir);
        cb(null, targetDir);
    },
    filename: function (req, file, cb) {
        // 生成文件名: 时间戳 + 随机数 + 原始扩展名
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${timestamp}_${randomNum}${ext}`);
    }
});
// 文件过滤器
const fileFilter = (req, file, cb) => {
    // 只接受图片文件
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('只能上传图片文件!'));
    }
};
// 创建multer实例
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 限制文件大小为2MB
        files: 10 // 一次最多上传10个文件
    }
});
// 对于没有文件但仍需处理表单数据的请求
exports.formData = (0, multer_1.default)();
// 生成公网可访问的URL
const getPublicUrl = (filename) => {
    // 基于服务器IP和相对路径构建URL
    const baseUrl = `http://118.31.76.202:3000/uploads`;
    return `${baseUrl}/${filename}`;
};
exports.getPublicUrl = getPublicUrl;
