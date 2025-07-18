# GitHub 快速部署脚本 (PowerShell)
# 使用方法：在PowerShell中运行 .\deploy.ps1

Write-Host "=== 抖音数据推送及分析工具 - GitHub部署脚本 ===" -ForegroundColor Green
Write-Host ""

# 检查是否在正确的目录
if (-not (Test-Path "index.html")) {
    Write-Host "错误：请在项目根目录中运行此脚本！" -ForegroundColor Red
    exit 1
}

# 获取用户GitHub用户名
$githubUsername = Read-Host "请输入您的GitHub用户名"
if ([string]::IsNullOrWhiteSpace($githubUsername)) {
    Write-Host "错误：GitHub用户名不能为空！" -ForegroundColor Red
    exit 1
}

# 仓库名称
$repoName = "douyin-data-analysis-tool"

Write-Host "正在部署到: https://github.com/$githubUsername/$repoName" -ForegroundColor Yellow
Write-Host ""

# 检查Git状态
Write-Host "1. 检查Git状态..." -ForegroundColor Cyan
git status --porcelain
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误：Git仓库未初始化！" -ForegroundColor Red
    exit 1
}

# 添加远程仓库
Write-Host "2. 配置远程仓库..." -ForegroundColor Cyan
$remoteUrl = "https://github.com/$githubUsername/$repoName.git"

# 检查是否已有远程仓库
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "远程仓库已存在: $existingRemote" -ForegroundColor Yellow
    $confirm = Read-Host "是否要更新远程仓库地址？(y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        git remote set-url origin $remoteUrl
        Write-Host "远程仓库地址已更新" -ForegroundColor Green
    }
} else {
    git remote add origin $remoteUrl
    Write-Host "远程仓库已添加: $remoteUrl" -ForegroundColor Green
}

# 切换到main分支
Write-Host "3. 切换到main分支..." -ForegroundColor Cyan
git branch -M main

# 推送代码
Write-Host "4. 推送代码到GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== 部署成功！ ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步操作：" -ForegroundColor Yellow
    Write-Host "1. 访问您的GitHub仓库: https://github.com/$githubUsername/$repoName" -ForegroundColor White
    Write-Host "2. 进入 Settings > Pages" -ForegroundColor White
    Write-Host "3. 在Source中选择 'Deploy from a branch'" -ForegroundColor White
    Write-Host "4. 选择 'main' 分支和 '/ (root)' 文件夹" -ForegroundColor White
    Write-Host "5. 点击 Save" -ForegroundColor White
    Write-Host ""
    Write-Host "几分钟后，您的网站将在以下地址可用：" -ForegroundColor Green
    Write-Host "https://$githubUsername.github.io/$repoName/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "详细说明请查看 DEPLOYMENT.md 文件" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "=== 部署失败！ ===" -ForegroundColor Red
    Write-Host "请检查：" -ForegroundColor Yellow
    Write-Host "1. GitHub用户名是否正确" -ForegroundColor White
    Write-Host "2. 是否已在GitHub上创建了仓库" -ForegroundColor White
    Write-Host "3. 是否有推送权限" -ForegroundColor White
    Write-Host "4. 网络连接是否正常" -ForegroundColor White
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")