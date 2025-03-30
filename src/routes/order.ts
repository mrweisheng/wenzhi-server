import express from 'express'
import { auth } from '../middlewares/auth'
import { 
  getOrders, 
  updateOrderCustomer,
  updateOrderWriter 
} from '../controllers/order'

const router = express.Router()

router.get('/', auth, getOrders)
router.put('/:orderId/customer', auth, updateOrderCustomer)
router.put('/:orderId/writer', auth, updateOrderWriter)

export default router 