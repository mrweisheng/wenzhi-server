"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const issue_1 = require("../controllers/issue");
const router = express_1.default.Router();
// 获取问题列表
router.get('/', auth_1.auth, issue_1.getIssues);
// 获取问题详情
router.get('/:id', auth_1.auth, issue_1.getIssueById);
// 创建问题
router.post('/', auth_1.auth, issue_1.createIssue);
// 更新问题
router.put('/:id', auth_1.auth, issue_1.updateIssue);
// 添加处理记录
router.post('/:id/records', auth_1.auth, issue_1.addIssueRecord);
exports.default = router;
