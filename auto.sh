#!/bin/bash

# 进入指定目录
cd /opt/projects/two-defender-app || exit

# 停止 server 容器
echo "停止 server 容器..."
sudo docker-compose stop server

# 移除 server 容器，自动确认
echo "移除 server 容器..."
yes | sudo docker-compose rm server

# 停止 web 容器
echo "停止 web 容器..."
sudo docker-compose stop web

# 移除 web 容器，自动确认
echo "移除 web 容器..."
yes | sudo docker-compose rm web

# 删除镜像
echo "删除 Docker 镜像..."
sudo docker image rm td-server:latest
sudo docker image rm td-web:latest

# 加载镜像
echo "加载 Docker 镜像..."
sudo docker load -i td-server.tar
sudo docker load -i td-web.tar

# 删除已加载的 tar 文件
sudo rm td-server.tar
sudo rm td-web.tar

# 启动服务
echo "启动服务..."
sudo docker-compose up -d

# 查看 server 容器的日志
echo "查看 server 容器的日志..."
sudo docker-compose logs server

echo "脚本执行完成。"
