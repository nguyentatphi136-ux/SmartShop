"""
FastAPI Service cho Computer Vision (MTCNN + FaceNet)
Chạy ở cổng 8000:
- GET  /api/cv/health: Kiểm tra trạng thái service và các hồ sơ khuôn mặt đã đăng ký
- POST /api/cv/verify: Nhận ảnh từ camera web, phát hiện khuôn mặt, trích xuất vector và đối chiếu với CSDL
- POST /api/cv/enroll: Đăng ký / cập nhật khuôn mặt mới trực tiếp từ camera
"""

import os
import sys
import json
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

# Đảm bảo UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from face_engine import load_image_from_base64, extract_face_and_embedding, compute_metrics

app = FastAPI(
    title="SmartShop Face Recognition Service",
    description="Microservice nhận diện khuôn mặt bằng MTCNN + FaceNet cho Chủ cửa hàng và Quản lý",
    version="1.0.0"
)

# Cấu hình CORS để web frontend (port 3000 / 5173) gọi được trực tiếp nếu cần
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(current_dir), "data", "face_embeddings.json")


def load_database():
    if not os.path.exists(DATA_PATH):
        return {}
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Lỗi khi đọc CSDL khuôn mặt: {e}")
        return {}


def save_database(db):
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)


class VerifyRequest(BaseModel):
    image: str
    role: Optional[str] = None
    email: Optional[str] = None


class EnrollRequest(BaseModel):
    image: str
    key: str
    displayName: str
    role: str
    email: str


@app.get("/api/cv/health")
def health_check():
    db = load_database()
    profiles = []
    for k, v in db.items():
        profiles.append({
            "key": k,
            "displayName": v.get("display_name", k),
            "role": v.get("role", "staff"),
            "email": v.get("email", ""),
            "sampleCount": v.get("sample_count", 1)
        })
    return {
        "status": "healthy",
        "engine": "MTCNN (Detection/Alignment) + FaceNet InceptionResnetV1 (VGGFace2)",
        "vectorDimensions": 512,
        "enrolledCount": len(profiles),
        "profiles": profiles
    }


