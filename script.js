// 抖音数据推送及分析工具 JavaScript

// 全局变量
let databaseManager;
let douyinAuth;
let douyinAPI;

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
            // 如果API失败，尝试从所有员工中查找
            try {
                const allEmployees = await this.getAllEmployees();
                return allEmployees.find(emp => emp.id == employeeId) || null;
            } catch (fallbackError) {
                console.error('备用查找也失败:', fallbackError);
                return null;
            }
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
            await this.api.post(`/auth/token/${employeeId}`, tokenData);
        } catch (error) {
            console.error('保存授权令牌失败:', error);
            throw error;
        }
    }

    // 获取授权令牌
    async getAuthToken(employeeId) {
        try {
            const response = await this.api.get(`/auth/token/${employeeId}`);
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

    // 保存用户视频统计数据
    async saveUserVideoStats(employeeId, statsData) {
        try {
            await this.api.post('/user-video-stats', {
                employeeId,
                ...statsData
            });
        } catch (error) {
            console.error('保存用户视频统计数据失败:', error);
            throw error;
        }
    }

    // 获取用户视频统计数据
    async getUserVideoStats(employeeId, days = 30) {
        try {
            const response = await this.api.get(`/video-stats/${employeeId}?days=${days}`);
            return response.data || [];
        } catch (error) {
            console.error('获取用户视频统计数据失败:', error);
            return [];
        }
    }

    // 手动同步数据
    async manualSyncData(employeeId = null) {
        try {
            const response = await this.api.post('/sync/manual', {
                employeeId
            });
            return response;
        } catch (error) {
            console.error('手动同步数据失败:', error);
            throw error;
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
        this.clientKey = 'awc23rrtn8rtoqrk';
        this.clientSecret = 'f4a6b2c8e1d3f7a9b5c2e8f1a4d7b9c3';
        // 使用抖音官方回调地址
        this.redirectUri = 'https://api.snssdk.com/oauth/authorize/callback/';
        this.scope = 'user_info,data.external.user,video.list.bind,trial.whitelist';
        this.optionalScope = '';
    }

    // 获取授权URL - 根据抖音文档更新
    getAuthUrl(employeeId) {
        const params = new URLSearchParams({
            client_key: this.clientKey,
            response_type: 'code',
            scope: this.scope,
            redirect_uri: this.redirectUri
        });
        
        // 添加可选的state参数
        if (employeeId) {
            params.append('state', employeeId);
        }
        
        // 如果有可选权限，添加到参数中
        if (this.optionalScope && this.optionalScope.trim()) {
            params.append('optionalScope', this.optionalScope);
        }
        
        const authUrl = `https://open.douyin.com/platform/oauth/connect?${params.toString()}`;
        logManager.addLog(`生成授权URL: ${authUrl}`, 'info');
        return authUrl;
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
            // 根据抖音官方API文档，使用form-urlencoded格式
            const formData = new URLSearchParams();
            formData.append('open_id', openId);
            formData.append('access_token', accessToken);
            
            const response = await fetch(`${this.baseURL}/oauth/userinfo/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
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

    // 获取用户粉丝数
    async getUserFansCount(openId, accessToken) {
        try {
            const formData = new URLSearchParams();
            formData.append('open_id', openId);
            formData.append('access_token', accessToken);
            
            const response = await fetch('https://open.douyin.com/api/douyin/v1/user/fans/count/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
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
                    message: data.description || '获取粉丝数失败'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 获取用户点赞数
    async getUserLikeCount(openId, accessToken) {
        try {
            const formData = new URLSearchParams();
            formData.append('open_id', openId);
            formData.append('access_token', accessToken);
            
            const response = await fetch('https://open.douyin.com/api/douyin/v1/user/like/number/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
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
                    message: data.description || '获取点赞数失败'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 获取用户评论数
    async getUserCommentCount(openId, accessToken) {
        try {
            const formData = new URLSearchParams();
            formData.append('open_id', openId);
            formData.append('access_token', accessToken);
            
            const response = await fetch('https://open.douyin.com/api/douyin/v1/user/comment/count/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
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
                    message: data.description || '获取评论数失败'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 获取用户分享数
    async getUserShareCount(openId, accessToken) {
        try {
            const response = await fetch('https://open.douyin.com/api/douyin/v1/user/share/count/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
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
                    message: data.description || '获取分享数失败'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 获取用户主页访问数
    async getUserHomePv(openId, accessToken) {
        try {
            const response = await fetch('https://open.douyin.com/api/douyin/v1/user/home/pv/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
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
                    message: data.description || '获取主页访问数失败'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 获取用户视频状态
    async getUserVideoStatus(openId, accessToken) {
        try {
            const response = await fetch('https://open.douyin.com/api/douyin/v1/user/video/status/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
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
                    message: data.description || '获取视频状态失败'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 获取粉丝数据（保留兼容性）
    async getFansData(openId, accessToken, days) {
        return await this.getUserFansCount(openId, accessToken);
    }

    // 获取视频数据（保留兼容性）
    async getVideoData(openId, accessToken, days) {
        const [videoStatus, likeData, commentData, shareData] = await Promise.all([
            this.getUserVideoStatus(openId, accessToken),
            this.getUserLikeCount(openId, accessToken),
            this.getUserCommentCount(openId, accessToken),
            this.getUserShareCount(openId, accessToken)
        ]);
        
        return {
            success: true,
            data: {
                total_videos: videoStatus.success ? videoStatus.data.video_count : 0,
                total_likes: likeData.success ? likeData.data.like_count : 0,
                total_comments: commentData.success ? commentData.data.comment_count : 0,
                total_shares: shareData.success ? shareData.data.share_count : 0
            }
        };
    }
}

// 打开数据分析报告（多维表格）
function openAnalysisReport() {
    logManager.addLog('用户点击了打开数据分析看板按钮', 'info');
    
    const url = 'https://ocn8o3ghsdb2.feishu.cn/base/R238bPjJbag3gKs4vcocdd8Bnlg?from=from_copylink';
    window.open(url, '_blank');
    
    logManager.addLog('已打开数据分析看板', 'success');
    showNotification('正在打开飞书多维表格...', 'info');
}

// 手动同步数据
async function manualSync() {
    const syncBtn = document.getElementById('syncBtn');
    const originalText = syncBtn.innerHTML;
    
    try {
        logManager.addLog('用户点击了手动同步数据按钮', 'info');
        
        // 禁用按钮并显示加载状态
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>同步中...';
        
        showNotification('开始同步数据...', 'info');
        logManager.addLog('开始同步抖音数据...', 'info');
        
        // 调用新的同步API
        const result = await databaseManager.manualSyncData();
        
        if (result.success) {
            // 更新最后同步时间
            updateLastSyncTime();
            
            // 重新加载员工数据
            await loadEmployeeData();
            
            const message = result.message || '数据同步完成！';
            showNotification(message, 'success');
            logManager.addLog(message, 'success');
            
        } else {
            throw new Error(result.message || '同步失败');
        }
        
    } catch (error) {
        console.error('数据同步失败:', error);
        showNotification('数据同步失败: ' + error.message, 'error');
        logManager.addLog('数据同步失败: ' + error.message, 'error');
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
    logManager.addLog('用户点击了添加员工按钮', 'info');
    const modal = new bootstrap.Modal(document.getElementById('addEmployeeModal'));
    modal.show();
    logManager.addLog('显示添加员工对话框', 'info');
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
        
        // 关闭模态框 - 彻底修复半透明阴影问题
        const modalElement = document.getElementById('addEmployeeModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        
        // 立即清理模态框状态
        const cleanupModal = () => {
            // 移除所有可能的backdrop
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                backdrop.remove();
            });
            
            // 重置body样式
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.body.style.marginRight = '';
            
            // 确保模态框隐藏
            modalElement.style.display = 'none';
            modalElement.classList.remove('show');
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.removeAttribute('aria-modal');
            modalElement.removeAttribute('role');
        };
        
        if (modal) {
            modal.hide();
            // 监听隐藏完成事件
            modalElement.addEventListener('hidden.bs.modal', cleanupModal, { once: true });
        } else {
            // 直接清理
            cleanupModal();
        }
        
        // 额外的延时清理，确保彻底移除
        setTimeout(cleanupModal, 100);
        setTimeout(cleanupModal, 500);
        
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
            tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">暂无员工数据</td></tr>';
            return;
        }
        
        // 为每个员工获取授权令牌信息并添加到表格
        for (const employee of employees) {
            let employeeWithAuth = { ...employee };
            
            // 只对已授权的员工获取授权令牌信息，避免不必要的404请求
            if (employee.auth_status === 'authorized') {
                try {
                    // 获取授权令牌信息
                    const authToken = await databaseManager.getAuthToken(employee.id);
                    
                    // 将授权信息合并到员工对象中
                    employeeWithAuth = {
                        ...employee,
                        code: authToken?.code || null,
                        access_token: authToken?.access_token || null,
                        refresh_token: authToken?.refresh_token || null,
                        scope: authToken?.scope || null,
                        open_id: authToken?.open_id || null,
                        expires_in: authToken?.expires_in || null
                    };
                } catch (error) {
                    console.error(`获取员工 ${employee.id} 的授权信息失败:`, error);
                    logManager.addLog(`获取员工 ${employee.name} 的授权信息失败: ${error.message}`, 'warning');
                }
            }
            
            addEmployeeToTable(employeeWithAuth);
        }
        
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
    
    // 格式化最后同步时间
    const lastSyncTime = employee.last_sync_time ? new Date(employee.last_sync_time).toLocaleString('zh-CN') : '-';
    
    // 存储员工数据到行元素，用于授权凭证显示
    row.setAttribute('data-employee-id', employee.id);
    row.setAttribute('data-employee-data', JSON.stringify(employee));

    row.innerHTML = `
        <td>${employee.name}</td>
        <td>@${employee.douyin_account}</td>
        <td>${statusBadge}</td>
        <td>${formatNumber(employee.fans_count || 0)}</td>
        <td>${formatNumber(employee.like_count || 0)}</td>
        <td>${formatNumber(employee.comment_count || 0)}</td>
        <td>${formatNumber(employee.share_count || 0)}</td>
        <td>${formatNumber(employee.home_pv || 0)}</td>
        <td>
            <button class="btn btn-sm btn-link text-primary" onclick="showVideoStats('${employee.id}')" 
                    title="查看视频统计">
                <i class="fas fa-chart-bar"></i> 查看
            </button>
        </td>
        <td>${lastSyncTime}</td>
        <td>
            <button class="btn btn-sm btn-info me-1" onclick="showAuthCredentials('${employee.id}')" 
                    ${employee.auth_status !== 'authorized' ? 'disabled' : ''}
                    title="查看授权凭证">
                <i class="fas fa-key"></i> 授权凭证
            </button>
            <button class="btn btn-sm btn-primary me-1" onclick="authorizeEmployee('${employee.id}')" 
                    ${employee.auth_status === 'authorized' ? 'disabled' : ''}>
                <i class="fas fa-user-check"></i> 授权
            </button>
            <button class="btn btn-sm btn-success me-1" onclick="refreshEmployee('${employee.id}')" 
                    ${employee.auth_status !== 'authorized' ? 'disabled' : ''}>
                <i class="fas fa-sync"></i> 刷新
            </button>
            <button class="btn btn-sm btn-warning me-1" onclick="revokeEmployee('${employee.id}')" 
                    ${employee.auth_status === 'pending' ? 'disabled' : ''}>
                <i class="fas fa-times"></i> 撤销
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${employee.id}')">
                <i class="fas fa-trash"></i> 删除
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
}

// 授权员工账号
async function authorizeEmployee(employeeId) {
    try {
        logManager.addLog(`开始为员工ID ${employeeId} 进行授权`, 'info');
        
        const employee = await databaseManager.getEmployee(employeeId);
        if (!employee) {
            logManager.addLog('员工信息不存在', 'error');
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        logManager.addLog(`为员工 ${employee.name} 生成授权URL`, 'info');
        
        // 生成授权URL
        const authUrl = douyinAuth.getAuthUrl(employeeId);
        
        // 显示授权模态框
        const authModal = document.createElement('div');
        authModal.className = 'modal fade';
        authModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">抖音账号授权 - ${employee.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            请按照以下步骤完成抖音账号授权：
                        </div>
                        
                        <!-- 步骤1：授权链接 -->
                        <div class="mb-4">
                            <h6><i class="fas fa-step-forward me-2"></i>步骤1：访问授权链接</h6>
                            <div class="mb-3">
                                <label class="form-label">授权链接：</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" value="${authUrl}" readonly id="authUrlInput">
                                    <button class="btn btn-outline-secondary" type="button" onclick="copyAuthUrl()">
                                        <i class="fas fa-copy"></i> 复制
                                    </button>
                                </div>
                            </div>
                            <div class="text-center">
                                <button class="btn btn-primary" onclick="openAuthUrl('${authUrl}')">
                                    <i class="fas fa-external-link-alt me-2"></i>直接跳转授权
                                </button>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <!-- 步骤2：输入授权码 -->
                        <div class="mb-4">
                            <h6><i class="fas fa-step-forward me-2"></i>步骤2：输入授权码</h6>
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                完成授权后，请将获得的授权码(code)粘贴到下方输入框中：
                            </div>
                            <div class="mb-3">
                                <label for="authCodeInput" class="form-label">授权码(Code)：</label>
                                <input type="text" class="form-control" id="authCodeInput" placeholder="请输入从授权页面获得的授权码">
                            </div>
                            <div class="text-center">
                                <button class="btn btn-success" onclick="processAuthCode('${employeeId}')">
                                    <i class="fas fa-check me-2"></i>提交授权码
                                </button>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="small text-muted">
                            <strong>授权参数说明：</strong><br>
                            • Client Key: ${douyinAuth.clientKey}<br>
                            • 权限范围: ${douyinAuth.scope}<br>
                            • 回调地址: ${douyinAuth.redirectUri}<br>
                            • 状态参数: ${employeeId}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(authModal);
        const modal = new bootstrap.Modal(authModal);
        modal.show();
        
        // 模态框关闭时移除元素
        authModal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(authModal);
        });
        
        logManager.addLog('授权模态框已显示，等待用户输入授权码', 'success');
        showNotification('请按照步骤完成授权并输入授权码', 'info');
        
    } catch (error) {
        console.error('授权失败:', error);
        logManager.addLog(`授权失败: ${error.message}`, 'error');
        showNotification('授权失败: ' + error.message, 'error');
    }
}

// 显示授权详情
async function showAuthDetails(employeeId) {
    try {
        logManager.addLog(`获取员工ID ${employeeId} 的授权详情`, 'info');
        
        // 获取员工信息和授权令牌
        const employee = await databaseManager.getEmployee(employeeId);
        const authToken = await databaseManager.getAuthToken(employeeId);
        
        if (!employee) {
            logManager.addLog('员工信息不存在', 'error');
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        // 创建授权详情模态框
        const authDetailsModal = document.createElement('div');
        authDetailsModal.className = 'modal fade';
        authDetailsModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">授权详情 - ${employee.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary"><i class="fas fa-user me-2"></i>员工信息</h6>
                                <table class="table table-sm">
                                    <tr><td><strong>姓名:</strong></td><td>${employee.name}</td></tr>
                                    <tr><td><strong>抖音账号:</strong></td><td>@${employee.douyin_account}</td></tr>
                                    <tr><td><strong>授权状态:</strong></td><td>
                                        <span class="badge ${
                                            employee.auth_status === 'authorized' ? 'bg-success' :
                                            employee.auth_status === 'pending' ? 'bg-warning' :
                                            employee.auth_status === 'expired' ? 'bg-danger' : 'bg-secondary'
                                        }">${
                                            employee.auth_status === 'authorized' ? '已授权' :
                                            employee.auth_status === 'pending' ? '待授权' :
                                            employee.auth_status === 'expired' ? '已过期' : '已撤销'
                                        }</span>
                                    </td></tr>
                                    <tr><td><strong>创建时间:</strong></td><td>${new Date(employee.created_at).toLocaleString('zh-CN')}</td></tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-success"><i class="fas fa-key me-2"></i>授权信息</h6>
                                ${authToken ? `
                                    <table class="table table-sm">
                                        <tr><td><strong>授权范围:</strong></td><td><code>${authToken.scope || 'N/A'}</code></td></tr>
                                        <tr><td><strong>OpenID:</strong></td><td><code>${authToken.open_id || 'N/A'}</code></td></tr>
                                        <tr><td><strong>过期时间:</strong></td><td>${authToken.expires_in ? authToken.expires_in + '秒' : 'N/A'}</td></tr>
                                        <tr><td><strong>授权时间:</strong></td><td>${new Date(authToken.created_at).toLocaleString('zh-CN')}</td></tr>
                                    </table>
                                ` : '<p class="text-muted">暂无授权信息</p>'}
                            </div>
                        </div>
                        
                        ${authToken ? `
                            <hr>
                            <h6 class="text-info"><i class="fas fa-lock me-2"></i>访问令牌</h6>
                            <div class="mb-3">
                                <label class="form-label">Access Token:</label>
                                <div class="input-group">
                                    <input type="password" class="form-control font-monospace" value="${authToken.access_token}" readonly id="accessTokenInput">
                                    <button class="btn btn-outline-secondary" type="button" onclick="toggleTokenVisibility('accessTokenInput')">
                                        <i class="fas fa-eye" id="accessTokenEye"></i>
                                    </button>
                                    <button class="btn btn-outline-primary" type="button" onclick="copyToClipboard('accessTokenInput', 'Access Token')">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            
                            ${authToken.refresh_token ? `
                                <div class="mb-3">
                                    <label class="form-label">Refresh Token:</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control font-monospace" value="${authToken.refresh_token}" readonly id="refreshTokenInput">
                                        <button class="btn btn-outline-secondary" type="button" onclick="toggleTokenVisibility('refreshTokenInput')">
                                            <i class="fas fa-eye" id="refreshTokenEye"></i>
                                        </button>
                                        <button class="btn btn-outline-primary" type="button" onclick="copyToClipboard('refreshTokenInput', 'Refresh Token')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                        ` : ''}
                        
                        <div class="alert alert-warning mt-3">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>安全提示:</strong> 请妥善保管访问令牌，不要泄露给他人。令牌用于访问抖音API获取数据。
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                        ${authToken ? `
                            <button type="button" class="btn btn-warning" onclick="refreshAuthToken('${employeeId}')">
                                <i class="fas fa-sync me-2"></i>刷新令牌
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(authDetailsModal);
        const modal = new bootstrap.Modal(authDetailsModal);
        modal.show();
        
        // 模态框关闭时移除元素
        authDetailsModal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(authDetailsModal);
        });
        
        logManager.addLog('授权详情已显示', 'success');
        
    } catch (error) {
        console.error('获取授权详情失败:', error);
        logManager.addLog(`获取授权详情失败: ${error.message}`, 'error');
        showNotification('获取授权详情失败: ' + error.message, 'error');
    }
}

// 切换令牌可见性
function toggleTokenVisibility(inputId) {
    const input = document.getElementById(inputId);
    const eye = document.getElementById(inputId.replace('Input', 'Eye'));
    
    if (input.type === 'password') {
        input.type = 'text';
        eye.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        eye.className = 'fas fa-eye';
    }
}

// 复制到剪贴板
function copyToClipboard(inputIdOrValue, tokenType) {
    let textToCopy = '';
    
    // 检查是否是元素ID还是直接的值
    const input = document.getElementById(inputIdOrValue);
    if (input) {
        // 如果是元素ID，从元素中获取值
        input.select();
        input.setSelectionRange(0, 99999);
        textToCopy = input.value;
    } else {
        // 如果不是元素ID，则直接使用传入的值
        textToCopy = inputIdOrValue;
    }
    
    if (!textToCopy) {
        showNotification('没有内容可复制', 'warning');
        return;
    }
    
    try {
        // 优先使用现代API
        if (navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showNotification(`${tokenType} 已复制到剪贴板`, 'success');
                logManager.addLog(`${tokenType} 已复制到剪贴板`, 'info');
            }).catch(() => {
                // 如果现代API失败，尝试传统方法
                fallbackCopy(textToCopy, tokenType);
            });
        } else {
            // 如果不支持现代API，使用传统方法
            fallbackCopy(textToCopy, tokenType);
        }
    } catch (err) {
        fallbackCopy(textToCopy, tokenType);
    }
}

// 传统复制方法
function fallbackCopy(text, tokenType) {
    try {
        // 创建临时文本区域
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showNotification(`${tokenType} 已复制到剪贴板`, 'success');
        logManager.addLog(`${tokenType} 已复制到剪贴板`, 'info');
    } catch (err) {
        showNotification('复制失败，请手动复制', 'error');
        logManager.addLog(`复制失败: ${err.message}`, 'error');
    }
}

// 复制授权链接
function copyAuthUrl() {
    const authUrlInput = document.getElementById('authUrlInput');
    if (authUrlInput) {
        authUrlInput.select();
        authUrlInput.setSelectionRange(0, 99999); // 移动端兼容
        
        try {
            document.execCommand('copy');
            showNotification('授权链接已复制到剪贴板', 'success');
            logManager.addLog('授权链接已复制到剪贴板', 'info');
        } catch (err) {
            // 如果execCommand不支持，尝试使用现代API
            if (navigator.clipboard) {
                navigator.clipboard.writeText(authUrlInput.value).then(() => {
                    showNotification('授权链接已复制到剪贴板', 'success');
                    logManager.addLog('授权链接已复制到剪贴板', 'info');
                }).catch(() => {
                    showNotification('复制失败，请手动复制', 'error');
                });
            } else {
                showNotification('复制失败，请手动复制', 'error');
            }
        }
    }
}

// 打开授权链接
function openAuthUrl(authUrl) {
    try {
        // 在新窗口中打开授权页面
        const authWindow = window.open(authUrl, 'douyinAuth', 'width=600,height=700,scrollbars=yes,resizable=yes');
        
        if (!authWindow) {
            logManager.addLog('无法打开授权窗口，可能被浏览器阻止', 'error');
            showNotification('无法打开授权窗口，请检查浏览器弹窗设置或手动复制链接打开', 'error');
            return;
        }
        
        logManager.addLog('授权窗口已打开，等待用户授权', 'success');
        showNotification('授权窗口已打开，请在新窗口中完成授权', 'info');
        
        // 监听授权窗口关闭
        const checkClosed = setInterval(() => {
            if (authWindow.closed) {
                clearInterval(checkClosed);
                logManager.addLog('授权窗口已关闭，建议刷新页面查看授权结果', 'info');
                showNotification('授权窗口已关闭，请刷新页面查看授权结果', 'info');
            }
        }, 1000);
        
    } catch (error) {
        console.error('打开授权窗口失败:', error);
        logManager.addLog('打开授权窗口失败: ' + error.message, 'error');
        showNotification('打开授权窗口失败，请手动复制链接打开', 'error');
    }
}

// 处理用户输入的授权码
async function processAuthCode(employeeId) {
    try {
        const authCodeInput = document.getElementById('authCodeInput');
        const authCode = authCodeInput ? authCodeInput.value.trim() : '';
        
        if (!authCode) {
            showNotification('请输入授权码', 'warning');
            return;
        }
        
        logManager.addLog(`开始处理员工ID ${employeeId} 的授权码: ${authCode}`, 'info');
        
        // 获取员工信息
        const employee = await databaseManager.getEmployee(employeeId);
        if (!employee) {
            logManager.addLog('员工信息不存在', 'error');
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        // 使用后端API获取访问令牌
        const response = await fetch('/api/auth/access-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: authCode,
                employeeId: employeeId
            })
        });
        
        const tokenResult = await response.json();
        
        if (!tokenResult.success) {
            logManager.addLog(`获取访问令牌失败: ${tokenResult.message}`, 'error');
            showNotification(`获取访问令牌失败: ${tokenResult.message}`, 'error');
            return;
        }
        
        const tokenData = tokenResult.data;
        logManager.addLog(`成功获取访问令牌，OpenID: ${tokenData.open_id}`, 'success');
        
        // 后端已经自动获取了用户信息并保存，直接使用返回的数据
        if (tokenData.userInfo) {
            logManager.addLog(`获取用户信息成功: ${tokenData.userInfo.nickname}`, 'success');
        }
        
        logManager.addLog(`员工 ${employee.name} 授权成功，授权令牌已保存`, 'success');
        showNotification(`员工 ${employee.name} 授权成功！`, 'success');
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.querySelector('.modal.show'));
            if (modal) {
                modal.hide();
            }
            
            // 验证授权令牌是否已成功保存
            try {
                const savedToken = await databaseManager.getAuthToken(employeeId);
                if (savedToken && savedToken.access_token) {
                    logManager.addLog('授权令牌验证成功，开始刷新员工列表', 'success');
                    await loadEmployeeData();
                    logManager.addLog('员工列表刷新完成', 'success');
                } else {
                    logManager.addLog('授权令牌验证失败，延迟刷新', 'warning');
                    // 如果验证失败，延迟2秒后再次尝试
                    setTimeout(async () => {
                        try {
                            await loadEmployeeData();
                            logManager.addLog('延迟刷新员工列表完成', 'success');
                        } catch (error) {
                            logManager.addLog(`延迟刷新员工列表失败: ${error.message}`, 'error');
                        }
                    }, 2000);
                }
            } catch (verifyError) {
                logManager.addLog(`验证授权令牌时出错: ${verifyError.message}`, 'error');
                // 如果验证出错，延迟2秒后刷新
                setTimeout(async () => {
                    try {
                        await loadEmployeeData();
                        logManager.addLog('延迟刷新员工列表完成', 'success');
                    } catch (error) {
                        logManager.addLog(`延迟刷新员工列表失败: ${error.message}`, 'error');
                    }
                }, 2000);
            }
        
    } catch (error) {
        console.error('处理授权码失败:', error);
        logManager.addLog(`处理授权码失败: ${error.message}`, 'error');
        showNotification('处理授权码失败: ' + error.message, 'error');
    }
}

// 刷新员工数据
async function refreshEmployee(employeeId) {
    try {
        logManager.addLog(`开始刷新员工ID ${employeeId} 的数据`, 'info');
        
        const employee = await databaseManager.getEmployee(employeeId);
        if (!employee) {
            logManager.addLog('员工信息不存在', 'error');
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        logManager.addLog(`员工信息: ${employee.name} (@${employee.douyin_account})`, 'info');
        
        if (employee.auth_status !== 'authorized' || !employee.access_token) {
            logManager.addLog('该员工尚未授权，无法刷新数据', 'warning');
            showNotification('该员工尚未授权，无法刷新数据', 'warning');
            return;
        }
        
        // 获取授权令牌信息
        let authToken = null;
        try {
            authToken = await databaseManager.getAuthToken(employeeId);
        } catch (tokenError) {
            // 如果是404错误（授权令牌不存在），使用员工表中的授权信息
            if (tokenError.message.includes('404')) {
                logManager.addLog('授权令牌表中暂无数据，使用员工表中的授权信息', 'info');
            } else {
                logManager.addLog(`获取授权令牌失败: ${tokenError.message}`, 'error');
            }
        }
        
        const accessToken = authToken?.access_token || employee.access_token;
        const openId = authToken?.open_id || employee.open_id;
        
        logManager.addLog(`使用Access Token: ${accessToken ? accessToken.substring(0, 8) + '...' : 'N/A'}`, 'info');
        logManager.addLog(`使用Open ID: ${openId || 'N/A'}`, 'info');
        
        showNotification('正在同步数据，请稍候...', 'info');
        
        const syncResults = {};
        let hasError = false;
        
        try {
            // 1. 获取用户视频情况
            logManager.addLog('📹 正在获取用户视频情况...', 'info');
            const videoStatusResult = await douyinAPI.getUserVideoStatus(openId, accessToken);
            logManager.addLog(`视频情况API返回: ${JSON.stringify(videoStatusResult, null, 2)}`, videoStatusResult.success ? 'success' : 'error');
            syncResults.videoStatus = videoStatusResult;
            
            // 2. 获取用户粉丝数
            logManager.addLog('👥 正在获取用户粉丝数...', 'info');
            const fansCountResult = await douyinAPI.getUserFansCount(openId, accessToken);
            logManager.addLog(`粉丝数API返回: ${JSON.stringify(fansCountResult, null, 2)}`, fansCountResult.success ? 'success' : 'error');
            syncResults.fansCount = fansCountResult;
            
            // 3. 获取用户点赞数
            logManager.addLog('👍 正在获取用户点赞数...', 'info');
            const likeCountResult = await douyinAPI.getUserLikeCount(openId, accessToken);
            logManager.addLog(`点赞数API返回: ${JSON.stringify(likeCountResult, null, 2)}`, likeCountResult.success ? 'success' : 'error');
            syncResults.likeCount = likeCountResult;
            
            // 4. 获取用户评论数
            logManager.addLog('💬 正在获取用户评论数...', 'info');
            const commentCountResult = await douyinAPI.getUserCommentCount(openId, accessToken);
            logManager.addLog(`评论数API返回: ${JSON.stringify(commentCountResult, null, 2)}`, commentCountResult.success ? 'success' : 'error');
            syncResults.commentCount = commentCountResult;
            
            // 5. 获取用户分享数
            logManager.addLog('📤 正在获取用户分享数...', 'info');
            const shareCountResult = await douyinAPI.getUserShareCount(openId, accessToken);
            logManager.addLog(`分享数API返回: ${JSON.stringify(shareCountResult, null, 2)}`, shareCountResult.success ? 'success' : 'error');
            syncResults.shareCount = shareCountResult;
            
            // 6. 获取用户主页访问数
            logManager.addLog('🏠 正在获取用户主页访问数...', 'info');
            const homePvResult = await douyinAPI.getUserHomePv(openId, accessToken);
            logManager.addLog(`主页访问数API返回: ${JSON.stringify(homePvResult, null, 2)}`, homePvResult.success ? 'success' : 'error');
            syncResults.homePv = homePvResult;
            
        } catch (apiError) {
            logManager.addLog(`API调用过程中发生错误: ${apiError.message}`, 'error');
            hasError = true;
        }
        
        // 汇总同步结果
        logManager.addLog('📊 数据同步结果汇总:', 'info');
        logManager.addLog(`完整同步结果: ${JSON.stringify(syncResults, null, 2)}`, 'info');
        
        // 更新员工数据
        const updatedEmployee = {
            ...employee,
            last_sync_time: new Date().toISOString(),
            fans_count: syncResults.fansCount?.success ? syncResults.fansCount.data?.fans_count || 0 : employee.fans_count || 0,
            like_count: syncResults.likeCount?.success ? syncResults.likeCount.data?.like_count || 0 : employee.like_count || 0,
            comment_count: syncResults.commentCount?.success ? syncResults.commentCount.data?.comment_count || 0 : employee.comment_count || 0,
            share_count: syncResults.shareCount?.success ? syncResults.shareCount.data?.share_count || 0 : employee.share_count || 0,
            home_pv: syncResults.homePv?.success ? syncResults.homePv.data?.pv_count || 0 : employee.home_pv || 0,
            video_status: syncResults.videoStatus?.success ? syncResults.videoStatus.data : null
        };
        
        logManager.addLog(`更新后的员工数据: ${JSON.stringify(updatedEmployee, null, 2)}`, 'info');
        
        await databaseManager.updateEmployee(employeeId, updatedEmployee);
        
        // 保存详细的同步数据
        await databaseManager.saveUserData(employeeId, {
            sync_time: new Date().toISOString(),
            sync_results: syncResults,
            fans_data: syncResults.fansCount?.data,
            like_data: syncResults.likeCount?.data,
            comment_data: syncResults.commentCount?.data,
            share_data: syncResults.shareCount?.data,
            home_pv_data: syncResults.homePv?.data,
            video_status_data: syncResults.videoStatus?.data
        });
        
        // 重新加载表格数据
        await loadEmployeeData();
        
        if (hasError) {
            logManager.addLog('数据同步完成，但部分API调用失败', 'warning');
            showNotification('数据同步完成，但部分数据获取失败，请查看日志', 'warning');
        } else {
            logManager.addLog('数据同步成功完成', 'success');
            showNotification('数据刷新成功！', 'success');
        }
        
    } catch (error) {
        console.error('刷新数据失败:', error);
        logManager.addLog(`刷新数据失败: ${error.message}`, 'error');
        logManager.addLog(`错误堆栈: ${error.stack}`, 'error');
        showNotification('刷新数据失败: ' + error.message, 'error');
        
        // 检查是否是token过期错误
        if (error.message && (error.message.includes('access_token') || error.message.includes('过期') || error.message.includes('unauthorized'))) {
            logManager.addLog('检测到授权过期，尝试刷新token', 'warning');
            
            const authToken = await databaseManager.getAuthToken(employeeId);
            if (authToken?.refresh_token) {
                try {
                    const refreshResult = await douyinAuth.refreshAccessToken(authToken.refresh_token);
                    if (refreshResult.success) {
                        logManager.addLog('Token刷新成功，重新尝试同步数据', 'success');
                        
                        // 更新token
                        await databaseManager.saveAuthToken(employeeId, {
                            ...authToken,
                            access_token: refreshResult.data.access_token,
                            refresh_token: refreshResult.data.refresh_token,
                            expires_at: new Date(Date.now() + refreshResult.data.expires_in * 1000).toISOString()
                        });
                        
                        // 重新尝试同步
                        await refreshEmployee(employeeId);
                        return;
                    } else {
                        logManager.addLog('Token刷新失败，需要重新授权', 'error');
                    }
                } catch (refreshError) {
                    logManager.addLog(`Token刷新异常: ${refreshError.message}`, 'error');
                }
            }
            
            // 更新授权状态为过期
            await databaseManager.updateEmployee(employeeId, {
                ...employee,
                auth_status: 'expired'
            });
            
            await loadEmployeeData();
            showNotification('授权已过期，请重新授权', 'warning');
        }
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
                        scope: tokenData.scope || '',
                        expires_in: tokenData.expires_in || 0,
                        refresh_expires_in: tokenData.refresh_expires_in || 0
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

// 显示用户视频情况
async function showVideoStats(employeeId) {
    try {
        logManager.addLog(`显示员工 ${employeeId} 的视频统计`, 'info');
        
        // 获取员工信息
        const employee = await databaseManager.getEmployee(employeeId);
        if (!employee) {
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        // 获取视频统计数据
        const videoStats = await databaseManager.getUserVideoStats(employeeId, 30);
        
        // 更新模态框标题
        document.getElementById('videoStatsModalLabel').textContent = `${employee.name} - 用户视频情况`;
        
        // 更新表格内容
        const tbody = document.querySelector('#videoStatsModal tbody');
        tbody.innerHTML = '';
        
        if (videoStats.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">暂无视频统计数据</td></tr>';
        } else {
            videoStats.forEach(stat => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${stat.stat_date}</td>
                    <td>${stat.daily_publish_count || 0}</td>
                    <td>${stat.daily_new_play_count || 0}</td>
                    <td>${stat.total_publish_count || 0}</td>
                `;
                tbody.appendChild(row);
            });
        }
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('videoStatsModal'));
        modal.show();
        
        logManager.addLog('视频统计模态框已显示', 'success');
        
    } catch (error) {
        console.error('显示视频统计失败:', error);
        showNotification('显示视频统计失败: ' + error.message, 'error');
        logManager.addLog('显示视频统计失败: ' + error.message, 'error');
    }
}

