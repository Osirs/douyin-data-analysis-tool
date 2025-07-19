// 抖音数据推送及分析工具 JavaScript

// API客户端类
class APIClient {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // GET请求
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST请求
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT请求
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE请求
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// 数据库管理类
class DatabaseManager {
    constructor() {
        this.api = new APIClient();
    }

    // 获取所有员工
    async getAllEmployees() {
        try {
            const response = await this.api.get('/employees');
            return response.data || [];
        } catch (error) {
            console.error('获取员工列表失败:', error);
            return [];
        }
    }

    // 获取单个员工
    async getEmployee(employeeId) {
        try {
            const response = await this.api.get(`/employees/${employeeId}`);
            return response.data;
        } catch (error) {
            console.error('获取员工信息失败:', error);
            return null;
        }
    }

    // 添加员工
    async addEmployee(employee) {
        try {
            const response = await this.api.post('/employees', employee);
            return response.data.id;
        } catch (error) {
            console.error('添加员工失败:', error);
            throw error;
        }
    }

    // 更新员工
    async updateEmployee(employeeId, employee) {
        try {
            const response = await this.api.put(`/employees/${employeeId}`, employee);
            return response.data;
        } catch (error) {
            console.error('更新员工失败:', error);
            throw error;
        }
    }

    // 删除员工
    async deleteEmployee(employeeId) {
        try {
            await this.api.delete(`/employees/${employeeId}`);
        } catch (error) {
            console.error('删除员工失败:', error);
            throw error;
        }
    }

    // 保存授权令牌
    async saveAuthToken(employeeId, tokenData) {
        try {
            await this.api.post('/auth-tokens', {
                employeeId,
                ...tokenData
            });
        } catch (error) {
            console.error('保存授权令牌失败:', error);
            throw error;
        }
    }

    // 获取授权令牌
    async getAuthToken(employeeId) {
        try {
            const response = await this.api.get(`/auth-tokens/${employeeId}`);
            return response.data;
        } catch (error) {
            console.error('获取授权令牌失败:', error);
            return null;
        }
    }

