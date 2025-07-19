/**
 * MySQL数据库配置
 */
const mysql = require('mysql2/promise');

class MySQLConfig {
    constructor() {
        this.config = {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '123456',  // MySQL密码
            database: 'douyin_analytics',
            charset: 'utf8mb4',
            timezone: '+08:00',
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        };
        
        this.pool = null;
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
}

module.exports = MySQLConfig;