# 纸上电波 · PaperEX

PaperEX 的零依赖静态个人博客，面向 GitHub Pages 构建。

## 特点

- 纯 HTML、CSS、JavaScript，无构建步骤与第三方运行时依赖
- 响应式排版、深浅主题、键盘可访问性与减少动效支持
- 首页展示最近三篇文章，并提供按时间倒序排列的全部文章页
- 独立成就之墙展示实时账号数据、最新作品与开源项目
- 成就区每小时同步 YouTube 订阅数、最新视频和 Bilibili 关注数
- 底部集成 Mysterium 塔罗、眼跳时辰日晷与主播邻国 UpLingo

## 本地预览

```powershell
python -m http.server 4173
```

然后打开 `http://localhost:4173`。

## 发布

仓库通过 `.github/workflows/update-social-data.yml` 发布 GitHub Pages：推送到 `main` 时发布一次，此后每小时刷新社交数据并重新部署。

首次启用时需要：

1. 在 Google Cloud 启用 YouTube Data API v3，并创建 API Key。
2. 在 GitHub 仓库的 `Settings → Secrets and variables → Actions` 中添加名为 `YOUTUBE_API_KEY` 的 Secret。
3. 在 `Settings → Pages → Build and deployment` 中将 Source 设为 `GitHub Actions`。

没有 API Key 时，最新视频仍会通过公开 Feed 更新，但 YouTube 订阅数会保留上一次缓存值。Bilibili 关注数不需要密钥。
