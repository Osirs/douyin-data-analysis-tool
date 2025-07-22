/**
 * MySQL数据库管理器
 * 提供完整的数据库连接和操作功能
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseManager {
    constructor() {
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'douyin_analytics',
            charset: 'utf8mb4',
            timezone: '+08:00',
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        };
        
        this.pool = null;
        this.isInitialized = false;
        this.useMemoryStorage = false;
        this.memoryData = {
            employees: [],
            authTokens: {},
            userData: {}
        };
    }

    /**
     * 创建连接池（不指定数据库，用于创建数据库）
     */
    async createInitPool() {
        try {
            const initConfig = { ...this.config };
            delete initConfig.database; // 不指定数据库
            
            const initPool = mysql.createPool({
                ...initConfig,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
            
            console.log('MySQL初始化连接池创建成功');
            return initPool;
        } catch (error) {
            console.error('MySQL初始化连接池创建失败:', error);
            throw error;
        }
    }

    /**
     * 创建连接池
     */
    async createPool() {
        try {
            this.pool = mysql.createPool({
                ...this.config,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
            
            console.log('MySQL连接池创建成功');
            return this.pool;
        } catch (error) {
            console.error('MySQL连接池创建失败:', error);
            throw error;
        }
    }

    /**
     * 获取连接池
     */
    getPool() {
        if (!this.pool) {
            throw new Error('连接池未初始化，请先调用createPool()');
        }
        return this.pool;
    }

    /**
     * 测试数据库连接
     */
    async testConnection() {
        try {
            const connection = await this.getPool().getConnection();
            await connection.ping();
            connection.release();
            console.log('数据库连接测试成功');
            return true;
        } catch (error) {
            console.error('数据库连接测试失败:', error);
            return false;
        }
    }

    /**
     * 关闭连接池
     */
    async closePool() {
        if (this.pool) {
            await this.pool.end();
            console.log('MySQL连接池已关闭');
        }
    }

    /**
     * 初始化数据库
     */
    async initialize() {
        try {
            await this.createTablesIfNotExists();
            this.isInitialized = true;
            console.log('数据库管理器初始化成功');
            return true;
        } catch (error) {
            console.error('MySQL数据库连接失败，切换到内存存储模式:', error.message);
            this.useMemoryStorage = true;
            this.isInitialized = true;
            console.log('已切换到内存存储模式，数据将在重启后丢失');
            return true;
        }
    }

    /**
     * 创建数据库表（如果不存在）
     */
    async createTablesIfNotExists() {
        try {
            // 使用初始化连接池创建数据库
            const initPool = await this.createInitPool();
            await initPool.execute('CREATE DATABASE IF NOT EXISTS douyin_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            await initPool.end();
            
            // 现在使用正常的连接池（包含数据库名）进行表操作
            this.pool = await this.createPool();
            
            // 创建员工表
            const createEmployeesTable = `
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
                ) ENGINE=InnoDB COMMENT='员工信息表'
            `;
            await this.pool.execute(createEmployeesTable);
            
            // 创建授权令牌表
            const createAuthTokensTable = `
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
                ) ENGINE=InnoDB COMMENT='授权令牌表'
            `;
            await this.pool.execute(createAuthTokensTable);
            
            // 创建用户数据表
            const createUserDataTable = `
                CREATE TABLE IF NOT EXISTS user_data (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id VARCHAR(50) NOT NULL COMMENT '员工ID',
                    data_type ENUM('fans', 'like', 'comment', 'share', 'home_pv', 'video') NOT NULL COMMENT '数据类型',
                    data_value BIGINT DEFAULT 0 COMMENT '数据值',
                    data_date DATE NOT NULL COMMENT '数据日期',
                    raw_data JSON COMMENT '原始数据',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                    UNIQUE KEY uk_employee_type_date (employee_id, data_type, data_date),
                    INDEX idx_data_date (data_date)
                ) ENGINE=InnoDB COMMENT='用户数据表'
            `;
            await this.pool.execute(createUserDataTable);
            
            console.log('数据库表结构初始化完成');
        } catch (error) {
            console.error('创建数据库表失败:', error);
            throw error;
        }
    }

    /**
     * 执行SQL查询
     */
    async query(sql, params = []) {
        if (this.useMemoryStorage) {
            throw new Error('内存存储模式不支持SQL查询');
        }
        
        if (!this.isInitialized || !this.pool) {
            throw new Error('数据库未初始化，请先调用initialize()');
        }
        
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('SQL查询失败:', error);
            throw error;
        }
    }

    // ==================== 员工管理 ====================

    /**
     * 添加员工
     */
    async addEmployee(employee) {
        const { id, name, department = '', position = '', douyin_account = '' } = employee;
        
        if (this.useMemoryStorage) {
            // 检查员工是否已存在
            const existing = this.memoryData.employees.find(emp => emp.id === id);
            if (existing) {
                throw new Error(`员工ID ${id} 已存在`);
            }
            
            const newEmployee = {
                id, name, department, position, douyin_account,
                auth_status: 'pending',
                fans_count: 0, like_count: 0, comment_count: 0,
                share_count: 0, home_pv: 0, video_count: 0,
                last_sync_time: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.memoryData.employees.push(newEmployee);
            return newEmployee;
        }
        
        // 检查员工是否已存在
        const existing = await this.getEmployee(id);
        if (existing) {
            throw new Error(`员工ID ${id} 已存在`);
        }

        const sql = `
            INSERT INTO employees (id, name, department, position, douyin_account, auth_status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `;
        
        await this.query(sql, [id, name, department, position, douyin_account]);
        return await this.getEmployee(id);
    }

    /**
     * 获取员工信息
     */
    async getEmployee(employeeId) {
        if (this.useMemoryStorage) {
            return this.memoryData.employees.find(emp => emp.id === employeeId) || null;
        }
        
        const sql = 'SELECT * FROM employees WHERE id = ?';
        const rows = await this.query(sql, [employeeId]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * 获取所有员工
     */
    async getAllEmployees() {
        if (this.useMemoryStorage) {
            return [...this.memoryData.employees].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        
        const sql = 'SELECT * FROM employees ORDER BY created_at DESC';
        return await this.query(sql);
    }

    /**
     * 更新员工信息
     */
    async updateEmployee(employeeId, updates) {
        if (this.useMemoryStorage) {
            const employee = this.memoryData.employees.find(emp => emp.id === employeeId);
            if (!employee) {
                throw new Error(`员工ID ${employeeId} 不存在`);
            }
            
            Object.assign(employee, updates, { updated_at: new Date().toISOString() });
            return employee;
        }
        
        const allowedFields = [
            'name', 'department', 'position', 'douyin_account', 'auth_status',
            'fans_count', 'like_count', 'comment_count', 'share_count', 
            'home_pv', 'video_count', 'last_sync_time'
        ];
        const updateFields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        if (updateFields.length === 0) {
            throw new Error('没有有效的更新字段');
        }

        values.push(employeeId);
        const sql = `UPDATE employees SET ${updateFields.join(', ')} WHERE id = ?`;
        
        await this.query(sql, values);
        return await this.getEmployee(employeeId);
    }

    /**
     * 删除员工
     */
    async deleteEmployee(employeeId) {
        if (this.useMemoryStorage) {
            const index = this.memoryData.employees.findIndex(emp => emp.id === employeeId);
            if (index === -1) return false;
            
            this.memoryData.employees.splice(index, 1);
            delete this.memoryData.authTokens[employeeId];
            delete this.memoryData.userData[employeeId];
            return true;
        }
        
        const sql = 'DELETE FROM employees WHERE id = ?';
        const result = await this.query(sql, [employeeId]);
        return result.affectedRows > 0;
    }

    // ==================== 授权Token管理 ====================

    /**
     * 保存授权Token
     */
    async saveAuthToken(employeeId, tokenData) {
        const {
            access_token = null,
            refresh_token = null,
            expires_in = 0,
            refresh_expires_in = 0,
            scope = '',
            open_id = ''
        } = tokenData;

        if (this.useMemoryStorage) {
            this.memoryData.authTokens[employeeId] = {
                employee_id: employeeId,
                access_token, refresh_token, expires_in, refresh_expires_in,
                scope, open_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // 更新员工授权状态
            await this.updateEmployee(employeeId, { auth_status: 'authorized' });
            return true;
        }

        const sql = `
            INSERT INTO auth_tokens 
            (employee_id, access_token, refresh_token, expires_in, refresh_expires_in, scope, open_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            access_token = VALUES(access_token),
            refresh_token = VALUES(refresh_token),
            expires_in = VALUES(expires_in),
            refresh_expires_in = VALUES(refresh_expires_in),
            scope = VALUES(scope),
            open_id = VALUES(open_id),
            updated_at = CURRENT_TIMESTAMP
        `;

        await this.query(sql, [
            employeeId, access_token, refresh_token, 
            expires_in, refresh_expires_in, scope, open_id
        ]);

        // 更新员工授权状态
        await this.updateEmployee(employeeId, { auth_status: 'authorized' });
        
        return true;
    }

    /**
     * 获取授权Token
     */
    async getAuthToken(employeeId) {
        if (this.useMemoryStorage) {
            return this.memoryData.authTokens[employeeId] || null;
        }
        
        const sql = 'SELECT * FROM auth_tokens WHERE employee_id = ?';
        const rows = await this.query(sql, [employeeId]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * 删除授权Token
     */
    async deleteAuthToken(employeeId) {
        if (this.useMemoryStorage) {
            delete this.memoryData.authTokens[employeeId];
            await this.updateEmployee(employeeId, { auth_status: 'revoked' });
            return true;
        }
        
        const sql = 'DELETE FROM auth_tokens WHERE employee_id = ?';
        await this.query(sql, [employeeId]);
        
        // 更新员工授权状态
        await this.updateEmployee(employeeId, { auth_status: 'revoked' });
        
        return true;
    }

    // ==================== 用户数据管理 ====================

    /**
     * 保存用户数据
     */
    async saveUserData(employeeId, userData) {
        const today = new Date().toISOString().split('T')[0];
        
        if (this.useMemoryStorage) {
            if (!this.memoryData.userData[employeeId]) {
                this.memoryData.userData[employeeId] = [];
            }
            
            this.memoryData.userData[employeeId].push({
                ...userData,
                data_date: today,
                created_at: new Date().toISOString()
            });
            
            return true;
        }
        
        const sql = `
            INSERT INTO user_data 
            (employee_id, open_id, nickname, avatar_url, fans_count, following_count, 
             total_favorited, like_count, comment_count, share_count, home_pv, video_count, data_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.query(sql, [
            employeeId, userData.open_id || '', userData.nickname || '', userData.avatar_url || '',
            userData.fans_count || 0, userData.following_count || 0, userData.total_favorited || 0,
            userData.like_count || 0, userData.comment_count || 0, userData.share_count || 0,
            userData.home_pv || 0, userData.video_count || 0, userData.data_date || today
        ]);

        return true;
    }

    /**
     * 获取用户数据
     */
    async getUserData(employeeId) {
        if (this.useMemoryStorage) {
            const userData = this.memoryData.userData[employeeId] || [];
            return userData.length > 0 ? userData[userData.length - 1] : null;
        }
        
        const sql = 'SELECT * FROM user_data WHERE employee_id = ? ORDER BY created_at DESC LIMIT 1';
        const rows = await this.query(sql, [employeeId]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * 获取用户历史数据
     */
    async getUserDataHistory(employeeId, days = 30) {
        if (this.useMemoryStorage) {
            const userData = this.memoryData.userData[employeeId] || [];
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            return userData.filter(data => new Date(data.created_at) >= cutoffDate);
        }
        
        const sql = `
            SELECT * FROM user_data 
            WHERE employee_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY created_at DESC
        `;
        return await this.query(sql, [employeeId, days]);
    }

    /**
     * 保存视频数据
     */
    async saveVideoData(employeeId, videoList) {
        if (this.useMemoryStorage) {
            if (!this.memoryData.videoData) {
                this.memoryData.videoData = {};
            }
            if (!this.memoryData.videoData[employeeId]) {
                this.memoryData.videoData[employeeId] = [];
            }
            this.memoryData.videoData[employeeId] = videoList;
            return true;
        }
        
        // 清除旧数据
        await this.query('DELETE FROM video_data WHERE employee_id = ?', [employeeId]);
        
        // 插入新数据
        for (const video of videoList) {
            const sql = `
                INSERT INTO video_data 
                (employee_id, video_id, title, cover_url, play_count, like_count, 
                 comment_count, share_count, create_time, duration)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            await this.query(sql, [
                employeeId,
                video.item_id || '',
                video.title || '',
                video.cover || '',
                video.statistics?.play_count || 0,
                video.statistics?.digg_count || 0,
                video.statistics?.comment_count || 0,
                video.statistics?.share_count || 0,
                video.create_time || new Date().toISOString(),
                video.duration || 0
            ]);
        }
        
        return true;
    }

    /**
     * 获取视频数据
     */
    async getVideoData(employeeId, limit = 50) {
        if (this.useMemoryStorage) {
            const videoData = this.memoryData.videoData?.[employeeId] || [];
            return videoData.slice(0, limit);
        }
        
        const sql = `
            SELECT * FROM video_data 
            WHERE employee_id = ? 
            ORDER BY create_time DESC 
            LIMIT ?
        `;
        return await this.query(sql, [employeeId, limit]);
    }

    /**
     * 保存用户视频统计数据
     */
    async saveUserVideoStats(employeeId, statsData) {
        if (this.useMemoryStorage) {
            if (!this.memoryData.videoStats) {
                this.memoryData.videoStats = {};
            }
            if (!this.memoryData.videoStats[employeeId]) {
                this.memoryData.videoStats[employeeId] = [];
            }
            this.memoryData.videoStats[employeeId].push({
                ...statsData,
                created_at: new Date().toISOString()
            });
            return true;
        }
        
        const sql = `
            INSERT INTO user_video_stats 
            (employee_id, stat_date, daily_publish_count, daily_new_play_count, total_publish_count)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            daily_publish_count = VALUES(daily_publish_count),
            daily_new_play_count = VALUES(daily_new_play_count),
            total_publish_count = VALUES(total_publish_count)
        `;
        
        await this.query(sql, [
            employeeId,
            statsData.stat_date,
            statsData.daily_publish_count || 0,
            statsData.daily_new_play_count || 0,
            statsData.total_publish_count || 0
        ]);
        
        return true;
    }

    /**
     * 获取用户视频统计数据
     */
    async getUserVideoStats(employeeId, days = 30) {
        if (this.useMemoryStorage) {
            const statsData = this.memoryData.videoStats?.[employeeId] || [];
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            return statsData.filter(data => new Date(data.created_at) >= cutoffDate);
        }
        
        const sql = `
            SELECT * FROM user_video_stats 
            WHERE employee_id = ? AND stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ORDER BY stat_date DESC
        `;
        return await this.query(sql, [employeeId, days]);
    }

    /**
     * 创建同步记录
     */
    async createSyncRecord(employeeId, syncType) {
        if (this.useMemoryStorage) {
            const syncId = Date.now().toString();
            if (!this.memoryData.syncRecords) {
                this.memoryData.syncRecords = [];
            }
            this.memoryData.syncRecords.push({
                id: syncId,
                employee_id: employeeId,
                sync_type: syncType,
                sync_status: 'running',
                start_time: new Date().toISOString(),
                end_time: null,
                success_count: 0,
                failed_count: 0,
                error_message: null
            });
            return syncId;
        }
        
        const sql = `
            INSERT INTO sync_records 
            (employee_id, sync_type, sync_status, start_time)
            VALUES (?, ?, 'running', NOW())
        `;
        
        const result = await this.query(sql, [employeeId, syncType]);
        return result.insertId;
    }

    /**
     * 更新同步记录
     */
    async updateSyncRecord(syncId, updates) {
        if (this.useMemoryStorage) {
            const record = this.memoryData.syncRecords?.find(r => r.id === syncId);
            if (record) {
                Object.assign(record, updates);
            }
            return true;
        }
        
        const updateFields = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updates)) {
            updateFields.push(`${key} = ?`);
            values.push(value);
        }
        
        if (updateFields.length === 0) return false;
        
        values.push(syncId);
        const sql = `UPDATE sync_records SET ${updateFields.join(', ')} WHERE id = ?`;
        
        await this.query(sql, values);
        return true;
    }

    /**
     * 获取同步历史
     */
    async getSyncHistory(limit = 20) {
        if (this.useMemoryStorage) {
            const records = this.memoryData.syncRecords || [];
            return records.slice(-limit).reverse();
        }
        
        const sql = `
            SELECT * FROM sync_records 
            ORDER BY start_time DESC 
            LIMIT ?
        `;
        return await this.query(sql, [limit]);
    }

    /**
     * 更新最后同步时间
     */
    async updateLastSyncTime() {
        if (this.useMemoryStorage) {
            this.memoryData.lastSyncTime = new Date().toISOString();
            return true;
        }
        
        const sql = `
            INSERT INTO system_config (config_key, config_value) 
            VALUES ('last_sync_time', NOW()) 
            ON DUPLICATE KEY UPDATE config_value = NOW()
        `;
        
        await this.query(sql);
        return true;
    }

    /**
     * 获取统计数据
     */
    async getStatistics() {
        if (this.useMemoryStorage) {
            const employees = this.memoryData.employees || [];
            const authorizedCount = employees.filter(emp => emp.auth_status === 'authorized').length;
            const totalFans = employees.reduce((sum, emp) => sum + (emp.fans_count || 0), 0);
            const totalVideos = employees.reduce((sum, emp) => sum + (emp.video_count || 0), 0);
            
            return {
                total_employees: employees.length,
                authorized_employees: authorizedCount,
                total_fans: totalFans,
                total_videos: totalVideos,
                last_sync_time: this.memoryData.lastSyncTime || null
            };
        }
        
        const sql = `
            SELECT 
                COUNT(*) as total_employees,
                SUM(CASE WHEN auth_status = 'authorized' THEN 1 ELSE 0 END) as authorized_employees,
                SUM(fans_count) as total_fans,
                SUM(video_count) as total_videos
            FROM employees
        `;
        
        const rows = await this.query(sql);
        const stats = rows[0] || {};
        
        // 获取最后同步时间
        const syncTimeRows = await this.query(
            "SELECT config_value FROM system_config WHERE config_key = 'last_sync_time'"
        );
        
        stats.last_sync_time = syncTimeRows.length > 0 ? syncTimeRows[0].config_value : null;
        
        return stats;
    }

    /**
     * 获取配置
     */
    async getConfig(key) {
        if (this.useMemoryStorage) {
            return this.memoryData.config?.[key] || null;
        }
        
        const sql = 'SELECT config_value FROM system_config WHERE config_key = ?';
        const rows = await this.query(sql, [key]);
        return rows.length > 0 ? rows[0].config_value : null;
    }

    /**
     * 设置配置
     */
    async setConfig(key, value) {
        if (this.useMemoryStorage) {
            if (!this.memoryData.config) {
                this.memoryData.config = {};
            }
            this.memoryData.config[key] = value;
            return true;
        }
        
        const sql = `
            INSERT INTO system_config (config_key, config_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
        `;
        
        await this.query(sql, [key, value]);
        return true;
    }

    /**
     * 导出所有数据
     */
    async exportAllData() {
        if (this.useMemoryStorage) {
            return this.memoryData;
        }
        
        const data = {
            employees: await this.query('SELECT * FROM employees'),
            auth_tokens: await this.query('SELECT * FROM auth_tokens'),
            user_data: await this.query('SELECT * FROM user_data'),
            video_data: await this.query('SELECT * FROM video_data'),
            user_video_stats: await this.query('SELECT * FROM user_video_stats'),
            sync_records: await this.query('SELECT * FROM sync_records'),
            system_config: await this.query('SELECT * FROM system_config')
        };
        
        return data;
    }

    /**
     * 清空所有数据
     */
    async clearAllData() {
        if (this.useMemoryStorage) {
            this.memoryData = {
                employees: [],
                authTokens: {},
                userData: {},
                videoData: {},
                videoStats: {},
                syncRecords: [],
                config: {},
                lastSyncTime: null
            };
            return true;
        }
        
        const tables = [
            'user_video_stats',
            'video_data', 
            'user_data',
            'sync_records',
            'auth_tokens',
            'employees',
            'system_config'
        ];
        
        for (const table of tables) {
            await this.query(`DELETE FROM ${table}`);
        }
        
        return true;
    }
}

module.exports = DatabaseManager;