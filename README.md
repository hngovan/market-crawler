# Multi-Market Product Crawler

Crawl sản phẩm từ Joongna và Mercari không đăng nhập, lưu kết quả
theo từng chợ và hiển thị trên trang web local.

## Yêu cầu

- Node.js 20 trở lên
- npm

## Cài đặt

```powershell
npm install
```

## Crawl sản phẩm

Crawl tất cả chợ, giới hạn mặc định 20 sản phẩm cho mỗi chợ:

```powershell
npm run crawl:all
```

Chạy riêng từng chợ:

```powershell
npm run crawl:joongna -- --keyword=realforce --limit=20
npm run crawl:mercari -- --keyword=realforce --limit=20
```

Truyền từ khóa và số lượng:

```powershell
npm run crawl:all -- --keyword=realforce --limit=100 --sort=newest
```

Crawler sẽ:

- Chạy adapter riêng cho từng chợ.
- Hỗ trợ `--sort=price-asc`, `--sort=price-desc` và `--sort=newest`.
- Đi qua `?page=2...` của Joongna và `page_token` của Mercari cho đến khi đủ limit.
- Loại bỏ sản phẩm trùng URL hoặc thiếu dữ liệu cần thiết.
- Hiển thị tên, giá và URL của từng sản phẩm trên terminal.
- Mở tối đa 4 trang chi tiết cùng lúc để lấy toàn bộ ảnh sản phẩm.
- Lưu kết quả vào `data/joongna.json`, `data/mercari.json`.
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

Giao diện sử dụng theme Retro Arcade. Có thể chọn hiển thị tất cả chợ hoặc chỉ
Joongna/Mercari. Tên sản phẩm được giới hạn ba dòng và hiện tên đầy đủ khi hover.

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
Các file JSON trong `data/` được gitignore và workflow không commit dữ liệu crawl.
Vì vậy dữ liệu crawl từ GitHub Actions hiện chỉ tồn tại trong thời gian job chạy,
không tự cập nhật lên giao diện Vercel. Muốn lưu dữ liệu trên Vercel cần bổ sung
database hoặc object storage bên ngoài.

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

Workflow `.github/workflows/crawl.yml` cũng tự crawl hai chợ mỗi ngày lúc
`06:00` giờ Việt Nam (`23:00 UTC`), mặc định từ khóa `realforce`, sort giá tăng
dần và limit `100` mỗi chợ. Form UI cho phép nhập limit dương bất kỳ.

## Cấu trúc JSON

```json
[
  {
    "name": "Realforce 87U",
    "market": "joongna",
    "marketName": "Joongna",
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
|-- data/mercari.json        # Kết quả Mercari
|-- src/markets/             # Adapter crawler từng chợ
|-- src/options.js           # Xử lý tham số dòng lệnh
|-- src/products.js          # Chuẩn hóa, loại trùng và sắp xếp
`-- test/                    # Automated tests
```

## Lưu ý

Joongna có thể thay đổi cấu trúc HTML. Nếu crawler báo không tìm thấy sản phẩm,
selector trong `crawl.js` và logic đọc card trong `src/products.js` có thể cần
được cập nhật.
