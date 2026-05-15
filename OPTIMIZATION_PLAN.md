# IPClaw-Speech 深度优化方案

> **优化目标**：将 IPClaw-Speech 从单机工具升级为可被 Hermes Agent 和 OpenClaw 调度的智能口播创作系统

---

## 📊 一、现状分析

### 1.1 产品优势
✅ **技术架构清晰**：纯静态前端 + DeepSeek API + Supabase，部署简单  
✅ **功能完整**：AI 对话（Agent/Ask）、选题库管理、爆款参考分析  
✅ **Prompt 工程成熟**：`prompt-mapping.md` 提供了完整的参数映射体系  
✅ **用户体验友好**：手绘风格界面，适合长辈使用  

### 1.2 核心痛点

#### 🔴 产品层面
1. **缺乏 API 接口**：无法被外部系统（Hermes/OpenClaw）调用
2. **批量生成能力弱**：只能生成 5 条，无批量导出功能
3. **模板管理缺失**：无法保存常用的 prompt 模板组合
4. **版本对比缺失**：无法对比不同版本的文案
5. **协作能力弱**：无分享、评论、协作功能

#### 🟡 AI 能力层面
1. **Prompt 质量不稳定**：生成结果质量波动大
2. **缺乏质量评估**：无法自动评估生成内容质量
3. **无迭代优化机制**：无法基于用户反馈优化 prompt
4. **单一 AI 引擎**：仅支持 DeepSeek，无多模型对比

#### 🟢 工作流层面
1. **选题到成稿断层**：缺少从选题→大纲→初稿→定稿的完整链路
2. **无数据分析**：无法分析哪些选题类型效果好
3. **缺少内容日历**：无法规划发布计划
4. **导出格式单一**：仅支持复制，无 Markdown/Word/PDF 导出

---

## 🎯 二、优化方案设计

### 2.1 产品体验优化

#### 2.1.1 交互流程优化
```
【现状】
用户输入 → AI 生成 → 手动编辑 → 保存到选题库

【优化后】
用户输入 → AI 生成（含质量评分）→ 智能推荐最佳版本 → 
一键优化 → 版本对比 → 保存/导出/分享
```

#### 2.1.2 界面优化
- **新增功能区**：
  - 📋 模板库：保存常用 prompt 组合
  - 📊 数据看板：生成统计、质量分析
  - 📅 内容日历：规划发布计划
  - 🔄 版本历史：对比不同版本

- **交互优化**：
  - 拖拽排序选题
  - 批量操作（批量生成、批量导出、批量删除）
  - 快捷键支持（Ctrl+Enter 发送、Ctrl+S 保存）
  - 实时保存（防止数据丢失）

#### 2.1.3 工作流优化
```
完整创作链路：
1. 选题阶段：爆款分析 → 选题生成 → 选题评估
2. 大纲阶段：结构规划 → 要点提炼 → 逻辑检查
3. 初稿阶段：文案生成 → 质量评分 → 智能优化
4. 定稿阶段：版本对比 → 人工润色 → 导出发布
5. 复盘阶段：效果追踪 → 数据分析 → 策略优化
```

---

### 2.2 AI 能力增强

#### 2.2.1 Prompt 优化策略

**现有 Prompt 问题**：
- 系统提示词过于宽泛，约束力不足
- 用户提示词参数过多，模型容易忽略
- 缺少 Few-shot 示例，输出质量不稳定

**优化方案**：
```javascript
// 1. 分层 Prompt 架构
const PromptLayers = {
  // 第一层：角色与硬性约束
  systemCore: `你是专业的口播文案策划师，10年经验。
硬性要求：
1. 输出必须原创，禁止抄袭
2. body 必须 3 大段，每段 130+ 字
3. 标题必须符合平台算法规则
4. 禁用词一律不出现`,

  // 第二层：质量标准
  qualityStandards: `优质口播文案标准：
