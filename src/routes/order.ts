import express from 'express'
import { auth } from '../middlewares/auth'
import { 
  getOrders, 
  updateOrderCustomer,
  updateOrderWriter,
  recalculateCommission
} from '../controllers/order'

const router = express.Router()

router.get('/', auth, getOrders)
router.put('/:orderId/customer', auth, updateOrderCustomer)
router.put('/:orderId/writer', auth, updateOrderWriter)
router.post('/recalculate-commission', auth, recalculateCommission)

export default router 