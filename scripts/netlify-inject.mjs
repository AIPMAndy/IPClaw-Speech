/**
 * IPClaw 口播版 - Netlify 构建脚本
 * 
 * 功能：在构建时将环境变量注入到 index.html，供浏览器使用。
 *
 * Netlify 环境变量配置（Site configuration → Environment variables）：
 *   DEEPSEEK_API_KEY     — DeepSeek API 密钥（必填，否则构建失败）
 *   SUPABASE_URL         — Supabase 项目 URL，如 https://xxxx.supabase.co（不要 /rest/v1）
 *   SUPABASE_ANON_KEY    — Supabase 项目 anon / publishable 公钥（必填）
 *
 * 本地开发预览（可选）：
 *   在项目根目录创建 .env 文件（已被 .gitignore 忽略），或直接在命令行传入：
 *   DEEPSEEK_API_KEY=sk-... SUPABASE_URL=https://....supabase.co SUPABASE_ANON_KEY=eyJ... node scripts/netlify-inject.mjs
 *   然后使用静态服务器打开 index.html
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const indexPath = resolve(root, "index.html");

/** 本地可从 .env 读入（勿提交密钥）；Netlify 以控制台环境变量为准 */
function loadDotEnv() {
  const p = resolve(root, ".env");
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadDotEnv();

const env = {
  SUPABASE_URL: (process.env.SUPABASE_URL || "").trim().replace(/\/$/, ""),
  SUPABASE_ANON_KEY: (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "").trim(),
  DEEPSEEK_API_KEY: (process.env.DEEPSEEK_API_KEY || "").trim()
};

const onNetlify = process.env.NETLIFY === "true" || process.env.CONTEXT === "production" || process.env.CONTEXT === "deploy-preview";

if (onNetlify) {
  if (!env.DEEPSEEK_API_KEY) {
    console.error("[netlify-inject] 缺少环境变量 DEEPSEEK_API_KEY，请在 Netlify 中配置。");
    process.exit(1);
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error("[netlify-inject] 缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY，请在 Netlify 中配置。");
    process.exit(1);
  }
} else {
  if (!env.DEEPSEEK_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.warn(
      "[netlify-inject] 未设置完整环境变量：将写入空配置（本地离线）。线上部署请务必在 Netlify 配置三项密钥。"
    );
  }
}

const injected = `<!-- NETLIFY_CONFIG_START：由 \`node scripts/netlify-inject.mjs\` 在构建时写入密钥；勿手动填密钥进仓库 -->
    <script>
      window.__speakSupabase = window.supabase.createClient(
        ${JSON.stringify(env.SUPABASE_URL)},
        ${JSON.stringify(env.SUPABASE_ANON_KEY)}
      );
      window.__DEEPSEEK_API_KEY = ${JSON.stringify(env.DEEPSEEK_API_KEY)};
    </script>
    <!-- NETLIFY_CONFIG_END -->`;

let html = readFileSync(indexPath, "utf8");
const pattern = /<!-- NETLIFY_CONFIG_START[^]*?<!-- NETLIFY_CONFIG_END -->/;
if (!pattern.test(html)) {
  console.error("[netlify-inject] index.html 中未找到 NETLIFY_CONFIG 标记块。");
  process.exit(1);
}
html = html
  .replace(pattern, injected)
  .replace(/DEEPSEEK_API_KEY_PLACEHOLDER/g, env.DEEPSEEK_API_KEY);
writeFileSync(indexPath, html, "utf8");

console.log(
  `[netlify-inject] 已写入 index.html · DeepSeek: ${Boolean(env.DEEPSEEK_API_KEY)} · Supabase URL: ${Boolean(env.SUPABASE_URL)} · Anon key: ${Boolean(env.SUPABASE_ANON_KEY)}`
);
