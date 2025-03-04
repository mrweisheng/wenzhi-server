import express from 'express'
import { auth } from '../middlewares/auth'
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleMenus
} from '../controllers/role'

const router = express.Router()

router.get('/', auth, getRoles)
router.post('/', auth, createRole)
router.put('/:id', auth, updateRole)
router.delete('/:id', auth, deleteRole)
router.get('/:id/menus', auth, getRoleMenus)

export default router 