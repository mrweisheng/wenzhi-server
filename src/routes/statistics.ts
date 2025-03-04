import express from 'express'
import { auth } from '../middlewares/auth'
import { getStatistics } from '../controllers/statistics'

const router = express.Router()

router.get('/', auth, getStatistics)

export default router 