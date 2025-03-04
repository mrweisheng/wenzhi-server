import express from 'express'
import { auth } from '../middlewares/auth'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus
} from '../controllers/user'

const router = express.Router()

router.get('/', auth, getUsers)
router.post('/', auth, createUser)
router.put('/:id', auth, updateUser)
router.delete('/:id', auth, deleteUser)
router.put('/:id/status', auth, updateUserStatus)

export default router 