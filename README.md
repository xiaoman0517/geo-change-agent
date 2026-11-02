# GeoChange Agent — 遥感变化分析 Agent Demo

基于 LangGraph Supervisor 的遥感变化分析工作流静态 Demo。

## 展示内容

- 场景一：复杂场景 · 自动增强
- 场景二：低置信 · 人工复核
- 场景三：干净单目标 · 模型效果

页面包含：

- T1 / T2 / 变化概率 / 掩膜叠加
- 图斑明细与置信度
- Supervisor 顶层路由与增强子图
- 真实 `route_history` 与审计轨迹
- `interrupt` / `Command(resume)` 人工复核
- LangGraph 关键代码与能力映射
- 报告与 GeoJSON / CSV 下载

## 说明

- 仅包含脱敏后的小范围 Demo 数据；
- 不包含原始影像、模型 checkpoint、训练代码；
- 模型输出为疑似图斑，不构成违法认定或执法依据。
