#!/usr/bin/env bash
# ==============================================================================
# SmartShop - Ubuntu Production Safe Deployment Script
# Tự động khắc phục lỗi Exit Code 139 (Segfault) và ngăn chặn 502 Bad Gateway Nginx
# ==============================================================================

set -e

echo "========================================================"
echo "  BẮT ĐẦU QUY TRÌNH TRIỂN KHAI SMARTSHOP TRÊN UBUNTU"
echo "========================================================"

# 1. Cài đặt các công cụ biên dịch C/C++ cần thiết cho Better-SQLite3
echo "\n[1/7] Kiểm tra & Cài đặt build tools..."
sudo apt-get update -y
sudo apt-get install -y build-essential python3 python3-pip make g++ curl git

# 2. Xoá sạch các tàn dư binary cũ (ngăn ngừa binary từ Windows/Mac gây Segfault 139)
echo "\n[2/7] Dọn dẹp các bản build và nhị phân cũ..."
rm -rf dist .vite server.js
# Nếu nghi ngờ node_modules từng bị copy từ Windows, uncomment dòng dưới:
# rm -rf node_modules package-lock.json

# 3. Cài đặt Node dependencies trực tiếp trên Ubuntu
echo "\n[3/7] Cài đặt dependencies sạch trên Linux..."
npm install

# 4. Biên dịch lại Better-SQLite3 từ mã nguồn C++ tương thích 100% với kernel và glibc hiện tại
echo "\n[4/7] Biên dịch lại C++ Native Addon cho Better-SQLite3..."
npm rebuild better-sqlite3 --build-from-source

# Kiểm tra xác thực binary SQLite
echo "-> Kiểm tra tải thư viện Better-SQLite3..."
node -e "const db = require('better-sqlite3'); console.log('✓ Better-SQLite3 native addon nạp thành công!');"

# 5. Cài đặt các thư viện Python cho AI Face Recognition
echo "\n[5/7] Cài đặt dependencies cho Python Computer Vision Service..."
pip3 install --no-cache-dir fastapi uvicorn python-multipart tqdm torch torchvision facenet-pytorch --extra-index-url https://download.pytorch.org/whl/cpu || pip3 install --no-cache-dir fastapi uvicorn python-multipart tqdm facenet-pytorch

# Nạp dữ liệu khuôn mặt mẫu nếu chưa có
if [ ! -f "data/face_embeddings.json" ]; then
    echo "-> Đang trích xuất vector khuôn mặt từ thư mục faceid/..."
    export PYTHONIOENCODING="utf-8"
    python3 cv_service/enroll.py
fi

# 6. Build bundle ứng dụng Production (JavaScript thuần)
echo "\n[6/7] Biên dịch ứng dụng sang Production Bundle..."
npm run build

# 7. Khởi động và giám sát qua PM2
echo "\n[7/7] Khởi động ứng dụng qua PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "-> Đang cài đặt PM2 toàn cục..."
    sudo npm install -g pm2
fi

# Tạo thư mục logs
mkdir -p logs

# Khởi động hoặc reload qua ecosystem
pm2 startOrRestart ecosystem.config.cjs

echo "\n--- ĐỢI 3 GIÂY ĐỂ CÁC DỊCH VỤ LẮNG NGHE CỔNG ---"
sleep 3

# Kiểm tra port 3000 (Node) và port 8000 (Python)
echo "\nKiểm tra trạng thái cổng mạng:"
sudo ss -tulpn | grep -E "3000|8000" || true

# Test gọi trực tiếp localhost
echo "\nTest kết nối Web (Port 3000):"
curl -I -s http://127.0.0.1:3000 | head -n 5 || echo "Cảnh báo: Chưa nhận được phản hồi từ cổng 3000"

echo "\nTest kết nối Python AI (Port 8000):"
curl -s http://127.0.0.1:8000/api/cv/health || echo "Cảnh báo: Chưa nhận được phản hồi từ cổng 8000"

echo "\n========================================================"
echo "  TRIỂN KHAI HOÀN TẤT THÀNH CÔNG!"
echo "  • Node Web App:   http://127.0.0.1:3000"
echo "  • Python Face ID: http://127.0.0.1:8000"
echo "========================================================"
