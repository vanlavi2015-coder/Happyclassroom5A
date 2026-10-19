# Website Lớp học 5A — bản khởi đầu

Đây là dự án mới, độc lập với LAVI. Không kết nối và không sửa mã nguồn hay cơ sở dữ liệu LAVI.

## Có gì trong bản khởi đầu?
- Thư viện 10 loại trò chơi học tập.
- Chế độ chơi thử trên màn hình lớp và trên thiết bị riêng.
- Ngân hàng câu hỏi dùng chung.
- Tạo trò chơi từ câu hỏi đã chọn.
- Điểm và kết quả lượt chơi được lưu trên máy chủ.
- Tạo câu hỏi bằng AI qua OpenAI API khi đã cấu hình khóa.
- Giao diện responsive, hiệu ứng âm thanh đúng/sai.

## Chạy thử trên máy tính
Cần Node.js 22 trở lên.

```bash
npm install
# Windows PowerShell: $env:TEACHER_PIN="dat-ma-giao-vien-dai-va-rieng"
# macOS/Linux: export TEACHER_PIN="dat-ma-giao-vien-dai-va-rieng"
npm start
```
Mở http://localhost:3000

## Đưa lên GitHub và Render
1. Tạo repository mới tên `LopHoc5A` (không chọn repository LAVI).
2. Upload toàn bộ tệp trong thư mục dự án.
3. Trên Render, tạo **New + → Web Service**, chọn repository mới.
4. Build Command: `npm install`; Start Command: `npm start`.
5. Dùng Node 22 trở lên.
6. Thêm biến môi trường `TEACHER_PIN` với mã giáo viên mạnh, riêng tư.
7. Gắn Persistent Disk tại `/var/data` (1 GB) để giữ dữ liệu sau deploy.
8. Muốn bật AI, thêm `OPENAI_API_KEY` trong Render Environment. Không đặt API key trong HTML hoặc GitHub.
9. Deploy và kiểm tra `/api/health`.

## Lưu ý trước khi dùng thật
- Bản này là MVP khởi đầu, chưa phải hệ thống quản lý học sinh đầy đủ; chưa có tài khoản/phân quyền riêng cho học sinh và phụ huynh.
- Trò chơi chọn từ thư viện đang chạy theo dạng hỏi-đáp chung; các cơ chế chuyên biệt như đua vịt theo thời gian thực, kéo co hai đội đồng bộ, lật mảnh ghép và dò mìn cần triển khai riêng ở giai đoạn tiếp theo.
- Bảo vệ mã giáo viên và không nhập dữ liệu nhạy cảm của học sinh cho đến khi bổ sung đăng nhập, giới hạn truy cập và quy trình bảo mật đầy đủ.
- Render Persistent Disk có thể phát sinh phí. Kiểm tra gói dịch vụ hiện hành trước khi triển khai.
