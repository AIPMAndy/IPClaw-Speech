// IPClaw 口播版 - 质量评估系统
// 自动评估生成内容的质量，并提供优化建议

/**
 * 质量评分器
 * 评估维度：结构完整性（30分）+ 内容质量（40分）+ 标题吸引力（30分）
 */
const QualityScorer = {
  /**
   * 评估结构完整性（30分）
   * - topic 长度合理（5分）
   * - hook 长度合理（5分）
   * - body 字数达标（10分）
   * - body 有明确分段（5分）
   * - ending_cta 完整（5分）
   */
  structure(item) {
    let score = 0;
    const topic = String(item.topic || '');
    const hook = String(item.hook || '');
    const body = String(item.body || '');
    const ending = String(item.ending_cta || '');

    // topic 长度：10-50 字为佳
    if (topic.length >= 10 && topic.length <= 50) score += 5;
    else if (topic.length > 5) score += 3;

    // hook 长度：20-100 字为佳
    if (hook.length >= 20 && hook.length <= 100) score += 5;
    else if (hook.length > 10) score += 3;

    // body 字数：600-1000 字为佳
    if (body.length >= 600 && body.length <= 1000) score += 10;
    else if (body.length >= 400) score += 6;
    else if (body.length >= 200) score += 3;

    // body 分段标记：至少 3 段
    const segments = body.match(/第[一二三四五六七八九十1-9]/g) || [];
    if (segments.length >= 3) score += 5;
    else if (segments.length >= 2) score += 3;
    else if (segments.length >= 1) score += 1;

    // ending_cta 长度：20-80 字为佳
    if (ending.length >= 20 && ending.length <= 80) score += 5;
    else if (ending.length > 10) score += 3;

    return score;
  },

  /**
   * 评估内容质量（40分）
   * - 有具体场景/案例（10分）
   * - 有数据/对比（10分）
   * - 口语化表达（10分）
   * - 有行动指引（10分）
   */
  content(item) {
    let score = 0;
    const body = String(item.body || '');
    const hook = String(item.hook || '');
    const ending = String(item.ending_cta || '');
    const fullText = `${hook} ${body} ${ending}`;

    // 具体场景/案例：比如、例如、想象、有个朋友、我见过
    const scenePatterns = /比如|例如|想象一下|有个朋友|我见过|有一次|曾经|之前遇到|真实案例/g;
    const sceneMatches = fullText.match(scenePatterns) || [];
    if (sceneMatches.length >= 3) score += 10;
    else if (sceneMatches.length >= 2) score += 7;
    else if (sceneMatches.length >= 1) score += 4;

    // 数据/对比：数字、百分比、对比词
    const dataPatterns = /\d+%|\d+倍|对比|之前|之后|原来|现在|过去|提升|下降|增加|减少/g;
    const dataMatches = fullText.match(dataPatterns) || [];
    if (dataMatches.length >= 3) score += 10;
    else if (dataMatches.length >= 2) score += 7;
    else if (dataMatches.length >= 1) score += 4;

    // 口语化：你、我、咱们、真的、其实、说实话
    const oralPatterns = /你|我|咱们|真的|其实|说实话|老实说|坦白讲|讲真|不瞒你说/g;
    const oralMatches = fullText.match(oralPatterns) || [];
    if (oralMatches.length >= 10) score += 10;
    else if (oralMatches.length >= 6) score += 7;
    else if (oralMatches.length >= 3) score += 4;

    // 行动指引：试试、做、开始、记住、建议
    const actionPatterns = /试试|做|开始|记住|建议|可以|不妨|马上|立刻|现在就|第一步|先|然后/g;
    const actionMatches = ending.match(actionPatterns) || [];
    if (actionMatches.length >= 2) score += 10;
    else if (actionMatches.length >= 1) score += 6;

    return score;
  },

  /**
   * 评估标题吸引力（30分）
   * - 封面标题：情绪化、有钩子（15分）
   * - 正文标题：有关键词、可搜索（15分）
   */
  title(item) {
    let score = 0;
    const cover = String(item.cover_title || '');
    const bodyTitle = String(item.body_title || '');
    const keywords = item.search_keywords || [];

    // 封面标题：情绪化钩子
    const hookPatterns = /[？！]|别再|千万|真相|秘密|揭秘|终于|原来|竟然|居然|没想到|震惊|必看|必读|必学/g;
    const hookMatches = cover.match(hookPatterns) || [];
    if (hookMatches.length >= 2) score += 8;
    else if (hookMatches.length >= 1) score += 5;
    else if (cover.length > 0) score += 2;

    // 封面标题长度：12-20 字为佳
    if (cover.length >= 12 && cover.length <= 20) score += 7;
    else if (cover.length >= 8 && cover.length <= 25) score += 4;
    else if (cover.length > 0) score += 2;

    // 正文标题长度：15-30 字为佳
    if (bodyTitle.length >= 15 && bodyTitle.length <= 30) score += 8;
    else if (bodyTitle.length >= 10) score += 5;
    else if (bodyTitle.length > 0) score += 2;

    // 搜索关键词数量：3-8 个为佳
    if (keywords.length >= 3 && keywords.length <= 8) score += 7;
    else if (keywords.length >= 2) score += 4;
    else if (keywords.length >= 1) score += 2;

    return score;
  },

  /**
   * 计算总分并生成评级
   */
  calculate(item) {
    const structureScore = this.structure(item);
    const contentScore = this.content(item);
    const titleScore = this.title(item);
    const total = structureScore + contentScore + titleScore;

    // 评级：A(80+), B(60-79), C(40-59), D(<40)
    let grade = 'D';
    if (total >= 80) grade = 'A';
    else if (total >= 60) grade = 'B';
    else if (total >= 40) grade = 'C';

    return {
      structure: structureScore,
      content: contentScore,
      title: titleScore,
      total,
      grade,
      maxScore: 100
    };
  }
};

