"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const menu_1 = require("../controllers/menu");
const router = express_1.default.Router();
router.get('/', auth_1.auth, menu_1.getAllMenus);
router.post('/', auth_1.auth, menu_1.createMenu);
router.put('/:id', auth_1.auth, menu_1.updateMenu);
router.delete('/:id', auth_1.auth, menu_1.deleteMenu);
exports.default = router;
