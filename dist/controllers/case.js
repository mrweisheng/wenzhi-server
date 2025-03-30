"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCase = exports.createSimpleCase = exports.createCase = exports.getCaseById = exports.getCases = void 0;
const db_1 = __importDefault(require("../config/db"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// 生成案例ID
async function generateCaseId() {
    const [result] = await db_1.default.query('SELECT MAX(id) as maxId FROM cases WHERE id LIKE "CASE-%"');
    let nextNum = 1;
    if (result[0].maxId) {
        // 从最大ID中提取数字部分
        const currentNum = parseInt(result[0].maxId.split('-')[1]);
        nextNum = currentNum + 1;
    }
    // 格式化为3位数，例如：CASE-001, CASE-002
    return `CASE-${nextNum.toString().padStart(3, '0')}`;
}
// 获取案例列表
const getCases = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, case_type } = req.query;
        // 构建查询条件
        let sql = `
      SELECT c.*, 
             u.username as creator_name,
             u.real_name as creator_real_name
      FROM cases c
      LEFT JOIN users u ON c.creator_id = u.id
      WHERE 1=1
    `;
        const params = [];
        if (case_type) {
            sql += ' AND c.case_type = ?';
            params.push(case_type);
        }
        // 计算总数
        const [countResult] = await db_1.default.query(`SELECT COUNT(*) as total FROM (${sql}) as t`, params);
        const total = countResult[0].total;
        // 分页查询
        sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
        const [rows] = await db_1.default.query(sql, params);
        // 格式化图片数据
        const formattedRows = rows.map((row) => ({
            ...row,
            images: row.images ? JSON.parse(row.images) : [],
            creator: {
                id: row.creator_id,
                name: row.creator_real_name || row.creator_name
            }
        }));
        res.json({
            code: 0,
            data: {
                total,
                list: formattedRows
            },
            message: "获取成功"
        });
    }
    catch (error) {
        console.error('Get cases error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getCases = getCases;
// 获取案例详情
const getCaseById = async (req, res) => {
    try {
        const { id } = req.params;
        const [cases] = await db_1.default.query(`SELECT c.*, 
              u.username as creator_name,
              u.real_name as creator_real_name
       FROM cases c
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.id = ?`, [id]);
        if (cases.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '案例不存在'
            });
        }
        // 格式化图片数据
        const caseData = cases[0];
        caseData.images = caseData.images ? JSON.parse(caseData.images) : [];
        caseData.creator = {
            id: caseData.creator_id,
            name: caseData.creator_real_name || caseData.creator_name
        };
        res.json({
            code: 0,
            data: caseData,
            message: "获取成功"
        });
    }
    catch (error) {
        console.error('Get case error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getCaseById = getCaseById;
// 创建案例
const createCase = async (req, res) => {
    try {
        // 添加调试日志
        console.log('请求体:', req.body);
        console.log('上传的文件:', req.files);
        const { case_type, title, content } = req.body;
        const creatorId = req.userId;
        // 验证必填字段
        if (!case_type || !title || !content) {
            return res.status(400).json({
                code: 1,
                message: '案例类型、标题和内容不能为空',
                debug: {
                    body: req.body,
                    files: req.files ? req.files.length : 0,
                    contentType: req.headers['content-type']
                }
            });
        }
        // 处理上传的文件
        const files = req.files;
        const imageUrls = [];
        if (files && files.length > 0) {
            for (const file of files) {
                // 获取相对路径，用于构建URL
                const relativePath = path_1.default.relative(process.cwd(), file.path);
                // 将Windows路径分隔符替换为URL路径分隔符
                const urlPath = relativePath.replace(/\\/g, '/');
                // 构建完整URL
                const imageUrl = `http://118.31.76.202:3000/${urlPath}`;
                imageUrls.push(imageUrl);
            }
        }
        // 生成案例ID
        const caseId = await generateCaseId();
        // 插入数据库
        await db_1.default.query('INSERT INTO cases (id, case_type, title, content, images, creator_id) VALUES (?, ?, ?, ?, ?, ?)', [caseId, case_type, title, content, JSON.stringify(imageUrls), creatorId]);
        res.json({
            code: 0,
            data: {
                id: caseId,
                images: imageUrls
            },
            message: '创建成功'
        });
    }
    catch (error) {
        console.error('Create case error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.createCase = createCase;
// 创建案例 (简单版本，不上传图片)
const createSimpleCase = async (req, res) => {
    try {
        // 添加调试日志
        console.log('简单创建案例请求体:', req.body);
        console.log('Content-Type:', req.headers['content-type']);
        const { case_type, title, content } = req.body;
        const creatorId = req.userId;
        // 验证必填字段
        if (!case_type || !title || !content) {
            return res.status(400).json({
                code: 1,
                message: '案例类型、标题和内容不能为空',
                debug: {
                    receivedBody: req.body,
                    contentType: req.headers['content-type']
                }
            });
        }
        // 生成案例ID
        const caseId = await generateCaseId();
        // 插入数据库
        await db_1.default.query('INSERT INTO cases (id, case_type, title, content, images, creator_id) VALUES (?, ?, ?, ?, ?, ?)', [caseId, case_type, title, content, JSON.stringify([]), creatorId]);
        res.json({
            code: 0,
            data: {
                id: caseId
            },
            message: '创建成功'
        });
    }
    catch (error) {
        console.error('Create simple case error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.createSimpleCase = createSimpleCase;
// 删除案例
const deleteCase = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // 先查询案例信息，以获取图片路径
        const [cases] = await db_1.default.query('SELECT * FROM cases WHERE id = ?', [id]);
        if (cases.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '案例不存在'
            });
        }
        // 删除案例记录
        const [result] = await db_1.default.query('DELETE FROM cases WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 1,
                message: '案例不存在或已被删除'
            });
        }
        // 尝试删除相关图片文件
        try {
            const caseData = cases[0];
            if (caseData.images) {
                const images = JSON.parse(caseData.images);
                for (const imageUrl of images) {
                    // 从URL中提取文件路径
                    const urlPath = new URL(imageUrl).pathname;
                    const filePath = path_1.default.join(process.cwd(), urlPath.slice(1));
                    // 检查文件是否存在并删除
                    if (fs_extra_1.default.existsSync(filePath)) {
                        fs_extra_1.default.unlinkSync(filePath);
                    }
                }
            }
        }
        catch (err) {
            console.error('删除图片文件失败:', err);
            // 不中断响应，即使图片删除失败
        }
        res.json({
            code: 0,
            message: '删除成功'
        });
    }
    catch (error) {
        console.error('Delete case error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.deleteCase = deleteCase;
