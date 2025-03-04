import express from 'express'
import { auth } from '../middlewares/auth'
import { getOrders } from '../controllers/order'

const router = express.Router()

router.get('/', auth, getOrders)

export default router 