const state = {
  data: null,
  sceneIndex: 0,
  tab: "effect",
  codeKey: "graph",
};

const TABS = [
  { key: "effect", label: "🛰️ 效果演示" },
  { key: "graph", label: "🧭 LangGraph 路由" },
  { key: "review", label: "🧑‍⚖️ 人工复核" },
  { key: "report", label: "📄 报告与产物" },
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function fmt(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function pct(value) {
  const n = Math.max(0, Math.min(1, Number(value) || 0));
  return Math.round(n * 100);
}

function levelBadge(level) {
  const l = String(level || "").toLowerCase();
  const text = l === "high" ? "high" : l === "medium" ? "medium" : l === "low" ? "low" : "-";
  return `<span class="level ${l || ""}">${text}</span>`;
}

function routeChip(route) {
  const cls = route === "investigation" ? "blue" : route === "enhancement" ? "amber" : route === "finish" ? "teal" : "";
  return `<span class="chip ${cls}">${esc(route)}</span>`;
}

function currentScene() {
  return state.data.scenes[state.sceneIndex];
}

function renderSceneList() {
  const list = $("#scene-list");
  list.innerHTML = state.data.scenes
    .map((scene, index) => `
      <button class="scene-btn ${index === state.sceneIndex ? "active" : ""}" data-scene="${index}">
        <span class="scene-label">${esc(scene.label)}</span>
        <span class="scene-title">${esc(scene.title)}</span>
        <span class="scene-route">${esc((scene.route_history || []).join(" → "))}</span>
      </button>`)
    .join("");
}

function renderHeader(scene) {
  const route = (scene.route_history || []).map(routeChip).join("");
  $("#scene-header").innerHTML = `
    <div class="eyebrow">${esc(scene.label)} · ${esc(scene.title)}</div>
    <h2>${esc(scene.short)}</h2>
    <p>Run ID：<code>${esc(scene.run_id)}</code> · 状态：<code>${esc(scene.status)}</code></p>
    <div class="chips">${route}</div>`;
}

function renderMetrics(scene) {
  const m = scene.metrics || {};
  const items = [
    ["疑似图斑", fmt(m.findings, 0), "个"],
    ["总面积", fmt(m.area_m2, 1), "m²"],
    ["整体置信度", fmt(m.confidence, 3), m.level || ""],
    ["质量门控", esc(m.gate || "-"), m.actions ? `${m.actions} 个增强动作` : "无增强动作"],
    ["增强动作", fmt(m.actions, 0), "parameter_sweep / TTA / review"],
    ["人工复核", m.reviewed ? "已复核" : "未触发", m.reviewed ? "interrupt / resume" : "自动流程"],
  ];
  $("#metrics").innerHTML = items
    .map(([label, value, sub]) => `
      <div class="metric">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
        <div class="sub">${esc(sub)}</div>
      </div>`)
    .join("");
}

function renderTabs() {
  $("#tabs").innerHTML = TABS
    .map((tab) => `<button class="tab-btn ${state.tab === tab.key ? "active" : ""}" data-tab="${tab.key}">${tab.label}</button>`)
    .join("");
}

function imageCard(src, title, sub) {
  if (!src) return "";
  return `
    <figure class="image-card">
      <img src="${esc(src)}" alt="${esc(title)}" loading="lazy" />
      <figcaption><b>${esc(title)}</b><span>${esc(sub)}</span></figcaption>
    </figure>`;
}

function renderEffect(scene) {
  const imgs = scene.images || {};
  const imageHtml = [
    imageCard(imgs.t1, "T1 · 前一时相", "小范围脱敏裁剪"),
    imageCard(imgs.t2, "T2 · 后一时相", "同一窗口配准"),
    imageCard(imgs.prob_overlay, "变化概率叠加", "magma colormap"),
    imageCard(imgs.mask_overlay, "变化掩膜叠加", "红色 = 变化区域"),
  ].filter(Boolean).join("");

  const crops = (imgs.crops || []).map((src, index) => `
    <div class="crop-card">
      <img src="${esc(src)}" alt="Top finding ${index + 1}" loading="lazy" />
      <div>Top ${index + 1} · T1 / T2 / probability</div>
    </div>`).join("");

  const findings = (scene.findings || []).map((f) => {
    const flags = (f.flags || []).join(", ") || "-";
    const review = f.review_status || "pending";
    return `
      <tr>
        <td><b>${esc(f.id)}</b></td>
        <td class="num">${fmt(f.area_m2, 1)}</td>
        <td>
          <div class="bar"><span style="width:${pct(f.mean_prob)}%"></span></div>
          <span class="muted">${fmt(f.mean_prob, 3)}</span>
        </td>
        <td>${levelBadge(f.confidence_level)}</td>
        <td>${esc(flags)}</td>
        <td><span class="status ${esc(review)}">${esc(review)}</span></td>
      </tr>`;
  }).join("");

  $("#tab-content").innerHTML = `
    <section class="panel">
      <h3>影像、概率图与掩膜</h3>
      <p class="muted">模型输出概率图，再由质量门控决定是否进入增强链路。</p>
      <div class="image-grid">${imageHtml || '<div class="info-box">没有影像产物。</div>'}</div>
    </section>

    <section class="panel">
      <h3>Top 图斑三联图</h3>
      <p class="muted">每张图包含 T1 / T2 / 概率图，用于人工快速判断。</p>
      ${crops ? `<div class="crop-grid">${crops}</div>` : '<div class="info-box">该场景没有生成 crop 图。</div>'}
    </section>

    <section class="panel">
      <h3>图斑明细</h3>
      <p class="muted">面积、平均概率、置信等级、标记与复核状态。</p>
      ${findings ? `
        <table class="data-table">
          <thead><tr><th>ID</th><th>面积 (m²)</th><th>平均概率</th><th>等级</th><th>标记</th><th>复核状态</th></tr></thead>
          <tbody>${findings}</tbody>
        </table>` : '<div class="info-box">没有满足面积阈值的图斑。</div>'}
    </section>

    ${imgs.overview ? `
      <section class="panel">
        <h3>整体概览</h3>
        <p class="muted">概率图 + 掩膜的整体视图。</p>
        <img src="${esc(imgs.overview)}" alt="overview" style="width:100%;border-radius:12px;" loading="lazy" />
      </section>` : ""}
  `;
}

function topLevelFlow(scene) {
  const route = scene.route_history || [];
  const actions = scene.actions || [];
  const inv = route.includes("investigation");
  const enh = route.includes("enhancement") || actions.length > 0;
  const fin = route.includes("finish") || scene.status === "done";
  const review = scene.reviewed || actions.some((a) => String(a).includes("human_review"));

  return `
    <div class="flow-wrap">
      <div class="flow-top">
        <span class="node">START</span>
        <span class="arrow">→</span>
        <span class="node super active">Supervisor <small>路由 + 护栏</small></span>
      </div>
      <div class="route-cards">
        <div class="route-card ${inv ? "active" : ""}">
          <div class="route-cond">无调查结果</div>
          <div class="node ${inv ? "active" : ""}">Investigation <small>预处理 / 推理 / 评估</small></div>
          <div class="route-desc">自然语言请求 → 场景解析 → BIT 推理 → 图斑 + 置信度。</div>
        </div>
        <div class="route-card ${enh ? "active" : ""}">
          <div class="route-cond">质量门控失败</div>
          <div class="node ${enh ? "active amber" : ""}">Enhancement <small>调参 / TTA / 复核</small></div>
          <div class="route-desc">参数扫描 → TTA → 人工复核 → 解释报告。</div>
          ${review ? '<div class="sub-node">Human Review · interrupt(payload)</div>' : ""}
        </div>
        <div class="route-card ${fin ? "active" : ""}">
          <div class="route-cond">通过 / 达到上限</div>
          <div class="node ${fin ? "active" : ""}">Finish <small>报告 + 回答</small></div>
          <div class="route-desc">生成 report.md、GeoJSON、CSV 和最终回答。</div>
        </div>
      </div>
      <div class="back-row">Investigation / Enhancement 完成后都会回到 Supervisor，再次判断下一步。</div>
    </div>`;
}

function enhancementFlow(scene) {
  const actions = new Set(scene.actions || []);
  const sweep = actions.has("parameter_sweep");
  const reinfer = actions.has("tta_reinfer");
  const review = scene.reviewed || actions.has("human_review");
  const explain = actions.has("explain");
  return `
    <div class="subflow flow-wrap">
      <div class="node active">diagnose <small>质量门控诊断</small></div>
      <div class="arrow">↓</div>
      <div class="subflow-row">
        <div class="node ${sweep ? "active" : ""}">sweep <small>参数扫描</small></div>
        <div class="node ${reinfer ? "active" : ""}">reinfer <small>TTA</small></div>
        <div class="node ${review ? "active rose" : ""}">review <small>interrupt</small></div>
        <div class="node ${explain ? "active indigo" : ""}">explain <small>报告</small></div>
      </div>
      <div class="arrow">↓</div>
      <div class="node active">reassess <small>重新评估</small></div>
      <div class="arrow">↓</div>
      <div class="node ${review ? "active rose" : ""}">Human Review <small>暂停 / 恢复</small></div>
      <div class="arrow">↓</div>
      <div class="node active indigo">Finish <small>报告</small></div>
    </div>`;
}

function auditTimeline(scene) {
  const audit = scene.audit || [];
  if (!audit.length) return '<div class="info-box">没有审计记录。</div>';
  return `<div class="timeline">${audit.map((item) => `
    <div class="timeline-item">
      <div><span class="timeline-node">${esc(item.node)}</span><span class="timeline-ts">${esc(item.ts || "")}</span></div>
      <div class="timeline-detail">${esc(item.detail || "")}</div>
    </div>`).join("")}</div>`;
}

function stateTable(scene) {
  const m = scene.metrics || {};
  const rows = [
    ["scene", scene.id],
    ["findings", m.findings],
    ["confidence.overall", fmt(m.confidence, 3)],
    ["assessment.needs_enhancement", m.gate === "未通过" ? "true" : "false"],
    ["enhancement.actions", (scene.actions || []).join(", ") || "—"],
    ["reviewed", scene.reviewed ? "true" : "false"],
    ["status", scene.status],
  ];
  return `<table class="data-table"><thead><tr><th>状态键</th><th>值</th></tr></thead><tbody>
    ${rows.map(([k, v]) => `<tr><td><code>${esc(k)}</code></td><td>${esc(v)}</td></tr>`).join("")}
  </tbody></table>`;
}

function renderCodePanel() {
  const code = (state.data.framework.code || {})[state.codeKey] || "";
  const panel = $("#code-panel");
  if (panel) panel.textContent = code;
  $$("[data-code]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.code === state.codeKey);
  });
}

function bindCodeTabs() {
  $$("[data-code]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.codeKey = btn.dataset.code;
      renderCodePanel();
    });
  });
  renderCodePanel();
}

