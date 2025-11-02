# Project: Fromutome (SIGNALING SERVER)

---

## 1. Project Overview (Tổng quan Dự án)

**Fromutome (Signaling Server)** là một máy chủ backend (Node.js) siêu nhẹ, đóng vai trò là "Người gác cổng" (Gatekeeper) và "Tổng đài Mai mối" (Matchmaking Switchboard).

Nó **KHÔNG** xử lý video. Nhiệm vụ duy nhất của nó là:
1.  **Đăng ký (Register):** Nhận `{ id, pass }` từ "Streamer" (Project 1) và *lưu* mật khẩu đó vào "bộ nhớ" (`Map`).
2.  **Xác thực (Validate):** Nhận `{ id, pass }` từ "Viewer" (Project 2), *kiểm tra* (validate) xem mật khẩu có khớp không.
3.  **Mai mối (Matchmake):** Nếu mật khẩu khớp, nó sẽ "mai mối" (matchmake) hai client (người dùng) với nhau, cho phép họ bắt đầu "Cú bắt tay" (Handshake) WebRTC (P2P).

### Các tính năng cốt lõi (ĐÃ CẬP NHẬT):

* **Bộ nhớ (In-Memory Storage):** Sử dụng một `Map` (của JavaScript) để lưu trữ `{ password, streamerSocketId }` cho mỗi `cameraID` (phòng) đang "Online".
* **Đăng ký Streamer:** Lắng nghe (listen) '''register-streamer''', nhận `{ id, pass }`, và `rooms.set(...)` (lưu vào bộ nhớ).
* **Xác thực Viewer:** Lắng nghe (listen) '''request-stream''', nhận `{ id, pass }`, kiểm tra `rooms.has(id)` (ID đúng?) và `rooms.get(id).password === pass` (Pass đúng?).
* **Phản hồi (Feedback):** Gửi (emit) phản hồi lại cho Viewer: '''password-valid''' (Đúng), '''password-invalid''' (Sai Pass), hoặc '''room-not-found''' (Sai ID).
* **Dọn dẹp (Cleanup):** Lắng nghe (listen) '''disconnect''' và `rooms.delete(...)` (xóa) Streamer khỏi "bộ nhớ" (`Map`) để tránh "rò rỉ" (leaks) / "phòng ma" (ghost rooms).

---

## 2. Tech Stack (Bộ Công nghệ - ĐÃ CẬP NHẬT)

* **Nền tảng (Platform):** **Node.js**
* **Framework:** **Express** (Nền tảng cho server HTTP).
* **Giao tiếp Real-time:** **Socket.IO (Server)**
    * "Trái tim" của server. Dùng để xử lý logic "Đăng ký" (Register), "Xác thực" (Validate), và "Mai mối" (Matchmake) qua WebSocket.
* **Bộ nhớ (Storage):** **`Map` (JavaScript)**
    * Dùng làm "bộ nhớ" (RAM) tạm thời (volatile) để lưu trữ mật khẩu của các phòng đang "Online".
* **Công cụ Dev:** **Nodemon** (Tự động restart server khi code thay đổi).

---

## 3. Coding Style & Convention (Phong cách Code)

* **Ngôn ngữ:** **JavaScript (CommonJS)** (Dùng `require()` và `module.exports`).
* **Logic:** Toàn bộ logic server (vì đơn giản) đều nằm trong `index.js`.
* **Sự kiện (Events):** Tên sự kiện (event names) (ví dụ: '''register-streamer''', '''request-stream''', '''password-valid''') phải *khớp 100%* với Client (Project 1 & 2).

---

## 4. Cam kết Phát triển Project (Gemini CLI)

(Phần này giữ nguyên)

### Quy trình Làm việc Lặp (Iterative Workflow)

... (Giữ nguyên nội dung Cam kết Phát triển) ...

---

## 5. File Cấu hình (package.json - ĐÃ CẬP NHẬT)

Đây là `package.json` (ước tính) dựa trên *tất cả* các thư viện chúng ta đã cài đặt.

```json
{
  "name": "fromutome-signaling-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "nodemon index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "express": "5.0.0",
    "socket.io": "^4.7.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```