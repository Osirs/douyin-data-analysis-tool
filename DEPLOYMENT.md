# GitHub 部署指南

本指南将帮助您将抖音数据推送及分析工具部署到GitHub并启用GitHub Pages。

## 前提条件

- 拥有GitHub账号
- 本地已安装Git
- 项目文件已准备就绪

## 部署步骤

### 1. 创建GitHub仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `douyin-data-analysis-tool`
   - **Description**: `抖音数据推送及分析工具 - 企业员工抖音数据管理平台`
   - **Visibility**: 选择 Public（公开仓库才能使用免费的GitHub Pages）
   - **不要**勾选 "Add a README file"（我们已经有了）
4. 点击 "Create repository"

### 2. 连接本地仓库到GitHub

在项目目录中执行以下命令：

```bash
# 添加远程仓库（请替换为您的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/douyin-data-analysis-tool.git

# 推送代码到GitHub
git branch -M main
git push -u origin main
```

### 3. 启用GitHub Pages

1. 在GitHub仓库页面，点击 "Settings" 选项卡
2. 在左侧菜单中找到 "Pages"
3. 在 "Source" 部分：
   - 选择 "Deploy from a branch"
   - Branch 选择 "main"
   - Folder 选择 "/ (root)"
4. 点击 "Save"

### 4. 访问您的网站

几分钟后，您的网站将在以下地址可用：
```
https://YOUR_USERNAME.github.io/douyin-data-analysis-tool/
```

## 自动化部署脚本

为了方便后续更新，您可以使用以下脚本：

### Windows (PowerShell)
```powershell
# deploy.ps1
git add .
git commit -m "更新: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git push origin main
Write-Host "部署完成！网站将在几分钟后更新。"
```

### macOS/Linux (Bash)
```bash
#!/bin/bash
# deploy.sh
git add .
git commit -m "更新: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main
echo "部署完成！网站将在几分钟后更新。"
```

## 自定义域名（可选）

如果您有自己的域名，可以：

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容为您的域名，例如：`douyin-tool.yourdomain.com`
3. 在您的域名DNS设置中添加CNAME记录指向 `YOUR_USERNAME.github.io`

## 注意事项

### 安全考虑
- 不要在代码中包含真实的API密钥
- 使用环境变量或配置文件管理敏感信息
- 定期更新依赖项

### 性能优化
- 启用浏览器缓存
- 压缩CSS和JavaScript文件
- 优化图片大小

### SEO优化
- 添加适当的meta标签
- 使用语义化HTML
- 添加sitemap.xml

## 故障排除

### 常见问题

1. **GitHub Pages没有更新**
   - 检查Actions选项卡是否有构建错误
   - 确保推送到了正确的分支
   - 等待几分钟，GitHub Pages更新需要时间

2. **404错误**
   - 确保index.html在仓库根目录
   - 检查文件名大小写
   - 确认仓库是公开的

3. **样式或脚本不加载**
   - 检查文件路径是否正确
   - 确保所有文件都已推送到GitHub
   - 检查浏览器控制台的错误信息

### 获取帮助

- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [Git 官方文档](https://git-scm.com/doc)
- GitHub Community 论坛

## 更新流程

每次修改代码后：

1. 测试本地更改
2. 提交更改到Git
3. 推送到GitHub
4. 等待GitHub Pages自动部署

```bash
git add .
git commit -m "描述您的更改"
git push origin main
```

---

**祝您部署顺利！** 🚀