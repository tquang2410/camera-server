// (BƯỚC 9.3) Import các thư viện
const express = require('express');
const { createServer } = require('http'); // Module 'http' của Node.js
const { Server } = require('socket.io');

// Cài đặt Server
const PORT = 4000; // Chúng ta sẽ chạy server trên cổng 4000

// (BƯỚC 16) "Bộ nhớ" của Server
// Dùng để lưu: { 'Wang vip 13' => { password: 'pass123', streamerSocketId: '...' } }
const rooms = new Map();
const app = express(); // Tạo app Express
const httpServer = createServer(app); // Tạo server HTTP từ app Express

// "Gắn" Socket.IO vào server HTTP
const io = new Server(httpServer, {
  // Cấu hình CORS
  cors: {
    origin: "*", // CHẤP NHẬN KẾT NỐI TỪ MỌI NƠI
    // (Trong đồ án thật, bạn nên đổi '*' thành 'http://localhost:5173'
    // hoặc '[https://frometou-viewer.vercel.app](https://frometou-viewer.vercel.app)' (tên web viewer))
    methods: ["GET", "POST"]
  }
});

// (BƯỚC 9.3) "Trái tim" của server:
// Lắng nghe sự kiện 'connection' (khi có ai đó kết nối)
io.on('connection', (socket) => {
  // 'socket' là đối tượng đại diện cho NGƯỜI VỪA KẾT NỐI
  console.log(`[Socket.IO] Một người dùng đã kết nối! ID: ${socket.id}`);

    // (BƯỚC 16) "Nâng cấp" hàm 'register-streamer'
    socket.on('register-streamer', ({ id, pass }) => {
      // (BƯỚC 16) 1. Cho socket "tham gia" phòng (giống code cũ)
      socket.join(id);
      
      // (BƯỚC 16) 2. LƯU MẬT KHẨU vào "bộ nhớ"
      rooms.set(id, { 
        password: pass, 
        streamerSocketId: socket.id 
      });
      
      console.log(`[Socket.IO] Streamer ${socket.id} đã ĐĂNG KÝ (có pass) phòng: ${id}`);
    });

    // (BƯỚC 17.2) "Nâng cấp" hàm 'request-stream' (Xác thực Mật khẩu)
    socket.on('request-stream', ({ id, pass }) => {
      console.log(`[Socket.IO] Viewer ${socket.id} YÊU CẦU xem phòng: ${id}`);
      
      // (BƯỚC 17.2) 1. Kiểm tra xem phòng (ID) có tồn tại không
      if (rooms.has(id)) {
        // Phòng TỒN TẠI
        const roomData = rooms.get(id);
        
        // (BƯỚC 17.2) 2. Kiểm tra xem Mật khẩu có khớp không
        if (roomData.password === pass) {
          // Mật khẩu ĐÚNG
          console.log(`[Socket.IO] Viewer ${socket.id}: Mật khẩu HỢP LỆ cho phòng '${id}'.`);
          
          // A. Cho Viewer vào phòng (code cũ)
          socket.join(id);
          
          // B. Báo cho Viewer "OK, Mật khẩu đúng, HÃY GỌI (call) Streamer ID NÀY:"
          socket.emit('password-valid', roomData.streamerSocketId); 
          
          // C. Báo cho Streamer (CŨ) "Này, có Viewer (Q0L1...) vừa vào"
          socket.to(id).emit('viewer-joined', socket.id);
          
        } else {
          // Mật khẩu SAI
          console.warn(`[Socket.IO] Viewer ${socket.id}: Mật khẩu SAI cho phòng '${id}'.`);
          
          // Báo cho Viewer "Mật khẩu sai rồi"
          socket.emit('password-invalid');
        }
      } else {
        // Phòng KHÔNG TỒN TẠI
        console.warn(`[Socket.IO] Viewer ${socket.id}: Phòng '${id}' KHÔNG TỒN TẠI.`);
        
        // Báo cho Viewer "Mã Camera (Phòng) sai rồi"
        socket.emit('room-not-found');
      }
    });

    // (BƯỚC 19 - HOÀN CHỈNH) "Người đưa thư" (Mailman) (Sửa lỗi)
    socket.on('webrtc-signal', ({ signalData, targetSocketId }) => {
      
      console.log(`[Socket.IO] Đang chuyển tiếp (forwarding) Tín hiệu WebRTC từ ${socket.id} TỚI ${targetSocketId}`);
      
      // (BƯỚC 19 - Sửa lỗi) Gửi (emit) "Nội dung thư" (signalData)
      // VÀ (MỚI) "Địa chỉ người gửi" (senderSocketId: socket.id)
      io.to(targetSocketId).emit('webrtc-signal', {
        signalData: signalData,
        senderSocketId: socket.id // (Địa chỉ người gửi)
      });
    });

    // (BƯỚC 23) "Nâng cấp" hàm 'disconnect' (Hoàn chỉnh)
    socket.on('disconnect', () => {
      let disconnectedRoom = null;
      let isStreamer = false;

      // 1. Kiểm tra xem có phải là Streamer không
      for (const [roomName, roomData] of rooms.entries()) {
        if (roomData.streamerSocketId === socket.id) {
          disconnectedRoom = roomName;
          isStreamer = true;
          break;
        }
      }

      // 2. Nếu KHÔNG phải là Streamer, tìm xem là Viewer của phòng nào
      if (!isStreamer) {
        for (const room of socket.rooms) {
          if (room !== socket.id) {
            disconnectedRoom = room;
            break;
          }
        }
      }
      
      // 3. Xử lý
      if (isStreamer && disconnectedRoom) {
        // (A) ĐÂY LÀ STREAMER
        // 3A.1. Xóa phòng khỏi "bộ nhớ"
        rooms.delete(disconnectedRoom);
        console.log(`[Socket.IO] Streamer phòng '${disconnectedRoom}' (ID: ${socket.id}) đã ngắt kết nối. Đã XÓA phòng.`);
        
        // 3A.2. (MỚI) BÁO cho TẤT CẢ Viewer trong phòng đó
        socket.to(disconnectedRoom).emit('streamer-disconnected');
        
      } else if (disconnectedRoom) {
        // (B) ĐÂY LÀ VIEWER
        console.log(`[Socket.IO] Một Viewer (ID: ${socket.id}) của phòng '${disconnectedRoom}' đã ngắt kết nối.`);
        
        // 3B.1. (MỚI) BÁO cho Streamer (chỉ Streamer)
        socket.to(disconnectedRoom).emit('viewer-disconnected', socket.id);
      } else {
        // (C) KHÔNG AI CẢ
        console.log(`[Socket.IO] Người dùng ${socket.id} (chưa vào phòng) đã ngắt kết nối.`);
      }
    });
});

// Khởi động server HTTP (đã gắn Socket.IO)
httpServer.listen(PORT, () => {
  console.log(`[SERVER] Đang chạy tại http://localhost:${PORT}`);
});
