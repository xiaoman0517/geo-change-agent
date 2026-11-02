# “两违”影像变化检测报告

- 生成时间：2026-10-25T11:25:25
- 任务：分析演示区B 2023年Q2的影像，找出新增建筑
- 场景：演示区 B 低置信案例
- 周期：2023-05-20
- 模型：bit / best_ckpt.pt:63777789:1691640682
- 状态：done

## 1. 结论摘要

本次分析共提取 **3** 个疑似新增/变化图斑，总面积 **175.79 m²**，整体置信度 **0.944（high）**。

质量门控触发：`fragmented_findings`、`many_tiny_findings`、`low_confidence_objects`。

人工复核结论：**approve**；备注：demo approved

已执行的增强动作：`diagnose:reinfer`、`tta_reinfer`、`human_review`、`explain`

## 2. 置信度与质量

| 指标 | 值 |
|---|---|
| 总体置信度 | 0.944 |
| 像素级置信度 | 0.988 |
| 图斑级置信度 | 0.859 |
| 模糊像素占比 | 0.006 |
| 变化面积占比 | 0.0170 |
| 模型稳定性(TTA) | 0.989 |

## 3. 疑似图斑（按面积排序，Top 20）

| ID | 面积(m²) | 平均概率 | 置信等级 | 中心点 | 标记 | 复核状态 |
|---|---:|---:|---|---|---|---|
| F0001 | 135.10 | 0.921 | high | 36.2, -4.7 | - | approved |
| F0002 | 24.29 | 0.641 | low | 77.7, -33.7 | low_confidence, ambiguous_boundary | approved |
| F0003 | 16.40 | 0.667 | medium | 4.9, -100.9 | low_confidence, ambiguous_boundary | approved |

## 4. 增强与人工复核记录

- 诊断: 置信度/模糊度高，使用 TTA 重新推理；原因=['fragmented_findings', 'many_tiny_findings', 'low_confidence_objects']
- TTA 重新推理: 图斑 3 个，模型稳定性 0.9886，置信度 0.9123 → 待重评
- 人工复核: approve; 通过=['F0001', 'F0002', 'F0003']; 驳回=[]; 备注=demo approved
- 解释性报告已生成: （演示产物）

## 5. 产物

- prob_tif: `（演示产物）`
- mask_tif: `（演示产物）`
- findings_geojson: `（演示产物）`
- findings_csv: `（演示产物）`
- findings_json: `（演示产物）`
- overview: `（演示产物）`
- crop: `（演示产物）`
- crop: `（演示产物）`
- crop: `（演示产物）`

## 6. 方法与限制

本报告由变化检测模型 + 质量门控自动生成。模型输出为**疑似变化图斑**，不构成违法认定或执法依据；应结合审批数据、用地红线、历史影像和实地核查复核。

主要误差来源：季节性/光照差异、配准误差、阴影与道路改造、影像分辨率、训练区域与目标区域的地物分布差异。低置信图斑建议优先人工复核。
