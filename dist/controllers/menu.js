"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMenu = exports.updateMenu = exports.createMenu = exports.getAllMenus = void 0;
const db_1 = __importDefault(require("../config/db"));
// 获取所有菜单
const getAllMenus = async (req, res) => {
    try {
        const [menus] = await db_1.default.query('SELECT * FROM menus ORDER BY sort');
        res.json({
            code: 0,
            data: menus
        });
    }
    catch (err) {
        console.error('Get menus error:', err);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.getAllMenus = getAllMenus;
// 创建菜单
const createMenu = async (req, res) => {
    try {
        const { name, path, icon, sort, parent_id } = req.body;
        await db_1.default.query('INSERT INTO menus (name, path, icon, sort, parent_id) VALUES (?, ?, ?, ?, ?)', [name, path, icon, sort, parent_id]);
        res.json({
            code: 0,
            message: '创建成功'
        });
    }
    catch (error) {
        console.error('Create menu error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.createMenu = createMenu;
// 更新菜单
const updateMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, sort } = req.body;
        // 检查菜单是否存在
        const [existing] = await db_1.default.query('SELECT id FROM menus WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                code: 1,
                message: '菜单不存在'
            });
        }
        // 构建更新SQL
        const updateFields = [];
        const params = [];
        if (name !== undefined) {
            updateFields.push('name = ?');
            params.push(name);
        }
        if (icon !== undefined) {
            updateFields.push('icon = ?');
            params.push(icon);
        }
        if (sort !== undefined) {
            updateFields.push('sort = ?');
            params.push(sort);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({
                code: 1,
                message: '没有要更新的字段'
            });
        }
        params.push(id);
        // 执行更新
        await db_1.default.query(`UPDATE menus SET ${updateFields.join(', ')} WHERE id = ?`, params);
        res.json({
            code: 0,
            message: '更新成功'
        });
    }
    catch (error) {
        console.error('Update menu error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.updateMenu = updateMenu;
// 删除菜单
const deleteMenu = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.query('DELETE FROM menus WHERE id = ?', [id]);
        res.json({
            code: 0,
            message: '删除成功'
        });
    }
    catch (error) {
        console.error('Delete menu error:', error);
        res.status(500).json({
            code: 1,
            message: '服务器错误'
        });
    }
};
exports.deleteMenu = deleteMenu;
