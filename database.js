/**
 * 数据库管理模块
 * 使用localStorage模拟数据库存储
 * 管理员工信息、授权状态和数据同步记录
 */

class DatabaseManager {
    constructor() {
        this.storageKeys = {
            employees: 'douyin_employees',
            authTokens: 'douyin_auth_tokens',
            syncHistory: 'douyin_sync_history',
            userData: 'douyin_user_data'
        };
        
        // 初始化数据库
        this.initDatabase();
    }

    /**
     * 初始化数据库，创建默认数据结构
     */
    initDatabase() {
        if (!localStorage.getItem(this.storageKeys.employees)) {
            this.saveEmployees([]);
        }
        if (!localStorage.getItem(this.storageKeys.authTokens)) {
            this.saveAuthTokens({});
        }
        if (!localStorage.getItem(this.storageKeys.syncHistory)) {
            this.saveSyncHistory([]);
        }
        if (!localStorage.getItem(this.storageKeys.userData)) {
            this.saveUserData({});
        }
    }

    // ==================== 员工管理 ====================

    /**
     * 获取所有员工
     * @returns {Array} 员工列表
     */
    getEmployees() {
        try {
            const data = localStorage.getItem(this.storageKeys.employees);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('获取员工数据失败:', error);
            return [];
        }
    }

    /**
     * 保存员工列表
     * @param {Array} employees - 员工列表
     */
    saveEmployees(employees) {
        try {
            localStorage.setItem(this.storageKeys.employees, JSON.stringify(employees));
        } catch (error) {
            console.error('保存员工数据失败:', error);
        }
    }

    /**
     * 添加员工
     * @param {Object} employee - 员工信息
     * @returns {Object} 添加结果
     */
    addEmployee(employee) {
        try {
            const employees = this.getEmployees();
            
            // 检查是否已存在相同抖音账号
            const existingEmployee = employees.find(emp => emp.douyinAccount === employee.douyinAccount);
            if (existingEmployee) {
                return {
                    success: false,
                    message: '该抖音账号已存在'
                };
            }

            const newEmployee = {
                id: this.generateId(),
                name: employee.name,
                douyinAccount: employee.douyinAccount,
                authStatus: 'unauthorized', // unauthorized, authorized, expired
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastSyncTime: null,
                openId: null
            };

            employees.push(newEmployee);
            this.saveEmployees(employees);

            return {
                success: true,
                data: newEmployee,
                message: '员工添加成功'
            };
        } catch (error) {
            console.error('添加员工失败:', error);
            return {
                success: false,
                message: '添加员工失败: ' + error.message
            };
        }
    }

