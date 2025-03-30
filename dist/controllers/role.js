"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleMenus = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoles = void 0;
const db_1 = __importDefault(require("../config/db"));
// 获取角色列表
const getRoles = async (req, res) => {
    try {
        const [roles] = await db_1.default.query('SELECT * FROM roles ORDER BY id DESC');
        res.json({
            code: 0,
            data: roles
        });
    }
    catch (err) {
        console.error('Get roles error:', err);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getRoles = getRoles;
// 创建角色
const createRole = async (req, res) => {
    try {
        const { role_name } = req.body;
        // 检查角色名是否已存在
        const [existing] = await db_1.default.query('SELECT id FROM roles WHERE role_name = ?', [role_name]);
        if (existing.length > 0) {
            return res.status(400).json({
                code: 1,
                message: '角色名已存在'
            });
        }
        // 创建角色
        const [result] = await db_1.default.query('INSERT INTO roles (role_name) VALUES (?)', [role_name]);
        // 如果有菜单权限，添加角色菜单关系
        if (req.body.menu_ids && req.body.menu_ids.length > 0) {
            const values = req.body.menu_ids.map((menuId) => [result.insertId, menuId]);
            await db_1.default.query('INSERT INTO role_menus (role_id, menu_id) VALUES ?', [values]);
        }
        res.json({
            code: 0,
            message: '创建成功'
        });
    }
    catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.createRole = createRole;
// 更新角色
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role_name, menu_ids } = req.body;
        // 检查角色名是否已存在
        const [existing] = await db_1.default.query('SELECT id FROM roles WHERE role_name = ? AND id != ?', [role_name, id]);
        if (existing.length > 0) {
            return res.status(400).json({
                code: 1,
                message: '角色名已存在'
            });
        }
        // 如果有角色名，则更新角色基本信息
        if (role_name) {
            await db_1.default.query('UPDATE roles SET role_name = ? WHERE id = ?', [role_name, id]);
        }
        // 更新角色菜单权限
        if (menu_ids) {
            // 先删除原有权限
            await db_1.default.query('DELETE FROM role_menus WHERE role_id = ?', [id]);
            // 添加新的权限
            if (menu_ids.length > 0) {
                const values = menu_ids.map((menuId) => [id, menuId]);
                await db_1.default.query('INSERT INTO role_menus (role_id, menu_id) VALUES ?', [values]);
            }
        }
        res.json({
            code: 0,
            message: '更新成功'
        });
    }
    catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.updateRole = updateRole;
// 删除角色
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        // 检查是否有用户使用该角色
        const [users] = await db_1.default.query('SELECT id FROM users WHERE role_id = ?', [id]);
        if (users.length > 0) {
            return res.status(400).json({
                code: 1,
                message: '该角色下存在用户，无法删除'
            });
        }
        // 删除角色菜单关系
        await db_1.default.query('DELETE FROM role_menus WHERE role_id = ?', [id]);
        // 删除角色
        await db_1.default.query('DELETE FROM roles WHERE id = ?', [id]);
        res.json({
            code: 0,
            message: '删除成功'
        });
    }
    catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.deleteRole = deleteRole;
// 获取角色的菜单权限
const getRoleMenus = async (req, res) => {
    try {
        const { id } = req.params;
        const [menus] = await db_1.default.query(`SELECT m.* FROM menus m 
       INNER JOIN role_menus rm ON m.id = rm.menu_id 
       WHERE rm.role_id = ?
       ORDER BY m.sort`, [id]);
        res.json({
            code: 0,
            data: menus
        });
    }
    catch (error) {
        console.error('Get role menus error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getRoleMenus = getRoleMenus;
