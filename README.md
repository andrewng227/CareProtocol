# 🏥 CareProtocol — Trợ Lý Phục Hồi Hậu Phẫu Thông Minh x Solana Blockchain

<p align="center">
  <img src="https://img.shields.io/badge/Solana-Devnet-14F195?style=for-the-badge&logo=solana&logoColor=black" alt="Solana Devnet" />
  <img src="https://img.shields.io/badge/AI-MediaPipe_Pose-FF6F00?style=for-the-badge&logo=google&logoColor=white" alt="MediaPipe" />
  <img src="https://img.shields.io/badge/Google_Gemini-Vision_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini Vision" />
  <img src="https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

> **CareProtocol** là nền tảng y tế số tiên phong kết hợp **AI Computer Vision (MediaPipe Pose)** và **Blockchain (Solana)** nhằm hỗ trợ bệnh nhân tự phục hồi chức năng hậu phẫu tại nhà chuẩn y khoa, minh bạch dữ liệu điều trị và xác thực tuân thủ bất biến với chi phí gần như bằng 0.

---

## 🌟 Các Tính Năng Nổi Bật (Key Features)

### 1. 🏃 AI Huấn Luyện Viên Phục Hồi (Edge AI Pose Tracking)
- **Xử lý 100% On-Device (Client-side):** Sử dụng MediaPipe Pose chạy trực tiếp trên GPU trình duyệt qua WebAssembly, đảm bảo hình ảnh/video riêng tư của bệnh nhân không bao giờ rời khỏi máy.
- **Phân tích Biên độ Vận động (ROM - Range of Motion):** Đo góc gập duỗi khớp gối/vai thời gian thực, đếm số lần lặp (reps) chính xác và cảnh báo khi vượt ngưỡng an toàn.
- **Trợ lý Giọng nói Tiếng Việt:** Hướng dẫn, đếm nhịp và khích lệ người bệnh phát âm chuẩn y khoa offline.

### 2. 📋 Cổng Hồ Sơ Bệnh Án Điện Tử (Personal Patient EMR)
- **Quản lý Hồ sơ Cá nhân:** Tra cứu và chỉnh sửa thông tin bệnh nhân, số điện thoại, địa chỉ nhà, liên hệ khẩn cấp của người thân.
- **Cơ chế Phân quyền Thông minh:** Tự động bảo mật và ẩn/hiện các tab Quản lý/Đổi tài khoản linh hoạt theo trạng thái đăng nhập.
- **Đa dạng Phác đồ Phẫu thuật:** Hỗ trợ chuẩn hóa phác đồ cho Thay khớp gối (TKA), Tái tạo dây chằng (ACL), Mổ bắt con (C-Section), Thoát vị đĩa đệm cột sống...

### 3. 🔍 Trợ Lý Đơn Thuốc & Quan Sát Vết Mổ (Multimodal AI)
- **Gemini Vision OCR:** Nhận diện và trích xuất liều lượng, cách dùng từ ảnh chụp toa thuốc thực tế.
- **Camera Vết Mổ & Triệu Chứng:** Hỗ trợ chụp và theo dõi tiến trình hồi phục vết mổ, phát hiện sớm dấu hiệu nhiễm trùng.

### 4. ⚡ Xác Thực Tuân Thủ On-Chain (Solana Blockchain Verification)
- **Bằng chứng Bất biến (Proof-of-Rehab):** Gói gọn số lần tập, biên độ ROM và hàm băm SHA-256 vào giao dịch Solana Devnet qua ví Phantom.
- **Chi phí siêu rẻ & Tốc độ tức thì:** Lưu trữ phân tán, chống gian lận bảo hiểm y tế và giúp bác sĩ điều trị dễ dàng tra cứu qua Solana Explorer.

---

## 🏛️ Kiến Trúc Hệ Thống (System Architecture)