/**
 * 优化建议生成器
 * 基于质量评分生成具体的优化建议
 */
const OptimizationAdvisor = {
  /**
   * 生成优化建议
   */
  generateSuggestions(item, scores) {
    const suggestions = [];

    // 结构问题
    if (scores.structure < 20) {
      const body = String(item.body || '');
      if (body.length < 600) {
        suggestions.push({
          type: 'structure',
          priority: 'high',
          field: 'body',
          message: `正文字数不足（当前 ${body.length} 字，建议 600+ 字）`,
          suggestion: '补充更多具体场景、案例或对比，让每一段都充分展开',
          action: 'expand_body'
        });
      }
      const segments = body.match(/第[一二三四五六七八九十1-9]/g) || [];
      if (segments.length < 3) {
        suggestions.push({
          type: 'structure',
          priority: 'high',
          field: 'body',
          message: `缺少明确分段标记（当前 ${segments.length} 段，建议 3+ 段）`,
          suggestion: '使用"第一块"、"第二块"、"第三块"等标记清晰分段',
          action: 'add_segments'
        });
      }
    }

    // 内容质量问题
    if (scores.content < 25) {
      const fullText = `${item.hook} ${item.body} ${item.ending_cta}`;
      const sceneMatches = fullText.match(/比如|例如|想象一下|有个朋友|我见过/g) || [];
      if (sceneMatches.length < 2) {
        suggestions.push({
          type: 'content',
          priority: 'medium',
          field: 'body',
          message: '缺少具体场景或案例',
          suggestion: '增加真实例子，如"比如我有个朋友..."、"想象一下这个场景..."',
          action: 'add_examples'
        });
      }
      const dataMatches = fullText.match(/\d+%|\d+倍|对比|之前|之后/g) || [];
      if (dataMatches.length < 2) {
        suggestions.push({
          type: 'content',
          priority: 'medium',
          field: 'body',
          message: '缺少数据或对比',
          suggestion: '增加对比或数据支撑，如"之前...现在..."、"提升了 30%"',
          action: 'add_data'
        });
      }
    }

    // 标题问题
    if (scores.title < 20) {
      const cover = String(item.cover_title || '');
      if (cover.length < 12) {
        suggestions.push({
          type: 'title',
          priority: 'medium',
          field: 'cover_title',
          message: `封面标题过短（当前 ${cover.length} 字，建议 12-20 字）`,
          suggestion: '增加情绪化钩子，如"别再..."、"千万别..."、"原来..."',
          action: 'expand_cover_title'
        });
      }
      const keywords = item.search_keywords || [];
      if (keywords.length < 3) {
        suggestions.push({
          type: 'title',
          priority: 'low',
          field: 'search_keywords',
          message: `搜索关键词过少（当前 ${keywords.length} 个，建议 3-8 个）`,
          suggestion: '增加用户真实会搜索的长尾词',
          action: 'add_keywords'
        });
      }
    }

    return suggestions;
  },

  /**
   * 生成优化摘要
   */
  generateSummary(scores, suggestions) {
    const summary = {
      grade: scores.grade,
      total: scores.total,
      strengths: [],
      weaknesses: [],
      priority_actions: []
    };

    // 优势
    if (scores.structure >= 25) summary.strengths.push('结构完整');
    if (scores.content >= 30) summary.strengths.push('内容充实');
    if (scores.title >= 25) summary.strengths.push('标题吸引');

    // 劣势
    if (scores.structure < 20) summary.weaknesses.push('结构不完整');
    if (scores.content < 25) summary.weaknesses.push('内容单薄');
    if (scores.title < 20) summary.weaknesses.push('标题平淡');

    // 优先行动
    const highPriority = suggestions.filter(s => s.priority === 'high');
    summary.priority_actions = highPriority.map(s => s.message);

    return summary;
  }
};

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
  window.QualityScorer = QualityScorer;
  window.OptimizationAdvisor = OptimizationAdvisor;
}

// 导出（Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QualityScorer, OptimizationAdvisor };
}
