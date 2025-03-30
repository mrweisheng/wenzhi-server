"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const user_1 = require("../controllers/user");
const router = express_1.default.Router();
router.get('/', auth_1.auth, user_1.getUsers);
router.get('/customer-service', auth_1.auth, user_1.getCustomerService);
router.get('/list', auth_1.auth, user_1.getUserList);
router.post('/', auth_1.auth, user_1.createUser);
router.put('/email', auth_1.auth, user_1.updateEmail);
router.put('/password', auth_1.auth, user_1.updatePassword);
router.put('/:id', auth_1.auth, user_1.updateUser);
router.delete('/:id', auth_1.auth, user_1.deleteUser);
router.put('/:id/status', auth_1.auth, user_1.updateUserStatus);
exports.default = router;
