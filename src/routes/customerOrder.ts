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
  exportCustomerOrders // 新增导出客服订单
} from '../controllers/customerOrder'

const router = express.Router()

router.post('/', auth, createCustomerOrder)
router.get('/export-commission-data', auth, exportCustomerCommission)
router.get('/export', auth, exportCustomerOrders)
router.get('/', auth, getCustomerOrders)
router.get('/:id', auth, getCustomerOrderById)
router.put('/:id', auth, updateCustomerOrder)
router.delete('/:id', auth, deleteCustomerOrder)
router.post('/merge', auth, mergeCustomerOrder)

// 锁定相关路由
router.post('/lock', auth, checkCustomerOrderLockPermission, lockCustomerOrders)
router.post('/unlock', auth, checkCustomerOrderLockPermission, unlockCustomerOrders)

export default router 