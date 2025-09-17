"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const writer_1 = require("../controllers/writer");
const writerRating_1 = require("../controllers/writerRating");
const role_1 = require("../middlewares/role");
const rateLimit_1 = require("../middlewares/rateLimit");
const router = express_1.default.Router();
// 获取写手列表
router.get('/', auth_1.auth, writer_1.getWriters);
// 获取写手简要列表
router.get('/list', auth_1.auth, writer_1.getWriterList);
// 快速模糊搜索写手（无token限制，适合前端实时搜索）
router.get('/quick-search', writer_1.getWriterQuickSearch);
// 获取写手详情
router.get('/:id', auth_1.auth, writer_1.getWriterById);
// 创建写手
router.post('/', auth_1.auth, writer_1.createWriter);
// 更新写手
router.put('/:id', auth_1.auth, writer_1.updateWriter);
// 删除写手
router.delete('/:id', auth_1.auth, writer_1.deleteWriter);
// 批量删除写手
router.delete('/', auth_1.auth, writer_1.batchDeleteWriters);
// 写手评分相关路由
router.post('/:writerId/ratings', auth_1.auth, role_1.checkRatingPermission, writerRating_1.rateWriter);
router.get('/:writerId/ratings', auth_1.auth, writerRating_1.getWriterRatings);
router.get('/:writerId/today-rating', auth_1.auth, writerRating_1.getWriterTodayRating);
router.get('/:writerId/rating-by-date', auth_1.auth, writerRating_1.getWriterRatingByDate);
// 新增：开放注册写手（无token限制，带IP限流）
router.post('/open', rateLimit_1.writerOpenLimiter, writer_1.openCreateWriter);
// 导出写手数据
router.post('/export', auth_1.auth, writer_1.exportWriters);
exports.default = router;
