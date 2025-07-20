// 导入node-fetch用于HTTP请求
const fetch = require('node-fetch');

/**
 * 抖音开放平台授权处理类
 * 使用官方SDK实现完整的OAuth2.0授权流程
 */
class DouyinAuth {
    constructor() {
        // 抖音开放平台配置
        this.config = {
            client_key: 'awc23rtn8tcqrk',
            client_secret: '1755b7c5571c9eca',
            redirect_uri: 'https://api.snssdk.com/oauth/authorize/callback/',
            scope: 'user_info,data.external.user,video.list.bind,trial.whitelist'
        };

        // API端点配置
        this.apiEndpoints = {
            token: 'https://open.douyin.com/oauth/access_token/',
            refresh: 'https://open.douyin.com/oauth/refresh_token/'
        };

        // API端点（用于授权URL生成）
        this.endpoints = {
            authorize: 'https://open.douyin.com/platform/oauth/connect',
            userinfo: 'https://open.douyin.com/oauth/userinfo/'
        };
    }

    /**
     * 生成授权URL
     * @param {string} state - 状态参数，通常是员工ID
     * @returns {string} 授权URL
     */
    getAuthUrl(state = 'default_state') {
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
     * 使用授权码获取access_token（使用node-fetch）
     * @param {string} code - 授权码
     * @returns {Promise<Object>} 包含access_token的响应对象
     */
    async getAccessToken(code) {
        try {
            console.log('🔄 正在获取access_token，授权码:', code);
            
            // 构建请求参数
            const params = new URLSearchParams({
                'client_key': this.config.client_key,
                'client_secret': this.config.client_secret,
                'code': code,
                'grant_type': 'authorization_code'
            });

            // 发送POST请求获取access_token
            const response = await fetch(this.apiEndpoints.token, {
                method: 'POST',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            
            const data = await response.json();
            console.log('📥 API响应:', data);
            
            if (data && data.data && data.data.access_token) {
                console.log('✅ 获取access_token成功:', data.data);
                return {
                    success: true,
                    data: data.data
                };
            } else {
                console.error('❌ 获取access_token失败:', data);
                return {
                    success: false,
                    message: data.message || data.error_description || '获取access_token失败',
                    error: data
                };
            }
        } catch (error) {
            console.error('❌ 请求失败:', error);
            return {
                success: false,
                message: error.message || '请求失败',
                error: error.message
            };
        }
    }

    /**
     * 刷新access_token（使用node-fetch）
     * @param {string} refreshToken - 刷新令牌
     * @returns {Promise<Object>} 包含新access_token的响应对象
     */
    async refreshAccessToken(refreshToken) {
        try {
            console.log('🔄 正在刷新access_token，刷新令牌:', refreshToken);
            
            // 构建请求参数
            const params = new URLSearchParams({
                'client_key': this.config.client_key,
                'refresh_token': refreshToken,
                'grant_type': 'refresh_token'
            });

            // 发送POST请求刷新access_token
            const response = await fetch(this.apiEndpoints.refresh, {
                method: 'POST',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            
            const data = await response.json();
            console.log('📥 刷新token API响应:', data);
            
            if (data && data.data && data.data.access_token) {
                console.log('✅ 刷新access_token成功:', data.data);
                return {
                    success: true,
                    data: data.data
                };
            } else {
                console.error('❌ 刷新access_token失败:', data);
                return {
                    success: false,
                    message: data.message || data.error_description || '刷新access_token失败',
                    error: data
                };
            }
        } catch (error) {
            console.error('❌ 刷新请求失败:', error);
            return {
                success: false,
                message: error.message || '刷新请求失败',
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