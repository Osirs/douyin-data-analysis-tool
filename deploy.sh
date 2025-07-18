#!/bin/bash
# GitHub 快速部署脚本 (Bash)
# 使用方法：chmod +x deploy.sh && ./deploy.sh

echo "=== 抖音数据推送及分析工具 - GitHub部署脚本 ==="
echo ""

# 检查是否在正确的目录
if [ ! -f "index.html" ]; then
    echo "错误：请在项目根目录中运行此脚本！"
    exit 1
fi

# 获取用户GitHub用户名
read -p "请输入您的GitHub用户名: " github_username
if [ -z "$github_username" ]; then
    echo "错误：GitHub用户名不能为空！"
    exit 1
fi

# 仓库名称
repo_name="douyin-data-analysis-tool"

echo "正在部署到: https://github.com/$github_username/$repo_name"
echo ""

# 检查Git状态
echo "1. 检查Git状态..."
if ! git status --porcelain > /dev/null 2>&1; then
    echo "错误：Git仓库未初始化！"
    exit 1
fi

# 添加远程仓库
echo "2. 配置远程仓库..."
remote_url="https://github.com/$github_username/$repo_name.git"

# 检查是否已有远程仓库
existing_remote=$(git remote get-url origin 2>/dev/null)
if [ -n "$existing_remote" ]; then
    echo "远程仓库已存在: $existing_remote"
    read -p "是否要更新远程仓库地址？(y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        git remote set-url origin $remote_url
        echo "远程仓库地址已更新"
    fi
else
    git remote add origin $remote_url
    echo "远程仓库已添加: $remote_url"
fi

# 切换到main分支
echo "3. 切换到main分支..."
git branch -M main

# 推送代码
echo "4. 推送代码到GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=== 部署成功！ ==="
    echo ""
    echo "下一步操作："
    echo "1. 访问您的GitHub仓库: https://github.com/$github_username/$repo_name"
    echo "2. 进入 Settings > Pages"
    echo "3. 在Source中选择 'Deploy from a branch'"
    echo "4. 选择 'main' 分支和 '/ (root)' 文件夹"
    echo "5. 点击 Save"
    echo ""
    echo "几分钟后，您的网站将在以下地址可用："
    echo "https://$github_username.github.io/$repo_name/"
    echo ""
    echo "详细说明请查看 DEPLOYMENT.md 文件"
else
    echo ""
    echo "=== 部署失败！ ==="
    echo "请检查："
    echo "1. GitHub用户名是否正确"
    echo "2. 是否已在GitHub上创建了仓库"
    echo "3. 是否有推送权限"
    echo "4. 网络连接是否正常"
fi

echo ""
echo "按Enter键退出..."
read