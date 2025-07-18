/**
 * 抖音开放平台授权处理模块
 * 包含获取授权码和access_token的完整流程
 */

class DouyinAuth {
    constructor() {
        this.config = {
            client_key: 'awc23rrtn8rtoqrk',
            client_secret: '584c1636208b8bd54fe7eb76d3cb5205',
            redirect_uri: 'https://osirs.github.io/douyin-data-analysis-tool/',
            scope: 'user_info,video.list,video.data'
        };
        
        this.endpoints = {
            authorize: 'https://open.douyin.com/platform/oauth/connect/',
            token: 'https://open.douyin.com/oauth/access_token/',
            refresh: 'https://open.douyin.com/oauth/refresh_token/'
        };
    }

    /**
     * 构建授权URL
     * @param {string} state - 状态参数，用于防止CSRF攻击
     * @returns {string} 完整的授权URL
     */
    buildAuthUrl(state = null) {
        const params = {
            client_key: this.config.client_key,
            response_type: 'code',
            scope: this.config.scope,
            redirect_uri: this.config.redirect_uri,
            state: state || 'douyin_auth_' + Date.now()
        };

        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        return `${this.endpoints.authorize}?${queryString}`;
    }

    /**
     * 使用授权码获取access_token
     * @param {string} code - 授权码
     * @returns {Promise<Object>} 包含access_token的响应对象
     */
    async getAccessToken(code) {
        const params = {
            client_key: this.config.client_key,
            client_secret: this.config.client_secret,
            code: code,
            grant_type: 'authorization_code'
        };

        try {
            const response = await fetch(this.endpoints.token, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });

            const data = await response.json();
            
            if (data.error_code === 0) {
                console.log('✅ 获取access_token成功:', data.data);
                return {
                    success: true,
                    data: data.data
                };
            } else {
                console.error('❌ 获取access_token失败:', data);
                return {
                    success: false,
                    error: data
                };
            }
        } catch (error) {
            console.error('❌ 网络请求失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 刷新access_token
     * @param {string} refreshToken - 刷新令牌
     * @returns {Promise<Object>} 包含新access_token的响应对象
     */
    async refreshAccessToken(refreshToken) {
        const params = {
            client_key: this.config.client_key,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        };

        try {
            const response = await fetch(this.endpoints.refresh, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });

            const data = await response.json();
            
            if (data.error_code === 0) {
                console.log('✅ 刷新access_token成功:', data.data);
                return {
                    success: true,
                    data: data.data
                };
            } else {
                console.error('❌ 刷新access_token失败:', data);
                return {
                    success: false,
                    error: data
                };
            }
        } catch (error) {
            console.error('❌ 网络请求失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 从URL中提取授权码
     * @param {string} url - 包含授权码的URL
     * @returns {Object} 包含code和state的对象
     */
    extractCodeFromUrl(url = window.location.href) {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const state = urlObj.searchParams.get('state');
        const error = urlObj.searchParams.get('error');
        const errorDescription = urlObj.searchParams.get('error_description');

        return {
            code,
            state,
            error,
            errorDescription
        };
    }

    /**
     * 存储token到本地存储
     * @param {Object} tokenData - token数据
     */
    saveTokenToStorage(tokenData) {
        const tokenInfo = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            open_id: tokenData.open_id,
            scope: tokenData.scope,
            created_at: Date.now()
        };

        localStorage.setItem('douyin_token', JSON.stringify(tokenInfo));
        console.log('💾 Token已保存到本地存储');
    }

    /**
     * 从本地存储获取token
     * @returns {Object|null} token信息或null
     */
    getTokenFromStorage() {
        const tokenStr = localStorage.getItem('douyin_token');
        if (!tokenStr) return null;

        try {
            const tokenInfo = JSON.parse(tokenStr);
            const now = Date.now();
            const expiresAt = tokenInfo.created_at + (tokenInfo.expires_in * 1000);

            if (now >= expiresAt) {
                console.log('⚠️ Token已过期');
                this.clearTokenFromStorage();
                return null;
            }

            return tokenInfo;
        } catch (error) {
            console.error('❌ 解析token失败:', error);
            this.clearTokenFromStorage();
            return null;
        }
    }

    /**
     * 清除本地存储的token
     */
    clearTokenFromStorage() {
        localStorage.removeItem('douyin_token');
        console.log('🗑️ Token已从本地存储清除');
    }

    /**
     * 检查token是否有效
     * @returns {boolean} token是否有效
     */
    isTokenValid() {
        const token = this.getTokenFromStorage();
        return token !== null;
    }

    /**
     * 完整的授权流程处理
     * @returns {Promise<Object>} 授权结果
     */
    async handleAuthFlow() {
        // 检查是否已有有效token
        if (this.isTokenValid()) {
            const token = this.getTokenFromStorage();
            console.log('✅ 已有有效token:', token);
            return {
                success: true,
                data: token,
                message: '已有有效授权'
            };
        }

        // 检查URL中是否有授权码
        const { code, state, error, errorDescription } = this.extractCodeFromUrl();

        if (error) {
            console.error('❌ 授权失败:', error, errorDescription);
            return {
                success: false,
                error: error,
                message: errorDescription || '授权失败'
            };
        }

        if (code) {
            console.log('📝 检测到授权码，正在获取access_token...');
            const tokenResult = await this.getAccessToken(code);
            
            if (tokenResult.success) {
                this.saveTokenToStorage(tokenResult.data);
                return {
                    success: true,
                    data: tokenResult.data,
                    message: '授权成功'
                };
            } else {
                return {
                    success: false,
                    error: tokenResult.error,
                    message: '获取access_token失败'
                };
            }
        }

        // 没有授权码，需要跳转到授权页面
        console.log('🔄 需要用户授权，准备跳转到授权页面...');
        return {
            success: false,
            needAuth: true,
            authUrl: this.buildAuthUrl(),
            message: '需要用户授权'
        };
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DouyinAuth;
} else {
    window.DouyinAuth = DouyinAuth;
}

// 使用示例
/*
const auth = new DouyinAuth();

// 处理授权流程
auth.handleAuthFlow().then(result => {
    if (result.success) {
        console.log('授权成功:', result.data);
        // 可以开始调用抖音API
    } else if (result.needAuth) {
        console.log('需要授权，跳转到:', result.authUrl);
        // 跳转到授权页面
        window.location.href = result.authUrl;
    } else {
        console.error('授权失败:', result.message);
    }
});
*/