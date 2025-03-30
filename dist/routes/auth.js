"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middlewares/auth");
const router = express_1.default.Router();
router.post('/login', auth_1.login);
router.get('/userInfo', auth_2.auth, auth_1.getUserInfo);
exports.default = router;