// 删除员工
async function deleteEmployee(employeeId) {
    try {
        logManager.addLog(`开始删除员工ID ${employeeId}`, 'info');
        
        const employee = await databaseManager.getEmployee(employeeId);
        if (!employee) {
            logManager.addLog('员工信息不存在', 'error');
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        logManager.addLog(`准备删除员工: ${employee.name}`, 'warning');
        
        if (confirm(`确定要删除员工 "${employee.name}" 吗？此操作不可恢复。`)) {
            logManager.addLog(`用户确认删除员工: ${employee.name}`, 'info');
            await databaseManager.deleteEmployee(employeeId);
            await loadEmployeeData();
            logManager.addLog(`员工 ${employee.name} 删除成功`, 'success');
            showNotification('员工删除成功', 'success');
        } else {
            logManager.addLog('用户取消删除操作', 'info');
        }
        
    } catch (error) {
        console.error('删除员工失败:', error);
        logManager.addLog(`删除员工失败: ${error.message}`, 'error');
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

        // 插入到最前面（倒序显示）
        debugContent.insertBefore(logEntry, debugContent.firstChild);

        // 限制日志数量
        const logs = debugContent.querySelectorAll('.log-entry');
        if (logs.length > this.maxLogs) {
            logs[logs.length - 1].remove();
        }

        // 保持在顶部显示最新日志
        debugContent.scrollTop = 0;
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

// 通用模态框清理函数
function cleanupModalBackdrop(modalId = null) {
    // 移除所有可能的backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.remove();
    });
    
    // 重置body样式
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.body.style.marginRight = '';
    
    // 如果指定了模态框ID，确保该模态框隐藏
    if (modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            modalElement.style.display = 'none';
            modalElement.classList.remove('show');
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.removeAttribute('aria-modal');
            modalElement.removeAttribute('role');
        }
    }
    
    logManager.addLog('模态框背景已清理', 'info');
}

