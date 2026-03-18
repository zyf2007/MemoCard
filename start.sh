#!/bin/bash

LOG_FILE="expoAndroid.log"
> "$LOG_FILE"

# 实时输出到日志并保持100行
npx expo run:android 2>&1 | while IFS= read -r line; do
    echo "$line" >> "$LOG_FILE"
    tail -n 100 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
done

echo "执行完成，$LOG_FILE 保留最近100行"