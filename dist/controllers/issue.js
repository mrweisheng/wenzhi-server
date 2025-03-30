"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.addIssueRecord = exports.updateIssue = exports.createIssue = exports.getIssueById = exports.getIssues = void 0;
const db_1 = __importStar(require("../config/db"));
// 格式化日期函数
const formatDate = (date) => {
    if (!date)
        return null;
    return new Date(date).toISOString().replace('T', ' ').substring(0, 19);
};
// 获取问题列表
const getIssues = async (req, res) => {
    try {
        const { keyword, status, page = 1, pageSize = 10 } = req.query;
        // 构建查询条件
        let sql = `
      SELECT i.*, 
             ua.username as assignee_username, 
             ua.real_name as assignee_real_name,
             uc.username as creator_username,
             uc.real_name as creator_real_name
      FROM issues i
      LEFT JOIN users ua ON i.assignee_id = ua.id
      LEFT JOIN users uc ON i.creator_id = uc.id
      WHERE 1=1
    `;
        const params = [];
        if (keyword) {
            sql += ' AND i.title LIKE ?';
            params.push(`%${keyword}%`);
        }
        if (status && ['pending', 'processing', 'completed'].includes(status)) {
            sql += ' AND i.status = ?';
            params.push(status);
        }
        // 计算总数
        const [countResult] = await (0, db_1.query)(`SELECT COUNT(*) as total FROM (${sql}) as t`, params);
        const total = countResult[0].total;
        // 分页查询
        sql += ' ORDER BY i.create_time DESC LIMIT ? OFFSET ?';
        params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
        const [issues] = await (0, db_1.query)(sql, params);
        // 格式化返回数据
        const formattedIssues = issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            status: issue.status,
            priority: issue.priority,
            createTime: formatDate(issue.create_time),
            deadline: formatDate(issue.deadline),
            description: issue.description,
            assignee: issue.assignee_id ? {
                id: issue.assignee_id,
                name: issue.assignee_real_name || issue.assignee_username
            } : null,
            creator: {
                id: issue.creator_id,
                name: issue.creator_real_name || issue.creator_username
            }
        }));
        res.json({
            code: 0,
            message: "success",
            data: {
                total,
                pageCount: Math.ceil(total / Number(pageSize)),
                currentPage: Number(page),
                items: formattedIssues
            }
        });
    }
    catch (error) {
        console.error('获取问题列表失败:', error);
        res.status(500).json({
            code: 1,
            message: '获取问题列表失败'
        });
    }
};
exports.getIssues = getIssues;
// 获取问题详情
const getIssueById = async (req, res) => {
    try {
        const { id } = req.params;
        // 查询问题基本信息
        const [issues] = await (0, db_1.query)(`
      SELECT i.*, 
             ua.id as assignee_id, 
             ua.username as assignee_username, 
             ua.real_name as assignee_real_name,
             uc.id as creator_id,
             uc.username as creator_username,
             uc.real_name as creator_real_name
      FROM issues i
      LEFT JOIN users ua ON i.assignee_id = ua.id
      LEFT JOIN users uc ON i.creator_id = uc.id
      WHERE i.id = ?
    `, [id]);
        if (issues.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '问题不存在'
            });
        }
        const issue = issues[0];
        // 查询问题处理记录
        const [records] = await (0, db_1.query)(`
      SELECT r.*, 
             u.id as user_id, 
             u.username, 
             u.real_name
      FROM issue_records r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.issue_id = ?
      ORDER BY r.create_time DESC
    `, [id]);
        // 格式化处理记录
        const formattedRecords = records.map((record) => ({
            id: record.id,
            content: record.content,
            createTime: formatDate(record.create_time),
            user: {
                id: record.user_id,
                name: record.real_name || record.username
            }
        }));
        // 格式化并返回问题详情
        res.json({
            code: 0,
            message: "success",
            data: {
                id: issue.id,
                title: issue.title,
                status: issue.status,
                priority: issue.priority,
                createTime: formatDate(issue.create_time),
                deadline: formatDate(issue.deadline),
                description: issue.description,
                assignee: issue.assignee_id ? {
                    id: issue.assignee_id,
                    name: issue.assignee_real_name || issue.assignee_username
                } : null,
                creator: {
                    id: issue.creator_id,
                    name: issue.creator_real_name || issue.creator_username
                },
                records: formattedRecords
            }
        });
    }
    catch (error) {
        console.error('获取问题详情失败:', error);
        res.status(500).json({
            code: 1,
            message: '获取问题详情失败'
        });
    }
};
exports.getIssueById = getIssueById;
// 生成问题ID
const generateIssueId = async () => {
    // 获取当前问题数量
    const [result] = await (0, db_1.query)('SELECT COUNT(*) as count FROM issues');
    const count = result[0].count;
    // 生成新ID，格式为：ISSUE-XXX，XXX为三位数序号，从001开始
    const issueId = `ISSUE-${String(count + 1).padStart(3, '0')}`;
    return issueId;
};
// 创建问题
const createIssue = async (req, res) => {
    try {
        const { title, priority, status, description, deadline, assigneeId } = req.body;
        const creatorId = req.userId; // 从token获取创建人ID
        // 数据验证
        if (!title) {
            return res.status(400).json({
                code: 1,
                message: '问题标题不能为空'
            });
        }
        // 生成问题ID
        const issueId = await generateIssueId();
        // 创建问题
        await (0, db_1.query)(`
      INSERT INTO issues 
      (id, title, priority, status, description, deadline, assignee_id, creator_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            issueId,
            title,
            priority || 'medium',
            status || 'pending',
            description || null,
            deadline ? new Date(deadline) : null,
            assigneeId || null,
            creatorId
        ]);
        res.status(201).json({
            code: 0,
            message: '创建成功',
            data: {
                id: issueId
            }
        });
    }
    catch (error) {
        console.error('创建问题失败:', error);
        res.status(500).json({
            code: 1,
            message: '创建问题失败'
        });
    }
};
exports.createIssue = createIssue;
// 更新问题（带权限校验）
const updateIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, priority, status, description, deadline, assigneeId } = req.body;
        const currentUserId = req.userId; // 从token获取当前用户ID
        // 查询问题信息，检查当前用户是否有权限修改
        const [issues] = await (0, db_1.query)('SELECT * FROM issues WHERE id = ?', [id]);
        if (issues.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '问题不存在'
            });
        }
        const issue = issues[0];
        // 权限校验：只有问题创建人和负责人可以修改
        if (issue.creator_id !== currentUserId && issue.assignee_id !== currentUserId) {
            return res.status(403).json({
                code: 1,
                message: '您没有权限修改此问题，只有问题创建人和负责人可以修改'
            });
        }
        // 构建更新字段和参数
        const updateFields = [];
        const params = [];
        if (title !== undefined) {
            updateFields.push('title = ?');
            params.push(title);
        }
        if (priority !== undefined) {
            updateFields.push('priority = ?');
            params.push(priority);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            params.push(status);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            params.push(description);
        }
        if (deadline !== undefined) {
            updateFields.push('deadline = ?');
            params.push(deadline ? new Date(deadline) : null);
        }
        if (assigneeId !== undefined) {
            updateFields.push('assignee_id = ?');
            params.push(assigneeId);
        }
        // 如果没有要更新的字段
        if (updateFields.length === 0) {
            return res.status(400).json({
                code: 1,
                message: '没有要更新的字段'
            });
        }
        // 添加问题ID到参数中
        params.push(id);
        // 执行更新
        await (0, db_1.query)(`UPDATE issues SET ${updateFields.join(', ')} WHERE id = ?`, params);
        res.json({
            code: 0,
            message: '更新成功'
        });
    }
    catch (error) {
        console.error('更新问题失败:', error);
        res.status(500).json({
            code: 1,
            message: '更新问题失败'
        });
    }
};
exports.updateIssue = updateIssue;
// 添加问题处理记录（带权限校验）
const addIssueRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, newStatus } = req.body;
        const userId = req.userId; // 从token获取当前用户ID
        // 数据验证
        if (!content) {
            return res.status(400).json({
                code: 1,
                message: '处理记录内容不能为空'
            });
        }
        // 查询问题信息，检查当前用户是否有权限添加记录
        const [issues] = await (0, db_1.query)('SELECT * FROM issues WHERE id = ?', [id]);
        if (issues.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '问题不存在'
            });
        }
        const issue = issues[0];
        // 权限校验：只有问题创建人和负责人可以添加处理记录
        if (issue.creator_id !== userId && issue.assignee_id !== userId) {
            return res.status(403).json({
                code: 1,
                message: '您没有权限添加处理记录，只有问题创建人和负责人可以添加'
            });
        }
        // 开启事务
        const connection = await db_1.default.getConnection();
        await connection.beginTransaction();
        try {
            // 添加处理记录
            const [result] = await connection.query('INSERT INTO issue_records (issue_id, content, user_id) VALUES (?, ?, ?)', [id, content, userId]);
            // 如果提供了新状态，同时更新问题状态
            if (newStatus && ['pending', 'processing', 'completed'].includes(newStatus)) {
                await connection.query('UPDATE issues SET status = ? WHERE id = ?', [newStatus, id]);
            }
            // 提交事务
            await connection.commit();
            connection.release();
            // 查询用户信息
            const [users] = await (0, db_1.query)('SELECT id, username, real_name FROM users WHERE id = ?', [userId]);
            // 格式化返回数据
            const recordId = result.insertId;
            res.status(201).json({
                code: 0,
                message: '添加成功',
                data: {
                    id: recordId,
                    content,
                    createTime: formatDate(new Date()),
                    user: {
                        id: userId,
                        name: users[0].real_name || users[0].username
                    }
                }
            });
        }
        catch (error) {
            // 回滚事务
            await connection.rollback();
            connection.release();
            throw error;
        }
    }
    catch (error) {
        console.error('添加处理记录失败:', error);
        res.status(500).json({
            code: 1,
            message: '添加处理记录失败'
        });
    }
};
exports.addIssueRecord = addIssueRecord;
