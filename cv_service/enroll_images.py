"""
Đăng ký khuôn mặt cho MỘT người từ danh sách ảnh (selfie / ảnh chụp webcam).

Ví dụ:
  python cv_service/enroll_images.py --key haidang --name "Tên (Quản lý)" \
      --role manager --email ban@example.com anh1.jpg anh2.jpg ...

- Trích xuất vector 512 chiều (MTCNN + FaceNet) cho từng ảnh và cả ảnh lật gương
  (màn hình đăng nhập lật gương khung hình webcam trước khi gửi đi).
- Tính vector trung tâm (Centroid) và ghi/ghi đè hồ sơ `key` trong data/face_embeddings.json,
  giữ nguyên các hồ sơ khác (khác với enroll.py - script đó ghi lại toàn bộ file).
"""

import os
import sys
import json
import argparse
import numpy as np
from PIL import Image, ImageOps

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from face_engine import extract_face_and_embedding, compute_metrics

DATA_PATH = os.path.join(os.path.dirname(current_dir), "data", "face_embeddings.json")


def main():
    parser = argparse.ArgumentParser(description="Đăng ký khuôn mặt từ ảnh")
    parser.add_argument("--key", required=True, help="Mã hồ sơ, ví dụ: haidang")
    parser.add_argument("--name", required=True, help="Tên hiển thị")
    parser.add_argument("--role", required=True, choices=["admin", "manager", "cashier", "inventory_staff"])
    parser.add_argument("--email", required=True, help="Email trùng với tài khoản nhân sự")
    parser.add_argument("--force", action="store_true", help="Cho phép ghi đè hồ sơ đang gắn với email khác")
    parser.add_argument("images", nargs="+")
    args = parser.parse_args()

    key = args.key.strip().lower()
    email = args.email.strip().lower()

    db = {}
    if os.path.exists(DATA_PATH):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            db = json.load(f)

    existing = db.get(key)
    if existing and existing.get("email", "").lower() != email and not args.force:
        sys.exit(f"[DỪNG] Hồ sơ '{key}' đang thuộc {existing.get('email')}. Dùng --key khác hoặc thêm --force.")
    for k, v in db.items():
        if k != key and v.get("email", "").lower() == email:
            sys.exit(f"[DỪNG] Email {email} đã gắn với hồ sơ '{k}'.")

    embeddings = []
    for path in args.images:
        base = Image.open(path).convert("RGB")
        for label, img in (("gốc", base), ("lật gương", ImageOps.mirror(base))):
            emb, box, landmarks, prob = extract_face_and_embedding(img)
            if emb is None:
                print(f"  [-] {os.path.basename(path)} ({label}) -> Không phát hiện khuôn mặt")
                continue
            embeddings.append(emb)
            print(f"  [+] {os.path.basename(path)} ({label}) -> Conf: {prob:.3f}")

    if not embeddings:
        sys.exit("[DỪNG] Không trích xuất được khuôn mặt nào.")

    centroid = np.mean(embeddings, axis=0)
    centroid = centroid / np.linalg.norm(centroid)

    # Kiểm tra độ phân tách với các hồ sơ khác (ngưỡng xác thực trong server.py là 0.72)
    print("\n=== ĐỘ TƯƠNG ĐỒNG VỚI CÁC HỒ SƠ KHÁC ===")
    for k, v in db.items():
        if k == key:
            continue
        cosine_sim, _, percent = compute_metrics(centroid, np.array(v["embedding"], dtype=np.float32))
        warn = "  <-- CAO, dễ nhầm lẫn" if cosine_sim >= 0.72 else ""
        print(f"  • {v.get('display_name', k)}: cosine {cosine_sim:.4f} ({percent}%){warn}")

    db[key] = {
        "name": key,
        "display_name": args.name,
        "role": args.role,
        "email": email,
        "sample_count": len(embeddings),
        "embedding": centroid.tolist(),
    }

    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

    print(f"\n-> Đã lưu hồ sơ '{key}' ({len(embeddings)} mẫu) vào: {DATA_PATH}")


if __name__ == "__main__":
    main()
