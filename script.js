// 抖音数据推送及分析工具 JavaScript

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    updateLastSyncTime();
    loadEmployeeData();
});

// 打开数据分析报告（多维表格）
function openAnalysisReport() {
    const url = 'https://ocn8o3ghsdb2.feishu.cn/base/R238bPjJbag3gKs4vcocdd8Bnlg?from=from_copylink';
    window.open(url, '_blank');
    
    // 显示成功提示
    showNotification('正在打开飞书多维表格...', 'info');
}

// 手动同步数据
function manualSync() {
    const syncBtn = document.getElementById('syncBtn');
    const originalText = syncBtn.innerHTML;
    
    // 禁用按钮并显示加载状态
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>同步中...';
    
    // 模拟同步过程
    setTimeout(() => {
        // 更新最后同步时间
        updateLastSyncTime();
        
        // 恢复按钮状态
        syncBtn.disabled = false;
        syncBtn.innerHTML = originalText;
        
        // 显示成功提示
        showNotification('数据同步完成！', 'success');
        
        // 刷新员工数据
        loadEmployeeData();
    }, 3000);
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
function saveEmployee() {
    const name = document.getElementById('employeeName').value;
    const account = document.getElementById('douyinAccount').value;
    
    if (!name || !account) {
        showNotification('请填写完整的员工信息', 'error');
        return;
    }
    
    // 模拟保存过程
    setTimeout(() => {
        // 添加到表格
        addEmployeeToTable(name, account);
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
        modal.hide();
        
        // 清空表单
        document.getElementById('addEmployeeForm').reset();
        
        showNotification('员工添加成功！', 'success');
    }, 1000);
}

// 添加员工到表格
function addEmployeeToTable(name, account) {
    const tbody = document.getElementById('employeeTableBody');
    const newRow = document.createElement('tr');
    const employeeId = Date.now(); // 使用时间戳作为临时ID
    
    newRow.innerHTML = `
        <td>${name}</td>
        <td>${account}</td>
        <td><span class="status-badge status-unauthorized">未授权</span></td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>
            <button class="btn btn-sm btn-outline-success" onclick="authorize('${employeeId}')">
                <i class="fas fa-key"></i> 授权
            </button>
        </td>
    `;
    
    tbody.appendChild(newRow);
}

// 授权员工账号
function authorize(employeeId) {
    showNotification('正在跳转到抖音授权页面...', 'info');
    
    // 模拟授权过程
    setTimeout(() => {
        // 这里应该跳转到抖音开放平台的授权页面
        // 实际实现中需要构建正确的授权URL
        const authUrl = 'https://open.douyin.com/platform/oauth/connect?client_key=YOUR_CLIENT_KEY&response_type=code&scope=user_info&redirect_uri=YOUR_REDIRECT_URI';
        
        // 模拟授权成功后的状态更新
        updateEmployeeAuthStatus(employeeId, true);
        showNotification('授权成功！', 'success');
    }, 2000);
}

// 刷新授权
function refreshAuth(employeeId) {
    showNotification('正在刷新授权...', 'info');
    
    setTimeout(() => {
        showNotification('授权刷新成功！', 'success');
        loadEmployeeData();
    }, 1500);
}

// 撤销授权
function revokeAuth(employeeId) {
    if (confirm('确定要撤销该员工的授权吗？')) {
        updateEmployeeAuthStatus(employeeId, false);
        showNotification('授权已撤销', 'warning');
    }
}

// 更新员工授权状态
function updateEmployeeAuthStatus(employeeId, isAuthorized) {
    // 这里应该调用后端API更新数据库
    // 目前只是模拟前端更新
    console.log(`更新员工 ${employeeId} 授权状态: ${isAuthorized}`);
}

// 加载员工数据
function loadEmployeeData() {
    // 这里应该从后端API获取最新的员工数据
    // 目前使用模拟数据
    console.log('加载员工数据...');
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
setInterval(() => {
    // 这里可以添加定期检查后端同步状态的逻辑
    console.log('检查同步状态...');
}, 30000); // 每30秒检查一次

// 页面可见性变化时的处理
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // 页面重新可见时刷新数据
        loadEmployeeData();
    }
});