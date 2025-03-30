-- 添加 customer_name 列
ALTER TABLE `customer_orders` 
ADD COLUMN `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户名称' AFTER `new_customer`;

-- 删除不需要的列
ALTER TABLE `customer_orders` 
DROP COLUMN `taobao_order_id`,
DROP COLUMN `taobao_order_id2`,
DROP COLUMN `wechat_pay_id`,
DROP COLUMN `wechat_pay_id2`; 