# 基础镜像
FROM node:20-alpine as base

# 设置 npm 镜像源
RUN yarn config set registry https://registry.npmmirror.com

# 全局安装 pnpm 并设置其镜像源
RUN yarn global add pnpm && pnpm config set registry https://registry.npmmirror.com

# 设置工作目录
WORKDIR /app

# 复制 pnpm workspace 配置文件
COPY pnpm-workspace.yaml ./

# 首先复制 package.json, package-lock.json 和 pnpm-lock.yaml 文件
COPY package*.json pnpm-lock.yaml* ./

COPY tsconfig.json .
# 利用 Docker 缓存机制，如果依赖没有改变则不会重新执行 pnpm install


FROM base As server-build
WORKDIR /app
COPY packages/common /app/packages/common
COPY apps/back-worker /app/apps/back-worker
RUN pnpm install --filter back-worker
RUN pnpm install --filter common
RUN pnpm --filter common build
RUN pnpm run build:server

FROM base As server-prod-dep
WORKDIR /app
COPY packages/common /app/packages/common
COPY apps/back-worker /app/apps/back-worker
RUN pnpm install --filter back-worker --prod
RUN pnpm install --filter common --prod


FROM server-prod-dep as server
WORKDIR /app
ENV NODE_ENV production
COPY --from=server-build /app/packages/common/dist ./packages/common/dist
COPY --from=server-build /app/apps/back-worker/dist ./apps/back-worker/dist
COPY apps/back-worker/entrypoint.sh ./apps/back-worker/entrypoint.sh

RUN chmod +x ./apps/back-worker/entrypoint.sh
RUN apk add postgresql-client

EXPOSE 3010

ENTRYPOINT [ "/app/apps/back-worker/entrypoint.sh" ]



FROM base AS front-app-build
# 复制其余文件到工作目录
COPY . .
RUN pnpm install
RUN pnpm run build:web
# 第二阶段，使用 nginx 提供服务
FROM nginx:stable-alpine as front-app
# 设置工作目录
WORKDIR /usr/share/nginx/html
# 设置环境变量
ENV NODE_ENV production
# 将构建的文件从上一阶段复制到当前镜像中
COPY --from=front-app-build /app/apps/front-app/build .
# 删除默认的nginx配置文件并添加自定义配置
RUN rm /etc/nginx/conf.d/default.conf
COPY apps/front-app/nginx.conf /etc/nginx/conf.d
# 添加 entrypoint 脚本，并确保其可执行
COPY apps/front-app/entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
# 安装 envsubst 以支持环境变量替换
RUN apk add  envsubst
# 暴露 80 端口
EXPOSE 80

CMD ["/usr/bin/entrypoint.sh"]


FROM python:3.10-slim as aiservice

# 设置工作目录
WORKDIR /app

# 将 pip.conf 文件复制到镜像中
# COPY apps/ai-service/config/pip.conf /etc/pip.conf

# 将 requirements.txt 复制到工作目录
COPY apps/ai-service/requirements.txt .
# 设置 pip 使用国内源，并安装依赖
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple && pip install --no-cache-dir -r requirements.txt
# 暴露端口
EXPOSE 8000

# 使用 entrypoint.sh 作为入口点
ENTRYPOINT ["/app/entrypoint.sh"]

FROM base As prisma-build
WORKDIR /app
COPY packages/common /app/packages/common
RUN pnpm install --filter common
RUN pnpm --filter common build

FROM base As prisma-prod-dep
WORKDIR /app
COPY packages/common /app/packages/common
RUN pnpm install --filter common --prod

FROM prisma-prod-dep as prisma-client
WORKDIR /app
ENV NODE_ENV production
COPY --from=prisma-build /app/packages/common/dist ./packages/common/dist
CMD ["pnpm", "prisma", "migrate", "deploy"]