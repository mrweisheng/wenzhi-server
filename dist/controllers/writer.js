"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWriterQuickSearch = exports.openCreateWriter = exports.getWriterList = exports.batchDeleteWriters = exports.deleteWriter = exports.updateWriter = exports.createWriter = exports.getWriterById = exports.getWriters = void 0;
const db_1 = __importDefault(require("../config/db"));
// 获取写手列表
const getWriters = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, writer_id, name, education, major, writing_experience, starred, processed } = req.query;
        // 构建查询条件
        let sql = `
      SELECT w.*, 
             CASE WHEN u.id IS NOT NULL THEN 1 ELSE 0 END as is_activated
      FROM writer_info w
      LEFT JOIN users u ON w.writer_id = u.username
      WHERE 1=1
    `;
        const params = [];
        if (writer_id) {
            sql += ' AND w.writer_id = ?';
            params.push(writer_id);
        }
        if (name) {
            sql += ' AND w.name LIKE ?';
            params.push(`%${name}%`);
        }
        if (education) {
            sql += ' AND w.education = ?';
            params.push(education);
        }
        if (major) {
            sql += ' AND w.major LIKE ?';
            params.push(`%${major}%`);
        }
        if (writing_experience) {
            sql += ' AND w.writing_experience = ?';
            params.push(writing_experience);
        }
        if (starred !== undefined) {
            sql += ' AND w.starred = ?';
            params.push(starred);
        }
        if (processed !== undefined) {
            sql += ' AND w.processed = ?';
            params.push(processed);
        }
        // 计算总数
        const [countResult] = await db_1.default.query(`SELECT COUNT(*) as total FROM (${sql}) as t`, params);
        const total = countResult[0].total;
        // 分页查询
        sql += ' ORDER BY w.created_time DESC LIMIT ? OFFSET ?';
        params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
        const [rows] = await db_1.default.query(sql, params);
        res.json({
            code: 0,
            data: {
                total,
                list: rows
            },
            message: "获取成功"
        });
    }
    catch (error) {
        console.error('Get writers error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getWriters = getWriters;
// 获取写手详情
const getWriterById = async (req, res) => {
    try {
        const { id } = req.params;
        // 获取写手基本信息
        const [writers] = await db_1.default.query(`SELECT w.*, 
              CASE WHEN u.id IS NOT NULL THEN 1 ELSE 0 END as is_activated
       FROM writer_info w
       LEFT JOIN users u ON w.writer_id = u.username
       WHERE w.id = ?`, [id]);
        if (writers.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '写手不存在'
            });
        }
        // 查询最新的评分记录
        const [latestRatings] = await db_1.default.query(`SELECT r.*, 
              u.username as inspector_username,
              u.real_name as inspector_name
       FROM writer_ratings r
       INNER JOIN users u ON r.quality_inspector_id = u.id
       WHERE r.writer_id = ?
       ORDER BY r.rating_date DESC, r.updated_at DESC
       LIMIT 1`, [id]);
        // 格式化写手数据
        const writerData = writers[0];
        // 如果有评分记录，添加到返回数据中
        if (latestRatings.length > 0) {
            const rating = latestRatings[0];
            writerData.latest_rating = {
                id: rating.id,
                score: rating.score,
                comment: rating.comment,
                date: rating.rating_date,
                created_at: rating.created_at,
                updated_at: rating.updated_at,
                quality_inspector: {
                    id: rating.quality_inspector_id,
                    name: rating.inspector_name || rating.inspector_username
                }
            };
        }
        else {
            writerData.latest_rating = null;
        }
        res.json({
            code: 0,
            data: writerData,
            message: '获取成功'
        });
    }
    catch (error) {
        console.error('Get writer error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getWriterById = getWriterById;
// 生成写手ID
async function generateWriterId() {
    // 获取当前日期，格式: 240720 (年月日)
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(-2) +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    let sequence = 1;
    let writerId = '';
    let isUnique = false;
    // 循环尝试直到找到唯一的writer_id
    while (!isUnique) {
        writerId = `w${dateStr}${sequence.toString().padStart(2, '0')}`;
        // 检查是否已存在
        const [existing] = await db_1.default.query('SELECT id FROM writer_info WHERE writer_id = ?', [writerId]);
        if (existing.length === 0) {
            isUnique = true;
        }
        else {
            sequence++;
            if (sequence > 99) {
                throw new Error('当日写手ID序号已用尽');
            }
        }
    }
    return writerId;
}
function formatDate(date) {
    if (!date)
        return null;
    const d = new Date(date);
    if (isNaN(d.getTime()))
        return null;
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// 创建写手
const createWriter = async (req, res) => {
    try {
        const writer = req.body;
        // 自动生成writer_id
        writer.writer_id = await generateWriterId();
        writer.created_time = new Date();
        writer.created_by = req.userId;
        // 格式化 apply_date 字段
        if (writer.apply_date) {
            writer.apply_date = formatDate(writer.apply_date);
        }
        // 添加唯一性约束检查
        const [existing] = await db_1.default.query('SELECT id FROM writer_info WHERE writer_id = ?', [writer.writer_id]);
        if (existing.length > 0) {
            return res.status(400).json({
                code: 1,
                message: '写手ID已存在'
            });
        }
        const [result] = await db_1.default.query('INSERT INTO writer_info SET ?', writer);
        res.json({
            code: 0,
            data: {
                id: result.insertId,
                writer_id: writer.writer_id
            },
            message: '添加成功'
        });
    }
    catch (err) {
        console.error('Create writer error:', err);
        if (err.message === '当日写手ID序号已用尽') {
            return res.status(400).json({
                code: 1,
                message: err.message
            });
        }
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.createWriter = createWriter;
// 更新写手
const updateWriter = async (req, res) => {
    try {
        const { id } = req.params;
        const writer = req.body;
        writer.last_modified_time = new Date();
        writer.last_modified_by = req.userId;
        const [result] = await db_1.default.query('UPDATE writer_info SET ? WHERE id = ?', [writer, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 1,
                message: '写手不存在'
            });
        }
        res.json({
            code: 0,
            message: '更新成功'
        });
    }
    catch (error) {
        console.error('Update writer error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.updateWriter = updateWriter;
// 删除写手
const deleteWriter = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db_1.default.query('DELETE FROM writer_info WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 1,
                message: '写手不存在'
            });
        }
        res.json({
            code: 0,
            message: '删除成功'
        });
    }
    catch (error) {
        console.error('Delete writer error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.deleteWriter = deleteWriter;
// 批量删除写手
const batchDeleteWriters = async (req, res) => {
    try {
        const { ids } = req.body;
        await db_1.default.query('DELETE FROM writer_info WHERE id IN (?)', [ids]);
        res.json({
            code: 0,
            message: '删除成功'
        });
    }
    catch (error) {
        console.error('Batch delete writers error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.batchDeleteWriters = batchDeleteWriters;
// 获取写手简要列表
const getWriterList = async (req, res) => {
    try {
        const [writers] = await db_1.default.query(`SELECT w.id, w.writer_id, w.name, w.phone_1,
              CASE WHEN u.id IS NOT NULL THEN 1 ELSE 0 END as is_activated
       FROM writer_info w
       LEFT JOIN users u ON w.writer_id = u.username
       ORDER BY w.created_time DESC`);
        res.json({
            code: 0,
            message: 'success',
            data: writers
        });
    }
    catch (err) {
        console.error('Get writer list error:', err);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getWriterList = getWriterList;
// 开放注册写手（无token、无用户限制）
const openCreateWriter = async (req, res) => {
    try {
        const writer = req.body;
        // 自动生成writer_id
        writer.writer_id = await generateWriterId();
        writer.created_time = new Date();
        // 不设置 created_by
        // 格式化 apply_date 字段
        if (writer.apply_date) {
            writer.apply_date = formatDate(writer.apply_date);
        }
        // 添加唯一性约束检查
        const [existing] = await db_1.default.query('SELECT id FROM writer_info WHERE writer_id = ?', [writer.writer_id]);
        if (existing.length > 0) {
            return res.status(400).json({
                code: 1,
                message: '写手ID已存在'
            });
        }
        const [result] = await db_1.default.query('INSERT INTO writer_info SET ?', writer);
        res.json({
            code: 0,
            data: {
                id: result.insertId,
                writer_id: writer.writer_id
            },
            message: '添加成功'
        });
    }
    catch (err) {
        console.error('Create writer error:', err);
        if (err.message === '当日写手ID序号已用尽') {
            return res.status(400).json({
                code: 1,
                message: err.message
            });
        }
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.openCreateWriter = openCreateWriter;
// 快速模糊搜索写手
const getWriterQuickSearch = async (req, res) => {
    try {
        let { keyword = '', page = 1, pageSize = 10 } = req.query;
        keyword = keyword.trim();
        page = Number(page) || 1;
        pageSize = Math.min(Number(pageSize) || 10, 20); // 最大20条
        if (!keyword || keyword.length < 2) {
            return res.json({
                code: 0,
                data: [],
                message: 'success'
            });
        }
        const offset = (page - 1) * pageSize;
        const sql = `
      SELECT w.id, w.writer_id, w.name, w.phone_1
      FROM writer_info w
      WHERE w.writer_id LIKE ?
      ORDER BY w.created_time DESC
      LIMIT ? OFFSET ?
    `;
        const params = [`%${keyword}%`, pageSize, offset];
        const [rows] = await db_1.default.query(sql, params);
        res.json({
            code: 0,
            data: rows,
            message: 'success'
        });
    }
    catch (err) {
        console.error('Quick search writer error:', err);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getWriterQuickSearch = getWriterQuickSearch;
