/**
 * 抖音开放平台API调用模块
 * 实现用户数据获取的各种接口
 */

class DouyinAPI {
    constructor() {
        this.baseUrl = 'https://open.douyin.com';
        this.endpoints = {
            // 用户数据相关接口
            userInfo: '/api/douyin/v1/user/info/',
            userVideoStatus: '/data/external/user/item/',
            userFans: '/data/external/user/fans/',
            userLike: '/data/external/user/like/',
            userComment: '/data/external/user/comment/',
            userShare: '/data/external/user/share/',
            userProfile: '/data/external/user/profile/',
            
            // 视频数据相关接口
            videoList: '/api/douyin/v1/video/list/',
            videoData: '/data/external/item/base/',
            
            // 其他接口
            relatedId: '/api/douyin/v1/auth/get_related_id/'
        };
    }

    /**
     * 通用API请求方法
     * @param {string} endpoint - API端点
     * @param {Object} params - 请求参数
     * @param {string} accessToken - 访问令牌
     * @param {string} method - 请求方法
     * @returns {Promise<Object>} API响应
     */
    async makeRequest(endpoint, params = {}, accessToken, method = 'GET') {
        try {
            const url = this.baseUrl + endpoint;
            const headers = {
                'Content-Type': 'application/json',
                'access-token': accessToken
            };

            let requestOptions = {
                method: method,
                headers: headers
            };

            if (method === 'GET') {
                const queryString = new URLSearchParams(params).toString();
                const fullUrl = queryString ? `${url}?${queryString}` : url;
                requestOptions.url = fullUrl;
            } else {
                requestOptions.body = JSON.stringify(params);
            }

            const response = await fetch(method === 'GET' ? requestOptions.url || url : url, requestOptions);
            const data = await response.json();

            if (data.err_no === 0 || data.error_code === 0) {
                return {
                    success: true,
                    data: data.data || data,
                    message: '请求成功'
                };
            } else {
                console.error('API请求失败:', data);
                return {
                    success: false,
                    error: data,
                    message: data.err_msg || data.message || 'API请求失败'
                };
            }
        } catch (error) {
            console.error('网络请求失败:', error);
            return {
                success: false,
                error: error.message,
                message: '网络请求失败: ' + error.message
            };
        }
    }

    /**
     * 获取用户基本信息
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @returns {Promise<Object>} 用户信息
     */
    async getUserInfo(openId, accessToken) {
        const params = { open_id: openId };
        return await this.makeRequest(this.endpoints.userInfo, params, accessToken, 'POST');
    }

    /**
     * 获取用户视频情况
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户视频数据
     */
    async getUserVideoStatus(openId, accessToken, dateType = 7) {
        const params = {
            open_id: openId,
            date_type: dateType
        };
        return await this.makeRequest(this.endpoints.userVideoStatus, params, accessToken, 'GET');
    }

    /**
     * 获取用户粉丝数据
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户粉丝数据
     */
    async getUserFansData(openId, accessToken, dateType = 7) {
        const params = {
            open_id: openId,
            date_type: dateType
        };
        return await this.makeRequest(this.endpoints.userFans, params, accessToken, 'GET');
    }

    /**
     * 获取用户点赞数据
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户点赞数据
     */
    async getUserLikeData(openId, accessToken, dateType = 7) {
        const params = {
            open_id: openId,
            date_type: dateType
        };
        return await this.makeRequest(this.endpoints.userLike, params, accessToken, 'GET');
    }

    /**
     * 获取用户评论数据
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户评论数据
     */
    async getUserCommentData(openId, accessToken, dateType = 7) {
        const params = {
            open_id: openId,
            date_type: dateType
        };
        return await this.makeRequest(this.endpoints.userComment, params, accessToken, 'GET');
    }

    /**
     * 获取用户分享数据
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户分享数据
     */
    async getUserShareData(openId, accessToken, dateType = 7) {
        const params = {
            open_id: openId,
            date_type: dateType
        };
        return await this.makeRequest(this.endpoints.userShare, params, accessToken, 'GET');
    }

    /**
     * 获取用户主页访问数据
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @param {number} dateType - 时间类型 (7/15/30天)
     * @returns {Promise<Object>} 用户主页访问数据
     */
    async getUserProfileData(openId, accessToken, dateType = 7) {
        const params = {
            open_id: openId,
            date_type: dateType
        };
        return await this.makeRequest(this.endpoints.userProfile, params, accessToken, 'GET');
    }

    /**
     * 获取用户唯一标识
     * @param {string} openId - 用户openId
     * @param {string} accessToken - 访问令牌
     * @returns {Promise<Object>} 用户唯一标识
     */
    async getUserRelatedId(openId, accessToken) {
        const params = { open_id: openId };
        return await this.makeRequest(this.endpoints.relatedId, params, accessToken, 'POST');
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
        const params = {
            open_id: openId,
            count: count,
            cursor: cursor
        };
        return await this.makeRequest(this.endpoints.videoList, params, accessToken, 'POST');
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