function renderGraph(scene) {
  const reasons = (scene.reasons || []).map((r) => `<span class="chip rose">${esc(r)}</span>`).join("");
  const actions = (scene.actions || []).map((a) => `<span class="chip amber">${esc(a)}</span>`).join("");
  const caps = (state.data.framework.capabilities || []).map(([ability, where, why]) => `
    <tr><td><b>${esc(ability)}</b></td><td>${esc(where)}</td><td>${esc(why)}</td></tr>`).join("");
  const codeButtons = [
    ["state", "AgentState"],
    ["graph", "Top-level graph"],
    ["investigation", "Investigation"],
    ["enhancement", "Enhancement"],
    ["review", "interrupt / resume"],
  ].map(([key, label]) => `<button class="code-tab ${state.codeKey === key ? "active" : ""}" data-code="${key}">${label}</button>`).join("");

  $("#tab-content").innerHTML = `
    <div class="callout">
      <b>LangGraph 在这里不是“调模型的壳”。</b>
      Supervisor 用条件边决定工作流；调查/增强是独立子图；共享 <code>AgentState</code> 传递
      <code>findings / confidence / assessment / review_decision</code>；人工复核用
      <code>interrupt</code> 暂停、用 <code>Command(resume)</code> 恢复。
    </div>

    <section class="panel">
      <h3>顶层路由</h3>
      <p class="muted">Supervisor 只负责“走哪条工作流”，不负责像素计算。</p>
      ${topLevelFlow(scene)}
      <div class="chips" style="margin-top:12px;">
        ${(scene.route_history || []).map(routeChip).join("")}
        ${reasons}
        ${actions}
      </div>
    </section>

    <section class="panel">
      <h3>增强子图</h3>
      <p class="muted">只有质量门控失败时才进入；动作按成本从低到高排列。</p>
      ${enhancementFlow(scene)}
    </section>

    <section class="panel">
      <h3>真实审计轨迹</h3>
      <p class="muted">来自 run_meta.json 的 audit，记录每个节点的关键输入/输出。</p>
      ${auditTimeline(scene)}
    </section>

    <section class="panel">
      <h3>状态交接</h3>
      <p class="muted">这些字段就是跨节点、跨子图传递的 AgentState。</p>
      ${stateTable(scene)}
    </section>

    <section class="panel">
      <h3>实际 LangGraph 图</h3>
      <details>
        <summary>查看 Mermaid 定义（graph.get_graph().draw_mermaid()）</summary>
        <pre>${esc(state.data.framework.mermaid || "")}</pre>
      </details>
    </section>

    <section class="panel">
      <h3>关键代码</h3>
      <p class="muted">直接读取当前仓库源码，证明这些路由、子图和 interrupt 是实际实现。</p>
      <div class="code-tabs">${codeButtons}</div>
      <pre class="code"><code id="code-panel"></code></pre>
    </section>

    <section class="panel">
      <h3>LangGraph 能力映射</h3>
      <table class="data-table">
        <thead><tr><th>LangGraph 能力</th><th>在本项目中的落点</th><th>作用</th></tr></thead>
        <tbody>${caps}</tbody>
      </table>
    </section>`;

  bindCodeTabs();
}

