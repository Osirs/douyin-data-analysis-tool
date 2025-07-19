# 抖音数据推送及分析工具

基于MySQL数据库的企业级抖音数据管理和分析解决方案。

## 功能特性

### 🔐 员工管理
- 员工信息的增删改查
- 抖音账号绑定管理
- 授权状态实时监控
- 批量操作支持

### 🚀 授权流程
- 抖音开放平台OAuth2.0授权
- 自动获取和刷新访问令牌
- 授权状态可视化管理
- 安全的令牌存储

### 📊 数据同步
- 用户基础信息同步
- 粉丝数据获取
- 视频数据分析
- 定时同步机制
- 同步历史记录

### 📈 数据分析
- 实时统计面板
- 数据趋势分析
- 多维度数据展示
- 数据导出功能

## 技术架构

### 前端技术
- **HTML5/CSS3**: 现代化响应式界面
- **JavaScript ES6+**: 原生JavaScript开发
- **Fetch API**: RESTful API调用
- **模块化设计**: 组件化开发模式

### 后端技术
- **Node.js**: 服务器运行环境
- **Express.js**: Web应用框架
- **MySQL**: 关系型数据库
- **mysql2**: MySQL数据库驱动
- **CORS**: 跨域资源共享

### 数据库设计
- **employees**: 员工信息表
- **auth_tokens**: 授权令牌表
- **user_data**: 用户数据表
- **video_data**: 视频数据表
- **sync_records**: 同步记录表
- **system_config**: 系统配置表

## 安装部署

### 环境要求
- Node.js >= 14.0.0
- MySQL >= 5.7
- npm >= 6.0.0

### 1. 安装依赖
```bash
npm install
```

### 2. 数据库配置

#### 创建数据库
```sql
CREATE DATABASE douyin_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 初始化数据库结构
```bash
mysql -u root -p douyin_analytics < config/init.sql
```

### 3. 环境配置

复制环境配置文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接信息：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=douyin_analytics

# 抖音开放平台配置
DOUYIN_CLIENT_KEY=your_client_key
DOUYIN_CLIENT_SECRET=your_client_secret
```

### 4. 启动服务

#### 开发模式
```bash
npm run dev
```

#### 生产模式
```bash
npm start
```

### 5. 访问应用

打开浏览器访问：`http://localhost:3000`

## 使用指南

### 1. 员工管理
- 添加员工信息
- 绑定抖音账号
- 管理授权状态

### 2. 数据同步
- 手动同步数据
- 查看同步历史
- 监控同步状态

### 3. 数据分析
- 查看统计面板
- 导出数据报告
- 分析数据趋势

## 项目结构

```
douyin-analytics-tool/
├── config/
│   └── init.sql              # 数据库初始化脚本
├── index.html                # 主页面
├── script.js                 # 前端逻辑
├── style.css                 # 样式文件
├── douyin_auth.html          # 授权页面
├── douyin_auth.js            # 授权逻辑
├── server.js                 # 后端服务器
├── database.js               # 数据库管理
├── package.json              # 项目配置
├── .env.example              # 环境配置模板
└── README.md                 # 项目说明
```

## 更新日志

### v2.0.0 (2024-01-01)
- 🔄 数据存储从localStorage迁移到MySQL
- 🚀 新增Node.js后端服务
- 📡 实现RESTful API接口
- 🔐 增强安全性和数据持久化
- 📊 优化数据分析功能

### v1.0.0
- 初始版本发布
- 基础功能实现