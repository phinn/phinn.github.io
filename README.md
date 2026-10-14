# phinn.github.io — 个人服务主站

企业 AI Agent 落地咨询 / 数据交叉分析报告 / iOS 提审托管。

## 结构

```
index.html        # 服务页(含 AI 客服对话组件,前端自带离线 FAQ 兜底)
worker/ai-chat.js # Cloudflare Worker:AI 客服后端(GLM-4-Flash,免费)
wrangler.toml     # Worker 配置
DEPLOY.md         # 部署手册
```

## AI 客服架构(降级三态)

1. **正常**:前端 → `/api/chat`(Cloudflare Worker)→ GLM-4-Flash,带完整销售话术知识库
2. **Worker 未配**:fetch 失败 → 自动降级本地规则版 FAQ(关键词匹配,覆盖价格/流程/安全/联系等 8 类)
3. **降级后**:标题栏显示「离线问答模式」,页面永不打烊

## 本地预览

```bash
cd phinn.github.io && python3 -m http.server 8000
# open http://127.0.0.1:8000
```

Worker 未部署时本地即可测降级链路(Origin 允许 127.0.0.1:8000)。

## 部署

见 [DEPLOY.md](DEPLOY.md)。核心:GitHub Pages 托管页面(推送 main 即发布),Worker 单独部署后绑定自有域名 `/api/*` 路由。
