#!/usr/bin/env bash
# angles.sh <input.mp4|mov> <out_dir> [anchor_x anchor_y]
# Simulated camera angles from one clip (reframing, no new footage): push-in, tight, pull-out, tilt.
# anchor = where the action is, 0..1 (default 0.4 0.75 = lower left of centre). Source should be >= 1080x1920.
set -euo pipefail
IN="$1"; OUT="$2"; AX="${3:-0.4}"; AY="${4:-0.75}"
mkdir -p "$OUT"; NAME="$(basename "${IN%.*}")"
D="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")"
ENC=(-c:v libx264 -crf 18 -pix_fmt yuv420p -r 30 -movflags +faststart -c:a aac -b:a 192k)
cropx="(iw-1080)*$AX"; cropy="(ih-1920)*$AY"
zoom() { # $1 = zoom expression in t
  echo "scale=w='trunc(1080*($1)/2)*2':h=-2:eval=frame:flags=lanczos,crop=1080:1920:x='$cropx':y='$cropy',setsar=1"
}
ffmpeg -y -v error -i "$IN" -vf "$(zoom "1+0.25*t/$D")" "${ENC[@]}" "$OUT/$NAME-angle-1-pushin.mp4"
ffmpeg -y -v error -i "$IN" -vf "$(zoom "1.35")" "${ENC[@]}" "$OUT/$NAME-angle-2-tight.mp4"
ffmpeg -y -v error -i "$IN" -vf "$(zoom "1.3-0.3*t/$D")" "${ENC[@]}" "$OUT/$NAME-angle-3-pullout.mp4"
ffmpeg -y -v error -i "$IN" -vf "scale=w=1296:h=-2:flags=lanczos,rotate=a=0.05:c=black:ow=1296:oh=2304,crop=1080:1920,setsar=1" "${ENC[@]}" "$OUT/$NAME-angle-4-tilt.mp4"
echo "done: 4 angle variants in $OUT"
