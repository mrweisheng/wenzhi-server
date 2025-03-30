"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const role_1 = require("../middlewares/role");
const upload_1 = require("../middlewares/upload");
const case_1 = require("../controllers/case");
const router = express_1.default.Router();
// 获取案例列表
router.get('/', auth_1.auth, role_1.checkCasePermission, case_1.getCases);
// 获取案例详情
router.get('/:id', auth_1.auth, role_1.checkCasePermission, case_1.getCaseById);
// 创建案例 (使用array('images')中间件处理图片上传，最多10张)
router.post('/', auth_1.auth, role_1.checkCasePermission, (req, res, next) => {
    // 使用multer中间件并添加错误处理
    upload_1.upload.array('images', 10)(req, res, (err) => {
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
}, case_1.createCase);
// 简单创建案例 (不上传图片)
router.post('/simple', auth_1.auth, role_1.checkCasePermission, case_1.createSimpleCase);
// 删除案例
router.delete('/:id', auth_1.auth, role_1.checkCasePermission, case_1.deleteCase);
exports.default = router;
