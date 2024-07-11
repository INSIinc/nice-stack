#!/bin/sh

# 从 DATABASE_URL 环境变量中提取主机名、端口和用户名
DB_HOST=$(echo $DATABASE_URL | cut -d '@' -f 2 | cut -d ':' -f 1)
DB_PORT=$(echo $DATABASE_URL | cut -d ':' -f 4 | cut -d '/' -f 1)
DB_USER=$(echo $DATABASE_URL | cut -d '/' -f 3 | cut -d ':' -f 1)

# 检查数据库是否就绪
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is up"

# 检查标记文件是否存在，如果不存在，则执行 prisma deploy 并创建标记文件
# if [ ! -f "/app/prisma-deployed" ]; then
#   pnpm prisma generate
#   pnpm prisma migrate deploy
#   touch /app/prisma-deployed
# fi

# 启动主应用
exec node apps/back-worker/dist/main
