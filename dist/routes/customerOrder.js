"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const role_1 = require("../middlewares/role");
const customerOrder_1 = require("../controllers/customerOrder");
const router = express_1.default.Router();
router.post('/', auth_1.auth, customerOrder_1.createCustomerOrder);
router.get('/export-commission-data', auth_1.auth, customerOrder_1.exportCustomerCommission);
router.get('/', auth_1.auth, customerOrder_1.getCustomerOrders);
router.get('/:id', auth_1.auth, customerOrder_1.getCustomerOrderById);
router.put('/:id', auth_1.auth, customerOrder_1.updateCustomerOrder);
router.delete('/:id', auth_1.auth, customerOrder_1.deleteCustomerOrder);
router.post('/merge', auth_1.auth, customerOrder_1.mergeCustomerOrder);
// 锁定相关路由
router.post('/lock', auth_1.auth, role_1.checkCustomerOrderLockPermission, customerOrder_1.lockCustomerOrders);
router.post('/unlock', auth_1.auth, role_1.checkCustomerOrderLockPermission, customerOrder_1.unlockCustomerOrders);
exports.default = router;
