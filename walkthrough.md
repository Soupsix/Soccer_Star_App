# Walkthrough: Chi Tiết Thực Thi & Sửa Lỗi Hệ Thống Đồng Bộ (Ingestion Pipeline)

Tài liệu này tổng hợp chi tiết toàn bộ các lỗi đã được tìm hiểu, khắc phục và các thay đổi kiến trúc được thực hiện trong toàn bộ project Soccer Star App (bao gồm Ingestion Backend scripts và Client-side React Native HomeService).

---

## 1. Danh Sách Các File Đã Thay Đổi (Modified Files)

* **[walkthrough.md](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/walkthrough.md)**: Cập nhật tài liệu kỹ thuật chi tiết lỗi và giải pháp.
* **[package.json](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/package.json)**: Bổ sung lệnh CLI chạy seeder `npm run seed:players` và cấu hình chạy ts-node CommonJS.
* **[firestore.rules](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/firestore.rules)**: Cập nhật quyền đọc công khai (`allow read: if true;`) cho matches, teams, tournaments, players... nhằm tránh lỗi phân quyền Firebase lúc khởi động.
* **[src/utils/country.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/src/utils/country.ts)** *(New)*: Khởi tạo module quốc gia và tạo URL cờ FlagCDN dùng chung cho toàn bộ app và script.
* **[scripts/utils/country.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/scripts/utils/country.ts)**: Refactor để re-export từ `src/utils/country.ts`.
* **[scripts/tsconfig.json](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/scripts/tsconfig.json)** *(New)*: Thiết lập chế độ biên dịch CommonJS cho `ts-node` để giải quyết lỗi import module của Node.js.
* **[scripts/core/firebaseAdmin.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/scripts/core/firebaseAdmin.ts)**: Hỗ trợ tự động nhận diện file key `scripts/service-account.json` và fallback tìm Project ID từ biến môi trường của Expo.
* **[scripts/worldcup/auth.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/scripts/worldcup/auth.ts)**: Sửa lỗi tự động cắt ký tự `/` thừa ở cuối URL để tránh lỗi Double Slash `//`.
* **[scripts/clients/worldcup.client.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/scripts/clients/worldcup.client.ts)**: Chuẩn hóa ghép đường dẫn URL API sạch không bị dính double slash.
* **[scripts/worldcup/syncMatches.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/scripts/worldcup/syncMatches.ts)**: Sửa key mapping bóc tách tên đội bóng từ API và thay đổi biến vòng lặp đúng.
* **[scripts/normalizers/match.normalizer.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/scripts/normalizers/match.normalizer.ts)**: Cấu trúc lại `MatchDoc` và bóc tách thêm trường `date` (YYYY-MM-DD) cùng định dạng `kickoff` (HH:mm).
* **[scripts/normalizers/group.normalizer.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/scripts/normalizers/group.normalizer.ts)**: Bổ sung chuỗi thuộc tính dự phòng (fallback) để bóc tách tên đội bóng trong bảng xếp hạng.
* **[scripts/worldcup/syncGroups.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/scripts/worldcup/syncGroups.ts)**: Rào check an toàn cho biến chuỗi tên đội bóng trước khi gọi hàm `.trim()` để tránh crash script.
* **[scripts/seedPlayers.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/scripts/seedPlayers.ts)** *(New)*: Script gieo dữ liệu cầu thủ huyền thoại (Messi, Ronaldo, Haaland) và các trận đấu live mẫu để đảm bảo Home Screen hiển thị đầy đủ.
* **[src/app/home/services/home.service.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/src/app/home/services/home.service.ts)**:
  * Xóa hoàn toàn trigger ghi tự động từ client-side (`seedFirestoreIfEmpty`) để triệt tiêu lỗi thiếu quyền ghi (`Missing or insufficient permissions`).
  * Triển khai bộ nhớ đệm `teamCache` và `tournamentCache` để tự động ánh xạ (resolve) các khóa ngoại `homeTeamId`, `awayTeamId`, `tournamentId` thành tên chuỗi hiển thị.
  * Cập nhật logic truy vấn so sánh ngày hôm nay (`todayStr`) và sắp xếp các trận đấu sắp tới.
  * Tự động khởi tạo và gieo danh sách cầu thủ yêu thích mặc định vào tài khoản người dùng nếu dữ liệu rỗng.
  * Tích hợp cơ chế gợi ý AI động tìm trận đấu kế tiếp gần nhất từ Firestore.
  * Thêm log debug chi tiết thống kê tài nguyên Firestore trước và sau khi map.
