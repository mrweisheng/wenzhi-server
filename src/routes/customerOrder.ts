import express from 'express'
import { auth } from '../middlewares/auth'
import { 
  createCustomerOrder,
  getCustomerOrders,
  getCustomerOrderById,
  updateCustomerOrder,
  deleteCustomerOrder,
  mergeCustomerOrder
} from '../controllers/customerOrder'

const router = express.Router()

router.post('/', auth, createCustomerOrder)
router.get('/', auth, getCustomerOrders)
router.get('/:id', auth, getCustomerOrderById)
router.put('/:id', auth, updateCustomerOrder)
router.delete('/:id', auth, deleteCustomerOrder)
router.post('/merge', auth, mergeCustomerOrder)

export default router 