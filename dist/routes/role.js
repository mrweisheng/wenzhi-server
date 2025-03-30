"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const role_1 = require("../controllers/role");
const router = express_1.default.Router();
router.get('/', auth_1.auth, role_1.getRoles);
router.post('/', auth_1.auth, role_1.createRole);
router.put('/:id', auth_1.auth, role_1.updateRole);
router.delete('/:id', auth_1.auth, role_1.deleteRole);
router.get('/:id/menus', auth_1.auth, role_1.getRoleMenus);
exports.default = router;
