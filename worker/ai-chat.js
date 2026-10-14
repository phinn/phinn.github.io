/**
 * AI 客服 Worker — phinn.github.io/api/chat
 * 模型:智谱 GLM-4-Flash(免费、国内直连)
 * 部署:
 *   1. npm i -g wrangler && wrangler login
 *   2. wrangler secret put ZHIPU_API_KEY   # 粘贴 https://open.bigmodel.cn 的 API Key
 *   3. wrangler deploy
 *   4. Cloudflare Dashboard → Workers → 该 Worker → Domains & Routes
 *      绑定 Custom Domain: phinn.github.io 的自有域名路径 /api/* 
 *      (GitHub Pages 不支持反代,推荐:域名 A 记录指向 Cloudflare,
 *       Worker Route: yourdomain.com/api/* ;页面 JS 里 API 变量改为绝对地址)
 * CORS:仅允许站点来源,防止被人白嫖接口刷 token
 */

const SYSTEM_PROMPT = `你是 Phinn 的 AI 客服,服务于他的独立咨询业务。用简体中文,口语化、简短、专业,单次回复不超过 200 字。

# 你推销的服务(基于事实,不得编造)
1. 企业 AI Agent 落地咨询(主打):场景评估→POC→生产部署→插件定制。单次评估 ¥3,000 起,项目制 ¥30k 起,第一轮评估免费。
2. 数据交叉分析报告:CRM/ERP/工单多源数据交叉分析,暗色 ECharts 交互报告交付。有医疗器械(Sysmex CRM)真实交付经验。按份/按月订阅。
3. iOS 提审托管:ASC API 自动提审、素材体检、4.3 模板指纹排查、被拒急救。¥3,000-8,000/单。
4. KinetAios 企业定制:基于开源引擎(github.com/phinn/KinetAios,多引擎/ReAct/四层架构/分层记忆/MCP)定制企业专属 Agent 工作台。

# 关于 Phinn(用于回答背景问题)
独立开发者,一人 + AI 工作流。KinetAios 开源引擎作者(70 天 1000+ clone)。6+ 款 App 上架 Apple 全家桶。擅长:Agent 引擎架构、端侧 Local-First(SQLite C API)、LLM 多协议(SSE/GLM/Anthropic/豆包 Realtime)、医疗数据交叉分析、Electron/Swift/TypeScript/Python。

# 行为规则
- 报价问题:给区间 + 强调"第一轮评估免费、固定总价、中途不加价"
- 流程问题:评估 1 周 / POC 1-2 周 / 落地 2-8 周,每阶段独立报价可随时停
- 数据安全:支持全私有化,数据不出客户机房
- 超出知识范围:引导发邮件 phinn@outlook.com(24h 内回复),或建议留下联系方式
- 对方明显是来砍价或套方案的:礼貌坚持"免费评估后给固定总价",不免费出详细方案
- 不闲聊,每轮结尾自然推动下一步(留联系方式 / 发邮件 / 约评估)`;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (request.method !== 'POST') return cors(new Response('method not allowed', { status: 405 }));

    const origin = request.headers.get('Origin') || '';
    const ALLOWED = ['https://phinn.github.io', 'http://127.0.0.1:8000', 'http://localhost:8000'];
    if (ALLOWED.length && origin && !ALLOWED.includes(origin)) {
      return cors(new Response('forbidden', { status: 403 }));
    }

    let body;
    try { body = await request.json(); } catch { return cors(new Response('bad json', { status: 400 })); }
    const msgs = (body.messages || [])
      .filter(m => m && typeof m.content === 'string' && m.content.length < 2000)
      .slice(-10)
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
    if (!msgs.length) return cors(new Response('no messages', { status: 400 }));

    const upstream = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...msgs],
        temperature: 0.4,
        max_tokens: 600
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      return cors(new Response(JSON.stringify({ error: 'upstream', detail: errText.slice(0, 200) }), { status: 502 }));
    }
    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || '抱歉刚才没接上,请再问一次,或直接邮件 phinn@outlook.com。';
    return cors(new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    }));
  }
};

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}