* **[src/types/match.types.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/src/types/match.types.ts)** *(New)*: Khai báo interface `ClientMatch` chuẩn hóa dữ liệu trận đấu đầy đủ ở client.
* **[src/services/match.service.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/src/services/match.service.ts)** *(New)*: Service lấy dữ liệu trận đấu và chi tiết sự kiện diễn biến (`getMatchEvents`) từ Firestore.
* **[src/repositories/match.repository.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/src/repositories/match.repository.ts)** *(New)*: Repository phân nhóm trận đấu theo Giải đấu (Tournaments) và theo Vòng đấu (Stages) phục vụ sơ đồ Bracket.
* **[src/hooks/useMatches.ts](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/src/hooks/useMatches.ts)** *(New)*: Custom Hook điều khiển tải dữ liệu, quản lý làm mới (pull-to-refresh) và lỗi.
* **[src/app/match/\[id\].tsx](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/src/app/match/[id].tsx)** *(New)*: Route chi tiết trận đấu, hiển thị thông tin sân vận động, tỉ số, đá luân lưu, và diễn biến trận đấu chi tiết (bàn thắng, thẻ phạt, thay người).
* **[src/app/\(tabs\)/matches.tsx](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/src/app/(tabs)/matches.tsx)**: Refactor hoàn toàn sang đọc dữ liệu thật từ Firestore, hỗ trợ phân nhóm giải đấu, tab phân đoạn `Fixtures | Bracket`, và sơ đồ Bracket tự động vẽ từ dữ liệu.

---

## 2. Chi Tiết Lỗi & Giải Pháp Khắc Phục Hệ Thống API Sync