@app.post("/api/cv/verify")
def verify_face(req: VerifyRequest):
    if not req.image or len(req.image) < 100:
        raise HTTPException(status_code=400, detail="Chuỗi hình ảnh base64 không hợp lệ")

    db = load_database()
    if not db:
        raise HTTPException(
            status_code=500,
            detail="Chưa có dữ liệu khuôn mặt mẫu nào được nạp vào hệ thống. Vui lòng chạy enroll.py trước."
        )

    # 1. Giải mã ảnh và xử lý qua MTCNN + FaceNet
    try:
        img = load_image_from_base64(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể giải mã hình ảnh: {str(e)}")

    embedding, bbox, landmarks, prob = extract_face_and_embedding(img)

    if embedding is None:
        return {
            "success": False,
            "matched": False,
            "error": "Không tìm thấy khuôn mặt rõ ràng trong khung hình. Vui lòng nhìn thẳng vào camera, đủ sáng và không bị che khuất.",
            "detectionProb": prob,
            "hasFace": False
        }

    # 2. Xác định đối tượng mục tiêu cần so khớp
    target_key = None
    clean_email = req.email.strip().lower() if req.email else ""
    clean_role = req.role.strip().lower() if req.role else ""

    # Tìm theo email trước
    for k, v in db.items():
        if v.get("email", "").lower() == clean_email:
            target_key = k
            break

    # Nếu không thấy theo email, tìm theo role
    if not target_key and clean_role:
        if clean_role == "admin" and "nguyentatphi" in db:
            target_key = "nguyentatphi"
        elif clean_role == "manager":
            if "thanphucuong" in db:
                target_key = "thanphucuong"
            elif len(db) > 0:
                # Lấy profile quản lý đầu tiên
                for k, v in db.items():
                    if v.get("role") == "manager":
                        target_key = k
                        break

    # Nếu vẫn chưa thấy, mặc định so sánh với toàn bộ database để tìm người giống nhất (1:N Identification)
    best_candidate_key = None
    best_cosine_sim = -1.0
    all_comparisons = {}

    for k, v in db.items():
        stored_emb = np.array(v["embedding"], dtype=np.float32)
        c_sim, e_dist, s_percent = compute_metrics(embedding, stored_emb)
        all_comparisons[k] = {
            "name": v.get("display_name", k),
            "role": v.get("role"),
            "cosineSim": round(c_sim, 4),
            "euclidDist": round(e_dist, 4),
            "similarityPercent": s_percent
        }
        if c_sim > best_cosine_sim:
            best_cosine_sim = c_sim
            best_candidate_key = k

    # 3. Đánh giá tính khớp (Verification 1:1)
    if target_key and target_key in db:
        target_info = db[target_key]
        target_metrics = all_comparisons[target_key]
        target_cosine = target_metrics["cosineSim"]
        target_euclid = target_metrics["euclidDist"]
        target_percent = target_metrics["similarityPercent"]

        # Ngưỡng quyết định (Decision Threshold) của FaceNet:
        # Cosine Similarity >= 0.72 VÀ là người có độ tương đồng cao nhất
        is_matched = (target_cosine >= 0.72) and (best_candidate_key == target_key or target_cosine >= 0.78)

        return {
            "success": True,
            "matched": is_matched,
            "target": target_key,
            "targetName": target_info.get("display_name", target_key),
            "targetRole": target_info.get("role", "staff"),
            "cosineSimilarity": target_cosine,
            "euclideanDistance": target_euclid,
            "similarityPercent": target_percent,
            "threshold": 0.72,
            "boundingBox": bbox,
            "landmarks": landmarks,
            "detectionProb": round(prob, 4),
            "bestCandidate": best_candidate_key,
            "comparisons": all_comparisons,
            "message": (
                f"Xác thực khuôn mặt thành công: {target_info.get('display_name')} (Khớp {target_percent}%)"
                if is_matched else
                f"Khuôn mặt không khớp với hồ sơ {target_info.get('display_name')} (Chỉ đạt {target_percent}% tương đồng)"
            )
        }
    else:
        # Chế độ 1:N: Nhận dạng tự do
        best_info = db[best_candidate_key]
        best_metrics = all_comparisons[best_candidate_key]
        is_matched = best_metrics["cosineSim"] >= 0.72

        return {
            "success": True,
            "matched": is_matched,
            "target": best_candidate_key,
            "targetName": best_info.get("display_name", best_candidate_key),
            "targetRole": best_info.get("role", "staff"),
            "cosineSimilarity": best_metrics["cosineSim"],
            "euclideanDistance": best_metrics["euclidDist"],
            "similarityPercent": best_metrics["similarityPercent"],
            "threshold": 0.72,
            "boundingBox": bbox,
            "landmarks": landmarks,
            "detectionProb": round(prob, 4),
            "imgWidth": img.width,
            "imgHeight": img.height,
            "comparisons": all_comparisons,
            "message": (
                f"Nhận diện: {best_info.get('display_name')} (Độ tin cậy: {best_metrics['similarityPercent']}%)"
                if is_matched else
                "Không nhận diện được danh tính phù hợp trong hệ thống."
            )
        }


@app.post("/api/cv/track")
def track_face(req: VerifyRequest):
    """
    Endpoint tối ưu tốc độ cao cho Realtime Live Tracking:
    Nhận frame ảnh, tìm vị trí Bounding Box, 5 điểm Landmarks,
    và so khớp ngay lập tức để trả về TÊN người đứng trước camera.
    """
    if not req.image or len(req.image) < 100:
        return {"hasFace": False}

    db = load_database()
    if not db:
        return {"hasFace": False, "error": "Chưa nạp database"}

    try:
        img = load_image_from_base64(req.image)
        img_w, img_h = img.width, img.height
    except Exception:
        return {"hasFace": False}

    embedding, bbox, landmarks, prob = extract_face_and_embedding(img)
    if embedding is None or bbox is None:
        return {"hasFace": False, "imgWidth": img_w, "imgHeight": img_h}

    # So sánh với tất cả hồ sơ để tìm người có độ tương đồng cao nhất
    best_candidate_key = None
    best_cosine_sim = -1.0
    all_comparisons = {}

    for k, v in db.items():
        stored_emb = np.array(v["embedding"], dtype=np.float32)
        c_sim, e_dist, s_percent = compute_metrics(embedding, stored_emb)
        all_comparisons[k] = {
            "name": v.get("display_name", k),
            "role": v.get("role"),
            "cosineSim": round(c_sim, 4),
            "similarityPercent": s_percent
        }
        if c_sim > best_cosine_sim:
            best_cosine_sim = c_sim
            best_candidate_key = k

    best_info = db.get(best_candidate_key, {})
    best_metrics = all_comparisons.get(best_candidate_key, {})

    # Kiểm tra xem có khớp với tài khoản mục tiêu đang đăng nhập không
    target_key = None
    if req.email:
        clean_email = req.email.strip().lower()
        for k, v in db.items():
            if v.get("email", "").lower() == clean_email:
                target_key = k
                break
    if not target_key and req.role:
        clean_role = req.role.strip().lower()
        if clean_role == "admin" and "nguyentatphi" in db:
            target_key = "nguyentatphi"
        elif clean_role == "manager" and "thanphucuong" in db:
            target_key = "thanphucuong"

    is_matched = False
    is_known = best_cosine_sim >= 0.70
    if target_key:
        target_sim = all_comparisons.get(target_key, {}).get("cosineSim", 0)
        is_matched = (target_sim >= 0.72) and (best_candidate_key == target_key or target_sim >= 0.78)

    recognized_name = best_info.get("display_name", "Không xác định") if is_known else "Chưa nhận diện / Người lạ"
    recognized_role = best_info.get("role", "unknown") if is_known else "unknown"

    return {
        "hasFace": True,
        "name": recognized_name,
        "role": recognized_role,
        "key": best_candidate_key if is_known else "unknown",
        "isKnown": is_known,
        "isTarget": is_matched,
        "targetKey": target_key,
        "similarityPercent": best_metrics.get("similarityPercent", 0),
        "cosineSimilarity": best_metrics.get("cosineSim", 0),
        "box": bbox,  # [x1, y1, x2, y2] trong toạ độ ảnh
        "landmarks": landmarks,
        "detectionProb": round(prob, 3),
        "imgWidth": img_w,
        "imgHeight": img_h
    }



@app.post("/api/cv/enroll")
def enroll_face(req: EnrollRequest):
    img = load_image_from_base64(req.image)
    embedding, bbox, landmarks, prob = extract_face_and_embedding(img)

    if embedding is None:
        raise HTTPException(
            status_code=400,
            detail="Không tìm thấy khuôn mặt rõ ràng trong ảnh. Vui lòng chụp lại góc thẳng và đủ sáng."
        )

    db = load_database()
    key = req.key.strip().lower()

    if key in db and "embedding" in db[key]:
        # Cập nhật bằng cách lấy trung bình có trọng số với vector cũ (Exponential Moving Average)
        old_emb = np.array(db[key]["embedding"])
        new_emb = (old_emb * 0.4 + embedding * 0.6)
        new_emb = new_emb / np.linalg.norm(new_emb)
        db[key]["embedding"] = new_emb.tolist()
        db[key]["sample_count"] = db[key].get("sample_count", 1) + 1
        db[key]["display_name"] = req.displayName
        db[key]["role"] = req.role
        db[key]["email"] = req.email
    else:
        db[key] = {
            "name": key,
            "display_name": req.displayName,
            "role": req.role,
            "email": req.email,
            "sample_count": 1,
            "embedding": embedding.tolist()
        }

    save_database(db)

    return {
        "success": True,
        "message": f"Đã đăng ký thành công khuôn mặt cho {req.displayName}!",
        "key": key,
        "boundingBox": bbox,
        "detectionProb": round(prob, 4)
    }


if __name__ == "__main__":
    import uvicorn
    print("Khởi chạy FastAPI CV Service tại http://127.0.0.1:8000 ...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
