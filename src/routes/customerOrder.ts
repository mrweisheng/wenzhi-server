import express from 'express'
import { auth } from '../middlewares/auth'
import { 
  createCustomerOrder,
  getCustomerOrders,
  getCustomerOrderById,
  updateCustomerOrder,
  deleteCustomerOrder
} from '../controllers/customerOrder'

const router = express.Router()

router.post('/', auth, createCustomerOrder)
router.get('/', auth, getCustomerOrders)
router.get('/:id', auth, getCustomerOrderById)
router.put('/:id', auth, updateCustomerOrder)
router.delete('/:id', auth, deleteCustomerOrder)

export default router 