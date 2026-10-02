#!/usr/bin/env bash
# SULOOK Neo V2 (dikey) — tam üretim: kareler 60 fps render edilir, ikişerli harmanlanıp 30 fps'e iner (hareket bulanıklığı)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build/audio ../output src/assets/seq/perde src/assets/seq/anahtar
[ -f src/assets/seq/perde/0001.jpg ]   || ffmpeg -v error -i ../source/perde.mp4   -q:v 2 src/assets/seq/perde/%04d.jpg
[ -f src/assets/seq/anahtar/0001.jpg ] || ffmpeg -v error -i ../source/anahtar.mp4 -q:v 2 src/assets/seq/anahtar/%04d.jpg
node tools/render.mjs --cues tools/cues.json
python3 tools/audio_v2.py tools/cues.json build/audio
node tools/render.mjs --fps 60 --blur 1 --workers 3 --crf 14 --out build/v2_silent.mp4
ffmpeg -y -v error -i build/v2_silent.mp4 -i build/audio/mix.wav -af "loudnorm=I=-14:TP=-1.0:LRA=9" \
  -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart ../output/SULOOK_Neo_Reklam_V2_9x16.mp4
echo "Bitti -> ../output/SULOOK_Neo_Reklam_V2_9x16.mp4"
