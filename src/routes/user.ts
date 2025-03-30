import express from 'express'
import { auth } from '../middlewares/auth'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getCustomerService,
  getUserList,
  updateEmail,
  updatePassword
} from '../controllers/user'

const router = express.Router()

router.get('/', auth, getUsers)
router.get('/customer-service', auth, getCustomerService)
router.get('/list', auth, getUserList)
router.post('/', auth, createUser)
router.put('/email', auth, updateEmail)
router.put('/password', auth, updatePassword)
router.put('/:id', auth, updateUser)
router.delete('/:id', auth, deleteUser)
router.put('/:id/status', auth, updateUserStatus)

export default router 