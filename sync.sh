#!/usr/bin/env bash
set -euo pipefail

# 同步 token-usage 插件到本地 Antigravity 插件目录
TARGET_DIR="${1:-${HOME}/.gemini/config/plugins/token-usage}"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> 同步插件到本地:"
echo "    来源: ${SOURCE_DIR}"
echo "    目标: ${TARGET_DIR}"

mkdir -p "${TARGET_DIR}"

# 使用 rsync 增量同步核心组件，排除源码管理及开发缓存文件
rsync -av --delete \
  --exclude=".git" \
  --exclude=".github" \
  --exclude=".gitignore" \
  --exclude=".ai_map.md" \
  --exclude=".DS_Store" \
  --exclude="node_modules" \
  --exclude="*.log" \
  --exclude="sync.sh" \
  --exclude="promo" \
  --exclude="CONTRIBUTING.md" \
  --exclude="CODE_OF_CONDUCT.md" \
  --exclude="SECURITY.md" \
  --exclude="CHANGELOG.md" \
  "${SOURCE_DIR}/" "${TARGET_DIR}/"

echo "==> 同步完成！"
