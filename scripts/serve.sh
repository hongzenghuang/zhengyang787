#!/bin/bash
# 生产服务启动器（作为 dev 脚本的替代）：
# 无生产构建产物时先构建，然后启动 next start。
# 背景：预览环境执行 Turbopack dev chunk 时 currentScript 缺失导致
# "chunk path empty but not in a worker"，dev 模式在该环境不可用；
# 生产 bundle 不依赖该机制，可正常交互。
cd "$(dirname "$0")/.." || exit 1

if [ ! -f .next/BUILD_ID ]; then
  echo "[serve] 未发现生产构建，开始构建..."
  if ! pnpm run build; then
    echo "[serve] 构建失败，5 秒后退出（避免快速重启风暴）"
    sleep 5
    exit 1
  fi
fi

echo "[serve] 启动生产服务器 (端口 5001)"
exec npx next start -p 5001
