"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialCustomerOrderSync = exports.scheduleCustomerOrderSync = void 0;
const customerOrder_1 = require("./controllers/customerOrder");
// 定时同步客服订单到订单总表
const scheduleCustomerOrderSync = () => {
    // 每小时执行一次同步
    setInterval(async () => {
        try {
            console.log('执行定时同步任务...');
            const result = await (0, customerOrder_1.autoMergeCustomerOrder)();
            if (result.success) {
                console.log(`定时同步成功: ${result.message}, 处理订单数: ${result.total}`);
            }
            else {
                console.error(`定时同步失败: ${result.message}`);
            }
        }
        catch (error) {
            console.error('定时同步任务执行错误:', error);
        }
    }, 60 * 60 * 1000); // 60分钟 = 1小时
    console.log('客服订单自动同步任务已启动，每小时执行一次');
};
exports.scheduleCustomerOrderSync = scheduleCustomerOrderSync;
// 立即执行一次同步（服务启动时）
const initialCustomerOrderSync = async () => {
    try {
        console.log('服务启动，执行初始同步...');
        const result = await (0, customerOrder_1.autoMergeCustomerOrder)();
        if (result.success) {
            console.log(`初始同步完成: ${result.message}, 处理订单数: ${result.total}`);
        }
        else {
            console.error(`初始同步失败: ${result.message}`);
        }
    }
    catch (error) {
        console.error('初始同步错误:', error);
    }
};
exports.initialCustomerOrderSync = initialCustomerOrderSync;
