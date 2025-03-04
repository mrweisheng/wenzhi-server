import express from 'express'
import { login, getUserInfo } from '../controllers/auth'
import { auth } from '../middlewares/auth'

const router = express.Router()

router.post('/login', login)
router.get('/userInfo', auth, getUserInfo)

export default router 