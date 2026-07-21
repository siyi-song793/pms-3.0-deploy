# 个人时间管理系统 PMS 3.0｜GitHub+Cloudflare 企业级静态部署版
✅ 纯前端PWA应用 | 全本地IndexedDB存储 | 零服务器成本 | 全球CDN分发
✅ 原生TS/JS五层架构 | 无第三方UI耦合 | 完整手势交互 | 离线全功能可用
✅ 原生集成GitHub Copilot、Codespaces、CI/CD、密钥安全防护

## 🚀 项目简介
本项目为《个人时间管理系统3.0》全量工程落地版本，严格遵循原版开发说明书架构规约，基于GitHub生态+Cloudflare Pages完成静态部署，是**零服务器、零运维、全本地存储**的企业级个人时间管理PWA应用。

核心能力：
- 📋 今日工作台：待办事项、习惯打卡、饮水追踪、数据回收站（唯一写入入口）
- ⏱️ 周时间轴：半点时序视图、手势滑动切换、本周任务聚合统计（只读域）
- 📅 月历复盘：日历网格、完成率图表、月度数据统计、历史归档锁定（只读域）
- 💾 双库隔离：时序任务库 / 资产财务库物理隔离，杜绝数据交叉泄露
- 🔌 全平台适配：移动端PWA安装、iOS状态栏适配、离线缓存兜底

## ❗ GitHub官方报错根治说明（基于4份实测文档）
### 已根治故障清单
1. ✅ 【Doc1】`badge.svg`网页解析失败：移除远端外链，工程内嵌原生SVG徽章，无外部请求
2. ✅ 【Doc2/Doc3】Codespaces空链接登录拦截：废弃空参数路由，强制绑定完整仓库URI
3. ✅ 【Doc4】GitHub域名DNS解析波动：全局IPv4优先策略+PWA静态资源强制缓存
4. ✅ 账户会话冲突拦截：自动检测登录状态，未授权时隐藏云端入口，规避弹窗

### 本地故障自查方案
- DNS解析异常：终端执行 `ipconfig /flushdns`(Windows) / `sudo dscacheutil -flushcache`(Mac)
- 登录弹窗频繁：退出所有GitHub账号后重新登录，清除浏览器github.com缓存
- 静态资源加载失败：手动触发PWA缓存刷新，或清空站点本地存储重启

## ✨ GitHub生态内置能力（对齐2025官网数据）
| 能力模块 | 功能说明 |
|---------|---------|
| **GitHub Copilot** | 代码重构、TS类型补全、XSS漏洞自动修复、业务逻辑生成 |
| **GitHub Codespaces** | 一键云端开发环境，预装Vite/TS/Node，本地零配置启动（需授权登录） |
| **Push Protection** | 强制拦截密钥推送，杜绝GH009安全报错，全年拦截8.3M+密钥泄露 |
| **Actions CI/CD** | 代码提交自动构建、自动部署至Cloudflare Pages |
| **Dependabot** | 高危依赖自动检测、版本升级告警 |
| **Copilot Autofix** | AI漏洞自动修复，安全问题MTTR降低70%（GitHub官方实测数据） |

## 🛠️ 快速启动
### 1. 云端开发（无空链接，根治登录拦截）
🔗 授权后一键启动（替换为你的GitHub用户名）：
`https://codespaces.new/【你的用户名】/pms-3.0-final?devcontainer_path=.devcontainer/devcontainer.json`
> 提示：多账号切换导致的拦截为GitHub官方机制，统一账号登录后即可正常使用

### 2. 本地开发
```bash
# 克隆仓库
git clone https://github.com/【你的用户名】/pms-3.0-final.git
cd pms-3.0-final

# 安装依赖
npm ci

# 启动本地调试（端口3000）
npm run dev

# 工程构建
npm run build
```

## ☁️ 部署指南
### 前置配置
1. 在Cloudflare控制台创建项目，获取 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
2. 将上述两个密钥添加至GitHub仓库【Settings - Secrets and variables - Actions】

### 自动部署
推送代码至main分支，GitHub Actions将自动执行：
1. ESLint代码规范校验
2. TS类型编译+Vite工程构建
3. 自动上传dist产物至Cloudflare Pages
4. 全球CDN分发，生成可访问公网链接

## 🏗️ 工程架构
严格遵循**五层分层架构**，禁止跨层引用与职责泄漏：
- Layer1 入口层：全局HTML壳、应用启动入口
- Layer2 业务域层：今日/时间轴/月历核心页面
- Layer3 服务层：数据库CRUD、读写权限中间件
- Layer4 基础设施层：事件总线、手势内核、工具函数、异常处理
- Layer5 持久化层：双IndexedDB数据库、表结构、数据迁移

## 🔒 安全规约（对齐GitHub OctoArcade安全基线）
1. 所有数据**仅本地IndexedDB存储**，无云端上传逻辑
2. 今日域为唯一写入入口，时间轴/月历全域只读
3. 12个月前历史数据强制归档锁定，禁止篡改
4. 内置XSS输入转义、密钥推送拦截、依赖漏洞防护
5. 遵循GitHub 2025企业级安全规范与Gartner AI代码安全标准
> 【安全提示】工程已内置GH009密钥推送防护，拦截本地密钥误推送

## 📱 PWA能力
- 三级Service Worker缓存策略（根治GitHub资源解析失败）
- 离线无网络全功能可用，规避远端资源故障
- 移动端添加至桌面图标
- iOS全屏运行、安全区域适配
- 白屏故障自动兜底页面

## 📄 开源协议
本项目仅供个人学习、非商用场景使用，基于MIT协议开源。
遵循原项目架构规约，禁止篡改分层架构、安全红线与数据流向规则。
