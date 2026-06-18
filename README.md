# Multi-Market Product Crawler

Crawl sản phẩm từ Joongna, Bunjang, Guheyo và Mercari không đăng nhập, lưu kết quả
theo từng chợ và hiển thị trên trang web local.

## Yêu cầu

- Node.js 20 trở lên
- npm

## Cài đặt

```powershell
npm install
```

## Crawl sản phẩm

Crawl tất cả chợ, giới hạn mặc định 50 sản phẩm mới nhất cho mỗi chợ:

```powershell
npm run crawl:all
```

Chạy riêng từng chợ:

```powershell
npm run crawl:joongna -- --keyword=realforce --limit=20
npm run crawl -- --markets=bunjang --keyword=realforce --limit=20
npm run crawl:guheyo -- --keyword=realforce --limit=20
npm run crawl:mercari -- --keyword=realforce --limit=20
```

Truyền nhiều từ khóa và số lượng:

```powershell
npm run crawl:all -- --keywords=realforce,hhkb --limit=50 --sort=newest
```

Crawler sẽ:

- Chạy adapter riêng cho từng chợ.
- Hỗ trợ `--sort=price-asc`, `--sort=price-desc` và `--sort=newest`.
- Đi qua `?page=2...` của Joongna và `page_token` của Mercari cho đến khi đủ limit.
- Guheyo hiện crawl trang search đầu tiên rồi sort nội bộ vì chưa xác định được API phân trang ổn định.
- Loại bỏ sản phẩm trùng URL hoặc thiếu dữ liệu cần thiết.
- Hiển thị tên, giá và URL của từng sản phẩm trên terminal.
- Gắn metadata khu vực, chợ và keyword để UI lọc lại sau khi crawl nhiều từ khóa.
- Mở trang chi tiết để lấy toàn bộ ảnh sản phẩm.
- Lưu kết quả vào `data/joongna.json`, `data/bunjang.json`, `data/guheyo.json`, `data/mercari.json`.
- Lưu trạng thái các chợ vào `data/markets.json`.

Mercari chạy headless không cần đăng nhập và sử dụng giá gốc JPY.

## Xem danh sách sản phẩm

Khởi động local server:

```powershell
npm run serve
```

Sau đó mở:

```text
http://localhost:3000
```

Form crawl trên local dùng secret mặc định `local`. Để tự động đọc cấu hình,
tạo file `.env` từ `.env.example`:

```env
CRAWL_TRIGGER_SECRET=your-secret
GITHUB_TOKEN=github-fine-grained-token
GITHUB_OWNER=github-username
GITHUB_REPO=market-korea-crawl
GITHUB_BRANCH=main
```

Sau đó chạy:

```powershell
npm run serve
```

File `.env` đã được gitignore và không được commit. Khi chạy local,
`npm run serve` tự động đọc file này.

Khi reload trang trong lúc crawler đang chạy, UI tự kết nối lại job và tiếp tục
hiển thị log bằng dữ liệu trong `sessionStorage`. Hệ thống chỉ cho phép một job
crawl chạy tại một thời điểm; bấm crawl lần nữa sẽ nối lại job hiện tại thay vì
tạo thêm process ghi đè dữ liệu.

Trang HTML đọc `data/markets.json` và hiển thị mỗi chợ trong một cột riêng.

Click vào ảnh sản phẩm để mở preview bằng LightGallery. Badge số lượng ảnh chỉ
hiển thị khi sản phẩm có nhiều hơn một ảnh.

Switch `VND` dưới nút `Crawler` gọi `/api/exchange-rates` để lấy tỉ giá realtime
từ ExchangeRate-API Open Access, hiển thị giá gốc và giá Việt Nam đã quy đổi.
Nếu API lỗi, UI dùng cache gần nhất trong trình duyệt và ghi rõ thời điểm cập nhật.

Giao diện sử dụng theme Retro Arcade. Có thể lọc theo khu vực, chợ, keyword crawl
và ngày đăng như hôm nay, 3 ngày gần đây hoặc 7 ngày gần đây. Tên sản phẩm được
giới hạn ba dòng và hiện tên đầy đủ khi hover.

