"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const role_1 = require("../middlewares/role");
const writerRating_1 = require("../controllers/writerRating");
const router = express_1.default.Router();
// 获取未评分的写手列表（今日）
router.get('/unrated', auth_1.auth, role_1.checkRatingPermission, writerRating_1.getUnratedWriters);
// 获取某日所有写手评分
router.get('/daily', auth_1.auth, writerRating_1.getDailyRatings);
// 添加或更新写手评分
router.post('/:writerId/ratings', auth_1.auth, role_1.checkRatingPermission, writerRating_1.rateWriter);
// 获取写手评分历史
router.get('/:writerId/ratings', auth_1.auth, writerRating_1.getWriterRatings);
exports.default = router;