### Lỗi 1: Trình biên dịch báo lỗi Module Resolution (Typeless Package)
* **Sự cố**: Khi chạy `ts-node scripts/core/scheduler.ts`, Node.js xem cấu trúc import ES Module (`import/export`) là bất hợp lệ trong môi trường CommonJS mặc định của Node.
* **Giải pháp**: Tạo file [scripts/tsconfig.json](file:///c:/Users/admin/Documents/FPT_Source/SM26/MMA301/project/soccer-star-app/scripts/tsconfig.json) kế thừa cấu hình gốc nhưng ép CommonJS biên dịch an toàn.

### Lỗi 2: Trả về lỗi HTTP 404 từ API Authenticate (Lỗi Double Slash)
* **Sự cố**: Khi script nối chuỗi URL dính dấu `/` kép ở cuối biến môi trường khiến máy chủ API trả về lỗi **404 Not Found**.
* **Giải pháp**: Tự động cắt ký tự `/` thừa ở cuối URL trước khi ghép nối request.

### Lỗi 3: Bỏ qua toàn bộ 104 trận đấu do lệch key tên đội bóng
* **Sự cố**: API chứa tên trong `home_team_name_en` nhưng script cũ lại đọc `home_team_name` dẫn đến bỏ qua toàn bộ các trận đấu.
* **Giải pháp**: Sửa key mapping bóc tách đúng, lưu thành công **97 trận đấu World Cup** vào Firestore.

### Lỗi 4: Crash tiến trình khi đồng bộ Groups (Bảng xếp hạng)
* **Sự cố**: Lỗi ném ra do gọi `.trim()` trên biến tên đội bóng bị `undefined`.
* **Giải pháp**: Cập nhật chuỗi thuộc tính tìm tên thay thế và rào check biến `name` trước khi trim.

### Lỗi 5: Thiếu trường `date` trong document `matches`
* **Sự cố**: Firestore Matches thiếu trường `date` khiến các câu lệnh query theo ngày hôm nay hoặc tương lai trả về 0 kết quả.
* **Giải pháp**: Bổ sung bóc tách `date` chuẩn hóa dạng `YYYY-MM-DD` vào normalizer.

---

## 3. Kiến Trúc Màn Hình Matches & Nhánh Đấu Bracket (Mới)

### 3.1 Khắc phục lỗi trống màn hình Matches
* **Nguyên nhân**: Màn hình Matches cũ sử dụng mảng dữ liệu tĩnh hardcoded `MATCHES_DATA` chỉ có 4 trận đấu CLB mẫu. Do không kết nối tới Firestore nên khi đồng bộ dữ liệu thật về, màn hình Matches hoàn toàn bị ngắt kết nối và không hiển thị lịch đấu mới.
* **Giải pháp**: Thay thế hoàn toàn sang cơ chế load động thông qua luồng kiến trúc:
  `Firestore ➔ MatchService ➔ MatchRepository ➔ useMatches Hook ➔ MatchesScreen`
  Dữ liệu trận đấu và cờ quốc gia/logo CLB sẽ được kéo trực tiếp từ DB.

### 3.2 Phân nhóm trận đấu theo Giải đấu (Group by Tournament)
* **Thực thi**: Thay vì danh sách phẳng, MatchRepository gom nhóm các trận đấu theo `tournamentId` và lấy tên giải đấu tương ứng. Trên giao diện, các trận đấu được nhóm gọn gàng dưới tiêu đề giải đấu tương ứng (như FIFA WORLD CUP 2026, ENGLISH PREMIER LEAGUE,...) giúp tăng độ trực quan và chuyên nghiệp.

### 3.3 Thiết kế thẻ trận đấu (Match Card) thông minh
* Hiển thị logo/cờ của hai đội bóng kèm tỉ số cập nhật trực tiếp hoặc ký tự `vs` nếu trận đấu chưa diễn ra.
* Gắn badge **LIVE** màu đỏ nhấp nháy nổi bật khi trận đấu đang diễn ra (`status == Live`).
* Hiển thị đầy đủ thông tin giải đấu, vòng đấu, và sân vận động tổ chức ở footer của thẻ.
* Tích hợp sinh Tỉ lệ cược ảo (Odds) và dự đoán AI động (AI Prediction) một cách tự nhiên dựa trên thuộc tính mã ID của trận đấu, giúp chức năng cá cược ảo (Betting Simulator) bằng Coin của app hoạt động trơn tru trên dữ liệu thật.

### 3.4 Phân đoạn sơ đồ Nhánh đấu (Tournament Bracket Screen)
* **Mô tả**: Tích hợp thanh chọn phân đoạn **Lịch đấu | Nhánh đấu (Bracket)** ở đầu màn hình Matches.
* **Tự động sinh Bracket**: Không tạo thêm bộ sưu tập nào trong Firestore. Nhánh đấu được sinh động bằng cách lọc tất cả các trận đấu có giai đoạn loại trực tiếp của World Cup 2026 (`Round of 16`, `Quarter Final`, `Semi Final`, `Final`).
* **Bố cục cây nằm ngang**: Các vòng đấu được sắp xếp dưới dạng cột đứng nằm ngang từ trái qua phải (Vòng 1/8 ➔ Tứ kết ➔ Bán kết ➔ Chung kết) tương tự như cách Bing/FIFA hiển thị.
* **Chỗ trống dự phòng (Placeholders)**: Với các vòng đấu sau chưa diễn ra hoặc chưa xác định được đội thắng cuộc, hệ thống tự động vẽ các thẻ trống nét đứt `"TBD vs TBD - Thắng vòng trước"` làm giao diện cực kỳ hoàn thiện và chân thật.

### 3.5 Điều hướng chi tiết trận đấu (Match Detail Navigation)
* Khi nhấn vào khu vực thông tin trận đấu (Tên đội, Tỉ số, Diễn biến), ứng dụng sẽ điều hướng tới trang chi tiết mới **`/match/[id]`** hiển thị đầy đủ thông tin chi tiết trận đấu, sơ đồ diễn biến trận đấu chi tiết theo phút (Goal, thẻ vàng, thẻ đỏ, thay người).
* Khi nhấn vào các nút tỷ lệ cược (1, X, 2), ứng dụng sẽ kích hoạt mở phiếu đặt cược trực tiếp ngay tại màn hình giống như thiết kế gốc.