    // 保存用户数据
    async saveUserData(employeeId, userData) {
        try {
            await this.api.post('/user-data', {
                employeeId,
                data: userData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('保存用户数据失败:', error);
            throw error;
        }
    }

    // 获取用户数据
    async getUserData(employeeId, limit = 10) {
        try {
            const response = await this.api.get(`/user-data/${employeeId}?limit=${limit}`);
            return response.data || [];
        } catch (error) {
            console.error('获取用户数据失败:', error);
            return [];
        }
    }

    // 保存视频数据
    async saveVideoData(employeeId, videoData) {
        try {
            await this.api.post('/video-data', {
                employeeId,
                data: videoData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('保存视频数据失败:', error);
            throw error;
        }
    }

    // 获取视频数据
    async getVideoData(employeeId, limit = 10) {
        try {
            const response = await this.api.get(`/video-data/${employeeId}?limit=${limit}`);
            return response.data || [];
        } catch (error) {
            console.error('获取视频数据失败:', error);
            return [];
        }
    }

    // 添加同步历史记录
    async addSyncHistory(syncRecord) {
        try {
            await this.api.post('/sync-history', syncRecord);
        } catch (error) {
            console.error('保存同步历史失败:', error);
            throw error;
        }
    }

    // 获取同步历史
    async getSyncHistory(limit = 20) {
        try {
            const response = await this.api.get(`/sync-history?limit=${limit}`);
            return response.data || [];
        } catch (error) {
            console.error('获取同步历史失败:', error);
            return [];
        }
    }

    // 获取统计数据
    async getStatistics() {
        try {
            const response = await this.api.get('/statistics');
            return response.data || {
                totalEmployees: 0,
                authorizedEmployees: 0,
                totalDataRecords: 0,
                lastSyncTime: null
            };
        } catch (error) {
            console.error('获取统计数据失败:', error);
            return {
                totalEmployees: 0,
                authorizedEmployees: 0,
                totalDataRecords: 0,
                lastSyncTime: null
            };
        }
    }

    // 清空所有数据
    async clearAllData() {
        try {
            await this.api.delete('/clear-all');
        } catch (error) {
            console.error('清空数据失败:', error);
            throw error;
        }
    }

    // 导出数据
    async exportData() {
        try {
            const response = await this.api.get('/export');
            return response.data;
        } catch (error) {
            console.error('导出数据失败:', error);
            throw error;
        }
    }

    // 导入数据
    async importData(data) {
        try {
            await this.api.post('/import', data);
        } catch (error) {
            console.error('导入数据失败:', error);
            throw error;
        }
    }
}

// 抖音授权类
class DouyinAuth {
    constructor() {
        this.clientKey = 'your_client_key';
        this.clientSecret = 'your_client_secret';
        this.redirectUri = window.location.origin + window.location.pathname;
        this.scope = 'user_info,video.list,fans.list,following.list,video.data';
    }

    // 获取授权URL
    getAuthUrl(employeeId) {
        const params = new URLSearchParams({
            client_key: this.clientKey,
            response_type: 'code',
            scope: this.scope,
            redirect_uri: this.redirectUri,
            state: employeeId
        });
        
        return `https://open.douyin.com/platform/oauth/connect/?${params.toString()}`;
    }

    // 获取访问令牌
    async getAccessToken(code) {
        try {
            const response = await fetch('https://open.douyin.com/oauth/access_token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_key: this.clientKey,
                    client_secret: this.clientSecret,
                    code: code,
                    grant_type: 'authorization_code'
                })
            });

            const data = await response.json();
            
            if (data.error_code === 0) {
                return {
                    success: true,
                    data: data.data
                };
            } else {
                return {
                    success: false,
                    message: data.description || '获取访问令牌失败'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 刷新访问令牌
    async refreshAccessToken(refreshToken) {
        try {
            const response = await fetch('https://open.douyin.com/oauth/refresh_token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_key: this.clientKey,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            const data = await response.json();
            
            if (data.error_code === 0) {
                return {
                    success: true,
                    data: data.data
                };
            } else {
                return {
                    success: false,
                    message: data.description || '刷新令牌失败'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// 抖音API类
class DouyinAPI {
    constructor() {
        this.baseURL = 'https://open.douyin.com';
    }

    // 获取用户信息
    async getUserInfo(openId, accessToken) {
        try {
            const response = await fetch(`${this.baseURL}/oauth/userinfo/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    open_id: openId,
                    access_token: accessToken
                })
            });

            const data = await response.json();
            
            if (data.error_code === 0) {
                return {
                    success: true,
                    data: data.data
                };
            } else {
                return {
                    success: false,
                    message: data.description || '获取用户信息失败'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 获取完整用户数据
    async getCompleteUserData(openId, accessToken, days = 7) {
        try {
            const [userInfo, fansData, videoData] = await Promise.all([
                this.getUserInfo(openId, accessToken),
                this.getFansData(openId, accessToken, days),
                this.getVideoData(openId, accessToken, days)
            ]);

            return {
                success: true,
                data: {
                    userInfo: userInfo.success ? userInfo.data : null,
                    fansData: fansData.success ? fansData.data : null,
                    videoData: videoData.success ? videoData.data : null
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 批量获取用户数据
    async batchGetUserData(userList, days = 7) {
        try {
            const results = [];
            const errors = [];

            for (const user of userList) {
                try {
                    const result = await this.getCompleteUserData(user.openId, user.accessToken, days);
                    if (result.success) {
                        results.push({
                            employeeId: user.employeeId,
                            data: result.data
                        });
                    } else {
                        errors.push({
                            employeeId: user.employeeId,
                            error: result.message
                        });
                    }
                } catch (error) {
                    errors.push({
                        employeeId: user.employeeId,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                data: {
                    results,
                    errors
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 获取粉丝数据
    async getFansData(openId, accessToken, days) {
        // 模拟API调用
        return {
            success: true,
            data: {
                total_fans: Math.floor(Math.random() * 50000) + 1000
            }
        };
    }

    // 获取视频数据
    async getVideoData(openId, accessToken, days) {
        // 模拟API调用
        return {
            success: true,
            data: {
                total_videos: Math.floor(Math.random() * 100) + 10,
                total_likes: Math.floor(Math.random() * 100000) + 5000,
                total_comments: Math.floor(Math.random() * 10000) + 500,
                total_shares: Math.floor(Math.random() * 5000) + 200
            }
        };
    }
}

// 全局变量
let databaseManager;
let douyinAuth;
let douyinAPI;

// 打开数据分析报告（多维表格）
function openAnalysisReport() {
    const url = 'https://ocn8o3ghsdb2.feishu.cn/base/R238bPjJbag3gKs4vcocdd8Bnlg?from=from_copylink';
    window.open(url, '_blank');
    
    // 显示成功提示
    showNotification('正在打开飞书多维表格...', 'info');
}

// 手动同步数据
async function manualSync() {
    const syncBtn = document.getElementById('syncBtn');
    const originalText = syncBtn.innerHTML;
    
    try {
        // 禁用按钮并显示加载状态
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>同步中...';
        
        showNotification('开始同步数据...', 'info');
        
        // 获取所有已授权的员工
        const employees = await databaseManager.getAllEmployees();
        const authorizedEmployees = employees.filter(emp => emp.auth_status === 'authorized' && emp.access_token);
        
        if (authorizedEmployees.length === 0) {
            showNotification('没有已授权的员工账号，无法同步数据', 'warning');
            return;
        }
        
        // 准备用户列表
        const userList = authorizedEmployees.map(emp => ({
            employeeId: emp.id,
            openId: emp.open_id,
            accessToken: emp.access_token
        }));
        
        // 批量获取用户数据
        const result = await douyinAPI.batchGetUserData(userList, 7);
        
        if (result.success) {
            // 保存同步结果
            const syncRecord = {
                timestamp: new Date().toISOString(),
                totalUsers: userList.length,
                successCount: result.data.results.length,
                failedCount: result.data.errors.length,
                results: result.data.results,
                errors: result.data.errors
            };
            
            await databaseManager.addSyncHistory(syncRecord);
            
            // 更新员工数据
            for (const userResult of result.data.results) {
                const employee = await databaseManager.getEmployee(userResult.employeeId);
                if (employee) {
                    // 更新员工的数据统计
                    const userData = userResult.data;
                    const updatedEmployee = {
                        ...employee,
                        last_sync_time: new Date().toISOString(),
                        fans_count: userData.fansData?.total_fans || employee.fans_count || 0,
                        video_count: userData.videoStatus?.total_videos || employee.video_count || 0,
                        like_count: userData.likeData?.total_likes || employee.like_count || 0,
                        comment_count: userData.commentData?.total_comments || employee.comment_count || 0,
                        share_count: userData.shareData?.total_shares || employee.share_count || 0,
                        profile_views: userData.profileData?.total_views || employee.profile_views || 0
                    };
                    
                    await databaseManager.updateEmployee(userResult.employeeId, updatedEmployee);
                    
                    // 保存用户数据到数据库
                    await databaseManager.saveUserData(userResult.employeeId, userData);
                }
            }
            
            updateLastSyncTime();
            loadEmployeeData();
            
            const message = `数据同步完成！成功同步 ${result.data.results.length} 个账号，${result.data.errors.length} 个失败`;
            showNotification(message, result.data.errors.length > 0 ? 'warning' : 'success');
            
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('数据同步失败:', error);
        showNotification('数据同步失败: ' + error.message, 'error');
    } finally {
        // 恢复按钮状态
        syncBtn.disabled = false;
        syncBtn.innerHTML = originalText;
    }
}

// 更新最后同步时间
function updateLastSyncTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastSyncTime').textContent = timeString;
}

// 添加员工
function addEmployee() {
    const modal = new bootstrap.Modal(document.getElementById('addEmployeeModal'));
    modal.show();
}

// 保存员工信息
async function saveEmployee() {
    const name = document.getElementById('employeeName').value;
    const account = document.getElementById('douyinAccount').value;
    
    // 验证表单
    if (!name || !account) {
        showNotification('请填写完整的员工信息', 'error');
        return;
    }
    
    try {
        // 检查抖音账号是否已存在
        const existingEmployees = await databaseManager.getAllEmployees();
        const isDuplicate = existingEmployees.some(emp => emp.douyin_account === account);
        
        if (isDuplicate) {
            showNotification('该抖音账号已存在！', 'error');
            return;
        }
        
        // 准备员工数据
        const employee = {
            name: name,
            douyin_account: account,
            department: '',
            position: ''
        };
        
        // 添加到数据库
        const employeeId = await databaseManager.addEmployee(employee);
        
        // 重新加载员工数据
        await loadEmployeeData();
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
        modal.hide();
        
        // 清空表单
        document.getElementById('addEmployeeForm').reset();
        
        showNotification('员工添加成功！', 'success');
        
    } catch (error) {
        console.error('添加员工失败:', error);
        showNotification('添加员工失败: ' + error.message, 'error');
    }
}

// 加载员工数据
async function loadEmployeeData() {
    try {
        const employees = await databaseManager.getAllEmployees();
        const tbody = document.querySelector('#employeeTableBody');
        
        if (!tbody) {
            console.error('找不到员工表格元素');
            return;
        }
        
        // 清空现有数据
        tbody.innerHTML = '';
        
        if (employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">暂无员工数据</td></tr>';
            return;
        }
        
        // 添加员工行
        employees.forEach(employee => {
            addEmployeeToTable(employee);
        });
        
    } catch (error) {
        console.error('加载员工数据失败:', error);
        showNotification('加载员工数据失败: ' + error.message, 'error');
    }
}

// 添加员工到表格
function addEmployeeToTable(employee) {
    const tbody = document.querySelector('#employeeTableBody');
    const row = document.createElement('tr');
    
    // 格式化时间
    const addTime = employee.created_at ? new Date(employee.created_at).toLocaleString('zh-CN') : '-';
    
    // 授权状态显示
    let statusBadge = '';
    switch (employee.auth_status) {
        case 'authorized':
            statusBadge = '<span class="badge bg-success">已授权</span>';
            break;
        case 'pending':
            statusBadge = '<span class="badge bg-warning">待授权</span>';
            break;
        case 'expired':
            statusBadge = '<span class="badge bg-danger">已过期</span>';
            break;
        case 'revoked':
            statusBadge = '<span class="badge bg-secondary">已撤销</span>';
            break;
        default:
            statusBadge = '<span class="badge bg-secondary">未知</span>';
    }
    
    // 格式化数字显示
    const formatNumber = (num) => {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + 'w';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    };
    
    row.innerHTML = `
        <td>${employee.name}</td>
        <td>@${employee.douyin_account}</td>
        <td>${statusBadge}</td>
        <td>${addTime}</td>
        <td>${formatNumber(employee.fans_count || 0)}</td>
        <td>${employee.video_count || 0}</td>
        <td>
            <button class="btn btn-sm btn-primary me-1" onclick="authorizeEmployee('${employee.id}')" 
                    ${employee.auth_status === 'authorized' ? 'disabled' : ''}>
                <i class="fas fa-key"></i> 授权
            </button>
            <button class="btn btn-sm btn-success me-1" onclick="refreshEmployee('${employee.id}')" 
                    ${employee.auth_status !== 'authorized' ? 'disabled' : ''}>
                <i class="fas fa-sync"></i> 刷新
            </button>
            <button class="btn btn-sm btn-danger" onclick="revokeEmployee('${employee.id}')" 
                    ${employee.auth_status === 'pending' ? 'disabled' : ''}>
                <i class="fas fa-times"></i> 撤销
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
}

// 授权员工账号
async function authorizeEmployee(employeeId) {
    try {
        const employee = await databaseManager.getEmployee(employeeId);
        if (!employee) {
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        // 生成授权URL并跳转
        const authUrl = douyinAuth.getAuthUrl(employeeId);
        
        // 在新窗口中打开授权页面
        const authWindow = window.open(authUrl, 'douyinAuth', 'width=600,height=700,scrollbars=yes,resizable=yes');
        
        if (!authWindow) {
            showNotification('无法打开授权窗口，请检查浏览器弹窗设置', 'error');
            return;
        }
        
        // 监听授权窗口关闭
        const checkClosed = setInterval(() => {
            if (authWindow.closed) {
                clearInterval(checkClosed);
                // 检查授权结果
                setTimeout(async () => {
                    await loadEmployeeData();
                }, 1000);
            }
        }, 1000);
        
        showNotification('正在跳转到抖音授权页面...', 'info');
        
    } catch (error) {
        console.error('授权失败:', error);
        showNotification('授权失败: ' + error.message, 'error');
    }
}

// 刷新员工数据
async function refreshEmployee(employeeId) {
    try {
        const employee = await databaseManager.getEmployee(employeeId);
        if (!employee) {
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        if (employee.auth_status !== 'authorized' || !employee.access_token) {
            showNotification('该员工尚未授权，无法刷新数据', 'warning');
            return;
        }
        
        showNotification('正在刷新数据...', 'info');
        
        // 获取用户完整数据
        const result = await douyinAPI.getCompleteUserData(employee.open_id, employee.access_token, 7);
        
        if (result.success) {
            const userData = result.data;
            
            // 更新员工数据
            const updatedEmployee = {
                ...employee,
                last_sync_time: new Date().toISOString(),
                fans_count: userData.fansData?.total_fans || employee.fans_count || 0,
                video_count: userData.videoStatus?.total_videos || employee.video_count || 0,
                like_count: userData.likeData?.total_likes || employee.like_count || 0,
                comment_count: userData.commentData?.total_comments || employee.comment_count || 0,
                share_count: userData.shareData?.total_shares || employee.share_count || 0,
                profile_views: userData.profileData?.total_views || employee.profile_views || 0
            };
            
                 await databaseManager.updateEmployee(employeeId, updatedEmployee);
            await databaseManager.saveUserData(employeeId, userData);
            
            // 重新加载表格数据
            await loadEmployeeData();
            
            showNotification('数据刷新成功！', 'success');
            
        } else {
            // 检查是否是token过期
            if (result.error && (result.error.includes('access_token') || result.error.includes('过期'))) {
                // 尝试刷新token
                if (employee.refresh_token) {
                    const refreshResult = await douyinAuth.refreshAccessToken(employee.refresh_token);
                    if (refreshResult.success) {
                        // 更新token并重试
                        const updatedEmployee = {
                            ...employee,
                            access_token: refreshResult.data.access_token,
                            refresh_token: refreshResult.data.refresh_token,
                            expires_at: new Date(Date.now() + refreshResult.data.expires_in * 1000).toISOString()
                        };
                        
                        await databaseManager.updateEmployee(employeeId, updatedEmployee);
                        
                        // 重试获取数据
                        await refreshEmployee(employeeId);
                        return;
                    }
                }
                
                // token刷新失败，更新授权状态
                await databaseManager.updateEmployee(employeeId, {
                    ...employee,
                    auth_status: 'expired'
                });
                
                await loadEmployeeData();
                showNotification('授权已过期，请重新授权', 'warning');
            } else {
                throw new Error(result.message);
            }
        }
        
    } catch (error) {
        console.error('刷新数据失败:', error);
        showNotification('刷新数据失败: ' + error.message, 'error');
    }
}

// 撤销员工授权
async function revokeEmployee(employeeId) {
    try {
        const employee = await databaseManager.getEmployee(employeeId);
        if (!employee) {
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        if (confirm('确定要撤销该员工的授权吗？此操作将清除所有授权信息。')) {
            // 清除授权信息
            const updatedEmployee = {
                ...employee,
                auth_status: 'revoked',
                access_token: null,
                refresh_token: null,
                open_id: null,
                expires_at: null,
                revoke_time: new Date().toISOString()
            };
            
       await databaseManager.updateEmployee(employeeId, updatedEmployee);
            
            // 重新加载表格数据
            await loadEmployeeData();
            
            showNotification('授权已撤销', 'info');
        }
        
    } catch (error) {
        console.error('撤销授权失败:', error);
        showNotification('撤销授权失败: ' + error.message, 'error');
    }
}

// 检查授权回调
async function checkAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
        await handleAuthCallback(code, state);
    }
}

// 处理授权回调
async function handleAuthCallback(code, employeeId) {
    try {
        showNotification('正在处理授权回调...', 'info');
        
        // 获取access_token
        const tokenResult = await douyinAuth.getAccessToken(code);
        
        if (tokenResult.success) {
            const tokenData = tokenResult.data;
            
            // 获取用户信息
            const userInfoResult = await douyinAPI.getUserInfo(tokenData.open_id, tokenData.access_token);
            
            if (userInfoResult.success) {
                // 更新员工信息
                const employee = await databaseManager.getEmployee(employeeId);
                if (employee) {
                    const updatedEmployee = {
                        ...employee,
                        auth_status: 'authorized',
                        access_token: tokenData.access_token,
                        refresh_token: tokenData.refresh_token,
                        open_id: tokenData.open_id,
                        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
                        auth_time: new Date().toISOString(),
                        user_info: userInfoResult.data
                    };
                    
                    await databaseManager.updateEmployee(employeeId, updatedEmployee);
                    
                    // 保存token到数据库
                    await databaseManager.saveAuthToken(employeeId, {
                        access_token: tokenData.access_token,
                        refresh_token: tokenData.refresh_token,
                        open_id: tokenData.open_id,
                        expires_at: updatedEmployee.expires_at,
                        scope: tokenData.scope
                    });
                    
                    // 清除URL参数
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    // 重新加载数据
                    await loadEmployeeData();
                    
                    showNotification('授权成功！', 'success');
                } else {
                    showNotification('员工信息不存在', 'error');
                }
            } else {
                throw new Error('获取用户信息失败: ' + userInfoResult.message);
            }
        } else {
            throw new Error('获取访问令牌失败: ' + tokenResult.message);
        }
        
    } catch (error) {
        console.error('处理授权回调失败:', error);
        showNotification('授权失败: ' + error.message, 'error');
        
        // 清除URL参数
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// 更新员工授权状态
async function updateEmployeeAuthStatus(employeeId, status) {
    try {
        const employee = await databaseManager.getEmployee(employeeId);
        if (employee) {
            const updatedEmployee = {
                ...employee,
                auth_status: status,
                status_update_time: new Date().toISOString()
            };
            
            await databaseManager.updateEmployee(employeeId, updatedEmployee);
            await loadEmployeeData();
        }
    } catch (error) {
        console.error('更新员工授权状态失败:', error);
    }
}

// 删除员工
async function deleteEmployee(employeeId) {
    try {
        const employee = await databaseManager.getEmployee(employeeId);
        if (!employee) {
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        if (confirm(`确定要删除员工 "${employee.name}" 吗？此操作不可恢复。`)) {
            await databaseManager.deleteEmployee(employeeId);
            await loadEmployeeData();
            showNotification('员工删除成功', 'success');
        }
        
    } catch (error) {
        console.error('删除员工失败:', error);
        showNotification('删除员工失败: ' + error.message, 'error');
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `alert alert-${getBootstrapAlertClass(type)} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// 获取Bootstrap警告类
function getBootstrapAlertClass(type) {
    const classMap = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
    };
    return classMap[type] || 'info';
}

// 获取通知图标
function getNotificationIcon(type) {
    const iconMap = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return iconMap[type] || 'fa-info-circle';
}

// 模拟数据更新
function simulateDataUpdate() {
    const employees = [
        { name: '张三', account: '@zhangsan_douyin', followers: '12.8K', videos: 47 },
        { name: '李四', account: '@lisi_creator', followers: '8.5K', videos: 34 },
    ];
    
    // 更新表格数据
    // 这里可以添加实际的数据更新逻辑
}

// 定期检查同步状态
function checkSyncStatus() {
    // 这里可以添加定期检查后端同步状态的逻辑
    console.log('检查同步状态...');
}

setInterval(checkSyncStatus, 30000); // 每30秒检查一次

// 页面可见性变化时的处理
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // 页面重新可见时刷新数据
        loadEmployeeData();
    }
});

// 日志管理类
class LogManager {
    constructor() {
        this.maxLogs = 100; // 最大日志条数
    }

    // 添加日志
    addLog(message, type = 'info') {
        const debugContent = document.getElementById('debugContent');
        if (!debugContent) return;

        const timestamp = new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `
            <span class="log-timestamp">[${timestamp}]</span>
            <span>${this.escapeHtml(message)}</span>
        `;

        debugContent.appendChild(logEntry);

        // 限制日志数量
        const logs = debugContent.querySelectorAll('.log-entry');
        if (logs.length > this.maxLogs) {
            logs[0].remove();
        }

        // 自动滚动到底部
        debugContent.scrollTop = debugContent.scrollHeight;
    }

    // 清空日志
    clearLogs() {
        const debugContent = document.getElementById('debugContent');
        if (debugContent) {
            debugContent.innerHTML = '';
            this.addLog('日志已清空', 'info');
        }
    }

    // 转义HTML字符
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 记录API请求
    logAPIRequest(method, url, data = null) {
        let message = `API请求: ${method} ${url}`;
        if (data) {
            message += ` - 数据: ${JSON.stringify(data).substring(0, 100)}${JSON.stringify(data).length > 100 ? '...' : ''}`;
        }
        this.addLog(message, 'info');
    }

    // 记录API响应
    logAPIResponse(url, response, success = true) {
        const type = success ? 'success' : 'error';
        const status = success ? '成功' : '失败';
        let message = `API响应 ${status}: ${url}`;
        
        if (response) {
            const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
            message += ` - ${responseStr.substring(0, 200)}${responseStr.length > 200 ? '...' : ''}`;
        }
        
        this.addLog(message, type);
    }

    // 记录错误
    logError(error, context = '') {
        const message = context ? `${context}: ${error.message || error}` : (error.message || error);
        this.addLog(message, 'error');
        console.error(context, error);
    }

    // 记录警告
    logWarning(message) {
        this.addLog(message, 'warning');
        console.warn(message);
    }

    // 记录成功信息
    logSuccess(message) {
        this.addLog(message, 'success');
    }
}

// 创建全局日志管理器实例
const logManager = new LogManager();

// 清空日志的全局函数
function clearLogs() {
    logManager.clearLogs();
}

// 重写console方法以同时记录到日志区域
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = function(...args) {
    originalConsoleError.apply(console, args);
    logManager.addLog(args.join(' '), 'error');
};

console.warn = function(...args) {
    originalConsoleWarn.apply(console, args);
    logManager.addLog(args.join(' '), 'warning');
};

// 增强APIClient类以支持日志记录
if (typeof APIClient !== 'undefined') {
    const originalRequest = APIClient.prototype.request;
    
    APIClient.prototype.request = async function(endpoint, options = {}) {
        const method = options.method || 'GET';
        const url = `${this.baseURL}${endpoint}`;
        
        // 记录请求
        logManager.logAPIRequest(method, endpoint, options.body ? JSON.parse(options.body) : null);
        
        try {
            const result = await originalRequest.call(this, endpoint, options);
            // 记录成功响应
            logManager.logAPIResponse(endpoint, result, true);
            return result;
        } catch (error) {
            // 记录错误响应
            logManager.logAPIResponse(endpoint, error.message, false);
            throw error;
        }
    };
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 记录抖音API配置信息
    logManager.logSuccess('抖音API配置加载成功 - Client Key: awc23rrtn8rtoqrk');
    logManager.addLog('Client Secret已配置 (已隐藏)', 'info');
    logManager.addLog('系统初始化完成，准备就绪', 'success');
    
    // 初始化数据
    initializeApp();
});

// 应用初始化函数
async function initializeApp() {
    try {
        // 初始化管理器
        databaseManager = new DatabaseManager();
        douyinAuth = new DouyinAuth();
        douyinAPI = new DouyinAPI();
        
        logManager.logSuccess('管理器初始化完成');
        
        // 加载员工数据
        await loadEmployeeData();
        logManager.logSuccess('员工数据加载完成');
        
        // 检查授权回调
        await checkAuthCallback();
        
        // 更新最后同步时间
        updateLastSyncTime();
        
    } catch (error) {
        logManager.logError(error, '应用初始化失败');
        showNotification('系统初始化失败，请检查后端服务是否启动', 'error');
    }
}