- 开头 3 秒抓住注意力
- 正文有场景、有对比、有案例
- 结尾有升华、有行动指引
- 全文口语化、接地气`,

  // 第三层：Few-shot 示例
  examples: [
    { input: "职场焦虑", output: "..." },
    { input: "副业赚钱", output: "..." }
  ],

  // 第四层：用户定制参数
  userParams: { platform, persona, audience, ... }
};

// 2. 动态 Prompt 组装
function buildPrompt(task, settings) {
  return {
    system: [
      PromptLayers.systemCore,
      PromptLayers.qualityStandards,
      formatExamples(PromptLayers.examples)
    ].join('\n\n'),
    user: formatUserPrompt(task, settings)
  };
}
```

#### 2.2.2 质量评估系统

```javascript
// 自动质量评分
const QualityScorer = {
  // 1. 结构完整性（30分）
  structure: (item) => {
    let score = 0;
    if (item.topic?.length > 10) score += 5;
    if (item.hook?.length > 20) score += 5;
    if (item.body?.length > 600) score += 10;
    if (item.body?.match(/第[一二三]/g)?.length >= 3) score += 5;
    if (item.ending_cta?.length > 20) score += 5;
    return score;
  },

  // 2. 内容质量（40分）
  content: (item) => {
    let score = 0;
    // 检查是否有具体场景
    if (/比如|例如|想象一下|有个朋友/.test(item.body)) score += 10;
    // 检查是否有数据/对比
    if (/\d+%|对比|之前|之后/.test(item.body)) score += 10;
    // 检查口语化程度
    if (/你|我|咱们|真的|其实/.test(item.body)) score += 10;
    // 检查是否有行动指引
    if (/试试|做|开始|记住/.test(item.ending_cta)) score += 10;
    return score;
  },

  // 3. 标题吸引力（30分）
  title: (item) => {
    let score = 0;
    const cover = item.cover_title || '';
    const body = item.body_title || '';
    // 封面标题：情绪化、有钩子
    if (/[？！]|别再|千万|真相|秘密/.test(cover)) score += 10;
    if (cover.length >= 12 && cover.length <= 20) score += 5;
    // 正文标题：有关键词、可搜索
    if (body.length >= 15) score += 10;
    if (item.search_keywords?.length >= 3) score += 5;
    return score;
  },

  // 总分计算
  calculate: (item) => {
    const scores = {
      structure: QualityScorer.structure(item),
      content: QualityScorer.content(item),
      title: QualityScorer.title(item)
    };
    scores.total = scores.structure + scores.content + scores.title;
    scores.grade = scores.total >= 80 ? 'A' : 
                   scores.total >= 60 ? 'B' : 
                   scores.total >= 40 ? 'C' : 'D';
    return scores;
  }
};
```

#### 2.2.3 智能优化建议

```javascript
// 基于质量评分给出优化建议
function generateOptimizationSuggestions(item, scores) {
  const suggestions = [];

  if (scores.structure < 20) {
    suggestions.push({
      type: 'structure',
      priority: 'high',
      message: 'body 字数不足或缺少分段标记，建议补充到 3 大段',
      action: 'rewrite_body'
    });
  }

  if (scores.content < 25) {
    suggestions.push({
      type: 'content',
      priority: 'medium',
      message: '缺少具体场景或案例，建议增加真实例子',
      action: 'add_examples'
    });
  }

  if (scores.title < 20) {
    suggestions.push({
      type: 'title',
      priority: 'medium',
      message: '标题吸引力不足，建议增强钩子或情绪',
      action: 'optimize_title'
    });
  }

  return suggestions;
}
```

---

### 2.3 Skill 集成方案

#### 2.3.1 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    Hermes Agent / OpenClaw              │
│                                                         │
│  "帮我生成 10 条职场焦虑相关的口播选题"                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 调用 Skill
                     ▼
┌─────────────────────────────────────────────────────────┐
│              IPClaw-Speech Skill (SKILL.md)             │
│                                                         │
│  - 解析用户意图                                          │
│  - 调用 API 接口                                         │
│  - 格式化返回结果                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP API
                     ▼
┌─────────────────────────────────────────────────────────┐
│           IPClaw-Speech API Layer (新增)                │
│                                                         │
│  POST /api/generate    - 生成口播内容                    │
│  POST /api/analyze     - 爆款分析                        │
│  GET  /api/topics      - 获取选题库                      │
│  POST /api/optimize    - 优化文案                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 调用核心逻辑
                     ▼
