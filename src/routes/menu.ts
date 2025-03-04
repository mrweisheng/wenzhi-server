import express from 'express'
import { auth } from '../middlewares/auth'
import {
  getAllMenus,
  createMenu,
  updateMenu,
  deleteMenu
} from '../controllers/menu'

const router = express.Router()

router.get('/', auth, getAllMenus)
router.post('/', auth, createMenu)
router.put('/:id', auth, updateMenu)
router.delete('/:id', auth, deleteMenu)

export default router 