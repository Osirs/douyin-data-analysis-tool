/**
 * MySQL数据库管理器
 * 替换原有的localStorage实现，提供完整的数据库操作功能
 */
const MySQLConfig = require('./config/database');

class DatabaseManager {
    constructor() {
        this.dbConfig = new MySQLConfig();
        this.pool = null;
        this.isInitialized = false;
    }

    /**
     * 初始化数据库连接
     */
    async initialize() {
        try {
            this.pool = await this.dbConfig.createPool();
            this.isInitialized = true;
            console.log('数据库管理器初始化成功');
            return true;
        } catch (error) {
            console.error('数据库管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 确保数据库已初始化
     */
    ensureInitialized() {
        if (!this.isInitialized || !this.pool) {
            throw new Error('数据库未初始化，请先调用initialize()');
        }
    }

    /**
     * 执行SQL查询
     */
    async query(sql, params = []) {
        this.ensureInitialized();
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
        const sql = 'SELECT * FROM employees WHERE id = ?';
        const rows = await this.query(sql, [employeeId]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * 获取所有员工
     */
    async getAllEmployees() {
        const sql = 'SELECT * FROM employee_overview ORDER BY created_at DESC';
        return await this.query(sql);
    }

    /**
     * 更新员工信息
     */
    async updateEmployee(employeeId, updates) {
        const allowedFields = ['name', 'department', 'position', 'douyin_account', 'auth_status'];
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
        const sql = 'SELECT * FROM auth_tokens WHERE employee_id = ?';
        const rows = await this.query(sql, [employeeId]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * 删除授权Token
     */
    async deleteAuthToken(employeeId) {
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
        // 处理新的数据结构（包含同步结果）
        if (userData.sync_results) {
            // 新的同步数据格式
            const {
                sync_time = new Date().toISOString(),
                sync_results = {},
                fans_data = {},
                like_data = {},
                comment_data = {},
                share_data = {},
                home_pv_data = {},
                video_status_data = {}
            } = userData;

            // 保存详细的同步数据到JSON字段
            const detailSql = `
                INSERT INTO user_sync_details 
                (employee_id, sync_time, sync_results, fans_data, like_data, 
                 comment_data, share_data, home_pv_data, video_status_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                sync_results = VALUES(sync_results),
                fans_data = VALUES(fans_data),
                like_data = VALUES(like_data),
                comment_data = VALUES(comment_data),
                share_data = VALUES(share_data),
                home_pv_data = VALUES(home_pv_data),
                video_status_data = VALUES(video_status_data)
            `;

            try {
                await this.query(detailSql, [
                    employeeId, 
                    sync_time,
                    JSON.stringify(sync_results),
                    JSON.stringify(fans_data),
                    JSON.stringify(like_data),
                    JSON.stringify(comment_data),
                    JSON.stringify(share_data),
                    JSON.stringify(home_pv_data),
                    JSON.stringify(video_status_data)
                ]);
            } catch (error) {
                // 如果表不存在，创建表
                if (error.code === 'ER_NO_SUCH_TABLE') {
                    await this.createUserSyncDetailsTable();
                    // 重试插入
                    await this.query(detailSql, [
                        employeeId, 
                        sync_time,
                        JSON.stringify(sync_results),
                        JSON.stringify(fans_data),
                        JSON.stringify(like_data),
                        JSON.stringify(comment_data),
                        JSON.stringify(share_data),
                        JSON.stringify(home_pv_data),
                        JSON.stringify(video_status_data)
                    ]);
                } else {
                    throw error;
                }
            }

            return true;
        }

        // 处理传统的用户数据格式
        const {
            open_id = '',
            nickname = '',
            avatar_url = '',
            fans_count = 0,
            following_count = 0,
            total_favorited = 0,
            video_count = 0
        } = userData;

        const today = new Date().toISOString().split('T')[0];
        
        const sql = `
            INSERT INTO user_data 
            (employee_id, open_id, nickname, avatar_url, fans_count, 
             following_count, total_favorited, video_count, data_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            nickname = VALUES(nickname),
            avatar_url = VALUES(avatar_url),
            fans_count = VALUES(fans_count),
            following_count = VALUES(following_count),
            total_favorited = VALUES(total_favorited),
            video_count = VALUES(video_count)
        `;

        await this.query(sql, [
            employeeId, open_id, nickname, avatar_url,
            fans_count, following_count, total_favorited, video_count, today
        ]);

        return true;
    }

    /**
     * 创建用户同步详情表
     */
    async createUserSyncDetailsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS user_sync_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                sync_time DATETIME NOT NULL,
                sync_results JSON,
                fans_data JSON,
                like_data JSON,
                comment_data JSON,
                share_data JSON,
                home_pv_data JSON,
                video_status_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_employee_sync (employee_id, sync_time),
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await this.query(sql);
        return true;
    }

    /**
     * 获取用户最新数据
     */
    async getUserData(employeeId) {
        const sql = `
            SELECT * FROM user_data 
            WHERE employee_id = ? 
            ORDER BY data_date DESC 
            LIMIT 1
        `;
        const rows = await this.query(sql, [employeeId]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * 获取用户历史数据
     */
    async getUserDataHistory(employeeId, days = 30) {
        const sql = `
            SELECT * FROM user_data 
            WHERE employee_id = ? AND data_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ORDER BY data_date DESC
        `;
        return await this.query(sql, [employeeId, days]);
    }

    // ==================== 视频数据管理 ====================

    /**
     * 保存视频数据
     */
    async saveVideoData(employeeId, videoList) {
        if (!Array.isArray(videoList) || videoList.length === 0) {
            return true;
        }

        const today = new Date().toISOString().split('T')[0];
        const values = [];
        const placeholders = [];

        videoList.forEach(video => {
            const {
                item_id,
                title = '',
                cover_url = '',
                play_count = 0,
                digg_count = 0,
                comment_count = 0,
                share_count = 0,
                create_time = null
            } = video;

            placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            values.push(
                employeeId, item_id, title, cover_url,
                play_count, digg_count, comment_count, share_count,
                create_time, today
            );
        });

        const sql = `
            INSERT INTO video_data 
            (employee_id, item_id, title, cover_url, play_count, 
             digg_count, comment_count, share_count, create_time, data_date)
            VALUES ${placeholders.join(', ')}
            ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            cover_url = VALUES(cover_url),
            play_count = VALUES(play_count),
            digg_count = VALUES(digg_count),
            comment_count = VALUES(comment_count),
            share_count = VALUES(share_count)
        `;

        await this.query(sql, values);
        return true;
    }

    /**
     * 获取视频数据
     */
    async getVideoData(employeeId, limit = 50) {
        const sql = `
            SELECT * FROM video_data 
            WHERE employee_id = ? 
            ORDER BY data_date DESC, create_time DESC 
            LIMIT ?
        `;
        return await this.query(sql, [employeeId, limit]);
    }

    /**
     * 保存用户视频统计数据
     */
    async saveUserVideoStats(employeeId, statsData) {
        const {
            stat_date,
            daily_publish_count = 0,
            daily_new_play_count = 0,
            total_publish_count = 0
        } = statsData;

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
            employeeId, stat_date, daily_publish_count, 
            daily_new_play_count, total_publish_count
        ]);

        return true;
    }

    /**
     * 获取用户视频统计数据
     */
    async getUserVideoStats(employeeId, days = 30) {
        const sql = `
            SELECT * FROM user_video_stats 
            WHERE employee_id = ? AND stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ORDER BY stat_date DESC
        `;
        return await this.query(sql, [employeeId, days]);
    }

    // ==================== 同步记录管理 ====================

    /**
     * 创建同步记录
     */
    async createSyncRecord(employeeId = null, syncType = 'manual') {
        const sql = `
            INSERT INTO sync_records (employee_id, sync_type, sync_status)
            VALUES (?, ?, 'running')
        `;
        const result = await this.query(sql, [employeeId, syncType]);
        return result.insertId;
    }

    /**
     * 更新同步记录
     */
    async updateSyncRecord(recordId, updates) {
        const allowedFields = ['sync_status', 'end_time', 'success_count', 'failed_count', 'error_message'];
        const updateFields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        if (updateFields.length === 0) {
            return false;
        }

        values.push(recordId);
        const sql = `UPDATE sync_records SET ${updateFields.join(', ')} WHERE id = ?`;
        
        await this.query(sql, values);
        return true;
    }

    /**
     * 获取同步历史
     */
    async getSyncHistory(limit = 20) {
        const sql = `
            SELECT sr.*, e.name as employee_name
            FROM sync_records sr
            LEFT JOIN employees e ON sr.employee_id = e.id
            ORDER BY sr.start_time DESC
            LIMIT ?
        `;
        return await this.query(sql, [limit]);
    }

    // ==================== 系统配置管理 ====================

    /**
     * 获取配置
     */
    async getConfig(key) {
        const sql = 'SELECT config_value FROM system_config WHERE config_key = ?';
        const rows = await this.query(sql, [key]);
        return rows.length > 0 ? rows[0].config_value : null;
    }

    /**
     * 设置配置
     */
    async setConfig(key, value) {
        const sql = `
            INSERT INTO system_config (config_key, config_value)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
        `;
        await this.query(sql, [key, value]);
        return true;
    }

    /**
     * 更新最后同步时间
     */
    async updateLastSyncTime() {
        const now = new Date().toISOString();
        return await this.setConfig('last_sync_time', now);
    }

    /**
     * 获取最后同步时间
     */
    async getLastSyncTime() {
        const time = await this.getConfig('last_sync_time');
        return time ? new Date(time) : null;
    }

    // ==================== 数据统计 ====================

    /**
     * 获取数据统计
     */
    async getStatistics() {
        const stats = {};

        // 员工总数
        const employeeCount = await this.query('SELECT COUNT(*) as count FROM employees');
        stats.totalEmployees = employeeCount[0].count;

        // 已授权员工数
        const authorizedCount = await this.query(
            "SELECT COUNT(*) as count FROM employees WHERE auth_status = 'authorized'"
        );
        stats.authorizedEmployees = authorizedCount[0].count;

        // 今日数据更新数
        const todayUpdates = await this.query(
            'SELECT COUNT(*) as count FROM user_data WHERE data_date = CURDATE()'
        );
        stats.todayUpdates = todayUpdates[0].count;

        // 最后同步时间
        stats.lastSyncTime = await this.getLastSyncTime();

        return stats;
    }

    // ==================== 数据导入导出 ====================

    /**
     * 导出所有数据
     */
    async exportAllData() {
        const data = {
            employees: await this.getAllEmployees(),
            auth_tokens: await this.query('SELECT * FROM auth_tokens'),
            user_data: await this.query('SELECT * FROM user_data ORDER BY data_date DESC'),
            video_data: await this.query('SELECT * FROM video_data ORDER BY data_date DESC LIMIT 1000'),
            sync_records: await this.getSyncHistory(100),
            system_config: await this.query('SELECT * FROM system_config'),
            export_time: new Date().toISOString()
        };
        
        return data;
    }

    /**
     * 清空所有数据
     */
    async clearAllData() {
        const tables = ['sync_records', 'video_data', 'user_data', 'auth_tokens', 'employees'];
        
        for (const table of tables) {
            await this.query(`DELETE FROM ${table}`);
        }
        
        // 重置系统配置
        await this.setConfig('last_sync_time', '');
        
        return true;
    }

    /**
     * 关闭数据库连接
     */
    async close() {
        if (this.pool) {
            await this.dbConfig.closePool();
            this.isInitialized = false;
        }
    }
}

// 创建全局实例
const dbManager = new DatabaseManager();

// 浏览器环境兼容性处理
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseManager;
} else if (typeof window !== 'undefined') {
    window.DatabaseManager = DatabaseManager;
    window.dbManager = dbManager;
}