```text
       ┌─────────────────────────────────────────────────────────┐
       │                   TRÌNH DUYỆT BỆNH NHÂN                  │
       │                                                         │
       │   [ Camera Web / Mobile ]                               │
       │              │                                          │
       │              ▼                                          │
       │   [ MediaPipe Pose Engine ] ──► Đo góc ROM & Đếm Reps   │
       │              │                                          │
       │              ▼                                          │
       │   [ Web Crypto API ] ─────────► Tạo Hash SHA-256        │
       │              │                                          │
       │              ▼                                          │
       │   [ Phantom Solana Wallet ] ──► Ký giao dịch Memo       │
       └──────────────┬──────────────────────────────────────────┘
                      │ (RPC On-Chain)
                      ▼
       ┌─────────────────────────────────────────────────────────┐
       │                    SOLANA BLOCKCHAIN                    │
       │   - SPL Memo Program / Anchor Smart Contract            │
       │   - Immutable Tx Hash & Merkle Proof Timestamp          │
       │   - Public Explorer Verification                        │
       └─────────────────────────────────────────────────────────┘
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Getting Started)

### 1. Yêu cầu tiên quyết
- **Node.js** phiên bản ≥ 18.x ([Tải Node.js](https://nodejs.org/))
- Trình duyệt **Google Chrome / Microsoft Edge / Brave** (hỗ trợ tăng tốc phần cứng WebGL/GPU)
- Tiện ích ví **Phantom Wallet** ([Cài đặt Phantom](https://phantom.app/))

### 2. Cài đặt và khởi chạy

```bash
# 1. Clone repository về máy
git clone https://github.com/andrewng227/CareProtocol.git
cd CareProtocol

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Khởi chạy môi trường phát triển (Dev Server)
npm run dev
```

Mở trình duyệt và truy cập: **`http://localhost:3000`**

*(Hoặc anh có thể mở trực tiếp file `CareProtocol_GiaoDien.html` trong trình duyệt để trải nghiệm ngay bản Standalone).*

---

## 📱 Cấu Hình Ví Phantom Sang Solana Devnet

1. Bấm vào icon **Phantom Wallet** trên thanh công cụ trình duyệt.
2. Nhấn vào **Cài đặt (Settings ⚙️)** ở góc dưới bên phải.
3. Chọn **Cài đặt nhà phát triển (Developer Settings)** ➔ Bật **Chế độ mạng thử nghiệm (Testnet Mode)**.
4. Đổi mạng từ **Mainnet** sang **Devnet**.
5. Nhận SOL thử nghiệm miễn phí tại [Solana Faucet](https://faucet.solana.com) hoặc bấm nút **"Xin SOL Devnet"** trực tiếp trên giao diện CareProtocol.

---

## 📂 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
CareProtocol/
├── app/                  # Next.js App Router (Dashboard, APIs, Routing)
├── public/               # Static Assets, HTML Standalone & Audio Packs
│   ├── CareProtocol_GiaoDien.html  # Giao diện ứng dụng chính
│   ├── google_female_voice_pack.js # Gói âm thanh giọng đọc AI
│   └── hoadonthuoc.jpg             # Ảnh mẫu đơn thuốc thử nghiệm
├── src/                  # React Components & giao diện mở rộng
├── lib/                  # Tiện ích Speech AI, Solana Web3 & Dữ liệu y khoa
├── next.config.mjs       # Cấu hình Next.js & điều hướng trang
├── package.json          # Quản lý danh sách thư viện & scripts
└── README.md             # Tài liệu dự án
```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Frontend Core:** Next.js 14, React 18, Tailwind CSS, Lucide Icons
- **AI & Vision:** Google MediaPipe Tasks Vision, Google Gemini API
- **Web3 & Blockchain:** `@solana/web3.js`, `@solana/wallet-adapter`
- **Audio Engine:** HTML5 Web Audio API & Offline Voice Pack

---

<p align="center">
  Được phát triển với niềm đam mê nâng tầm chăm sóc y tế thông minh và minh bạch hóa dữ liệu phục hồi hậu phẫu. ❤️
</p>
