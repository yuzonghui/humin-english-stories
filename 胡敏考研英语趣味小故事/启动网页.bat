@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  胡敏考研英语趣味小故事 - 网页版
echo  ========================================
echo  正在启动本地服务，请勿关闭此窗口...
echo.

where python >nul 2>&1
if %errorlevel%==0 (
  start http://localhost:8080
  python -m http.server 8080
  goto end
)

where py >nul 2>&1
if %errorlevel%==0 (
  start http://localhost:8080
  py -m http.server 8080
  goto end
)

echo 未找到 Python，请先安装 Python 后重试。
echo 或手动在项目文件夹运行: python -m http.server 8080
pause

:end
