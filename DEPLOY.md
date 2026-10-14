# 部署手册

## 一、GitHub Pages(页面)

本仓库 `main` 分支即 GitHub Pages 源。首次部署需在 GitHub 网页开一次开关:

```bash
gh repo create phinn.github.io --public --source=. --push
# 然后:GitHub → phinn.github.io → Settings → Pages →
#   Source: Deploy from a branch → main / (root) → Save
```

等 1-2 分钟,https://phinn.github.io 即上线。

## 二、AI 客服 Worker(可选,但强烈建议)

没有 Worker 时页面自动走本地 FAQ 兜底,不影响访问;部署后升级为真 AI 对话。

```bash
npm i -g wrangler
wrangler login
cd worker 目录的仓库根
wrangler secret put ZHIPU_API_KEY     # 粘贴 open.bigmodel.cn 的 key(个人认证免费额度即可)
wrangler deploy                        # 得到 https://phinn-ai-chat.<subdomain>.workers.dev
```

### 接线(二选一)

**方式 A — 自有域名(推荐,SEO + 可换后端)**
1. 域名 DNS 托管到 Cloudflare(免费计划)
2. wrangler.toml 加 routes(见文件内注释),重新 `wrangler deploy`
3. 页面 fetch `/api/chat` 走同域,零 CORS 问题
4. GitHub Pages 侧:Settings → Pages → Custom domain 填该域名

**方式 B — 无域名(最快)**
1. `wrangler.toml` 里 `workers_dev = true`(默认就是)
2. `index.html` 顶部 `var API = '/api/chat'` 改成 workers.dev 绝对地址
3. `worker/ai-chat.js` 的 ALLOWED 数组加上 `https://phinn.github.io` 已有;workers.dev 域名只在控制台看
4. 重新推送页面

## 三、验证清单

- [ ] https://phinn.github.io 200
- [ ] 点快捷问题有回复(Worker 未配 → 显示「离线问答模式」)
- [ ] 配完 Worker 后:问"怎么收费"返回基于知识库的话术
- [ ] 手机 Safari 打开排版正常
