# ---------- 构建阶段 ----------
FROM node:22 AS builder

# corepack 自带 pnpm；关闭下载确认提示，保证非交互式构建不中断
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# 先只复制依赖清单，依赖没变时可复用缓存
COPY package.json pnpm-lock.yaml ./
# --frozen-lockfile：严格按仓库锁文件安装，保证每次构建依赖版本一致（原来是 npm install，会重新解析版本）
# --ignore-scripts：不执行依赖的安装脚本，esbuild / vue-demi 的 postinstall 对本项目非必需
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# CI 会先生成 .env；本地构建缺少时退回 .env.example，避免打出缺少站点信息的包
RUN if [ ! -f .env ] && [ -f .env.example ]; then cp .env.example .env; fi

# 直接调用本地 vite（等价于 npm run build），不依赖包管理器的脚本前置检查
RUN ./node_modules/.bin/vite build

# ---------- 运行阶段 ----------
FROM node:22-alpine

# 固定 http-server 版本，避免不同时间构建出的镜像行为不一致
RUN npm install -g http-server@14.1.1

WORKDIR /app

COPY --from=builder /app/dist ./dist

EXPOSE 80

# -g：存在预压缩的 .gz 文件时优先返回，配合 vite-plugin-compression 减小传输体积
CMD ["http-server", "dist", "-p", "80", "-g"]