// 为所有模态框添加清理事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 为添加员工模态框添加事件监听器
    const addEmployeeModal = document.getElementById('addEmployeeModal');
    if (addEmployeeModal) {
        // 监听所有可能的关闭事件
        addEmployeeModal.addEventListener('hidden.bs.modal', () => {
            setTimeout(() => cleanupModalBackdrop('addEmployeeModal'), 100);
        });
        
        // 为取消和关闭按钮添加额外的清理
        const cancelBtn = addEmployeeModal.querySelector('[data-bs-dismiss="modal"]');
        const closeBtn = addEmployeeModal.querySelector('.btn-close');
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                setTimeout(() => cleanupModalBackdrop('addEmployeeModal'), 300);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                setTimeout(() => cleanupModalBackdrop('addEmployeeModal'), 300);
            });
        }
    }
});

// 清空日志的全局函数
function clearLogs() {
    logManager.addLog('用户点击了清空日志按钮', 'info');
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
    console.log('页面DOM加载完成');
    
    // 记录抖音API配置信息
    logManager.logSuccess('抖音API配置加载成功 - Client Key: awc23rrtn8rtoqrk');
    logManager.addLog('Client Secret已配置 (已隐藏)', 'info');
    logManager.addLog('系统初始化完成，准备就绪', 'success');
    
    // 测试按钮点击事件
    logManager.addLog('正在测试按钮事件绑定...', 'info');
    
    // 测试按钮是否存在
    const analysisBtn = document.querySelector('button[onclick="openAnalysisReport()"]');
    const syncBtn = document.querySelector('button[onclick="manualSync()"]');
    const addBtn = document.querySelector('button[onclick="addEmployee()"]');
    
    if (analysisBtn) {
        logManager.addLog('找到数据分析按钮', 'success');
    } else {
        logManager.addLog('未找到数据分析按钮', 'error');
    }
    
    if (syncBtn) {
        logManager.addLog('找到手动同步按钮', 'success');
    } else {
        logManager.addLog('未找到手动同步按钮', 'error');
    }
    
    if (addBtn) {
         logManager.addLog('找到添加员工按钮', 'success');
     } else {
         logManager.addLog('未找到添加员工按钮', 'error');
     }
     
     // 添加额外的事件监听器作为备用
     if (analysisBtn) {
         analysisBtn.addEventListener('click', function(e) {
             logManager.addLog('数据分析按钮被点击（事件监听器）', 'info');
             if (typeof openAnalysisReport === 'function') {
                 openAnalysisReport();
             } else {
                 logManager.addLog('openAnalysisReport函数未定义', 'error');
             }
         });
     }
     
     if (syncBtn) {
         syncBtn.addEventListener('click', function(e) {
             logManager.addLog('手动同步按钮被点击（事件监听器）', 'info');
             if (typeof manualSync === 'function') {
                 manualSync();
             } else {
                 logManager.addLog('manualSync函数未定义', 'error');
             }
         });
     }
     
     if (addBtn) {
         addBtn.addEventListener('click', function(e) {
             logManager.addLog('添加员工按钮被点击（事件监听器）', 'info');
             if (typeof addEmployee === 'function') {
                 addEmployee();
             } else {
                 logManager.addLog('addEmployee函数未定义', 'error');
             }
         });
     }
     
     // 初始化数据
     initializeApp();
});

