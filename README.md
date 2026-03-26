# Qwen · LangChain 知识点演示台

基于阿里云千问（Qwen）API 的 LangChain 核心知识点交互演示项目。

## 项目示例图

![Demo 1](./public/demo1.png)
![Demo 2](./public/demo2.png)

## 技术栈

- **React 18** + **TypeScript**
- **Vite 5** 构建工具
- **Qwen API**（兼容 OpenAI 接口）

## 快速启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打包
npm run build

# eslint 检测
npm run eslint
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

## Qwen API 说明

Qwen API 完全兼容 OpenAI Chat Completions 格式：

```
Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
模型列表: qwen-max-latest / qwen-plus-latest / qwen-turbo-latest / qwen-long
```

## 项目结构

```
src/
├── lib/
│   ├── qwen.ts               # Qwen API 客户端（调用 + 流式解析）
│   ├── tools.ts              # 工具定义与模拟执行器
│   └── rag.ts                # RAG 知识库与相似度检索
├── hooks/
│   └── useQwen.ts            # 统一 API 调用 Hook
├── components/
│   ├── ui.tsx                # 通用 UI 组件库
│   ├── LCELPanel.tsx         # LCEL 管道链
│   ├── ParsersPanel.tsx      # Output Parsers
│   ├── AgentPanel.tsx        # createAgent
│   ├── StateGraphPanel.tsx   # StateGraph
│   ├── MemoryPanel.tsx       # 短期记忆
│   ├── RAGPanel.tsx          # RAG检索
│   ├── HITLPanel.tsx         # Human-in-Loop
│   ├── FallbackPanel.tsx     #  执行容错链
│   └── StreamPanel.tsx       # 流式输出 SSE
├── public/
│   ├── demo1.png             # 演示图1
│   └── demo2.png             # 演示图2
├── .eslintrc.cjs             # ESLint 配置文件
├── .gitignore                # Git 忽略配置文件
├── index.html                # HTML 入口文件
├── package.json              # 项目依赖与脚本
├── package-lock.json         # 项目依赖锁定文件
├── tsconfig.json             # TypeScript 配置文件
├── vite.config.ts            # Vite 构建配置文件
└── App.tsx                   # 主布局 + 导航
```