Dropdown số sản phẩm hỗ trợ `20`, `50`, `100`, `200` và `All`, mặc định là `20`.
Mỗi chợ có phân trang `Trước`/`Sau` độc lập. Chọn `All` hiển thị toàn bộ sản
phẩm và ẩn phân trang.

Để sử dụng cổng khác:

```powershell
$env:PORT=8080
npm run serve
```

## Deploy Vercel Hobby

Vercel chỉ host giao diện và API nhẹ. Puppeteer chạy bằng GitHub Actions.
Sau khi crawl thành công, workflow commit các file JSON trong `data/` lên branch
`main`. Commit này kích hoạt Vercel deploy lại để giao diện nhận sản phẩm,
kiểu sắp xếp và thời gian crawl mới nhất.

GitHub Actions cần `Workflow permissions: Read and write permissions`. Sau khi
workflow hoàn tất, chờ deployment Vercel mới chuyển sang `Ready` rồi reload web.

Khai báo các environment variable trên Vercel:

- `CRAWL_TRIGGER_SECRET`: secret nhập trên form crawl.
- `GITHUB_TOKEN`: fine-grained token của private repo, có quyền Actions read/write.
- `GITHUB_OWNER`: owner của GitHub repo.
- `GITHUB_REPO`: tên GitHub repo.
- `GITHUB_BRANCH`: branch deploy, mặc định `main`.

Vercel không tự đọc file `.env` local khi deploy qua GitHub. Có thể thêm các
biến trên Vercel Dashboard, hoặc dùng Vercel CLI:

```powershell
vercel env add CRAWL_TRIGGER_SECRET
vercel env add GITHUB_TOKEN
vercel env add GITHUB_OWNER
vercel env add GITHUB_REPO
vercel env add GITHUB_BRANCH
vercel env pull .env.local
```

Workflow `.github/workflows/crawl.yml` tự crawl mỗi ngày lúc `06:00`, `12:00`
và `19:00` giờ Việt Nam (`23:00`, `05:00`, `12:00` UTC), mặc định từ khóa
`realforce`, sort mới nhất và limit `50` mỗi chợ. Form UI cho phép nhập nhiều
keyword cách nhau bằng dấu phẩy và limit dương bất kỳ.

## Cấu trúc JSON

```json
[
  {
    "name": "Realforce 87U",
    "market": "joongna",
    "marketName": "Joongna",
    "region": "korea",
    "regionName": "Hàn Quốc",
    "keywords": ["realforce"],
    "currency": "KRW",
    "price": 200000,
    "url": "https://web.joongna.com/product/228127782",
    "image": "https://img2.joongna.com/example-thumbnail.jpg",
    "images": [
      "https://img2.joongna.com/example-original-1.jpg",
      "https://img2.joongna.com/example-original-2.jpg"
    ]
  }
]
```

## Kiểm thử

```powershell
npm test
node scripts/verify-retro-viewer.js
```

`server.js` là server local phục vụ HTML/JSON và chạy crawler từ form UI.
`scripts/verify-retro-viewer.js` là browser regression test bằng Puppeteer;
website không phụ thuộc vào file này khi chạy bình thường.

## Cấu trúc chính

```text
.
|-- crawl.js                 # Điều khiển Puppeteer và ghi JSON
|-- server.js                # Local static server
|-- index.html               # Giao diện danh sách sản phẩm
|-- data/markets.json        # Trạng thái crawl từng chợ
|-- data/joongna.json        # Kết quả Joongna
|-- data/bunjang.json        # Kết quả Bunjang
|-- data/guheyo.json         # Kết quả Guheyo
|-- data/mercari.json        # Kết quả Mercari
|-- src/markets/             # Adapter crawler từng chợ
|-- src/options.js           # Xử lý tham số dòng lệnh
|-- src/products.js          # Chuẩn hóa, loại trùng và sắp xếp
`-- test/                    # Automated tests
```

## Lưu ý

Các chợ có thể thay đổi cấu trúc HTML hoặc chặn IP datacenter. Nếu crawler báo
không tìm thấy sản phẩm hoặc bị CloudFront/WAF 403, cần kiểm tra log HTTP/status
trước khi chỉnh selector.
