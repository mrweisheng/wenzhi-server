import express from 'express'
import { auth } from '../middlewares/auth'
import { checkCustomerOrderLockPermission } from '../middlewares/role'
import { 
  createCustomerOrder,
  getCustomerOrders,
  getCustomerOrderById,
  updateCustomerOrder,
  deleteCustomerOrder,
  mergeCustomerOrder,
  lockCustomerOrders,
  unlockCustomerOrders,
  exportCustomerCommission,
  exportCustomerOrders, // 新增导出客服订单
  updateSettlementStatus // 新增手动修改结算状态
} from '../controllers/customerOrder'

const router = express.Router()

router.post('/', auth, createCustomerOrder)
router.get('/export-commission-data', auth, exportCustomerCommission)
router.get('/export', auth, exportCustomerOrders)
router.get('/', auth, getCustomerOrders)
router.get('/:id', auth, getCustomerOrderById)
router.delete('/:id', auth, deleteCustomerOrder)
router.post('/merge', auth, mergeCustomerOrder)

// 锁定相关路由
router.post('/lock', auth, checkCustomerOrderLockPermission, lockCustomerOrders)
router.post('/unlock', auth, checkCustomerOrderLockPermission, unlockCustomerOrders)

// 手动修改结算状态路由 - 必须放在 /:id 路由之前
router.put('/settlement-status', auth, checkCustomerOrderLockPermission, updateSettlementStatus)
router.put('/:id', auth, updateCustomerOrder)

export default router 