// 添加全局错误处理
window.addEventListener('error', function(event) {
    logManager.logError(`JavaScript错误: ${event.error.message}`, '全局错误处理');
    console.error('全局错误:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    logManager.logError(`未处理的Promise拒绝: ${event.reason}`, '全局错误处理');
    console.error('未处理的Promise拒绝:', event.reason);
});

// 应用初始化函数
async function initializeApp() {
    try {
        logManager.addLog('开始初始化应用...', 'info');
        
        // 初始化管理器
        databaseManager = new DatabaseManager();
        douyinAuth = new DouyinAuth();
        douyinAPI = new DouyinAPI();
        
        logManager.addLog('管理器初始化完成', 'success');
        
        // 测试函数是否可用
        if (typeof openAnalysisReport === 'function') {
            logManager.addLog('openAnalysisReport函数可用', 'success');
        } else {
            logManager.addLog('openAnalysisReport函数不可用', 'error');
        }
        
        if (typeof manualSync === 'function') {
            logManager.addLog('manualSync函数可用', 'success');
        } else {
            logManager.addLog('manualSync函数不可用', 'error');
        }
        
        if (typeof addEmployee === 'function') {
            logManager.addLog('addEmployee函数可用', 'success');
        } else {
            logManager.addLog('addEmployee函数不可用', 'error');
        }
        
        // 加载员工数据
        await loadEmployeeData();
        logManager.logSuccess('员工数据加载完成');
        
        // 检查授权回调
        await checkAuthCallback();
        
        // 更新最后同步时间
        updateLastSyncTime();
        
        logManager.addLog('应用初始化完成', 'success');
        
    } catch (error) {
        logManager.logError(error, '应用初始化失败');
        showNotification('系统初始化失败，请检查后端服务是否启动', 'error');
    }
}

// 授权凭证相关函数

// 显示授权凭证信息
async function showAuthCredentials(employeeId) {
    try {
        // 获取员工信息
        const employee = await databaseManager.getEmployee(employeeId);
        if (!employee) {
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        // 获取授权令牌信息
        const authToken = await databaseManager.getAuthToken(employeeId);
        
        // 填充员工信息
        document.getElementById('authEmployeeName').textContent = employee.name;
        document.getElementById('authDouyinAccount').textContent = '@' + employee.douyin_account;
        
        // 设置授权状态
        const statusElement = document.getElementById('authStatus');
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
        statusElement.innerHTML = statusBadge;
        
        // 填充授权凭证信息
        document.getElementById('authCode').value = authToken?.code || '';
        document.getElementById('authAccessToken').value = authToken?.access_token || '';
        document.getElementById('authRefreshToken').value = authToken?.refresh_token || '';
        document.getElementById('authScope').value = authToken?.scope || '';
        
        // 显示授权凭证区域
        document.getElementById('authCredentialsSection').style.display = 'block';
        
        // 滚动到授权凭证区域
        document.getElementById('authCredentialsSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        logManager.addLog(`显示员工 ${employee.name} 的授权凭证信息`, 'info');
        
    } catch (error) {
        console.error('显示授权凭证失败:', error);
        showNotification('获取授权凭证信息失败: ' + error.message, 'error');
    }
}

// 隐藏授权凭证信息
function hideAuthCredentials() {
    document.getElementById('authCredentialsSection').style.display = 'none';
    
    // 清空表单
    document.getElementById('authEmployeeName').textContent = '-';
    document.getElementById('authDouyinAccount').textContent = '-';
    document.getElementById('authStatus').innerHTML = '-';
    document.getElementById('authCode').value = '';
    document.getElementById('authAccessToken').value = '';
    document.getElementById('authRefreshToken').value = '';
    document.getElementById('authScope').value = '';
    
    logManager.addLog('隐藏授权凭证信息', 'info');
}

// 复制授权字段内容
function copyAuthField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field || !field.value) {
        showNotification('没有可复制的内容', 'warning');
        return;
    }
    
    // 创建临时文本区域来复制内容
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = field.value;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    
    try {
        document.execCommand('copy');
        
        // 获取字段名称
        const fieldNames = {
            'authCode': '授权码',
            'authAccessToken': '访问令牌',
            'authRefreshToken': '刷新令牌',
            'authScope': '授权范围'
        };
        
        const fieldName = fieldNames[fieldId] || '内容';
        showNotification(`${fieldName}已复制到剪贴板`, 'success');
        logManager.addLog(`复制${fieldName}到剪贴板`, 'info');
        
    } catch (err) {
        console.error('复制失败:', err);
        showNotification('复制失败，请手动选择复制', 'error');
    } finally {
        document.body.removeChild(tempTextArea);
    }
}