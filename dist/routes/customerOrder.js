"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const customerOrder_1 = require("../controllers/customerOrder");
const router = express_1.default.Router();
router.post('/', auth_1.auth, customerOrder_1.createCustomerOrder);
router.get('/', auth_1.auth, customerOrder_1.getCustomerOrders);
router.get('/:id', auth_1.auth, customerOrder_1.getCustomerOrderById);
router.put('/:id', auth_1.auth, customerOrder_1.updateCustomerOrder);
router.delete('/:id', auth_1.auth, customerOrder_1.deleteCustomerOrder);
exports.default = router;
