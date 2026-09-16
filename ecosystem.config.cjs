/**
 * PM2 Production Ecosystem Configuration for SmartShop
 * Đảm bảo hệ thống tự phục hồi nếu gặp crash nhị phân (Exit 139)
 * và giữ cho Port 3000 luôn luôn lắng nghe ổn định, triệt tiêu lỗi 502 Nginx.
 */

module.exports = {
  apps: [
    {
      name: "smartshop-web",
      script: "dist/server.cjs",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "logs/web-error.log",
      out_file: "logs/web-out.log",
      time: true,
    },
    {
      name: "smartshop-cv",
      script: "cv_service/server.py",
      interpreter: process.platform === "win32" ? "python" : "/var/www/SmartShop/cv_venv/bin/python",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      restart_delay: 3000,
      max_memory_restart: "2G",
      env: {
        PYTHONIOENCODING: "utf-8",
        PORT: 8000,
      },
      error_file: "logs/cv-error.log",
      out_file: "logs/cv-out.log",
      time: true,
    },
  ],
};