    /**
     * 更新员工信息
     * @param {string} employeeId - 员工ID
     * @param {Object} updates - 更新的字段
     * @returns {Object} 更新结果
     */
    updateEmployee(employeeId, updates) {
        try {
            const employees = this.getEmployees();
            const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
            
            if (employeeIndex === -1) {
                return {
                    success: false,
                    message: '员工不存在'
                };
            }

            employees[employeeIndex] = {
                ...employees[employeeIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            this.saveEmployees(employees);

            return {
                success: true,
                data: employees[employeeIndex],
                message: '员工信息更新成功'
            };
        } catch (error) {
            console.error('更新员工失败:', error);
            return {
                success: false,
                message: '更新员工失败: ' + error.message
            };
        }
    }

    /**
     * 删除员工
     * @param {string} employeeId - 员工ID
     * @returns {Object} 删除结果
     */
    deleteEmployee(employeeId) {
        try {
            const employees = this.getEmployees();
            const filteredEmployees = employees.filter(emp => emp.id !== employeeId);
            
            if (employees.length === filteredEmployees.length) {
                return {
                    success: false,
                    message: '员工不存在'
                };
            }

            this.saveEmployees(filteredEmployees);

            // 同时删除相关的授权token和用户数据
            this.removeAuthToken(employeeId);
            this.removeUserData(employeeId);

            return {
                success: true,
                message: '员工删除成功'
            };
        } catch (error) {
            console.error('删除员工失败:', error);
            return {
                success: false,
                message: '删除员工失败: ' + error.message
            };
        }
    }

    /**
     * 根据ID获取员工
     * @param {string} employeeId - 员工ID
     * @returns {Object|null} 员工信息
     */
    getEmployeeById(employeeId) {
        const employees = this.getEmployees();
        return employees.find(emp => emp.id === employeeId) || null;
    }

    // ==================== 授权Token管理 ====================

    /**
     * 获取所有授权tokens
     * @returns {Object} 授权tokens对象
     */
    getAuthTokens() {
        try {
            const data = localStorage.getItem(this.storageKeys.authTokens);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('获取授权tokens失败:', error);
            return {};
        }
    }

    /**
     * 保存授权tokens
     * @param {Object} tokens - 授权tokens对象
     */
    saveAuthTokens(tokens) {
        try {
            localStorage.setItem(this.storageKeys.authTokens, JSON.stringify(tokens));
        } catch (error) {
            console.error('保存授权tokens失败:', error);
        }
    }

    /**
     * 保存员工的授权token
     * @param {string} employeeId - 员工ID
     * @param {Object} tokenData - token数据
     * @returns {Object} 保存结果
     */
    saveEmployeeAuthToken(employeeId, tokenData) {
        try {
            const tokens = this.getAuthTokens();
            
            tokens[employeeId] = {
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_in: tokenData.expires_in,
                open_id: tokenData.open_id,
                scope: tokenData.scope,
                created_at: Date.now(),
                updated_at: Date.now()
            };

            this.saveAuthTokens(tokens);

            // 更新员工的授权状态和openId
            this.updateEmployee(employeeId, {
                authStatus: 'authorized',
                openId: tokenData.open_id
            });

            return {
                success: true,
                message: '授权token保存成功'
            };
        } catch (error) {
            console.error('保存授权token失败:', error);
            return {
                success: false,
                message: '保存授权token失败: ' + error.message
            };
        }
    }

    /**
     * 获取员工的授权token
     * @param {string} employeeId - 员工ID
     * @returns {Object|null} token信息
     */
    getEmployeeAuthToken(employeeId) {
        const tokens = this.getAuthTokens();
        const tokenInfo = tokens[employeeId];
        
        if (!tokenInfo) return null;

        // 检查token是否过期
        const now = Date.now();
        const expiresAt = tokenInfo.created_at + (tokenInfo.expires_in * 1000);
        
        if (now >= expiresAt) {
            console.log(`员工 ${employeeId} 的token已过期`);
            this.updateEmployee(employeeId, { authStatus: 'expired' });
            return null;
        }

        return tokenInfo;
    }

    /**
     * 移除员工的授权token
     * @param {string} employeeId - 员工ID
     */
    removeAuthToken(employeeId) {
        const tokens = this.getAuthTokens();
        delete tokens[employeeId];
        this.saveAuthTokens(tokens);
        
        // 更新员工授权状态
        this.updateEmployee(employeeId, {
            authStatus: 'unauthorized',
            openId: null
        });
    }

    // ==================== 用户数据管理 ====================

    /**
     * 获取所有用户数据
     * @returns {Object} 用户数据对象
     */
    getUserData() {
        try {
            const data = localStorage.getItem(this.storageKeys.userData);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('获取用户数据失败:', error);
            return {};
        }
    }

    /**
     * 保存用户数据
     * @param {Object} userData - 用户数据对象
     */
    saveUserData(userData) {
        try {
            localStorage.setItem(this.storageKeys.userData, JSON.stringify(userData));
        } catch (error) {
            console.error('保存用户数据失败:', error);
        }
    }

    /**
     * 保存员工的用户数据
     * @param {string} employeeId - 员工ID
     * @param {Object} data - 用户数据
     */
    saveEmployeeUserData(employeeId, data) {
        const userData = this.getUserData();
        
        userData[employeeId] = {
            ...data,
            updated_at: new Date().toISOString()
        };

        this.saveUserData(userData);
        
        // 更新员工的最后同步时间
        this.updateEmployee(employeeId, {
            lastSyncTime: new Date().toISOString()
        });
    }

    /**
     * 获取员工的用户数据
     * @param {string} employeeId - 员工ID
     * @returns {Object|null} 用户数据
     */
    getEmployeeUserData(employeeId) {
        const userData = this.getUserData();
        return userData[employeeId] || null;
    }

    /**
     * 移除员工的用户数据
     * @param {string} employeeId - 员工ID
     */
    removeUserData(employeeId) {
        const userData = this.getUserData();
        delete userData[employeeId];
        this.saveUserData(userData);
    }

    // ==================== 同步历史管理 ====================

    /**
     * 获取同步历史
     * @returns {Array} 同步历史列表
     */
    getSyncHistory() {
        try {
            const data = localStorage.getItem(this.storageKeys.syncHistory);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('获取同步历史失败:', error);
            return [];
        }
    }

    /**
     * 保存同步历史
     * @param {Array} history - 同步历史列表
     */
    saveSyncHistory(history) {
        try {
            localStorage.setItem(this.storageKeys.syncHistory, JSON.stringify(history));
        } catch (error) {
            console.error('保存同步历史失败:', error);
        }
    }

    /**
     * 添加同步记录
     * @param {Object} syncRecord - 同步记录
     */
    addSyncRecord(syncRecord) {
        const history = this.getSyncHistory();
        
        const record = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...syncRecord
        };

        history.unshift(record); // 添加到开头
        
        // 只保留最近100条记录
        if (history.length > 100) {
            history.splice(100);
        }

        this.saveSyncHistory(history);
    }

    /**
     * 获取最后同步时间
     * @returns {string|null} 最后同步时间
     */
    getLastSyncTime() {
        const history = this.getSyncHistory();
        if (history.length > 0) {
            return history[0].timestamp;
        }
        return null;
    }

    // ==================== 工具方法 ====================

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 清空所有数据
     */
    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.initDatabase();
    }

    /**
     * 导出数据
     * @returns {Object} 所有数据
     */
    exportData() {
        return {
            employees: this.getEmployees(),
            authTokens: this.getAuthTokens(),
            syncHistory: this.getSyncHistory(),
            userData: this.getUserData(),
            exportTime: new Date().toISOString()
        };
    }

    /**
     * 导入数据
     * @param {Object} data - 要导入的数据
     * @returns {Object} 导入结果
     */
    importData(data) {
        try {
            if (data.employees) this.saveEmployees(data.employees);
            if (data.authTokens) this.saveAuthTokens(data.authTokens);
            if (data.syncHistory) this.saveSyncHistory(data.syncHistory);
            if (data.userData) this.saveUserData(data.userData);

            return {
                success: true,
                message: '数据导入成功'
            };
        } catch (error) {
            console.error('导入数据失败:', error);
            return {
                success: false,
                message: '导入数据失败: ' + error.message
            };
        }
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseManager;
} else {
    window.DatabaseManager = DatabaseManager;
}