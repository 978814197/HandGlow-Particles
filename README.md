# HandGlow-Particles
指尖星尘（手势驱动的三维粒子与礼花气球效果）

一个基于 Three.js 与 MediaPipe Hands 的浏览器小实验：用手指做出不同的手势，屏幕上的粒子会自动聚合为数字或爱心短语，并伴随上升的气球和花朵。支持一键全屏、相机实时追踪，纯前端、开箱即用。

提示：首次进入页面会提示申请摄像头权限；需要在本地服务器或 HTTPS 环境下运行（浏览器安全策略）。

---

## 预览与演示

- 在线演示（可选）：[在此放入你的 Demo 链接]
- 预览截图/动图（可选）：把截图放到仓库并在此引用。

---

## 功能特性

- 实时手势识别（MediaPipe Hands）
- 高性能粒子效果（Three.js Points + AdditiveBlending）
- 手势到状态的直观映射：
  - 1/2/3 指：粒子聚合为对应数字
  - 5 指张开：显示 “I ❤️ U”，并生成气球与小花缓缓上升
  - 拳头：重置/清屏，恢复为自由漂浮粒子
  - 其它/未映射姿态：维持上一次已识别的状态
- 一键切换全屏（页面右上角 ⛶ 按钮）

---

## 快速开始

1. 克隆或下载本仓库
2. 启动一个本地静态服务器（任选其一）：
   - 使用 VS Code 插件 Live Server（推荐）
   - 使用 Node.js：
     ```bash
     npx http-server -c-1 .
     # 或
     npx serve .
     ```
   - 使用 Python（3.x）：
     ```bash
     python -m http.server 8080
     ```
3. 浏览器打开你的本地地址（如 http://localhost:8080）
4. 按提示授予相机权限

注意：直接用 file:// 打开 `index.html` 无法获取摄像头权限，请务必使用本地服务器或部署到 HTTPS。

---

## 手势说明

- 拳头（所有手指收拢）：重置/清屏
- 5 指张开：显示 “I ❤️ U”，并生成多彩气球与小花上升
- 1/2/3 指：显示数字 “1/2/3” 的粒子字形
- 4 指或其它未映射姿态：不改变当前显示（保持上一次识别）

识别提示：将手置于画面中央、稍微后退以完整呈现手掌，光照均匀有助于提升识别稳定性。

---

## 运行环境

- 现代浏览器（建议最新版 Chrome / Edge / Firefox）
- 需要带摄像头的设备与权限
- 移动端需在 HTTPS 域名下访问，部分机型浏览器对相机权限较为严格

---

## 配置项（可在 `index.js` 顶部调整）

`index.js` 中的 `CONFIG` 用于控制粒子数量、大小、气球数量与颜色等：

```js
const CONFIG = {
  particleCount: 3000,   // 粒子数量（提高会更细腻，但更吃性能）
  particleSize: 0.15,    // 单个粒子尺寸
  balloonCount: 30,      // 触发 LOVE 状态时生成的气球数量
  colors: {
    text: 0xffffff,      // 数字/文本模式的粒子颜色
    heart: 0xff0000,     // LOVE 模式（I ❤️ U）粒子颜色
    balloons: [0xff5e57, 0xffdd59, 0x05c46b, 0x0fbcf9, 0xd2a8ff]
  }
};
```

根据你的设备性能，建议适当调低 `particleCount` 或 `particleSize` 来提升帧率。

---

## 文件结构

```
.
├─ index.html      # 页面入口，载入 index.js
├─ index.js        # 主逻辑（加载 Three.js/MediaPipe、粒子系统、气球/花朵、手势处理）
├─ package.json    # 项目信息（非必须）
├─ package-lock.json
├─ LICENSE         # 许可证
└─ README.md       # 本说明文档
```

项目通过 CDN 加载依赖：

- Three.js r128（cdnjs）
- MediaPipe Hands 与相关工具（jsDelivr）：`@mediapipe/hands`、`camera_utils`、`control_utils`、`drawing_utils`

这意味着你无需本地安装依赖即可运行，只要能联网访问这些 CDN 即可。

---

## 开发 & 扩展建议

- 粒子字形的生成：通过离屏 Canvas 绘制文本并采样像素，映射为粒子目标点位
- 你可以：
  - 修改 `updateTargetsFromText(text, isHeart)`，实现自定义词语/表情
  - 扩展 `handleGesture(fingers, isFist)` 的映射逻辑，加入更多手势与特效
  - 调整 `BalloonSystem` 的形状、颜色、数量或加入更多 3D 物体
- 性能优化思路：
  - 降低粒子数量、减少几何细分
  - 在移动端限制帧率或降低渲染分辨率

---

## 常见问题（FAQ）

1) 页面提示无法访问摄像头？
   - 请确保使用本地服务器或 HTTPS 域名访问，而不是 `file://`
   - 浏览器地址栏是否已允许相机权限

2) 画面黑屏/无响应？
   - 检查浏览器控制台是否有 CDN 资源加载失败
   - 网络环境是否能访问 `cdnjs` 与 `jsDelivr`

3) 手势识别不稳定？
   - 保持手掌清晰完整入镜，保证光线充足
   - 手部太近/太快移动会影响稳定性，尝试与摄像头保持 30–60cm 距离

4) 移动端打不开相机？
   - 需 HTTPS 域名；部分移动浏览器对相机权限策略更严格

5) 离线场景如何使用？
   - 需要将依赖库改为本地托管（下载 Three.js 与 MediaPipe 对应脚本）并修改 `index.js` 的脚本地址

---

## 隐私说明

本项目仅在本地浏览器中进行相机画面处理，不会上传视频数据到服务器。请在可信环境下使用并注意周围隐私。

---

## 许可证

本项目遵循仓库中的 `LICENSE`。若在你的项目中使用或二次开发，请保留原始版权与许可声明。

---

## 致谢

- [Three.js](https://threejs.org/)
- [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)

如果这个小实验对你有帮助，欢迎 Star 或分享给朋友 :)
