/**
 * 抖音开放平台API调用模块
 * 使用官方SDK实现用户数据获取的各种接口
 */
// 暂时注释SDK导入以避免循环依赖问题
// const Client = require('@open-dy/open_api_sdk');
// const CredentialClient = require('@open-dy/open_api_credential');
const fetch = require('node-fetch');
require('dotenv').config();

class DouyinAPI {
    constructor() {
        this.clientKey = process.env.DOUYIN_CLIENT_KEY;
        this.clientSecret = process.env.DOUYIN_CLIENT_SECRET;
        this.redirectUri = process.env.DOUYIN_REDIRECT_URI;
        
        // 暂时注释SDK客户端初始化
        // this.client = new Client({
        //     clientKey: this.clientKey,
        //     clientSecret: this.clientSecret
        // });
        
        // 初始化凭证客户端
        // this.credentialClient = new CredentialClient({
        //     clientKey: this.clientKey,
        //     clientSecret: this.clientSecret
        // });
        
        console.log('🔧 抖音API初始化完成', {
            clientKey: this.clientKey,
            redirectUri: this.redirectUri
        });
    }
    
    /**
     * 生成授权URL
     * @param {string} state - 状态参数，用于防止CSRF攻击
     * @returns {string} 授权URL
     */
    generateAuthUrl(state = '') {
        const params = new URLSearchParams({
            client_key: this.clientKey,
            response_type: 'code',
            scope: 'data.external.user,video.list.bind',
            redirect_uri: this.redirectUri,
            state: state || 'douyin_auth_' + Date.now()
        });
        
        const authUrl = `https://open.douyin.com/platform/oauth/connect?${params.toString()}`;
        console.log('🔗 生成授权URL:', authUrl);
        console.log('🔧 授权参数:', {
            client_key: this.clientKey,
            response_type: 'code',
            scope: 'data.external.user,video.list.bind',
            redirect_uri: this.redirectUri,
            state: state || 'douyin_auth_' + Date.now()
        });
        return authUrl;
    }
    
