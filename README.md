# 千问 · LangChain 知识点演示台

基于阿里云千问（Qwen）API 的 LangChain 核心知识点交互演示项目。

## 技术栈

- **React 18** + **TypeScript**
- **Vite 5** 构建工具
- **千问 API**（兼容 OpenAI 接口）

## 快速启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打包
npm run build
```

## 获取 API Key

访问 [阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/apiKey) 获取 API Key。

## 演示模块

| 模块               | 知识点    | 说明                                |
| ------------------ | --------- | ----------------------------------- |
| A · LCEL 管道链    | 补充A     | `.pipe()` 串联、多变量模板、并行链  |
| B · Output Parsers | 补充B     | String / JSON / List 三种解析器对比 |
| C · createAgent    | 阶段一/二 | ReAct 循环可视化，4 个模拟工具      |
| D · StateGraph     | 补充C     | 底层图构建，节点/边动态高亮         |
| E · 短期记忆       | 阶段二    | thread_id 多会话隔离，真实多轮对话  |
| F · RAG 检索       | 阶段三    | 相似度搜索，有/无 RAG 效果对比      |
| G · Human-in-Loop  | 阶段三    | 高风险工具暂停审批流程              |
| H · 容错链         | 补充E     | 多级备用模型，模拟限流场景          |
| I · 流式输出       | 阶段二    | SSE 打字机效果，三种 streamMode     |

## 千问 API 说明

千问 API 完全兼容 OpenAI Chat Completions 格式：

```
Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
模型列表: qwen-max-latest / qwen-plus-latest / qwen-turbo-latest / qwen-long
```

## 项目结构

```
src/
├── lib/
│   ├── qwen.ts       # 千问 API 客户端（调用 + 流式解析）
│   ├── tools.ts      # 工具定义与模拟执行器
│   └── rag.ts        # RAG 知识库与相似度检索
├── hooks/
│   └── useQwen.ts    # 统一 API 调用 Hook
├── components/
│   ├── ui.tsx        # 通用 UI 组件库
│   ├── LCELPanel.tsx
│   ├── ParsersPanel.tsx
│   ├── AgentPanel.tsx
│   ├── StateGraphPanel.tsx
│   ├── MemoryPanel.tsx
│   ├── RAGPanel.tsx
│   ├── HITLPanel.tsx
│   ├── FallbackPanel.tsx
│   └── StreamPanel.tsx
└── App.tsx           # 主布局 + 导航
```
