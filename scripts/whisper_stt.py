#!/usr/bin/env python3
"""语音识别脚本 - Faster Whisper"""
import sys
import os

from faster_whisper import WhisperModel

print("🚀 加载 Whisper tiny 模型...")
model = WhisperModel("tiny", device="cpu", compute_type="int8")
print("✅ 模型就绪!")

def transcribe(audio_path):
    if not os.path.exists(audio_path):
        return f"文件不存在: {audio_path}"
    
    print(f"📝 识别中: {audio_path}")
    segments, info = model.transcribe(audio_path, language="zh", beam_size=5)
    
    print(f"🎤 语言: {info.language} ({info.language_probability:.2f})")
    
    result = "".join([s.text.strip() for s in segments])
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: whisper_stt.py <音频文件>")
        sys.exit(1)
    
    result = transcribe(sys.argv[1])
    print(f"\n📄 结果: {result}")
