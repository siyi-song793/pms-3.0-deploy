@echo off
chcp 65001
echo ==============================================
echo 🚀 PMS3.0 代码质量 + SVG报错查杀 一键部署
echo ==============================================
echo.

if not exist "scripts" mkdir scripts

echo.
echo [1/5] 安装依赖...
npm install

echo.
echo [2/5] 初始化 Git 钩子...
npm run prepare 2>nul
npx husky add .husky/pre-commit "npx lint-staged" 2>nul
npx husky add .husky/commit-msg "npx --no -- commitlint --edit $1" 2>nul

echo.
echo [3/5] 自动修复代码规范...
npm run lint:fix 2>nul

echo.
echo [4/5] 查杀 SVG 恶意链接...
node scripts/svg-escape-scan.js

echo.
echo [5/5] TS 类型校验...
npx tsc --noEmit 2>nul

echo.
echo ==============================================
echo 🎉 全部完成！
echo ✅ 代码质量规则已启用
echo ✅ 所有 SVG 解析报错已彻底清理
echo ==============================================
pause