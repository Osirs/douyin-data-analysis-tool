-- 抖音数据推送及分析工具数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS douyin_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE douyin_analytics;

-- 员工信息表
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY COMMENT '员工ID',
    name VARCHAR(100) NOT NULL COMMENT '员工姓名',
    department VARCHAR(100) DEFAULT '' COMMENT '部门',
    position VARCHAR(100) DEFAULT '' COMMENT '职位',
    douyin_account VARCHAR(100) DEFAULT '' COMMENT '抖音账号',
    auth_status ENUM('pending', 'authorized', 'expired', 'revoked') DEFAULT 'pending' COMMENT '授权状态',
    fans_count BIGINT DEFAULT 0 COMMENT '粉丝数',
    like_count BIGINT DEFAULT 0 COMMENT '点赞数',
    comment_count BIGINT DEFAULT 0 COMMENT '评论数',
    share_count BIGINT DEFAULT 0 COMMENT '分享数',
    home_pv BIGINT DEFAULT 0 COMMENT '主页访问数',
    video_count INT DEFAULT 0 COMMENT '视频数量',
    last_sync_time TIMESTAMP NULL COMMENT '最后同步时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_auth_status (auth_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='员工信息表';

-- 授权令牌表
CREATE TABLE IF NOT EXISTS auth_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL COMMENT '员工ID',
    access_token TEXT COMMENT '访问令牌',
    refresh_token TEXT COMMENT '刷新令牌',
    expires_in INT DEFAULT 0 COMMENT '过期时间(秒)',
    refresh_expires_in INT DEFAULT 0 COMMENT '刷新令牌过期时间(秒)',
    scope VARCHAR(500) DEFAULT '' COMMENT '授权范围',
    open_id VARCHAR(100) DEFAULT '' COMMENT '用户openid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY uk_employee_id (employee_id),
    INDEX idx_open_id (open_id)
) ENGINE=InnoDB COMMENT='授权令牌表';

-- 用户数据表
CREATE TABLE IF NOT EXISTS user_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL COMMENT '员工ID',
    open_id VARCHAR(100) NOT NULL COMMENT '用户openid',
    nickname VARCHAR(200) DEFAULT '' COMMENT '昵称',
    avatar_url TEXT COMMENT '头像URL',
    fans_count BIGINT DEFAULT 0 COMMENT '粉丝数',
    following_count BIGINT DEFAULT 0 COMMENT '关注数',
    total_favorited BIGINT DEFAULT 0 COMMENT '获赞总数',
    like_count BIGINT DEFAULT 0 COMMENT '点赞数',
    comment_count BIGINT DEFAULT 0 COMMENT '评论数',
    share_count BIGINT DEFAULT 0 COMMENT '分享数',
    home_pv BIGINT DEFAULT 0 COMMENT '主页访问数',
    video_count INT DEFAULT 0 COMMENT '视频数量',
    data_date DATE NOT NULL COMMENT '数据日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY uk_employee_date (employee_id, data_date),
    INDEX idx_data_date (data_date),
    INDEX idx_open_id (open_id)
) ENGINE=InnoDB COMMENT='用户数据表';

-- 视频数据表
CREATE TABLE IF NOT EXISTS video_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL COMMENT '员工ID',
    item_id VARCHAR(100) NOT NULL COMMENT '视频ID',
    title TEXT COMMENT '视频标题',
    cover_url TEXT COMMENT '封面URL',
    play_count BIGINT DEFAULT 0 COMMENT '播放数',
    digg_count BIGINT DEFAULT 0 COMMENT '点赞数',
    comment_count BIGINT DEFAULT 0 COMMENT '评论数',
    share_count BIGINT DEFAULT 0 COMMENT '分享数',
    create_time TIMESTAMP NULL COMMENT '视频创建时间',
    data_date DATE NOT NULL COMMENT '数据日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY uk_item_date (item_id, data_date),
    INDEX idx_employee_id (employee_id),
    INDEX idx_data_date (data_date)
) ENGINE=InnoDB COMMENT='视频数据表';

-- 数据同步记录表
CREATE TABLE IF NOT EXISTS sync_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) COMMENT '员工ID（为空表示全量同步）',
    sync_type ENUM('manual', 'auto', 'scheduled') DEFAULT 'manual' COMMENT '同步类型',
    sync_status ENUM('pending', 'running', 'success', 'failed') DEFAULT 'pending' COMMENT '同步状态',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
    end_time TIMESTAMP NULL COMMENT '结束时间',
    success_count INT DEFAULT 0 COMMENT '成功数量',
    failed_count INT DEFAULT 0 COMMENT '失败数量',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_employee_id (employee_id),
    INDEX idx_sync_status (sync_status),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB COMMENT='数据同步记录表';

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(500) DEFAULT '' COMMENT '配置描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_config_key (config_key)
) ENGINE=InnoDB COMMENT='系统配置表';

-- 插入默认配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('last_sync_time', '', '最后同步时间'),
('auto_sync_enabled', 'false', '是否启用自动同步'),
('sync_interval', '3600', '同步间隔（秒）'),
('max_retry_count', '3', '最大重试次数')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- 用户视频统计表
CREATE TABLE IF NOT EXISTS user_video_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL COMMENT '员工ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    daily_publish_count INT DEFAULT 0 COMMENT '每日发布内容数',
    daily_new_play_count BIGINT DEFAULT 0 COMMENT '每日新增视频播放数',
    total_publish_count INT DEFAULT 0 COMMENT '总发布内容数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY uk_employee_stat_date (employee_id, stat_date),
    INDEX idx_stat_date (stat_date)
) ENGINE=InnoDB COMMENT='用户视频统计表';

-- 创建视图：员工数据概览
CREATE OR REPLACE VIEW employee_overview AS
SELECT 
    e.id,
    e.name,
    e.department,
    e.position,
    e.douyin_account,
    e.auth_status,
    e.fans_count,
    e.like_count,
    e.comment_count,
    e.share_count,
    e.home_pv,
    e.video_count,
    e.last_sync_time,
    e.created_at,
    e.updated_at
FROM employees e;

COMMIT;

SELECT 'Database initialization completed successfully!' as message;