"""
Face Engine: Module cốt lõi thực hiện bài toán Computer Vision
1. DETECTION & ALIGNMENT: Dùng mạng MTCNN (P-Net -> R-Net -> O-Net) phát hiện và căn chỉnh góc mặt dựa trên 5 điểm landmarks
2. FEATURE EXTRACTION: Dùng mạng InceptionResnetV1 (FaceNet) nén khuôn mặt về vector đặc trưng 512 chiều (Face Embedding)
3. VERIFICATION: Tính toán khoảng cách Euclid (L2 Distance) và Cosine Similarity bằng NumPy
"""

import io
import base64
import torch
import numpy as np
from PIL import Image
from facenet_pytorch import MTCNN, InceptionResnetV1

# Thiết bị tính toán (CPU hoặc CUDA nếu có GPU)
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')

# 1. Khởi tạo MTCNN cho bài toán Face Detection & Alignment
# image_size=160: Kích thước chuẩn đầu vào của FaceNet
# margin=14: Mở rộng vùng crop xung quanh khuôn mặt một chút để giữ trọn vẹn cằm và trán
# keep_all=False: Chỉ lấy khuôn mặt rõ nét nhất trong khung hình
mtcnn = MTCNN(
    image_size=160,
    margin=14,
    min_face_size=40,
    thresholds=[0.6, 0.7, 0.7], # Ngưỡng xác suất của 3 mạng P-Net, R-Net, O-Net
    factor=0.709,
    post_process=True,
    device=device,
    keep_all=False
)

# 2. Khởi tạo FaceNet (InceptionResnetV1) đã được huấn luyện trên tập dữ liệu VGGFace2
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)


def load_image_from_base64(b64_string: str) -> Image.Image:
    """Chuyển đổi chuỗi ảnh Base64 từ trình duyệt thành đối tượng ảnh PIL RGB"""
    if ',' in b64_string:
        b64_string = b64_string.split(',', 1)[1]
    image_bytes = base64.b64decode(b64_string)
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    return img


def extract_face_and_embedding(image: Image.Image):
    """
    Quy trình xử lý ảnh:
    1. MTCNN phát hiện khuôn mặt, lấy Bounding Box [x1, y1, x2, y2] và 5 điểm Landmarks
    2. Cắt và căn chỉnh khuôn mặt về chuẩn 160x160
    3. FaceNet trích xuất vector 512 chiều và chuẩn hoá (L2-norm = 1.0)
    
    Returns:
        embedding: np.ndarray (512,) hoặc None nếu không thấy mặt
        box: list [x1, y1, x2, y2]
        landmarks: list các điểm mốc mắt, mũi, miệng
        prob: float độ tin cậy phát hiện khuôn mặt (0.0 -> 1.0)
    """
    # Bước 1: Phát hiện Bounding Box & Landmarks
    boxes, probs, landmarks = mtcnn.detect(image, landmarks=True)
    
    if boxes is None or len(boxes) == 0 or probs[0] is None or probs[0] < 0.6:
        return None, None, None, 0.0

    best_box = boxes[0].tolist()
    best_prob = float(probs[0])
    best_landmarks = landmarks[0].tolist() if landmarks is not None else None

    # Bước 2: Cắt và căn chỉnh khuôn mặt qua MTCNN
    face_tensor = mtcnn(image)
    if face_tensor is None:
        return None, best_box, best_landmarks, best_prob

    # Bước 3: Đưa qua mạng FaceNet để trích xuất vector 512 chiều
    with torch.no_grad():
        face_tensor = face_tensor.unsqueeze(0).to(device)
        embedding_tensor = resnet(face_tensor)
        # Chuẩn hoá L2: ||v|| = 1
        embedding_tensor = torch.nn.functional.normalize(embedding_tensor, p=2, dim=1)
        embedding = embedding_tensor.squeeze().cpu().numpy()

    return embedding, best_box, best_landmarks, best_prob


def compute_metrics(emb1: np.ndarray, emb2: np.ndarray):
    """
    Tính toán 2 độ đo toán học kinh điển trong Computer Vision:
    1. Cosine Similarity = (A . B) / (||A|| * ||B||) -> Vì cả 2 vector đã chuẩn hoá L2 nên chỉ cần A . B
    2. Euclidean Distance (L2 Distance) = sqrt(sum((A - B)^2))
    
    Returns:
        cosine_sim: float (thường từ 0.0 đến 1.0)
        euclidean_dist: float (khoảng từ 0.0 đến 2.0, càng nhỏ càng giống nhau)
        similarity_percentage: float (độ tương đồng theo phần trăm, 0% -> 100%)
    """
    emb1 = np.array(emb1, dtype=np.float32)
    emb2 = np.array(emb2, dtype=np.float32)

    # 1. Cosine Similarity
    cosine_sim = float(np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2) + 1e-8))
    
    # 2. Euclidean Distance
    euclidean_dist = float(np.linalg.norm(emb1 - emb2))
    
    # Quy đổi về phần trăm tương đồng trực quan cho người dùng:
    # Đối với FaceNet (VGGFace2), khoảng cách Euclidean:
    # - Cùng một người: Euclidean < 0.8 (Cosine > 0.68)
    # - Người khác nhau: Euclidean > 1.1 (Cosine < 0.40)
    # Ta ánh xạ Cosine từ [-0.2, 1.0] thành [0%, 100%]
    sim_percent = max(0.0, min(100.0, float((cosine_sim + 0.1) / 1.1 * 100.0)))

    return cosine_sim, euclidean_dist, round(sim_percent, 2)
