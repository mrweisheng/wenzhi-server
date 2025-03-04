const express = require('express');
const router = express.Router();
const writerController = require('../controllers/writer');

// 获取写手列表
router.get('/writers', writerController.getWriters);

// 获取写手详情
router.get('/writers/:id', writerController.getWriterById);

// 新增写手
router.post('/writers', writerController.createWriter);

// 更新写手
router.put('/writers/:id', writerController.updateWriter);

// 删除写手
router.delete('/writers/:id', writerController.deleteWriter);

// 批量删除写手
router.delete('/writers', writerController.batchDeleteWriters);

module.exports = router; 