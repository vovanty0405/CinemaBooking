# Sử dụng Node.js 20 Alpine nhẹ và bảo mật
FROM node:20-alpine AS base

WORKDIR /app

# Cài đặt thư viện phụ thuộc trước để tận dụng Docker layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy toàn bộ mã nguồn
COPY . .

# Tạo sẵn thư mục lưu uploads và logs với quyền ghi
RUN mkdir -p public/uploads logs

# Chạy bằng user node (non-root) để tăng cường bảo mật
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "src/server.js"]