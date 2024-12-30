# 基础镜像
FROM node:20-alpine as base
# 更改 apk 镜像源为阿里云
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    yarn config set registry https://registry.npmmirror.com && \
    yarn global add pnpm && \
    pnpm config set registry https://registry.npmmirror.com
# 设置工作目录
WORKDIR /app

# 复制 pnpm workspace 配置文件
COPY pnpm-workspace.yaml ./

# 首先复制 package.json, package-lock.json 和 pnpm-lock.yaml 文件
COPY package*.json pnpm-lock.yaml* ./

COPY tsconfig.base.json .


FROM base As server-build
WORKDIR /app
COPY packages/common /app/packages/common
COPY apps/server /app/apps/server
RUN pnpm install --filter common && \
    pnpm install --filter server && \
    pnpm --filter common generate && \
    pnpm --filter common build:cjs && \
    pnpm --filter server build

FROM base As server-prod-dep
WORKDIR /app
COPY packages/common /app/packages/common
COPY apps/server /app/apps/server
RUN pnpm install --filter common --prod && \
    pnpm install --filter server --prod && \
    # 清理包管理器缓存
    pnpm store prune && rm -rf /root/.npm && rm -rf /root/.cache



FROM server-prod-dep as server
WORKDIR /app
ENV NODE_ENV production
COPY --from=server-build /app/packages/common/dist ./packages/common/dist
COPY --from=server-build /app/apps/server/dist ./apps/server/dist
COPY apps/server/entrypoint.sh ./apps/server/entrypoint.sh
RUN chmod +x ./apps/server/entrypoint.sh
# RUN apk add --no-cache postgresql-client


EXPOSE 3000

ENTRYPOINT [ "/app/apps/server/entrypoint.sh" ]



FROM base AS web-build
# 复制其余文件到工作目录
COPY . .
RUN pnpm install && pnpm --filter web build
# 第二阶段，使用 nginx 提供服务
FROM nginx:stable-alpine as web
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
# 设置工作目录
WORKDIR /usr/share/nginx/html
# 设置环境变量
ENV NODE_ENV production
# 将构建的文件从上一阶段复制到当前镜像中
COPY --from=web-build /app/apps/web/dist .
# 删除默认的nginx配置文件并添加自定义配置
RUN rm /etc/nginx/conf.d/default.conf
COPY apps/web/nginx.conf /etc/nginx/conf.d
# 添加 entrypoint 脚本，并确保其可执行
COPY apps/web/entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
# 安装 envsubst 以支持环境变量替换
# RUN apk add --no-cache  envsubst
# RUN echo "http://mirrors.aliyun.com/alpine/v3.12/main/" > /etc/apk/repositories && \
#     echo "http://mirrors.aliyun.com/alpine/v3.12/community/" >> /etc/apk/repositories && \
# apk update && \
RUN apk add --no-cache gettext
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