function renderReview(scene) {
  if (scene.review) {
    const review = scene.review;
    const rows = (scene.findings || []).map((f) => `
      <tr>
        <td><b>${esc(f.id)}</b></td>
        <td class="num">${fmt(f.area_m2, 1)}</td>
        <td>${fmt(f.mean_prob, 3)}</td>
        <td><span class="status ${esc(f.review_status || "pending")}">${esc(f.review_status || "pending")}</span></td>
        <td>${f.human_confirmed ? "是" : "否"}</td>
      </tr>`).join("");
    $("#tab-content").innerHTML = `
      <section class="panel">
        <h3>真实人工复核</h3>
        <p class="muted">该场景真实触发了 interrupt；审核提交后通过 Command(resume) 恢复图。</p>
        <div class="review-card">
          <div class="decision">${esc(review.decision)}</div>
          <div class="notes">${esc(review.notes || "（无备注）")}</div>
          <div class="chips" style="margin-top:10px;">
            <span class="chip teal">approved: ${(review.approved_ids || []).length}</span>
            <span class="chip rose">rejected: ${(review.rejected_ids || []).length}</span>
          </div>
        </div>
        <div class="section-title">图斑状态</div>
        <table class="data-table">
          <thead><tr><th>ID</th><th>面积 (m²)</th><th>平均概率</th><th>复核状态</th><th>人工确认</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="section-title">恢复图的方式</div>
        <pre class="code"><code>${esc(scene.resume_code || "")}</code></pre>
        <details>
          <summary>查看 review_decision 原始结构</summary>
          <pre>${esc(JSON.stringify(review, null, 2))}</pre>
        </details>
      </section>`;
  } else {
    $("#tab-content").innerHTML = `
      <section class="panel">
        <h3>人工复核</h3>
        <div class="info-box">
          该场景没有触发人工复核。切换到 <b>场景二</b> 可以看到真实的
          <code>interrupt</code> / <code>Command(resume)</code> 结果。
        </div>
        <div class="section-title">交互模拟（仅讲解，不写回图状态）</div>
        <div class="sim-form">
          <select id="sim-decision">
            <option value="approve">approve</option>
            <option value="reject">reject</option>
            <option value="partial">partial</option>
          </select>
          <input id="sim-notes" value="演示用复核意见" />
          <button id="sim-btn">生成 resume 指令</button>
        </div>
        <pre class="code" id="sim-output">点击按钮生成 Command(resume=...)</pre>
      </section>`;
    const btn = $("#sim-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        const decision = $("#sim-decision").value;
        const notes = $("#sim-notes").value;
        $("#sim-output").textContent = `Command(resume={\n  "decision": "${decision}",\n  "notes": "${notes}"\n})`;
      });
    }
  }
}

