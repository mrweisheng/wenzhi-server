/*
 Navicat Premium Dump SQL

 Source Server         : wenzhi乌班图
 Source Server Type    : MySQL
 Source Server Version : 80041 (8.0.41-0ubuntu0.20.04.1)
 Source Host           : 118.31.76.202:3306
 Source Schema         : wenzhi

 Target Server Type    : MySQL
 Target Server Version : 80041 (8.0.41-0ubuntu0.20.04.1)
 File Encoding         : 65001

 Date: 27/07/2025 22:28:47
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for cases
-- ----------------------------
DROP TABLE IF EXISTS `cases`;
CREATE TABLE `cases`  (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '案例ID，格式为CASE-001',
  `case_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '案例类型',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '案例标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容正文',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '图片URL数组，JSON格式',
  `creator_id` int NOT NULL COMMENT '创建人ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_case_type`(`case_type` ASC) USING BTREE,
  INDEX `idx_creator`(`creator_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `fk_case_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例管理表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for customer_orders
-- ----------------------------
DROP TABLE IF EXISTS `customer_orders`;
CREATE TABLE `customer_orders`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单编号',
  `dispatch_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '派单编号',
  `date` date NOT NULL COMMENT '日期',
  `is_fixed` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否定稿',
  `order_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '稿件内容信息',
  `word_count` int NULL DEFAULT NULL COMMENT '稿件字数(只填写数字)',
  `fee` decimal(10, 2) NULL DEFAULT NULL COMMENT '稿费',
  `fee_2` decimal(10, 2) NULL DEFAULT NULL COMMENT '第二个写手的稿费',
  `fee_per_1000` decimal(10, 2) NULL DEFAULT NULL COMMENT '每一千字/费用',
  `customer_commission` decimal(10, 2) NULL DEFAULT NULL COMMENT '客服佣金',
  `is_merged` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已同步到总表(0-未同步,1-已同步)',
  `customer_id` int NULL DEFAULT NULL COMMENT '客服ID',
  `writer_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `writer_id_2` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '第二个写手ID',
  `exchange_time` datetime NULL DEFAULT NULL COMMENT '交稿时间',
  `payment_channel` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '付款渠道',
  `store_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '店铺名或客户线下',
  `new_customer` tinyint(1) NULL DEFAULT 0 COMMENT '是否新客户',
  `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客户名称',
  `order_amount` decimal(10, 2) NULL DEFAULT NULL COMMENT '订单下单金额',
  `refund_amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '退款金额',
  `special_situation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '特殊情况(不结算)',
  `is_locked` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否锁定(0-未锁定,1-已锁定)',
  `locked_by` int NULL DEFAULT NULL COMMENT '锁定人ID',
  `locked_at` timestamp NULL DEFAULT NULL COMMENT '锁定时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  `settlement_status` enum('Pending','Eligible','Locked','SelfLocked','WriterSettled','AllSettled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'Pending' COMMENT '结算状态：Pending-未结算（初始状态，客服可编辑）；Eligible-可结算（已定稿且金额匹配，系统自动标记，客服仍可编辑）；Locked-待结算（财务/超管锁定普通订单，有写手，订单不可编辑）；SelfLocked-自写待结算（财务/超管锁定自写订单，无写手，订单不可编辑）；WriterSettled-老师已结算客服未结算（财务已给写手打款但未给客服结算，订单不可编辑）；AllSettled-老师已结算客服已结算（终态，完全冻结，任何人不可编辑）',
  `writer_settlement_exported` tinyint(1) NULL DEFAULT 0 COMMENT '是否已导出写手打款(0-未导出,1-已导出)',
  `customer_settlement_exported` tinyint(1) NULL DEFAULT 0 COMMENT '是否已导出客服打款(0-未导出,1-已导出)',
  `settlement_updated_by` int NULL DEFAULT NULL COMMENT '结算状态更新人ID',
  `settlement_updated_at` timestamp NULL DEFAULT NULL COMMENT '结算状态更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  UNIQUE INDEX `idx_dispatch_id`(`dispatch_id` ASC) USING BTREE,
  INDEX `idx_date`(`date` ASC) USING BTREE,
  INDEX `idx_customer_id`(`customer_id` ASC) USING BTREE,
  INDEX `idx_writer_id`(`writer_id` ASC) USING BTREE,
  INDEX `idx_writer_id_2`(`writer_id_2` ASC) USING BTREE,
  INDEX `idx_is_locked`(`is_locked` ASC) USING BTREE,
  INDEX `idx_locked_by`(`locked_by` ASC) USING BTREE,
  INDEX `idx_writer_settlement_exported`(`writer_settlement_exported` ASC) USING BTREE,
  INDEX `idx_customer_settlement_exported`(`customer_settlement_exported` ASC) USING BTREE,
  INDEX `idx_settlement_updated_by`(`settlement_updated_by` ASC) USING BTREE,
  CONSTRAINT `fk_customer_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_customer_order_locked_by` FOREIGN KEY (`locked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_settlement_updated_by` FOREIGN KEY (`settlement_updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1861 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '客服填报订单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for issue_records
-- ----------------------------
DROP TABLE IF EXISTS `issue_records`;
CREATE TABLE `issue_records`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `issue_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所属问题ID',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '记录内容',
  `user_id` int NOT NULL COMMENT '创建用户ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_issue_id`(`issue_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_record_issue` FOREIGN KEY (`issue_id`) REFERENCES `issues` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_record_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '问题处理记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for issues
-- ----------------------------
DROP TABLE IF EXISTS `issues`;
CREATE TABLE `issues`  (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '问题ID，格式为ISSUE-001',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '问题标题',
  `status` enum('pending','processing','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '状态：待处理/处理中/已完成',
  `priority` enum('high','medium','low') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium' COMMENT '优先级：高/中/低',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '问题描述',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `deadline` datetime NULL DEFAULT NULL COMMENT '截止时间',
  `assignee_id` int NULL DEFAULT NULL COMMENT '负责人ID',
  `creator_id` int NOT NULL COMMENT '创建人ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_assignee`(`assignee_id` ASC) USING BTREE,
  INDEX `idx_creator`(`creator_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_create_time`(`create_time` ASC) USING BTREE,
  INDEX `idx_deadline`(`deadline` ASC) USING BTREE,
  CONSTRAINT `fk_issue_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_issue_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '问题跟踪表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for menus
-- ----------------------------
DROP TABLE IF EXISTS `menus`;
CREATE TABLE `menus`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '菜单名称',
  `path` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '路由路径',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图标名称',
  `sort` int NULL DEFAULT 0 COMMENT '排序号',
  `parent_id` int NULL DEFAULT NULL COMMENT '父菜单ID',
  `created_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `parent_id`(`parent_id` ASC) USING BTREE,
  CONSTRAINT `menus_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '菜单表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `order_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单编号',
  `payment_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '支付单号',
  `amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '买家实付金额',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单状态',
  `create_time` datetime NOT NULL COMMENT '订单创建时间',
  `merchant_remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '商家备注',
  `refund_amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '卖家实退金额',
  `fee` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '手续费',
  `channel` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '渠道（支付宝/企业微信）',
  `confirm_time` datetime NULL DEFAULT NULL COMMENT '确认收货时间',
  `merchant_payment` decimal(10, 2) NULL DEFAULT NULL COMMENT '打款商家金额',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  `customer_id` int NULL DEFAULT NULL COMMENT '订单对应客服',
  `writer_id` int NULL DEFAULT NULL COMMENT '订单对应写手',
  `writer_id_2` int NULL DEFAULT NULL COMMENT '第二个写手ID',
  `writer_fee` decimal(10, 2) NULL DEFAULT NULL COMMENT '第一个写手的稿费',
  `writer_fee_2` decimal(10, 2) NULL DEFAULT NULL COMMENT '第二个写手的稿费',
  `fee_per_1000` decimal(10, 2) NULL DEFAULT NULL COMMENT '每一千字/费用',
  `customer_commission` decimal(10, 2) NULL DEFAULT NULL COMMENT '客服佣金',
  PRIMARY KEY (`order_id`) USING BTREE,
  INDEX `idx_payment_id`(`payment_id` ASC) USING BTREE,
  INDEX `idx_create_time`(`create_time` ASC) USING BTREE,
  INDEX `idx_channel`(`channel` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `fk_customer`(`customer_id` ASC) USING BTREE,
  INDEX `fk_writer`(`writer_id` ASC) USING BTREE,
  INDEX `idx_writer_id_2`(`writer_id_2` ASC) USING BTREE,
  CONSTRAINT `fk_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_writer` FOREIGN KEY (`writer_id`) REFERENCES `writer_info` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_writer_2` FOREIGN KEY (`writer_id_2`) REFERENCES `writer_info` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单数据表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for orders_backup_wechat_refund_20250120
-- ----------------------------
DROP TABLE IF EXISTS `orders_backup_wechat_refund_20250120`;
CREATE TABLE `orders_backup_wechat_refund_20250120`  (
  `order_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单编号',
  `payment_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '支付单号',
  `amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '买家实付金额',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单状态',
  `create_time` datetime NOT NULL COMMENT '订单创建时间',
  `merchant_remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '商家备注',
  `refund_amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '卖家实退金额',
  `fee` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '手续费',
  `channel` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '渠道（支付宝/企业微信）',
  `confirm_time` datetime NULL DEFAULT NULL COMMENT '确认收货时间',
  `merchant_payment` decimal(10, 2) NULL DEFAULT NULL COMMENT '打款商家金额',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  `customer_id` int NULL DEFAULT NULL COMMENT '订单对应客服',
  `writer_id` int NULL DEFAULT NULL COMMENT '订单对应写手',
  `writer_id_2` int NULL DEFAULT NULL COMMENT '第二个写手ID'
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for role_menus
-- ----------------------------
DROP TABLE IF EXISTS `role_menus`;
CREATE TABLE `role_menus`  (
  `role_id` int NOT NULL COMMENT '角色ID',
  `menu_id` int NOT NULL COMMENT '菜单ID',
  `created_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`, `menu_id`) USING BTREE,
  INDEX `menu_id`(`menu_id` ASC) USING BTREE,
  CONSTRAINT `role_menus_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `role_menus_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '角色菜单关联表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `role_name`(`role_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `role_id` int NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` tinyint(1) NULL DEFAULT 1,
  `created_time` datetime NULL DEFAULT NULL,
  `last_login_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  INDEX `role_id`(`role_id` ASC) USING BTREE,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 136 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for writer_info
-- ----------------------------
DROP TABLE IF EXISTS `writer_info`;
CREATE TABLE `writer_info`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `writer_group` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `writer_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `form_date` date NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `education` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `major` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `writing_experience` enum('大学水平','在职水平','事业单位水平','淘宝老手','在职老师','期刊报告科研') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `specialized_content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `phone_1` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `phone_2` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `alipay_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `alipay_account` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `id_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `ip_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_time` datetime NULL DEFAULT NULL,
  `creation_date` date NULL DEFAULT NULL,
  `last_modified_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `last_modified_time` datetime NULL DEFAULT NULL,
  `time_taken_seconds` int NULL DEFAULT NULL,
  `starred` tinyint(1) NULL DEFAULT NULL,
  `processed` tinyint(1) NULL DEFAULT NULL,
  `apply_date` date NULL DEFAULT NULL COMMENT '申请日期',
  PRIMARY KEY (`id`, `writer_id`) USING BTREE,
  INDEX `id`(`id` ASC) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 83981 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for writer_ratings
-- ----------------------------
DROP TABLE IF EXISTS `writer_ratings`;
CREATE TABLE `writer_ratings`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `writer_id` int NOT NULL COMMENT '关联writer_info表的id',
  `score` decimal(3, 1) NOT NULL COMMENT '评分(1-10分)',
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '评价内容(必填)',
  `quality_inspector_id` int NOT NULL COMMENT '质检员ID',
  `rating_date` date NOT NULL COMMENT '评分日期',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_writer_date`(`writer_id` ASC, `rating_date` ASC) USING BTREE,
  INDEX `idx_writer_id`(`writer_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_quality_inspector_id`(`quality_inspector_id` ASC) USING BTREE,
  CONSTRAINT `fk_rating_inspector` FOREIGN KEY (`quality_inspector_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_rating_writer` FOREIGN KEY (`writer_id`) REFERENCES `writer_info` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '写手评分表' ROW_FORMAT = Dynamic;

-- 为 customer_orders 表添加结算相关标识字段
ALTER TABLE customer_orders
ADD COLUMN writer_settlement_exported TINYINT(1) DEFAULT 0 COMMENT '是否已导出写手打款(0-未导出,1-已导出)',
ADD COLUMN customer_settlement_exported TINYINT(1) DEFAULT 0 COMMENT '是否已导出客服打款(0-未导出,1-已导出)',
ADD COLUMN settlement_updated_by INT NULL COMMENT '结算状态更新人ID',
ADD COLUMN settlement_updated_at TIMESTAMP NULL COMMENT '结算状态更新时间';

-- 添加索引以提高查询性能
ALTER TABLE customer_orders
ADD INDEX idx_writer_settlement_exported (writer_settlement_exported),
ADD INDEX idx_customer_settlement_exported (customer_settlement_exported),
ADD INDEX idx_settlement_updated_by (settlement_updated_by);

-- 添加外键约束（可选，确保数据完整性）
ALTER TABLE customer_orders
ADD CONSTRAINT fk_settlement_updated_by
FOREIGN KEY (settlement_updated_by) REFERENCES `users` (`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- 性能优化索引：为定时任务查询优化
ALTER TABLE customer_orders
ADD INDEX idx_settlement_status_date (settlement_status, date),
ADD INDEX idx_is_fixed_settlement_status (is_fixed, settlement_status),
ADD INDEX idx_date_settlement_status (date, settlement_status);

SET FOREIGN_KEY_CHECKS = 1;