    /**
     * 使用授权码获取访问令牌
     * @param {string} code - 授权码
     * @returns {Promise<Object>} 令牌信息
     */
    async getAccessToken(code) {
        try {
            console.log('🔄 获取访问令牌，授权码:', code);
            
            const url = 'https://open.douyin.com/oauth/access_token/';
            const params = {
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                code: code,
                grant_type: 'authorization_code'
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });
            
            const result = await response.json();
            console.log('📥 访问令牌响应:', result);
            
            if (result && result.data && result.data.error_code === 0) {
                return {
                    success: true,
                    data: result.data,
                    message: '获取访问令牌成功'
                };
            } else {
                return {
                    success: false,
                    error: result,
                    message: result.data ? result.data.description || '获取访问令牌失败' : '获取访问令牌失败'
                };
            }
        } catch (error) {
            console.error('❌ 获取访问令牌失败:', error);
            return {
                success: false,
                error: error.message,
                message: '获取访问令牌异常: ' + error.message
            };
        }
    }

    /**
     * 获取用户视频情况
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户视频数据
     */
    async getUserVideoStatus(openId, accessToken, dateType = 7) {
        try {
            console.log('🔄 获取用户视频情况:', { openId, dateType });
            
            const params = {
                access_token: accessToken,
                date_type: dateType,
                open_id: openId
            };
            
            const response = await this.makeGenericRequest('https://open.douyin.com/data/external/user/item/', params, 'POST');
            console.log('📥 用户视频情况响应:', response);
            
            return response;
        } catch (error) {
            console.error('❌ 获取用户视频情况失败:', error);
            return {
                success: false,
                error: error.message,
                message: '获取用户视频情况异常: ' + error.message
            };
        }
    }

    /**
     * 获取用户粉丝数据
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户粉丝数据
     */
    async getUserFansData(openId, accessToken, dateType = 7) {
        try {
             console.log('🔄 获取用户粉丝数据:', { openId, dateType });
             
             const params = {
                 access_token: accessToken,
                 date_type: dateType,
                 open_id: openId
             };
             
             const response = await this.makeGenericRequest('https://open.douyin.com/data/external/user/fans/', params, 'POST');
             console.log('📥 用户粉丝数据响应:', response);
             
             return response;
        } catch (error) {
            console.error('❌ 获取用户粉丝数据失败:', error);
            return {
                success: false,
                error: error.message,
                message: '获取用户粉丝数据异常: ' + error.message
            };
        }
    }

    /**
     * 获取用户点赞数据
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户点赞数据
     */
    async getUserLikeData(openId, accessToken, dateType = 7) {
        try {
             console.log('🔄 获取用户点赞数据:', { openId, dateType });
             
             const params = {
                 access_token: accessToken,
                 date_type: dateType,
                 open_id: openId
             };
             
             const response = await this.makeGenericRequest('https://open.douyin.com/data/external/user/like/', params, 'POST');
             console.log('📥 用户点赞数据响应:', response);
             
             return response;
        } catch (error) {
            console.error('❌ 获取用户点赞数据失败:', error);
            return {
                success: false,
                error: error.message,
                message: '获取用户点赞数据异常: ' + error.message
            };
        }
    }
    
    /**
     * 获取用户评论数据
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户评论数据
     */
    async getUserCommentData(openId, accessToken, dateType = 7) {
        try {
             console.log('🔄 获取用户评论数据:', { openId, dateType });
             
             const params = {
                 access_token: accessToken,
                 date_type: dateType,
                 open_id: openId
             };
             
             const response = await this.makeGenericRequest('https://open.douyin.com/data/external/user/comment/', params, 'POST');
             console.log('📥 用户评论数据响应:', response);
             
             return response;
        } catch (error) {
            console.error('❌ 获取用户评论数据失败:', error);
            return {
                success: false,
                error: error.message,
                message: '获取用户评论数据异常: ' + error.message
            };
        }
    }
    
    /**
     * 获取用户分享数据
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户分享数据
     */
    async getUserShareData(openId, accessToken, dateType = 7) {
        try {
             console.log('🔄 获取用户分享数据:', { openId, dateType });
             
             const params = {
                 access_token: accessToken,
                 date_type: dateType,
                 open_id: openId
             };
             
             const response = await this.makeGenericRequest('https://open.douyin.com/data/external/user/share/', params, 'POST');
             console.log('📥 用户分享数据响应:', response);
             
             return response;
        } catch (error) {
            console.error('❌ 获取用户分享数据失败:', error);
            return {
                success: false,
                error: error.message,
                message: '获取用户分享数据异常: ' + error.message
            };
        }
    }

    /**
     * 获取用户信息
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @returns {Promise<Object>} 用户信息
     */
    async getUserInfo(openId, accessToken) {
        try {
            console.log('🔄 获取用户信息:', { openId });
            
            const params = {
                access_token: accessToken,
                open_id: openId
            };
            
            const response = await this.makeGenericRequest('https://open.douyin.com/oauth/userinfo/', params);
            console.log('📥 用户信息响应:', response);
            
            return response;
        } catch (error) {
            console.error('❌ 获取用户信息失败:', error);
            return {
                success: false,
                error: error.message,
                message: '获取用户信息异常: ' + error.message
            };
        }
    }

    /**
     * 获取用户主页访问数据
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户主页访问数据
     */
    async getUserProfileData(openId, accessToken, dateType = 7) {
        try {
             console.log('🔄 获取用户主页访问数据:', { openId, dateType });
             
             const params = {
                 access_token: accessToken,
                 date_type: dateType,
                 open_id: openId
             };
             
             const response = await this.makeGenericRequest('https://open.douyin.com/data/external/user/profile/', params, 'POST');
             console.log('📥 用户主页访问数据响应:', response);
             
             return response;
        } catch (error) {
            console.error('❌ 获取用户主页访问数据失败:', error);
            return {
                success: false,
                error: error.message,
                message: '获取用户主页访问数据异常: ' + error.message
            };
        }
    }

    /**
     * 获取用户唯一标识
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @returns {Promise<Object>} 用户唯一标识
     */
    async getUserRelatedId(openId, accessToken) {
        try {
            console.log('🔄 获取用户唯一标识:', { openId });
            
            const params = {
                access_token: accessToken,
                open_id: openId
            };
            
            const response = await this.makeGenericRequest('https://open.douyin.com/data/external/user/related_id/', params, 'POST');
            console.log('📥 用户唯一标识响应:', response);
            
            return response;
        } catch (error) {
            console.error('❌ 获取用户唯一标识失败:', error);
            return {
                success: false,
                error: error.message,
                message: '获取用户唯一标识异常: ' + error.message
            };
        }
    }

    /**
     * 获取用户视频列表
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} count - 获取数量
     * @param {number} cursor - 分页游标
     * @returns {Promise<Object>} 用户视频列表
     */
    async getUserVideoList(openId, accessToken, count = 10, cursor = 0) {
        try {
            console.log('🔄 获取用户视频列表:', { openId, count, cursor });
            
            const params = {
                access_token: accessToken,
                open_id: openId,
                count: count,
                cursor: cursor
            };
            
            const response = await this.makeGenericRequest('https://open.douyin.com/video/list/', params, 'POST');
            console.log('📥 用户视频列表响应:', response);
            
            return response;
        } catch (error) {
            console.error('❌ 获取用户视频列表失败:', error);
            return {
                success: false,
                error: error.message,
                message: '获取用户视频列表异常: ' + error.message
            };
        }
    }

    /**
     * 通用API请求方法（用于SDK未覆盖的接口）
     * @param {string} url - 请求URL
     * @param {Object} params - 请求参数
     * @param {string} method - 请求方法
     * @returns {Promise<Object>} API响应
     */
    async makeGenericRequest(url, params, method = 'GET') {
        try {
            let response;
            
            if (method === 'GET') {
                const queryString = new URLSearchParams(params).toString();
                const fullUrl = `${url}?${queryString}`;
                
                response = await fetch(fullUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(params)
                });
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.err_no === 0 || data.error_code === 0) {
                return {
                    success: true,
                    data: data.data || data,
                    message: '请求成功'
                };
            } else {
                return {
                    success: false,
                    error: data,
                    message: data.err_msg || data.message || 'API请求失败'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '网络请求失败: ' + error.message
            };
        }
    }

    /**
     * 获取完整的用户数据
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 完整的用户数据
     */
    async getCompleteUserData(openId, accessToken, dateType = 7) {
        try {
            console.log(`开始获取用户 ${openId} 的完整数据...`);
            
            const results = {};
            const errors = [];

            // 并行获取所有数据
            const promises = [
                this.getUserInfo(openId, accessToken).then(result => {
                    if (result.success) {
                        results.userInfo = result.data;
                    } else {
                        errors.push({ type: 'userInfo', error: result.message });
                    }
                }),
                
                this.getUserVideoStatus(openId, accessToken, dateType).then(result => {
                    if (result.success) {
                        results.videoStatus = result.data;
                    } else {
                        errors.push({ type: 'videoStatus', error: result.message });
                    }
                }),
                
                this.getUserFansData(openId, accessToken, dateType).then(result => {
                    if (result.success) {
                        results.fansData = result.data;
                    } else {
                        errors.push({ type: 'fansData', error: result.message });
                    }
                }),
                
                this.getUserLikeData(openId, accessToken, dateType).then(result => {
                    if (result.success) {
                        results.likeData = result.data;
                    } else {
                        errors.push({ type: 'likeData', error: result.message });
                    }
                }),
                
                this.getUserCommentData(openId, accessToken, dateType).then(result => {
                    if (result.success) {
                        results.commentData = result.data;
                    } else {
                        errors.push({ type: 'commentData', error: result.message });
                    }
                }),
                
                this.getUserShareData(openId, accessToken, dateType).then(result => {
                    if (result.success) {
                        results.shareData = result.data;
                    } else {
                        errors.push({ type: 'shareData', error: result.message });
                    }
                }),
                
                this.getUserProfileData(openId, accessToken, dateType).then(result => {
                    if (result.success) {
                        results.profileData = result.data;
                    } else {
                        errors.push({ type: 'profileData', error: result.message });
                    }
                })
            ];

            await Promise.all(promises);

            // 汇总数据
            const completeData = {
                openId: openId,
                dateType: dateType,
                fetchTime: new Date().toISOString(),
                ...results,
                errors: errors
            };

            console.log(`用户 ${openId} 数据获取完成，成功获取 ${Object.keys(results).length} 项数据，${errors.length} 项失败`);

            return {
                success: true,
                data: completeData,
                message: `数据获取完成，成功 ${Object.keys(results).length} 项，失败 ${errors.length} 项`
            };

        } catch (error) {
            console.error('获取完整用户数据失败:', error);
            return {
                success: false,
                error: error.message,
                message: '获取完整用户数据失败: ' + error.message
            };
        }
    }

    /**
     * 批量获取多个用户的数据
     * @param {Array} userList - 用户列表 [{openId, accessToken}, ...]
     * @param {number} dateType - 时间类型
     * @returns {Promise<Object>} 批量获取结果
     */
    async batchGetUserData(userList, dateType = 7) {
        try {
            console.log(`开始批量获取 ${userList.length} 个用户的数据...`);
            
            const results = [];
            const errors = [];

            // 为了避免并发过多，分批处理
            const batchSize = 3; // 每批处理3个用户
            
            for (let i = 0; i < userList.length; i += batchSize) {
                const batch = userList.slice(i, i + batchSize);
                
                const batchPromises = batch.map(async (user) => {
                    try {
                        const result = await this.getCompleteUserData(user.openId, user.accessToken, dateType);
                        if (result.success) {
                            results.push({
                                employeeId: user.employeeId,
                                openId: user.openId,
                                data: result.data
                            });
                        } else {
                            errors.push({
                                employeeId: user.employeeId,
                                openId: user.openId,
                                error: result.message
                            });
                        }
                    } catch (error) {
                        errors.push({
                            employeeId: user.employeeId,
                            openId: user.openId,
                            error: error.message
                        });
                    }
                });

                await Promise.all(batchPromises);
                
                // 批次间稍作延迟，避免请求过于频繁
                if (i + batchSize < userList.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            console.log(`批量获取完成，成功 ${results.length} 个，失败 ${errors.length} 个`);

            return {
                success: true,
                data: {
                    results: results,
                    errors: errors,
                    summary: {
                        total: userList.length,
                        success: results.length,
                        failed: errors.length,
                        fetchTime: new Date().toISOString()
                    }
                },
                message: `批量获取完成，成功 ${results.length} 个，失败 ${errors.length} 个`
            };

        } catch (error) {
            console.error('批量获取用户数据失败:', error);
            return {
                success: false,
                error: error.message,
                message: '批量获取用户数据失败: ' + error.message
            };
        }
    }

    /**
     * 处理API错误
     * @param {Object} error - 错误对象
     * @returns {string} 错误描述
     */
    handleAPIError(error) {
        const errorMessages = {
            '20028001003': 'access_token无效，请重新授权',
            '20028001008': 'access_token过期，请刷新或重新授权',
            '20028001005': '系统内部错误，请重试',
            '20028001006': '网络调用错误，请重试',
            '20028001007': '参数不合法，请检查请求参数',
            '20028001014': '应用未授权任何能力，请检查应用配置',
            '20028001018': '应用未获得该能力，请开通相关能力',
            '20028003017': 'quota已用完，请联系平台处理',
            '20028001019': '应用该能力已被封禁，请联系平台处理',
            '20028001016': '当前应用已被封禁或下线'
        };

        if (error.err_no && errorMessages[error.err_no]) {
            return errorMessages[error.err_no];
        }

        return error.err_msg || error.message || '未知错误';
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DouyinAPI;
} else {
    window.DouyinAPI = DouyinAPI;
}