function renderReport(scene) {
  const assets = scene.assets || {};
  const links = [
    [assets.report_html, "报告 HTML"],
    [assets.report_md, "报告 Markdown"],
    [assets.findings_csv, "图斑 CSV"],
    [assets.findings_geojson, "图斑 GeoJSON"],
  ].filter(([href]) => href).map(([href, label]) => `
    <a class="download" href="${esc(href)}" download>${esc(label)}</a>`).join("");

  const inference = scene.inference || {};
  $("#tab-content").innerHTML = `
    <section class="panel">
      <h3>完整报告</h3>
      <p class="muted">由调查/增强/复核流程自动生成。</p>
      <div class="report">${scene.report_html || "<p>没有报告。</p>"}</div>
    </section>

    <section class="panel">
      <h3>下载产物</h3>
      <div class="download-grid">${links || '<div class="info-box">没有可下载产物。</div>'}</div>
      <details style="margin-top:14px;">
        <summary>查看推理信息</summary>
        <pre>${esc(JSON.stringify(inference, null, 2))}</pre>
      </details>
      <details>
        <summary>查看运行信息</summary>
        <pre>${esc(JSON.stringify({ run_id: scene.run_id, status: scene.status, route_history: scene.route_history, reviewed: scene.reviewed }, null, 2))}</pre>
      </details>
    </section>`;
}

