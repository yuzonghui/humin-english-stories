# 胡敏考研英语趣味小故事

浏览器听打练习：听英文 → 逐词跟打 → 自动判错 → 生词记忆。数据保存在浏览器本地。

## 在线使用（GitHub Pages）

部署完成后，访问地址一般为：

```text
https://你的GitHub用户名.github.io/仓库名/
```

安卓 / iPad / 电脑浏览器均可打开，建议添加到主屏幕当 App 使用。

---

## 部署到 GitHub（一步步来）

### 第一步：在 GitHub 创建仓库

1. 登录 [GitHub](https://github.com)
2. 右上角 **+** → **New repository**
3. 仓库名示例：`humin-english-stories`（英文，不要空格）
4. 选 **Public**
5. **不要**勾选 “Add a README file”（本地已有文件）
6. 点 **Create repository**

### 第二步：把项目上传到仓库

#### 方式 A：网页上传（最简单，不用装 Git）

1. 进入刚建的仓库，点 **Add file** → **Upload files**
2. 把本文件夹里**所有内容**拖进去（含 `index.html`、`css`、`js`、`data`、`.github` 等）
3. 下方写提交说明，点 **Commit changes**

#### 方式 B：用 Git 命令行（已安装 Git 时）

在项目文件夹打开终端，执行（把 `你的用户名` 和 `仓库名` 换成自己的）：

```bash
git init
git add .
git commit -m "Initial commit: 胡敏考研英语听打练习"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

### 第三步：开启 GitHub Pages

1. 仓库页 → **Settings** → 左侧 **Pages**
2. **Build and deployment** → Source 选 **GitHub Actions**
3. 回到 **Actions** 标签，等 “Deploy to GitHub Pages” 跑完（绿色 ✓）
4. 再打开 **Settings → Pages**，会显示站点地址

若 Actions 未自动运行：Actions → **Deploy to GitHub Pages** → **Run workflow**

### 第四步：发给朋友

把 Pages 地址发给她，例如：

```text
https://zhangsan.github.io/humin-english-stories/
```

她在安卓平板 Chrome 里打开即可；菜单里可选 **添加到主屏幕**。

---

## 本地运行（开发 / 自己电脑）

```bash
python -m http.server 8080
```

浏览器打开 http://localhost:8080  

或直接双击 `启动网页.bat`（Windows）。

> 不要直接双击 `index.html`，需通过 http 访问才能加载故事和词典。

---

## 功能

- 81 篇故事，进度本地保存
- 自动按 `. ! ? ;` 分整句
- 逐句跟读 / 盲打听写
- 每句朗读 10 遍，中文翻译默认显示
- 逐词校验，打对后 3 秒跳下一句
- 音标 + 释义，错题本、生词本

---

## 替换故事内容

编辑 `data/stories.json`，每篇包含：

```json
{
  "id": 1,
  "title": "中文标题",
  "titleEn": "English Title",
  "content": "英文全文…",
  "contentCn": "中文全文…"
}
```

改完后重新 commit 并 push，GitHub Actions 会自动更新网站。

## 维护脚本

```bash
node scripts/generate-stories.js   # 重新生成 81 篇示例故事
node scripts/build-dict.js         # 重新生成词典（含音标）
```
