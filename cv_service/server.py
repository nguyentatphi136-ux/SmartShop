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

from face_engine import (
    load_image_from_base64,
    extract_face_and_embedding,
    extract_all_faces_and_embeddings,
    compute_metrics
)

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
        "engine": "MTCNN (keep_all=True) + FaceNet InceptionResnetV1 (VGGFace2)",
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

    # 1. Giải mã ảnh và phát hiện tất cả các khuôn mặt qua MTCNN
    try:
        img = load_image_from_base64(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể giải mã hình ảnh: {str(e)}")

    detected_faces = extract_all_faces_and_embeddings(img)

    if not detected_faces:
        return {
            "success": False,
            "matched": False,
            "error": "Không tìm thấy khuôn mặt rõ ràng trong khung hình. Vui lòng nhìn thẳng vào camera, đủ sáng và không bị che khuất.",
            "detectionProb": 0.0,
            "hasFace": False,
            "faceCount": 0
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
                for k, v in db.items():
                    if v.get("role") == "manager":
                        target_key = k
                        break

    # 3. Duyệt và nhận diện tất cả khuôn mặt trong khung hình
    evaluated_faces = []
    matched_face = None

    for idx, face_item in enumerate(detected_faces):
        emb = face_item["embedding"]
        best_candidate_key = None
        best_cosine_sim = -1.0
        best_metrics = {}
        all_comps = {}

        for k, v in db.items():
            stored_emb = np.array(v["embedding"], dtype=np.float32)
            c_sim, e_dist, s_percent = compute_metrics(emb, stored_emb)
            all_comps[k] = {
                "name": v.get("display_name", k),
                "role": v.get("role"),
                "cosineSim": round(c_sim, 4),
                "euclidDist": round(e_dist, 4),
                "similarityPercent": s_percent
            }
            if c_sim > best_cosine_sim:
                best_cosine_sim = c_sim
                best_candidate_key = k
                best_metrics = all_comps[k]

        is_known = best_cosine_sim >= 0.70
        is_this_target = False
        if target_key:
            target_metrics = all_comps.get(target_key, {})
            target_cosine = target_metrics.get("cosineSim", 0.0)
            if target_cosine >= 0.72 and (best_candidate_key == target_key or target_cosine >= 0.78):
                is_this_target = True

        info = db.get(best_candidate_key, {}) if is_known else {}
        face_desc = {
            "index": idx,
            "name": info.get("display_name", "Người lạ / Chưa đăng ký") if is_known else "Người lạ / Chưa đăng ký",
            "role": info.get("role", "unknown") if is_known else "unknown",
            "key": best_candidate_key if is_known else "unknown",
            "isKnown": is_known,
            "isTarget": is_this_target,
            "cosineSimilarity": best_metrics.get("cosineSim", 0.0),
            "euclideanDistance": best_metrics.get("euclidDist", 2.0),
            "similarityPercent": best_metrics.get("similarityPercent", 0.0),
            "boundingBox": face_item["box"],
            "landmarks": face_item["landmarks"],
            "detectionProb": face_item["prob"],
            "comparisons": all_comps
        }
        evaluated_faces.append(face_desc)

        if is_this_target and matched_face is None:
            matched_face = face_desc

    # Nếu có target_key: kiểm tra xem có khuôn mặt nào khớp không
    if target_key and target_key in db:
        target_info = db[target_key]
        target_name = target_info.get("display_name", target_key)

        if matched_face:
            other_names = [f["name"] for f in evaluated_faces if f != matched_face]
            multi_note = f" (Cùng xuất hiện: {', '.join(other_names)})" if other_names else ""
            return {
                "success": True,
                "matched": True,
                "target": target_key,
                "targetName": target_name,
                "targetRole": target_info.get("role", "staff"),
                "cosineSimilarity": matched_face["cosineSimilarity"],
                "euclideanDistance": matched_face["euclideanDistance"],
                "similarityPercent": matched_face["similarityPercent"],
                "threshold": 0.72,
                "boundingBox": matched_face["boundingBox"],
                "landmarks": matched_face["landmarks"],
                "detectionProb": matched_face["detectionProb"],
                "faceCount": len(evaluated_faces),
                "faces": evaluated_faces,
                "message": f"Xác thực khuôn mặt thành công: {target_name} (Khớp {matched_face['similarityPercent']}%){multi_note}"
            }
        else:
            # Tìm khuôn mặt có độ tương tự cao nhất với target để báo phần trăm
            best_target_sim = max([f["comparisons"].get(target_key, {}).get("similarityPercent", 0.0) for f in evaluated_faces], default=0.0)
            return {
                "success": True,
                "matched": False,
                "target": target_key,
                "targetName": target_name,
                "targetRole": target_info.get("role", "staff"),
                "similarityPercent": best_target_sim,
                "threshold": 0.72,
                "faceCount": len(evaluated_faces),
                "faces": evaluated_faces,
                "boundingBox": evaluated_faces[0]["boundingBox"] if evaluated_faces else None,
                "landmarks": evaluated_faces[0]["landmarks"] if evaluated_faces else None,
                "message": f"Không tìm thấy khuôn mặt khớp với hồ sơ {target_name} trong khung hình (Chỉ đạt tối đa {best_target_sim}% tương đồng)."
            }
    else:
        # Chế độ 1:N: Nhận diện tự do
        primary = evaluated_faces[0]
        return {
            "success": True,
            "matched": primary["isKnown"],
            "target": primary["key"],
            "targetName": primary["name"],
            "targetRole": primary["role"],
            "cosineSimilarity": primary["cosineSimilarity"],
            "euclideanDistance": primary["euclideanDistance"],
            "similarityPercent": primary["similarityPercent"],
            "threshold": 0.72,
            "boundingBox": primary["boundingBox"],
            "landmarks": primary["landmarks"],
            "detectionProb": primary["detectionProb"],
            "faceCount": len(evaluated_faces),
            "faces": evaluated_faces,
            "imgWidth": img.width,
            "imgHeight": img.height,
            "message": (
                f"Nhận diện: {primary['name']} ({primary['similarityPercent']}%)"
                if primary["isKnown"] else
                "Không nhận diện được danh tính trong hệ thống."
            )
        }


@app.post("/api/cv/track")
def track_face(req: VerifyRequest):
    """
    Endpoint tối ưu tốc độ cao cho Realtime Live Tracking ĐA KHUÔN MẶT:
    Phát hiện TOÀN BỘ khuôn mặt (Chủ cửa hàng, Quản lý, Người lạ),
    gắn Bounding Box & nhãn danh tính cho từng người cùng lúc.
    """
    if not req.image or len(req.image) < 100:
        return {"hasFace": False, "faceCount": 0, "faces": []}

    db = load_database()
    if not db:
        return {"hasFace": False, "faceCount": 0, "faces": [], "error": "Chưa nạp database"}

    try:
        img = load_image_from_base64(req.image)
        img_w, img_h = img.width, img.height
    except Exception:
        return {"hasFace": False, "faceCount": 0, "faces": []}

    detected_faces = extract_all_faces_and_embeddings(img)
    if not detected_faces:
        return {"hasFace": False, "faceCount": 0, "faces": [], "imgWidth": img_w, "imgHeight": img_h}

    # Xác định đối tượng mục tiêu đang đăng nhập (nếu có)
    target_key = None
    clean_email = req.email.strip().lower() if req.email else ""
    clean_role = req.role.strip().lower() if req.role else ""

    if clean_email:
        for k, v in db.items():
            if v.get("email", "").lower() == clean_email:
                target_key = k
                break
    if not target_key and clean_role:
        if clean_role == "admin" and "nguyentatphi" in db:
            target_key = "nguyentatphi"
        elif clean_role == "manager" and "thanphucuong" in db:
            target_key = "thanphucuong"

    # Nhận diện từng khuôn mặt
    faces_list = []
    any_target_matched = False

    for item in detected_faces:
        emb = item["embedding"]
        best_key = None
        best_cosine = -1.0
        all_metrics = {}

        for k, v in db.items():
            stored_emb = np.array(v["embedding"], dtype=np.float32)
            c_sim, _, s_percent = compute_metrics(emb, stored_emb)
            all_metrics[k] = {
                "cosine": c_sim,
                "percent": s_percent
            }
            if c_sim > best_cosine:
                best_cosine = c_sim
                best_key = k

        is_known = best_cosine >= 0.70
        is_target = False

        if target_key:
            target_metric = all_metrics.get(target_key)
            if target_metric and target_metric["cosine"] >= 0.72:
                if best_key == target_key or target_metric["cosine"] >= 0.78:
                    is_target = True
                    any_target_matched = True

        if is_known:
            info = db.get(best_key, {})
            name = info.get("display_name", best_key)
            role = info.get("role", "staff")
            key = best_key
            percent = all_metrics[best_key]["percent"]
        else:
            name = "Người lạ"
            role = "unknown"
            key = "unknown"
            percent = max(0.0, all_metrics[best_key]["percent"]) if best_key else 0.0

        faces_list.append({
            "name": name,
            "role": role,
            "key": key,
            "isKnown": is_known,
            "isTarget": is_target,
            "similarityPercent": percent,
            "cosineSimilarity": round(best_cosine, 4),
            "box": item["box"],
            "landmarks": item["landmarks"],
            "detectionProb": item["prob"]
        })

    # Chọn khuôn mặt ưu tiên (Primary Face) cho backward-compatibility
    primary = faces_list[0]
    for f in faces_list:
        if f["isTarget"]:
            primary = f
            break
        elif f["isKnown"] and not primary["isKnown"]:
            primary = f

    return {
        "hasFace": True,
        "faceCount": len(faces_list),
        "faces": faces_list,
        "name": primary["name"],
        "role": primary["role"],
        "key": primary["key"],
        "isKnown": primary["isKnown"],
        "isTarget": any_target_matched,
        "targetKey": target_key,
        "similarityPercent": primary["similarityPercent"],
        "cosineSimilarity": primary["cosineSimilarity"],
        "box": primary["box"],
        "landmarks": primary["landmarks"],
        "detectionProb": primary["detectionProb"],
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
