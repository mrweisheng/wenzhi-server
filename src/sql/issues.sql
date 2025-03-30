-- 问题表
CREATE TABLE IF NOT EXISTS `issues` (
  `id` varchar(20) NOT NULL COMMENT '问题ID，格式为ISSUE-001',
  `title` varchar(255) NOT NULL COMMENT '问题标题',
  `status` enum('pending','processing','completed') NOT NULL DEFAULT 'pending' COMMENT '状态：待处理/处理中/已完成',
  `priority` enum('high','medium','low') NOT NULL DEFAULT 'medium' COMMENT '优先级：高/中/低',
  `description` text COMMENT '问题描述',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `deadline` datetime DEFAULT NULL COMMENT '截止时间',
  `assignee_id` int DEFAULT NULL COMMENT '负责人ID',
  `creator_id` int NOT NULL COMMENT '创建人ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_assignee` (`assignee_id`),
  KEY `idx_creator` (`creator_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_deadline` (`deadline`),
  CONSTRAINT `fk_issue_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_issue_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问题跟踪表';

-- 问题处理记录表
CREATE TABLE IF NOT EXISTS `issue_records` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `issue_id` varchar(20) NOT NULL COMMENT '所属问题ID',
  `content` text NOT NULL COMMENT '记录内容',
  `user_id` int NOT NULL COMMENT '创建用户ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_issue_id` (`issue_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_record_issue` FOREIGN KEY (`issue_id`) REFERENCES `issues` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_record_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问题处理记录表'; 