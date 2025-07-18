// 抖音数据推送及分析工具 JavaScript

// 全局变量
let databaseManager;
let douyinAuth;
let douyinAPI;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化管理器
    databaseManager = new DatabaseManager();
    douyinAuth = new DouyinAuth();
    douyinAPI = new DouyinAPI();
    
    updateLastSyncTime();
    loadEmployeeData();
    
    // 检查是否有授权回调
    checkAuthCallback();
});

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
        const employees = databaseManager.getAllEmployees();
        const authorizedEmployees = employees.filter(emp => emp.authStatus === 'authorized' && emp.accessToken);
        
        if (authorizedEmployees.length === 0) {
            showNotification('没有已授权的员工账号，无法同步数据', 'warning');
            return;
        }
        
        // 准备用户列表
        const userList = authorizedEmployees.map(emp => ({
            employeeId: emp.id,
            openId: emp.openId,
            accessToken: emp.accessToken
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
            
            databaseManager.addSyncHistory(syncRecord);
            
            // 更新员工数据
            result.data.results.forEach(userResult => {
                const employee = databaseManager.getEmployee(userResult.employeeId);
                if (employee) {
                    // 更新员工的数据统计
                    const userData = userResult.data;
                    const updatedEmployee = {
                        ...employee,
                        lastSyncTime: new Date().toISOString(),
                        fansCount: userData.fansData?.total_fans || employee.fansCount || 0,
                        videoCount: userData.videoStatus?.total_videos || employee.videoCount || 0,
                        likeCount: userData.likeData?.total_likes || employee.likeCount || 0,
                        commentCount: userData.commentData?.total_comments || employee.commentCount || 0,
                        shareCount: userData.shareData?.total_shares || employee.shareCount || 0,
                        profileViews: userData.profileData?.total_views || employee.profileViews || 0
                    };
                    
                    databaseManager.updateEmployee(userResult.employeeId, updatedEmployee);
                    
                    // 保存用户数据到数据库
                    databaseManager.saveUserData(userResult.employeeId, userData);
                }
            });
            
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
function addEmployee() {
    const name = document.getElementById('employeeName').value;
    const account = document.getElementById('douyinAccount').value;
    
    const employee = {
        name: name,
        douyinAccount: account,
        authStatus: 'pending',
        addTime: new Date().toISOString(),
        fansCount: 0,
        videoCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        profileViews: 0
    };
    
    // 验证表单
    if (!employee.name || !employee.douyinAccount) {
        showNotification('请填写完整的员工信息', 'error');
        return;
    }
    
    try {
        // 检查抖音账号是否已存在
        const existingEmployees = databaseManager.getAllEmployees();
        const isDuplicate = existingEmployees.some(emp => emp.douyinAccount === employee.douyinAccount);
        
        if (isDuplicate) {
            showNotification('该抖音账号已存在！', 'error');
            return;
        }
        
        // 添加到数据库
        const employeeId = databaseManager.addEmployee(employee);
        
        // 重新加载员工数据
        loadEmployeeData();
        
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
function loadEmployeeData() {
    try {
        const employees = databaseManager.getAllEmployees();
        const tbody = document.querySelector('#employeeTable tbody');
        
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
    const tbody = document.querySelector('#employeeTable tbody');
    const row = document.createElement('tr');
    
    // 格式化时间
    const addTime = employee.addTime ? new Date(employee.addTime).toLocaleString('zh-CN') : '-';
    
    // 授权状态显示
    let statusBadge = '';
    switch (employee.authStatus) {
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
        <td>@${employee.douyinAccount}</td>
        <td>${statusBadge}</td>
        <td>${addTime}</td>
        <td>${formatNumber(employee.fansCount || 0)}</td>
        <td>${employee.videoCount || 0}</td>
        <td>
            <button class="btn btn-sm btn-primary me-1" onclick="authorizeEmployee('${employee.id}')" 
                    ${employee.authStatus === 'authorized' ? 'disabled' : ''}>
                <i class="fas fa-key"></i> 授权
            </button>
            <button class="btn btn-sm btn-success me-1" onclick="refreshEmployee('${employee.id}')" 
                    ${employee.authStatus !== 'authorized' ? 'disabled' : ''}>
                <i class="fas fa-sync"></i> 刷新
            </button>
            <button class="btn btn-sm btn-danger" onclick="revokeEmployee('${employee.id}')" 
                    ${employee.authStatus === 'pending' ? 'disabled' : ''}>
                <i class="fas fa-times"></i> 撤销
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
}

// 授权员工账号
function authorizeEmployee(employeeId) {
    try {
        const employee = databaseManager.getEmployee(employeeId);
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
                setTimeout(() => {
                    loadEmployeeData();
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
        const employee = databaseManager.getEmployee(employeeId);
        if (!employee) {
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        if (employee.authStatus !== 'authorized' || !employee.accessToken) {
            showNotification('该员工尚未授权，无法刷新数据', 'warning');
            return;
        }
        
        showNotification('正在刷新数据...', 'info');
        
        // 获取用户完整数据
        const result = await douyinAPI.getCompleteUserData(employee.openId, employee.accessToken, 7);
        
        if (result.success) {
            const userData = result.data;
            
            // 更新员工数据
            const updatedEmployee = {
                ...employee,
                lastSyncTime: new Date().toISOString(),
                fansCount: userData.fansData?.total_fans || employee.fansCount || 0,
                videoCount: userData.videoStatus?.total_videos || employee.videoCount || 0,
                likeCount: userData.likeData?.total_likes || employee.likeCount || 0,
                commentCount: userData.commentData?.total_comments || employee.commentCount || 0,
                shareCount: userData.shareData?.total_shares || employee.shareCount || 0,
                profileViews: userData.profileData?.total_views || employee.profileViews || 0
            };
            
            databaseManager.updateEmployee(employeeId, updatedEmployee);
            databaseManager.saveUserData(employeeId, userData);
            
            // 重新加载表格数据
            loadEmployeeData();
            
            showNotification('数据刷新成功！', 'success');
            
        } else {
            // 检查是否是token过期
            if (result.error && (result.error.includes('access_token') || result.error.includes('过期'))) {
                // 尝试刷新token
                if (employee.refreshToken) {
                    const refreshResult = await douyinAuth.refreshAccessToken(employee.refreshToken);
                    if (refreshResult.success) {
                        // 更新token并重试
                        const updatedEmployee = {
                            ...employee,
                            accessToken: refreshResult.data.access_token,
                            refreshToken: refreshResult.data.refresh_token,
                            expiresAt: new Date(Date.now() + refreshResult.data.expires_in * 1000).toISOString()
                        };
                        
                        databaseManager.updateEmployee(employeeId, updatedEmployee);
                        
                        // 重试获取数据
                        await refreshEmployee(employeeId);
                        return;
                    }
                }
                
                // token刷新失败，更新授权状态
                databaseManager.updateEmployee(employeeId, {
                    ...employee,
                    authStatus: 'expired'
                });
                
                loadEmployeeData();
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
function revokeEmployee(employeeId) {
    try {
        const employee = databaseManager.getEmployee(employeeId);
        if (!employee) {
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        if (confirm('确定要撤销该员工的授权吗？此操作将清除所有授权信息。')) {
            // 清除授权信息
            const updatedEmployee = {
                ...employee,
                authStatus: 'revoked',
                accessToken: null,
                refreshToken: null,
                openId: null,
                expiresAt: null,
                revokeTime: new Date().toISOString()
            };
            
            databaseManager.updateEmployee(employeeId, updatedEmployee);
            
            // 重新加载表格数据
            loadEmployeeData();
            
            showNotification('授权已撤销', 'info');
        }
        
    } catch (error) {
        console.error('撤销授权失败:', error);
        showNotification('撤销授权失败: ' + error.message, 'error');
    }
}

// 检查授权回调
function checkAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
        handleAuthCallback(code, state);
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
                const employee = databaseManager.getEmployee(employeeId);
                if (employee) {
                    const updatedEmployee = {
                        ...employee,
                        authStatus: 'authorized',
                        accessToken: tokenData.access_token,
                        refreshToken: tokenData.refresh_token,
                        openId: tokenData.open_id,
                        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
                        authTime: new Date().toISOString(),
                        userInfo: userInfoResult.data
                    };
                    
                    databaseManager.updateEmployee(employeeId, updatedEmployee);
                    
                    // 保存token到数据库
                    databaseManager.saveAuthToken(employeeId, {
                        accessToken: tokenData.access_token,
                        refreshToken: tokenData.refresh_token,
                        openId: tokenData.open_id,
                        expiresAt: updatedEmployee.expiresAt,
                        scope: tokenData.scope
                    });
                    
                    // 清除URL参数
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    // 重新加载数据
                    loadEmployeeData();
                    
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
function updateEmployeeAuthStatus(employeeId, status) {
    try {
        const employee = databaseManager.getEmployee(employeeId);
        if (employee) {
            const updatedEmployee = {
                ...employee,
                authStatus: status,
                statusUpdateTime: new Date().toISOString()
            };
            
            databaseManager.updateEmployee(employeeId, updatedEmployee);
            loadEmployeeData();
        }
    } catch (error) {
        console.error('更新员工授权状态失败:', error);
    }
}

// 删除员工
function deleteEmployee(employeeId) {
    try {
        const employee = databaseManager.getEmployee(employeeId);
        if (!employee) {
            showNotification('员工信息不存在', 'error');
            return;
        }
        
        if (confirm(`确定要删除员工 "${employee.name}" 吗？此操作不可恢复。`)) {
            databaseManager.deleteEmployee(employeeId);
            loadEmployeeData();
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