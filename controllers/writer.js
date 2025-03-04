const Writer = require('../models/writer');
const { Op } = require('sequelize');

// 获取写手列表
exports.getWriters = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, writer_id, name, education, major, writing_experience, starred, processed } = req.query;
    
    // 构建查询条件
    const where = {};
    if(writer_id) where.writer_id = writer_id;
    if(name) where.name = { [Op.like]: `%${name}%` };
    if(education) where.education = education;
    if(major) where.major = { [Op.like]: `%${major}%` };
    if(writing_experience) where.writing_experience = writing_experience;
    if(starred !== undefined) where.starred = starred;
    if(processed !== undefined) where.processed = processed;

    const { count, rows } = await Writer.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      order: [['created_time', 'DESC']]
    });

    res.json({
      code: 200,
      data: {
        total: count,
        list: rows
      },
      message: "获取成功"
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
};

// 获取写手详情
exports.getWriterById = async (req, res) => {
  try {
    const writer = await Writer.findByPk(req.params.id);
    if (!writer) {
      return res.status(404).json({
        code: 404,
        message: "写手不存在"
      });
    }
    res.json({
      code: 200,
      data: writer,
      message: "获取成功"
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
};

// 新增写手
exports.createWriter = async (req, res) => {
  try {
    const writer = await Writer.create({
      ...req.body,
      created_time: new Date(),
      created_by: req.user?.username || 'system'
    });
    res.json({
      code: 200,
      data: { id: writer.id },
      message: "添加成功"
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
};

// 更新写手
exports.updateWriter = async (req, res) => {
  try {
    const writer = await Writer.findByPk(req.params.id);
    if (!writer) {
      return res.status(404).json({
        code: 404,
        message: "写手不存在"
      });
    }
    
    await writer.update({
      ...req.body,
      last_modified_time: new Date(),
      last_modified_by: req.user?.username || 'system'
    });
    
    res.json({
      code: 200,
      message: "更新成功"
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
};

// 删除写手
exports.deleteWriter = async (req, res) => {
  try {
    const writer = await Writer.findByPk(req.params.id);
    if (!writer) {
      return res.status(404).json({
        code: 404,
        message: "写手不存在"
      });
    }
    
    await writer.destroy();
    res.json({
      code: 200,
      message: "删除成功"
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
};

// 批量删除写手
exports.batchDeleteWriters = async (req, res) => {
  try {
    const { ids } = req.body;
    await Writer.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });
    res.json({
      code: 200,
      message: "删除成功"
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
}; 