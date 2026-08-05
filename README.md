# 纸上电波 · PaperEX

PaperEX 的零依赖静态个人博客，面向 GitHub Pages 构建。

## 特点

- 纯 HTML、CSS、JavaScript，无构建步骤与第三方运行时依赖
- 响应式排版、深浅主题、键盘可访问性与减少动效支持
- 文章分类筛选与三篇可独立访问的示例文章
- 底部集成 Mysterium 塔罗与眼跳时辰日晷

## 本地预览

```powershell
python -m http.server 4173
```

然后打开 `http://localhost:4173`。

## 发布

仓库使用 GitHub Pages 从 `main` 分支根目录发布。推送到 `main` 后会自动更新。