┌─────────────────────────────────────────────────────────┐
│              IPClaw-Speech Core (app.js)                │
│                                                         │
│  - handleGenerate()                                     │
│  - runViralAnalyze()                                    │
│  - QualityScorer.calculate()                            │
└─────────────────────────────────────────────────────────┘
```

#### 2.3.2 API 接口设计

由于是纯静态架构，我们采用 **Netlify Functions** 实现 API：

```javascript
// netlify/functions/generate.js
exports.handler = async (event) => {
  const { task, settings, batchSize = 5 } = JSON.parse(event.body);
  
  // 调用 DeepSeek API
  const items = await generateContent(task, settings, batchSize);
  
  // 质量评分
  const itemsWithScores = items.map(item => ({
    ...item,
    quality: QualityScorer.calculate(item)
  }));
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: itemsWithScores,
      meta: {
        count: itemsWithScores.length,
        avgScore: average(itemsWithScores.map(i => i.quality.total))
      }
    })
  };
};
```

#### 2.3.3 Skill 调用流程

```
用户 → Hermes Agent → Skill → API → 返回结果 → 格式化 → 用户

示例对话：
用户: "帮我生成 10 条关于职场焦虑的口播选题"
Hermes: [调用 ipclaw-speech skill]
Skill: [解析参数] → task="职场焦虑", batchSize=10
API: [生成内容] → 返回 10 条选题（含质量评分）
Skill: [格式化] → Markdown 表格 + 最佳推荐
Hermes: "已生成 10 条选题，平均质量 B+，推荐使用第 3 条..."
```

---

### 2.4 工作流优化

#### 2.4.1 批量生成工作流

```javascript
// 批量生成管理器
class BatchGenerationManager {
  async generateBatch(tasks, settings) {
    const results = [];
    const errors = [];
    
    for (const task of tasks) {
      try {
        const items = await handleGenerate({ task, settings, batchSize: 5 });
        results.push({ task, items, status: 'success' });
      } catch (error) {
        errors.push({ task, error: error.message, status: 'failed' });
      }
    }
    
    return {
      success: results,
      failed: errors,
      summary: {
        total: tasks.length,
        succeeded: results.length,
        failed: errors.length
      }
    };
  }
}
```

#### 2.4.2 模板管理系统

```javascript
// 模板数据结构
const TemplateSchema = {
  id: 'template-uuid',
  name: '职场干货模板',
  description: '适合职场类口播内容',
  settings: {
    platform: '小红书',
    personaName: '职场学姐',
    audienceProfile: '25-35岁职场人',
    toneStyle: '朋友式共鸣',
    toneDetails: '口语短句、多举例、少术语',
    hookStyle: '痛点提问',
    bodyFramework: '先说结论 + 三段式展开',
    ctaTemplate: '点赞收藏 + 关注获取更多',
    riskBlacklist: '稳赚,包治,100%',
    coverTitleStyle: '反差感强、有钩子',
    bodyTitleStyle: '关键词清晰、可搜索'
  },
  usage_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

// 模板管理功能
class TemplateManager {
  async saveTemplate(name, description, settings) {
    const template = {
      id: randomId(),
      name,
      description,
      settings,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await supabase.from('templates').insert(template);
    return template;
  }

  async loadTemplate(id) {
    const { data } = await supabase.from('templates').select('*').eq('id', id).single();
    return data;
  }

  async applyTemplate(templateId) {
    const template = await this.loadTemplate(templateId);
    Object.assign(state.settings, template.settings);
    syncSettingsToUI();
    // 增加使用次数
    await supabase.from('templates').update({ 
      usage_count: template.usage_count + 1 
    }).eq('id', templateId);
  }
}
```

#### 2.4.3 版本对比功能

```javascript
// 版本对比器
class VersionComparator {
  compare(version1, version2) {
    return {
      topic: this.diffText(version1.topic, version2.topic),
      hook: this.diffText(version1.hook, version2.hook),
      body: this.diffText(version1.body, version2.body),
      ending_cta: this.diffText(version1.ending_cta, version2.ending_cta),
      cover_title: this.diffText(version1.cover_title, version2.cover_title),
      body_title: this.diffText(version1.body_title, version2.body_title),
      quality: {
        v1: QualityScorer.calculate(version1),
        v2: QualityScorer.calculate(version2),
        winner: this.determineWinner(version1, version2)
      }
    };
  }

  diffText(text1, text2) {
    // 简单的文本差异标记
    return {
      original: text1,
      modified: text2,
      changed: text1 !== text2,
      lengthDiff: text2.length - text1.length
    };
  }

  determineWinner(v1, v2) {
    const score1 = QualityScorer.calculate(v1).total;
    const score2 = QualityScorer.calculate(v2).total;
    return score1 > score2 ? 'v1' : score2 > score1 ? 'v2' : 'tie';
  }
}
```

---

## 🚀 三、实施计划

### 阶段一：核心优化（Week 1-2）
- [x] 优化 Prompt 系统（分层架构 + Few-shot）
- [x] 实现质量评估系统
- [x] 添加智能优化建议
- [x] 优化生成流程（含进度提示）

### 阶段二：功能增强（Week 3-4）
- [ ] 实现模板管理系统
- [ ] 添加批量生成功能
- [ ] 实现版本对比功能
- [ ] 添加导出功能（Markdown/Word/PDF）

### 阶段三：API 与 Skill（Week 5-6）
- [ ] 创建 Netlify Functions API
- [ ] 编写 Hermes Skill 文件
- [ ] 测试 Skill 调用流程
- [ ] 编写使用文档

### 阶段四：数据分析（Week 7-8）
- [ ] 实现数据看板
- [ ] 添加内容日历
- [ ] 实现效果追踪
- [ ] 优化推荐算法

---

## 📈 四、预期效果

### 4.1 产品指标
- **生成质量提升 30%**：通过优化 Prompt 和质量评估
- **创作效率提升 50%**：通过模板和批量功能
- **用户留存提升 40%**：通过完整工作流和数据分析

### 4.2 技术指标
- **API 响应时间 < 3s**：优化 DeepSeek 调用
- **质量评分准确率 > 85%**：通过持续优化评分算法
- **Skill 调用成功率 > 95%**：稳定的 API 接口

### 4.3 生态价值
- **Hermes Agent 集成**：成为 Hermes 生态的内容创作工具
- **OpenClaw 调度**：支持自动化内容生产流程
- **IPClaw 生态协同**：与 IPClaw for Seniors 等产品联动

---

## 🎯 五、关键优化点总结

### 5.1 立即可实施（本次优化）
1. ✅ **优化 Prompt 系统**：分层架构 + Few-shot 示例
2. ✅ **质量评估系统**：自动评分 + 优化建议
3. ✅ **改进生成流程**：进度提示 + 错误处理
4. ✅ **创建 Skill 文件**：支持 Hermes/OpenClaw 调用

### 5.2 后续迭代（需要更多开发）
1. ⏳ **Netlify Functions API**：需要创建 serverless 函数
2. ⏳ **模板管理系统**：需要新增数据表和 UI
3. ⏳ **版本对比功能**：需要新增版本存储机制
4. ⏳ **数据分析看板**：需要统计和可视化功能

---

## 📝 六、技术债务与风险

### 6.1 技术债务
- **前端代码耦合度高**：app.js 超过 1300 行，需要模块化
- **缺少单元测试**：核心逻辑无测试覆盖
- **错误处理不完善**：部分异常未捕获
- **性能优化空间**：大量 DOM 操作可优化

### 6.2 风险点
- **API 密钥暴露**：静态部署模式固有风险
- **DeepSeek 依赖**：单一 AI 引擎，无降级方案
- **Supabase 成本**：数据量增长后可能产生费用
- **浏览器兼容性**：部分 API 可能不兼容旧浏览器

### 6.3 缓解措施
- 使用 Netlify Functions 隐藏 API 密钥
- 添加 Mock 模式作为降级方案
- 监控 Supabase 用量，设置告警
- 使用 Polyfill 提升兼容性

---

**优化原则**：
1. 保持纯静态架构优势
2. 向后兼容现有数据
3. 渐进式增强功能
4. 优先用户体验
5. 注重生态协同

**下一步行动**：
立即实施阶段一优化，创建 Skill 文件，编写使用文档。