function renderTab() {
  const scene = currentScene();
  renderTabs();
  if (state.tab === "effect") renderEffect(scene);
  else if (state.tab === "graph") renderGraph(scene);
  else if (state.tab === "review") renderReview(scene);
  else renderReport(scene);
}

function selectScene(index) {
  state.sceneIndex = Number(index) || 0;
  const scene = currentScene();
  renderSceneList();
  renderHeader(scene);
  renderMetrics(scene);
  renderTab();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindGlobalEvents() {
  document.addEventListener("click", (event) => {
    const sceneBtn = event.target.closest("[data-scene]");
    if (sceneBtn) {
      selectScene(sceneBtn.dataset.scene);
      return;
    }
    const tabBtn = event.target.closest("[data-tab]");
    if (tabBtn) {
      state.tab = tabBtn.dataset.tab;
      renderTab();
    }
  });
}

async function boot() {
  try {
    const response = await fetch("data/cases.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    bindGlobalEvents();
    selectScene(0);
  } catch (error) {
    $("#tab-content").innerHTML = `
      <div class="info-box">
        无法加载 <code>data/cases.json</code>：${esc(error.message)}。<br />
        请通过本地静态服务器或 Vercel 打开本页面，不要直接双击 index.html。
      </div>`;
  }
}

boot();
