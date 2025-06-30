"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const order_1 = require("../controllers/order");
const router = express_1.default.Router();
router.get('/', auth_1.auth, order_1.getOrders);
router.put('/:orderId/customer', auth_1.auth, order_1.updateOrderCustomer);
router.put('/:orderId/writer', auth_1.auth, order_1.updateOrderWriter);
router.post('/recalculate-commission', auth_1.auth, order_1.recalculateCommission);
exports.default = router;
