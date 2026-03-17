#!/bin/bash

# ========================= 配置项 =========================
# 需要排除的目录（用|分隔，支持正则）
EXCLUDE_DIRS="node_modules|\.git|dist|build|coverage|tmp|vendor"
# 要扫描的根目录（默认当前目录，可手动修改）
SCAN_ROOT="./"
# 要排除的文件后缀（可选，比如排除图片、日志等）
EXCLUDE_SUFFIX="\.(png|jpg|jpeg|gif|svg|ico|log|md|yml|yaml|json|lock|txt)$"
# ======================== 核心逻辑 ========================

# 检查是否安装了必要工具
check_dependencies() {
    if ! command -v grep &> /dev/null; then
        echo "错误：系统未安装grep，请先安装后再运行脚本"
        exit 1
    fi
    if ! command -v awk &> /dev/null; then
        echo "错误：系统未安装awk，请先安装后再运行脚本"
        exit 1
    fi
    if ! command -v sort &> /dev/null; then
        echo "错误：系统未安装sort，请先安装后再运行脚本"
        exit 1
    fi
    if ! command -v uniq &> /dev/null; then
        echo "错误：系统未安装uniq，请先安装后再运行脚本"
        exit 1
    fi
}

# 提取文件中的npm包名
extract_packages() {
    local file="$1"
    # 重构正则表达式，避免引号嵌套冲突
    # 匹配规则：
    # 1. import xxx from '包名' 或 import xxx from "包名"
    # 2. require('包名') 或 require("包名")
    # 3. import('包名') 或 import("包名")（动态导入）
    grep -E -o \
        'import\s+[^"]+from\s+["'"'"'](@?[a-zA-Z0-9_-]+)[/"'"'"]|require\(["'"'"'](@?[a-zA-Z0-9_-]+)[/"'"'"]\)|import\(["'"'"'](@?[a-zA-Z0-9_-]+)[/"'"'"]\)' \
        "$file" |
    # 提取分组中的包名
    awk -F '["\']' '{
        for (i=1; i<=NF; i++) {
            if ($i ~ /^@?[a-zA-Z0-9_-]+$/) {
                print $i
                break
            }
        }
    }' |
    # 过滤掉相对路径（以./或../开头）和内置模块
    grep -v -E '^\.{1,2}/|^path$|^fs$|^http$|^url$|^util$|^os$|^events$|^stream$|^buffer$'
}

# 主扫描函数
main() {
    echo "开始扫描目录：$SCAN_ROOT"
    echo "排除的目录：$EXCLUDE_DIRS"
    echo "========================================"

    # 递归查找所有文件，排除指定目录和后缀
    find "$SCAN_ROOT" \
        -type d -regex ".*($EXCLUDE_DIRS).*" -prune -o \
        -type f -not -regex ".*$EXCLUDE_SUFFIX" -print |
    while read -r file; do
        # 跳过空文件
        if [ -s "$file" ]; then
            extract_packages "$file"
        fi
    done |
    # 去重并排序
    sort | uniq

    echo "========================================"
    echo "扫描完成！以上是所有检测到的npm包名"
    echo "提示：可将结果与package.json中的dependencies/devDependencies对比，排查未使用的包"
}

# 执行入口
check_dependencies
main
