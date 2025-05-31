"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writerOpenLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.writerOpenLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1分钟
    max: 10, // 每个IP每分钟最多10次
    message: {
        code: 1,
        message: '请求过于频繁，请稍后再试'
    }
});
