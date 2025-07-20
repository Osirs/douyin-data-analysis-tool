/**
 * Node.js后端服务器
 * 提供API接口支持前端调用MySQL数据库
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const DatabaseManager = require('./database');
const DouyinAPI = require('./douyin_api');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 初始化数据库管理器
const dbManager = new DatabaseManager();
let isDbInitialized = false;

// 数据库初始化
async function initializeDatabase() {
    try {
        await dbManager.initialize();
        isDbInitialized = true;
        console.log('数据库连接成功');
    } catch (error) {
        console.error('数据库连接失败:', error);
        process.exit(1);
    }
}

// 确保数据库已初始化的中间件
function ensureDbInitialized(req, res, next) {
    if (!isDbInitialized) {
        return res.status(500).json({
            success: false,
            message: '数据库未初始化'
        });
    }
    next();
}

// ==================== 员工管理API ====================

// 获取所有员工
app.get('/api/employees', ensureDbInitialized, async (req, res) => {
    try {
        const employees = await dbManager.getAllEmployees();
        res.json({
            success: true,
            data: employees
        });
    } catch (error) {
        console.error('获取员工列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取员工列表失败: ' + error.message
        });
    }
});

// 添加员工
app.post('/api/employees', ensureDbInitialized, async (req, res) => {
    try {
        const { name, department, position, douyin_account } = req.body;
        
        if (!name || !douyin_account) {
            return res.status(400).json({
                success: false,
                message: '员工姓名和抖音账号不能为空'
            });
        }

        // 生成员工ID
        const employeeId = 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        
        const employee = await dbManager.addEmployee({
            id: employeeId,
            name,
            department: department || '',
            position: position || '',
            douyin_account
        });

        res.json({
            success: true,
            data: employee,
            message: '员工添加成功'
        });
    } catch (error) {
        console.error('添加员工失败:', error);
        res.status(500).json({
            success: false,
            message: '添加员工失败: ' + error.message
        });
    }
});

// 获取单个员工信息
app.get('/api/employees/:id', ensureDbInitialized, async (req, res) => {
    try {
        const { id } = req.params;
        
        const employee = await dbManager.getEmployee(id);
        
        if (employee) {
            res.json({
                success: true,
                data: employee
            });
        } else {
            res.status(404).json({
                success: false,
                message: '员工不存在'
            });
        }
    } catch (error) {
        console.error('获取员工信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取员工信息失败: ' + error.message
        });
    }
});

// 更新员工信息
app.put('/api/employees/:id', ensureDbInitialized, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const employee = await dbManager.updateEmployee(id, updates);
        
        res.json({
            success: true,
            data: employee,
            message: '员工信息更新成功'
        });
    } catch (error) {
        console.error('更新员工失败:', error);
        res.status(500).json({
            success: false,
            message: '更新员工失败: ' + error.message
        });
    }
});

// 删除员工
app.delete('/api/employees/:id', ensureDbInitialized, async (req, res) => {
    try {
        const { id } = req.params;
        
        const success = await dbManager.deleteEmployee(id);
        
        if (success) {
            res.json({
                success: true,
                message: '员工删除成功'
            });
        } else {
            res.status(404).json({
                success: false,
                message: '员工不存在'
            });
        }
    } catch (error) {
        console.error('删除员工失败:', error);
        res.status(500).json({
            success: false,
            message: '删除员工失败: ' + error.message
        });
    }
});

// ==================== 授权管理API ====================

// 授权回调处理
app.get('/auth/callback', async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;
        
        console.log('收到授权回调:', { code, state, error, error_description });
        
        if (error) {
            console.error('授权失败:', error, error_description);
            return res.redirect(`/?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`);
        }
        
        if (!code) {
            console.error('授权回调缺少code参数');
            return res.redirect('/?error=missing_code&error_description=授权回调缺少授权码');
        }
        
        // 重定向到主页面，并传递授权码和状态参数
        const redirectUrl = `/?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`;
        console.log('重定向到:', redirectUrl);
        res.redirect(redirectUrl);
        
    } catch (error) {
        console.error('处理授权回调失败:', error);
        res.redirect(`/?error=callback_error&error_description=${encodeURIComponent(error.message)}`);
    }
});

// 保存授权Token
app.post('/api/auth/token/:employeeId', ensureDbInitialized, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const tokenData = req.body;
        
        await dbManager.saveAuthToken(employeeId, tokenData);
        
        res.json({
            success: true,
            message: '授权Token保存成功'
        });
    } catch (error) {
        console.error('保存授权Token失败:', error);
        res.status(500).json({
            success: false,
            message: '保存授权Token失败: ' + error.message
        });
    }
});

// 获取授权Token
app.get('/api/auth/token/:employeeId', ensureDbInitialized, async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        const token = await dbManager.getAuthToken(employeeId);
        
        if (token) {
            res.json({
                success: true,
                data: token
            });
        } else {
            res.status(404).json({
                success: false,
                message: '未找到授权Token'
            });
        }
    } catch (error) {
        console.error('获取授权Token失败:', error);
        res.status(500).json({
            success: false,
            message: '获取授权Token失败: ' + error.message
        });
    }
});

// 获取授权Token (兼容前端调用路径)
app.get('/api/auth-tokens/:employeeId', ensureDbInitialized, async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        const token = await dbManager.getAuthToken(employeeId);
        
        if (token) {
            res.json({
                success: true,
                data: token
            });
        } else {
            res.status(404).json({
                success: false,
                message: '未找到授权Token'
            });
        }
    } catch (error) {
        console.error('获取授权Token失败:', error);
        res.status(500).json({
            success: false,
            message: '获取授权Token失败: ' + error.message
        });
    }
});

// 保存授权Token (兼容前端调用路径)
app.post('/api/auth-tokens', ensureDbInitialized, async (req, res) => {
    try {
        const { employeeId, tokenData } = req.body;
        
        await dbManager.saveAuthToken(employeeId, tokenData);
        
        res.json({
            success: true,
            message: '授权Token保存成功'
        });
    } catch (error) {
        console.error('保存授权Token失败:', error);
        res.status(500).json({
            success: false,
            message: '保存授权Token失败: ' + error.message
        });
    }
});

// 撤销授权
app.delete('/api/auth/token/:employeeId', ensureDbInitialized, async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        await dbManager.deleteAuthToken(employeeId);
        
        res.json({
            success: true,
            message: '授权撤销成功'
        });
    } catch (error) {
        console.error('撤销授权失败:', error);
        res.status(500).json({
            success: false,
            message: '撤销授权失败: ' + error.message
        });
    }
});

// ==================== 数据同步API ====================

// 手动同步数据
app.post('/api/sync/manual', ensureDbInitialized, async (req, res) => {
    try {
        const { employeeId } = req.body;
        
        // 创建同步记录
        const syncRecordId = await dbManager.createSyncRecord(employeeId, 'manual');
        
        let successCount = 0;
        let failedCount = 0;
        const errors = [];
        
        if (employeeId) {
            // 同步单个员工数据
            try {
                await syncEmployeeData(employeeId);
                successCount = 1;
            } catch (error) {
                failedCount = 1;
                errors.push(`员工${employeeId}: ${error.message}`);
            }
        } else {
            // 同步所有已授权员工数据
            const employees = await dbManager.getAllEmployees();
            const authorizedEmployees = employees.filter(emp => emp.auth_status === 'authorized');
            
            for (const employee of authorizedEmployees) {
                try {
                    await syncEmployeeData(employee.id);
                    successCount++;
                } catch (error) {
                    failedCount++;
                    errors.push(`员工${employee.name}(${employee.id}): ${error.message}`);
                }
            }
        }
        
        // 更新同步记录
        await dbManager.updateSyncRecord(syncRecordId, {
            sync_status: failedCount === 0 ? 'success' : 'failed',
            end_time: new Date().toISOString(),
            success_count: successCount,
            failed_count: failedCount,
            error_message: errors.join('; ')
        });
        
        // 更新最后同步时间
        if (successCount > 0) {
            await dbManager.updateLastSyncTime();
        }
        
        res.json({
            success: true,
            data: {
                syncRecordId,
                successCount,
                failedCount,
                errors
            },
            message: `同步完成：成功${successCount}个，失败${failedCount}个`
        });
    } catch (error) {
        console.error('数据同步失败:', error);
        res.status(500).json({
            success: false,
            message: '数据同步失败: ' + error.message
        });
    }
});

// 同步单个员工数据的辅助函数
async function syncEmployeeData(employeeId) {
    // 获取授权Token
    const tokenInfo = await dbManager.getAuthToken(employeeId);
    if (!tokenInfo) {
        throw new Error('未找到有效的授权Token');
    }
    
    // 创建API实例
    const douyinAPI = new DouyinAPI();
    
    try {
        // 获取用户基本信息
        const userInfo = await douyinAPI.getUserInfo(tokenInfo.access_token, tokenInfo.open_id);
        
        // 获取用户数据统计
        const userStats = await douyinAPI.getUserData(tokenInfo.access_token, tokenInfo.open_id);
        
        // 合并用户数据
        const userData = {
            open_id: tokenInfo.open_id,
            nickname: userInfo.nickname || '',
            avatar_url: userInfo.avatar || '',
            fans_count: userStats.fans_count || 0,
            following_count: userStats.following_count || 0,
            total_favorited: userStats.total_favorited || 0,
            video_count: userStats.video_count || 0
        };
        
        // 保存用户数据
        await dbManager.saveUserData(employeeId, userData);
        
        // 获取视频列表
        const videoList = await douyinAPI.getVideoList(tokenInfo.access_token, tokenInfo.open_id);
        if (videoList && videoList.length > 0) {
            await dbManager.saveVideoData(employeeId, videoList);
        }
        
        console.log(`员工${employeeId}数据同步成功`);
    } catch (error) {
        console.error(`员工${employeeId}数据同步失败:`, error);
        throw error;
    }
}

// 获取同步历史
app.get('/api/sync/history', ensureDbInitialized, async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        const history = await dbManager.getSyncHistory(parseInt(limit));
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('获取同步历史失败:', error);
        res.status(500).json({
            success: false,
            message: '获取同步历史失败: ' + error.message
        });
    }
});

// ==================== 数据查询API ====================

// 获取用户数据
app.get('/api/data/user/:employeeId', ensureDbInitialized, async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        const userData = await dbManager.getUserData(employeeId);
        
        if (userData) {
            res.json({
                success: true,
                data: userData
            });
        } else {
            res.status(404).json({
                success: false,
                message: '未找到用户数据'
            });
        }
    } catch (error) {
        console.error('获取用户数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户数据失败: ' + error.message
        });
    }
});

// 获取用户历史数据
app.get('/api/data/user/:employeeId/history', ensureDbInitialized, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { days = 30 } = req.query;
        
        const history = await dbManager.getUserDataHistory(employeeId, parseInt(days));
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('获取用户历史数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户历史数据失败: ' + error.message
        });
    }
});

// 获取视频数据
app.get('/api/data/video/:employeeId', ensureDbInitialized, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { limit = 50 } = req.query;
        
        const videoData = await dbManager.getVideoData(employeeId, parseInt(limit));
        
        res.json({
            success: true,
            data: videoData
        });
    } catch (error) {
        console.error('获取视频数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取视频数据失败: ' + error.message
        });
    }
});

// 获取数据统计
app.get('/api/statistics', ensureDbInitialized, async (req, res) => {
    try {
        const stats = await dbManager.getStatistics();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('获取数据统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取数据统计失败: ' + error.message
        });
    }
});

// ==================== 系统配置API ====================

// 获取配置
app.get('/api/config/:key', ensureDbInitialized, async (req, res) => {
    try {
        const { key } = req.params;
        
        const value = await dbManager.getConfig(key);
        
        res.json({
            success: true,
            data: { key, value }
        });
    } catch (error) {
        console.error('获取配置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取配置失败: ' + error.message
        });
    }
});

// 设置配置
app.post('/api/config', ensureDbInitialized, async (req, res) => {
    try {
        const { key, value } = req.body;
        
        await dbManager.setConfig(key, value);
        
        res.json({
            success: true,
            message: '配置保存成功'
        });
    } catch (error) {
        console.error('保存配置失败:', error);
        res.status(500).json({
            success: false,
            message: '保存配置失败: ' + error.message
        });
    }
});

// ==================== 抖音数据同步API ====================

// 手动同步数据
app.post('/api/sync/manual', ensureDbInitialized, async (req, res) => {
    try {
        const { employeeId } = req.body;
        
        // 创建抖音API实例
        const douyinAPI = new DouyinAPI();
        
        if (employeeId) {
            // 同步单个员工数据
            const result = await syncEmployeeData(employeeId, douyinAPI);
            res.json({
                success: true,
                data: result,
                message: '员工数据同步完成'
            });
        } else {
            // 同步所有已授权员工数据
            const employees = await dbManager.getAllEmployees();
            const authorizedEmployees = employees.filter(emp => emp.auth_status === 'authorized');
            
            const results = [];
            for (const employee of authorizedEmployees) {
                try {
                    const result = await syncEmployeeData(employee.id, douyinAPI);
                    results.push({ employeeId: employee.id, success: true, data: result });
                } catch (error) {
                    results.push({ employeeId: employee.id, success: false, error: error.message });
                }
            }
            
            res.json({
                success: true,
                data: results,
                message: `批量同步完成，共处理 ${results.length} 个员工`
            });
        }
    } catch (error) {
        console.error('数据同步失败:', error);
        res.status(500).json({
            success: false,
            message: '数据同步失败: ' + error.message
        });
    }
});

// 获取用户视频统计数据
app.get('/api/video-stats/:employeeId', ensureDbInitialized, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { days = 30 } = req.query;
        
        const stats = await dbManager.getUserVideoStats(employeeId, parseInt(days));
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('获取视频统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取视频统计失败: ' + error.message
        });
    }
});

// 同步单个员工数据的函数
async function syncEmployeeData(employeeId, douyinAPI) {
    try {
        // 获取员工的授权token
        const tokenData = await dbManager.getAuthToken(employeeId);
        if (!tokenData || !tokenData.access_token) {
            throw new Error('员工未授权或token已过期');
        }
        
        const { access_token, open_id } = tokenData;
        const results = {};
        
        // 1. 获取用户粉丝数
        try {
            const fansData = await douyinAPI.getUserFansCount(open_id, access_token);
            if (fansData.success) {
                results.fans_count = fansData.data.follower_count || 0;
            }
        } catch (error) {
            console.error('获取粉丝数失败:', error);
        }
        
        // 2. 获取用户点赞数
        try {
            const likeData = await douyinAPI.getUserLikeNumber(open_id, access_token);
            if (likeData.success) {
                results.like_count = likeData.data.like_count || 0;
            }
        } catch (error) {
            console.error('获取点赞数失败:', error);
        }
        
        // 3. 获取用户评论数
        try {
            const commentData = await douyinAPI.getUserCommentCount(open_id, access_token);
            if (commentData.success) {
                results.comment_count = commentData.data.comment_count || 0;
            }
        } catch (error) {
            console.error('获取评论数失败:', error);
        }
        
        // 4. 获取用户分享数
        try {
            const shareData = await douyinAPI.getUserShareCount(open_id, access_token);
            if (shareData.success) {
                results.share_count = shareData.data.share_count || 0;
            }
        } catch (error) {
            console.error('获取分享数失败:', error);
        }
        
        // 5. 获取主页访问数
        try {
            const pvData = await douyinAPI.getUserHomePv(open_id, access_token);
            if (pvData.success) {
                results.home_pv = pvData.data.pv_count || 0;
            }
        } catch (error) {
            console.error('获取主页访问数失败:', error);
        }
        
        // 6. 获取用户视频状态
        try {
            const videoStatusData = await douyinAPI.getUserVideoStatus(open_id, access_token);
            if (videoStatusData.success) {
                results.video_count = videoStatusData.data.video_count || 0;
                
                // 保存视频统计数据
                const today = new Date().toISOString().split('T')[0];
                await dbManager.saveUserVideoStats(employeeId, {
                    stat_date: today,
                    daily_publish_count: videoStatusData.data.daily_publish_count || 0,
                    daily_new_play_count: videoStatusData.data.daily_new_play_count || 0,
                    total_publish_count: videoStatusData.data.total_publish_count || 0
                });
            }
        } catch (error) {
            console.error('获取视频状态失败:', error);
        }
        
        // 更新员工表中的数据
        await dbManager.updateEmployee(employeeId, {
            ...results,
            last_sync_time: new Date()
        });
        
        // 保存用户数据历史记录
        await dbManager.saveUserData(employeeId, {
            open_id,
            ...results,
            data_date: new Date().toISOString().split('T')[0]
        });
        
        return results;
    } catch (error) {
        console.error(`同步员工 ${employeeId} 数据失败:`, error);
        throw error;
    }
}

// ==================== 数据导入导出API ====================

// 导出数据
app.get('/api/export', ensureDbInitialized, async (req, res) => {
    try {
        const data = await dbManager.exportAllData();
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=douyin_data_${Date.now()}.json`);
        res.json(data);
    } catch (error) {
        console.error('导出数据失败:', error);
        res.status(500).json({
            success: false,
            message: '导出数据失败: ' + error.message
        });
    }
});

// 清空数据
app.delete('/api/data/clear', ensureDbInitialized, async (req, res) => {
    try {
        await dbManager.clearAllData();
        
        res.json({
            success: true,
            message: '数据清空成功'
        });
    } catch (error) {
        console.error('清空数据失败:', error);
        res.status(500).json({
            success: false,
            message: '清空数据失败: ' + error.message
        });
    }
});

// ==================== 静态文件服务 ====================

// 主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 白名单授权页面
app.get('/whitelist-auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'whitelist_auth.html'));
});

// 授权配置说明文档
app.get('/auth-config-guide', (req, res) => {
    const fs = require('fs');
    const markdownPath = path.join(__dirname, '抖音授权配置说明.md');
    
    fs.readFile(markdownPath, 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('配置说明文档未找到');
            return;
        }
        
        // 简单的Markdown转HTML
        let html = data
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        const fullHtml = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>抖音授权配置说明</title>
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                h2 { color: #007bff; margin-top: 30px; }
                h3 { color: #28a745; }
                code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
                strong { color: #dc3545; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f8f9fa; }
                .back-btn { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-bottom: 20px; }
                .back-btn:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <a href="/whitelist-auth" class="back-btn">← 返回授权页面</a>
            ${html}
        </body>
        </html>`;
        
        res.send(fullHtml);
    });
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        database: isDbInitialized ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 启动服务器
async function startServer() {
    try {
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`服务器已启动，端口: ${PORT}`);
            console.log(`访问地址: http://localhost:${PORT}`);
            console.log(`健康检查: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n正在关闭服务器...');
    try {
        await dbManager.close();
        console.log('数据库连接已关闭');
        process.exit(0);
    } catch (error) {
        console.error('关闭服务器时出错:', error);
        process.exit(1);
    }
});

// 启动服务器
startServer();

module.exports = app;