"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.updateEmail = exports.getUserList = exports.getCustomerService = exports.updateUserStatus = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
// 获取用户列表
const getUsers = async (req, res) => {
    try {
        const { username, role_id, status } = req.query;
        let sql = `
      SELECT u.*, r.role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE 1=1
    `;
        const params = [];
        if (username) {
            sql += ' AND u.username LIKE ?';
            params.push(`%${username}%`);
        }
        if (role_id) {
            sql += ' AND u.role_id = ?';
            params.push(role_id);
        }
        if (status !== undefined && status !== '') {
            sql += ' AND u.status = ?';
            params.push(status);
        }
        sql += ' ORDER BY u.id DESC';
        const [users] = await db_1.default.query(sql, params);
        res.json({
            code: 0,
            data: users
        });
    }
    catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getUsers = getUsers;
// 创建用户
const createUser = async (req, res) => {
    try {
        const { username, password, role_id, real_name, email, status } = req.body;
        // 检查用户名是否已存在
        const [existing] = await db_1.default.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({
                code: 1,
                message: '用户名已存在'
            });
        }
        // 加密密码
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // 创建用户
        await db_1.default.query('INSERT INTO users (username, password, role_id, real_name, email, status) VALUES (?, ?, ?, ?, ?, ?)', [username, hashedPassword, role_id, real_name, email, status]);
        res.json({
            code: 0,
            message: '创建成功'
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.createUser = createUser;
// 更新用户
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, role_id, real_name, email, status } = req.body;
        // 检查用户名是否已存在
        const [existing] = await db_1.default.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
        if (existing.length > 0) {
            return res.status(400).json({
                code: 1,
                message: '用户名已存在'
            });
        }
        // 构建更新SQL
        let sql = 'UPDATE users SET username = ?, role_id = ?, real_name = ?, email = ?, status = ?';
        const params = [username, role_id, real_name, email, status];
        // 如果有密码，则更新密码
        if (password) {
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            sql += ', password = ?';
            params.push(hashedPassword);
        }
        sql += ' WHERE id = ?';
        params.push(id);
        await db_1.default.query(sql, params);
        res.json({
            code: 0,
            message: '更新成功'
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.updateUser = updateUser;
// 删除用户
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({
            code: 0,
            message: '删除成功'
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.deleteUser = deleteUser;
// 更新用户状态
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db_1.default.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
        res.json({
            code: 0,
            message: '状态更新成功'
        });
    }
    catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.updateUserStatus = updateUserStatus;
// 获取客服列表
const getCustomerService = async (req, res) => {
    try {
        // 假设客服角色的role_name包含"客服"关键字
        const [users] = await db_1.default.query(`SELECT u.id, u.username, u.real_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE r.role_name LIKE '%客服%' AND u.status = 1
       ORDER BY u.id`);
        res.json({
            code: 0,
            message: 'success',
            data: users
        });
    }
    catch (err) {
        console.error('Get customer service error:', err);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getCustomerService = getCustomerService;
// 获取用户列表（用于选择问题负责人）
const getUserList = async (req, res) => {
    try {
        // 获取所有活跃用户
        const [users] = await db_1.default.query(`SELECT u.id, u.username, u.real_name 
       FROM users u 
       WHERE u.status = 1
       ORDER BY u.id`);
        // 格式化返回数据
        const formattedUsers = users.map((user) => ({
            id: user.id.toString(),
            name: user.real_name || user.username
        }));
        res.json({
            code: 0,
            message: 'success',
            data: formattedUsers
        });
    }
    catch (err) {
        console.error('Get user list error:', err);
        res.status(500).json({
            code: 1,
            message: '获取用户列表失败'
        });
    }
};
exports.getUserList = getUserList;
// 更新用户邮箱
const updateEmail = async (req, res) => {
    try {
        const userId = req.userId; // 获取当前登录用户ID
        const { email } = req.body;
        // 验证邮箱格式
        if (!email || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
            return res.status(400).json({
                code: 1,
                message: '邮箱格式不正确'
            });
        }
        // 更新邮箱
        await db_1.default.query('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
        res.json({
            code: 0,
            message: '邮箱更新成功'
        });
    }
    catch (error) {
        console.error('Update email error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.updateEmail = updateEmail;
// 修改密码
const updatePassword = async (req, res) => {
    try {
        const userId = req.userId; // 获取当前登录用户ID
        const { oldPassword, newPassword } = req.body;
        // 验证参数
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                code: 1,
                message: '旧密码和新密码不能为空'
            });
        }
        // 验证新密码强度
        if (newPassword.length < 6) {
            return res.status(400).json({
                code: 1,
                message: '新密码长度不能少于6个字符'
            });
        }
        // 获取用户当前密码
        const [users] = await db_1.default.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '用户不存在'
            });
        }
        const user = users[0];
        // 验证旧密码
        const isMatch = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                code: 1,
                message: '旧密码不正确'
            });
        }
        // 加密新密码
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // 更新密码
        await db_1.default.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
        res.json({
            code: 0,
            message: '密码修改成功'
        });
    }
    catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.updatePassword = updatePassword;
