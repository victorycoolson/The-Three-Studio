#!/usr/bin/env bash
# SULOOK Neo reklamı — tam üretim hattı
# Gereksinim: node 18+, playwright (chromium), ffmpeg, python3 (numpy, scipy)
# Kullanım: ./build.sh            -> 9:16 + 4:5
#           ./build.sh 916        -> sadece 9:16
set -euo pipefail
cd "$(dirname "$0")"
FORMATS="${1:-916 45}"
mkdir -p build output src/assets/seq/perde src/assets/seq/anahtar

# 1) video kareleri (kaynak videolardan)
[ -f src/assets/seq/perde/0001.jpg ]   || ffmpeg -v error -i source/perde.mp4   -q:v 3 src/assets/seq/perde/%04d.jpg
[ -f src/assets/seq/anahtar/0001.jpg ] || ffmpeg -v error -i source/anahtar.mp4 -q:v 3 src/assets/seq/anahtar/%04d.jpg

# 2) zamanlama -> ses
node tools/render.mjs --f 916 --cues tools/cues.json
python3 tools/audio.py tools/cues.json build/audio

# 3) görüntü + miks
for F in $FORMATS; do
  node tools/render.mjs --f "$F" --workers 3 --out "build/v${F}_silent.mp4"
  ffmpeg -y -v error -i "build/v${F}_silent.mp4" -i build/audio/mix.wav \
    -af "loudnorm=I=-14:TP=-1.0:LRA=9" -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart \
    "output/SULOOK_Neo_Reklam_${F/916/9x16}.mp4"
done
mv -f output/SULOOK_Neo_Reklam_45.mp4 output/SULOOK_Neo_Reklam_4x5.mp4 2>/dev/null || true
echo "Bitti -> output/"
