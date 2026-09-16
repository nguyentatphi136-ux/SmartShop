"""
Enrollment Script: Đọc bộ dữ liệu 'faceid/' do người dùng cung cấp,
trích xuất vector đặc trưng 512 chiều bằng MTCNN + FaceNet
và tính toán vector trung tâm (Centroid Vector) cho:
  - Class 0: nguyentatphi  -> Chủ cửa hàng (Admin)
  - Class 1: thanphucuong  -> Quản lý cửa hàng (Manager)
Lưu kết quả vào 'data/face_embeddings.json' để phục vụ xác thực nhanh chóng.
"""

import os
import sys
import glob
import json
import numpy as np
from PIL import Image

# Đảm bảo in tiếng Việt trên console Windows không bị lỗi charmap cp1252
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Thêm đường dẫn hiện tại vào sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from face_engine import extract_face_and_embedding, compute_metrics


def enroll_dataset(dataset_dir="faceid", output_path="data/face_embeddings.json"):
    print(f"=== BẮT ĐẦU TRÍCH XUẤT ĐẶC TRƯNG TỪ TẬP DỮ LIỆU: {dataset_dir} ===")

    classes = {
        0: {
            "name": "nguyentatphi",
            "display_name": "Nguyễn Tất Phi (Chủ cửa hàng)",
            "role": "admin",
            "email": "nguyentatphi136@gmail.com",
            "embeddings": []
        },
        1: {
            "name": "thanphucuong",
            "display_name": "Thân Phú Cường (Quản lý)",
            "role": "manager",
            "email": "cuong.than@smartsale.ai",
            "embeddings": []
        }
    }

    # Quét tất cả các thư mục train và valid
    subsets = ["train", "valid"]
    total_processed = 0

    for subset in subsets:
        images_dir = os.path.join(dataset_dir, subset, "images")
        labels_dir = os.path.join(dataset_dir, subset, "labels")

        if not os.path.exists(images_dir):
            continue

        image_files = glob.glob(os.path.join(images_dir, "*.*"))

        for img_path in image_files:
            base_name = os.path.splitext(os.path.basename(img_path))[0]
            label_path = os.path.join(labels_dir, f"{base_name}.txt")

            if not os.path.exists(label_path):
                continue

            with open(label_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                if not lines:
                    continue
                try:
                    class_id = int(lines[0].strip().split()[0])
                except (ValueError, IndexError):
                    continue

            if class_id not in classes:
                continue

            try:
                img = Image.open(img_path).convert("RGB")
                emb, box, landmarks, prob = extract_face_and_embedding(img)

                if emb is not None:
                    classes[class_id]["embeddings"].append(emb)
                    total_processed += 1
                    print(f"  [+] {subset}/{os.path.basename(img_path)} -> {classes[class_id]['name']} (Conf: {prob:.2f})")
                else:
                    print(f"  [-] {subset}/{os.path.basename(img_path)} -> Không phát hiện khuôn mặt")
            except Exception as e:
                print(f"  [!] Lỗi khi xử lý {img_path}: {e}")

    print(f"\n-> Đã xử lý thành công {total_processed} ảnh hợp lệ.")

    # Tính vector trung bình (Centroid) cho từng người
    result_data = {}

    for cid, info in classes.items():
        embs = info["embeddings"]
        if len(embs) == 0:
            print(f"[CẢNH BÁO] Không có embedding nào cho {info['name']}")
            continue

        # Tính vector trung tâm: Trung bình cộng các vector thành phần
        centroid = np.mean(embs, axis=0)
        # Chuẩn hoá lại về độ dài đơn vị (Unit length)
        centroid = centroid / np.linalg.norm(centroid)

        result_data[info["name"]] = {
            "name": info["name"],
            "display_name": info["display_name"],
            "role": info["role"],
            "email": info["email"],
            "sample_count": len(embs),
            "embedding": centroid.tolist()
        }

        print(f"-> {info['display_name']} ({info['name']}): Đã tổng hợp từ {len(embs)} ảnh mẫu.")

    # Tính độ tương đồng chéo (Inter-class difference) để kiểm tra tính phân tách giữa 2 người
    if "nguyentatphi" in result_data and "thanphucuong" in result_data:
        v1 = np.array(result_data["nguyentatphi"]["embedding"])
        v2 = np.array(result_data["thanphucuong"]["embedding"])
        cosine_sim, euclid_dist, percent = compute_metrics(v1, v2)
        print("\n=== ĐỘ PHÂN TÁCH GIỮA 2 ĐỐI TƯỢNG (INTER-CLASS METRICS) ===")
        print(f"  • Cosine Similarity: {cosine_sim:.4f}")
        print(f"  • Euclidean Distance: {euclid_dist:.4f}")
        print(f"  • Độ tương đồng: {percent}%")
        if cosine_sim < 0.6:
            print("  ==> TUYỆT VỜI! 2 khuôn mặt có sự phân tách rõ rệt, mô hình sẽ phân biệt rất chuẩn xác!")
        else:
            print("  ==> 2 vector có độ tương đồng khá cao, nên đặt ngưỡng nhận diện cẩn thận.")

    # Lưu kết quả
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)

    print(f"\n-> Đã lưu dữ liệu khuôn mặt vào: {output_path}")
    return result_data


if __name__ == "__main__":
    enroll_dataset()
