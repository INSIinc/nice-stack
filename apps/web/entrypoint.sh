#!/bin/sh

# 使用envsubst替换index.html中的环境变量占位符
envsubst < /usr/share/nginx/html/index.html > /usr/share/nginx/html/index.html.tmp
mv /usr/share/nginx/html/index.html.tmp /usr/share/nginx/html/index.html
# 运行serve来提供静态文件
exec nginx -g "daemon off;"
# 使用 sed 替换 index.html 中的环境变量占位符
# for var in $(env | cut -d= -f1); do
#   sed -i "s|\${$var}|$(eval echo \$$var)|g" /usr/share/nginx/html/index.html
# done

# # 运行 nginx 来提供静态文件
# exec nginx -g "daemon off;"