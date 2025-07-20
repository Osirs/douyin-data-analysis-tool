/**
 * Node.js后端服务器
 * 提供API接口支持前端调用MySQL数据库
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const DatabaseManager = require('./config/database');
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

// 生成抖音授权URL
app.get('/api/auth/url', (req, res) => {
    try {
        const douyinAPI = new DouyinAPI();
        const authUrl = douyinAPI.generateAuthUrl();
        
        console.log('🔗 生成授权URL:', authUrl);
        
        res.json({
            success: true,
            data: {
                authUrl: authUrl
            },
            message: '授权URL生成成功'
        });
    } catch (error) {
        console.error('❌ 生成授权URL失败:', error);
        res.status(500).json({
            success: false,
            message: '生成授权URL失败: ' + error.message
        });
    }
});

// 通过授权码获取访问令牌
app.post('/api/auth/access-token', ensureDbInitialized, async (req, res) => {
    try {
        const { code, employeeId } = req.body;
        
        if (!code || !employeeId) {
            return res.status(400).json({
                success: false,
                message: '授权码和员工ID不能为空'
            });
        }
        
        console.log('🔄 开始获取访问令牌:', { code, employeeId });
        
        const douyinAPI = new DouyinAPI();
        const tokenResult = await douyinAPI.getAccessToken(code);
        
        if (tokenResult.success) {
            // 保存授权令牌到数据库
            await dbManager.saveAuthToken(employeeId, tokenResult.data);
            
            // 获取用户信息
            let userInfo = null;
            try {
                const userInfoResult = await douyinAPI.getUserInfo(tokenResult.data.open_id, tokenResult.data.access_token);
                if (userInfoResult.success) {
                    userInfo = userInfoResult.data;
                    console.log('✅ 用户信息获取成功:', userInfo.nickname);
                }
            } catch (userInfoError) {
                console.warn('⚠️ 获取用户信息失败:', userInfoError.message);
            }
            
            // 更新员工信息
            const updateData = {
                auth_status: 'authorized',
                access_token: tokenResult.data.access_token,
                refresh_token: tokenResult.data.refresh_token,
                open_id: tokenResult.data.open_id
            };
            
            if (userInfo) {
                updateData.nickname = userInfo.nickname;
                updateData.avatar = userInfo.avatar;
                updateData.followers_count = userInfo.followers_count || 0;
                updateData.total_favorited = userInfo.total_favorited || 0;
            }
            
            await dbManager.updateEmployee(employeeId, updateData);
            
            console.log('✅ 访问令牌获取并保存成功');
            
            res.json({
                success: true,
                data: {
                    ...tokenResult.data,
                    userInfo: userInfo
                },
                message: '授权成功'
            });
        } else {
            console.error('❌ 获取访问令牌失败:', tokenResult.message);
            res.status(400).json({
                success: false,
                message: '获取访问令牌失败: ' + tokenResult.message
            });
        }
    } catch (error) {
        console.error('❌ 授权处理失败:', error);
        res.status(500).json({
            success: false,
            message: '授权处理失败: ' + error.message
        });
    }
});

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
        console.log(`🔄 开始同步员工${employeeId}的数据`);
        
        // 获取用户基本信息
        const userInfoResult = await douyinAPI.getUserInfo(tokenInfo.open_id, tokenInfo.access_token);
        console.log('📥 用户基本信息:', userInfoResult);
        
        // 批量获取用户所有数据
        const allDataResult = await douyinAPI.getCompleteUserData(tokenInfo.open_id, tokenInfo.access_token, 1);
        console.log('📥 用户所有数据:', allDataResult);
        
        // 提取数据
        let userData = {
            open_id: tokenInfo.open_id,
            nickname: '',
            avatar_url: '',
            fans_count: 0,
            following_count: 0,
            total_favorited: 0,
            like_count: 0,
            comment_count: 0,
            share_count: 0,
            home_pv: 0,
            video_count: 0,
            data_date: new Date().toISOString().split('T')[0]
        };
        
        // 处理用户基本信息
        if (userInfoResult.success && userInfoResult.data) {
            userData.nickname = userInfoResult.data.nickname || '';
            userData.avatar_url = userInfoResult.data.avatar || '';
        }
        
        // 处理各项数据
        if (allDataResult.success && allDataResult.data) {
            const { videoStatus, fansData, likeData, commentData, shareData, profileData } = allDataResult.data;
            
            // 视频数据
            if (videoStatus && videoStatus.success && videoStatus.data) {
                userData.video_count = videoStatus.data.video_count || 0;
            }
            
            // 粉丝数据
            if (fansData && fansData.success && fansData.data) {
                userData.fans_count = fansData.data.fans_count || 0;
            }
            
            // 点赞数据
            if (likeData && likeData.success && likeData.data) {
                userData.like_count = likeData.data.like_count || 0;
            }
            
            // 评论数据
            if (commentData && commentData.success && commentData.data) {
                userData.comment_count = commentData.data.comment_count || 0;
            }
            
            // 分享数据
            if (shareData && shareData.success && shareData.data) {
                userData.share_count = shareData.data.share_count || 0;
            }
            
            // 主页访问数据
            if (profileData && profileData.success && profileData.data) {
                userData.home_pv = profileData.data.home_pv || 0;
            }
        }
        
        // 保存用户数据
        await dbManager.saveUserData(employeeId, userData);
        
        // 更新员工表中的统计数据
        await dbManager.updateEmployee(employeeId, {
            fans_count: userData.fans_count,
            like_count: userData.like_count,
            comment_count: userData.comment_count,
            share_count: userData.share_count,
            home_pv: userData.home_pv,
            video_count: userData.video_count,
            last_sync_time: new Date().toISOString()
        });
        
        // 获取视频列表
        const videoListResult = await douyinAPI.getUserVideoList(tokenInfo.open_id, tokenInfo.access_token, 50, 0);
        if (videoListResult.success && videoListResult.data && videoListResult.data.list) {
            await dbManager.saveVideoData(employeeId, videoListResult.data.list);
        }
        
        console.log(`✅ 员工${employeeId}数据同步成功`);
    } catch (error) {
        console.error(`❌ 员工${employeeId}数据同步失败:`, error);
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
        
        if (employeeId) {
            // 同步单个员工数据
            const result = await syncEmployeeData(employeeId);
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
                    const result = await syncEmployeeData(employee.id);
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

// 抖音授权回调处理
app.get('/auth/callback', (req, res) => {
    const { code, state } = req.query;
    
    if (code) {
        // 授权成功，显示授权码
        const html = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>授权成功</title>
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f8f9fa; }
                .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #28a745; text-align: center; margin-bottom: 30px; }
                .param-item { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745; }
                .param-name { font-weight: bold; color: #495057; margin-bottom: 5px; }
                .param-value { color: #666; font-family: monospace; word-break: break-all; background: white; padding: 10px; border-radius: 4px; }
                .note { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 20px 0; color: #155724; }
                .back-btn { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .back-btn:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✅ 抖音授权成功！</h1>
                <div class="param-item">
                    <div class="param-name">授权码 (Code):</div>
                    <div class="param-value">${code}</div>
                </div>
                <div class="param-item">
                    <div class="param-name">状态参数 (State):</div>
                    <div class="param-value">${state || 'N/A'}</div>
                </div>
                <div class="note">
                    <strong>🎉 下一步：</strong><br>
                    使用上述授权码调用 access_token 接口获取用户访问令牌。授权码有效期较短，请及时使用。
                </div>
                <a href="/" class="back-btn">← 返回主页</a>
                <a href="/douyin_auth.html" class="back-btn">重新授权</a>
            </div>
        </body>
        </html>`;
        
        res.send(html);
    } else {
        // 授权失败
        const error = req.query.error || '未知错误';
        const errorDescription = req.query.error_description || '授权过程中发生错误';
        
        const html = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>授权失败</title>
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f8f9fa; }
                .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #dc3545; text-align: center; margin-bottom: 30px; }
                .error-info { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin: 20px 0; color: #721c24; }
                .back-btn { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .back-btn:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>❌ 授权失败</h1>
                <div class="error-info">
                    <strong>错误类型：</strong> ${error}<br>
                    <strong>错误描述：</strong> ${errorDescription}
                </div>
                <a href="/douyin_auth.html" class="back-btn">重新授权</a>
                <a href="/" class="back-btn">返回主页</a>
            </div>
        </body>
        </html>`;
        
        res.send(html);
    }
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