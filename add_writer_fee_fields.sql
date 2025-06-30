-- 为订单总表添加写手佣金字段
ALTER TABLE `orders` 
ADD COLUMN `writer_fee` decimal(10, 2) NULL DEFAULT NULL COMMENT '第一个写手的稿费' AFTER `writer_id_2`,
ADD COLUMN `writer_fee_2` decimal(10, 2) NULL DEFAULT NULL COMMENT '第二个写手的稿费' AFTER `writer_fee`; 