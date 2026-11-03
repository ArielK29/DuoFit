#!/usr/bin/env bash
# trial_reels.sh <input.mp4> <out_dir> "<hook text>" [song ...]
set -euo pipefail
IN="$1"; OUT="$2"; TEXT="${3:-}"; shift 3 || shift $#
SONGS=("$@")
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$OUT"; NAME="$(basename "${IN%.*}")"
DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")"
HAS_A="$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "$IN" | head -1)"
ENC=(-c:v libx264 -crf 18 -pix_fmt yuv420p -r 30 -movflags +faststart)
AENC=(-c:a aac -b:a 192k)

# 1 speed 1.1x
if [ -n "$HAS_A" ]; then
  ffmpeg -y -v error -i "$IN" -filter_complex "[0:v]setpts=PTS/1.1[v];[0:a]atempo=1.1[a]" -map "[v]" -map "[a]" "${ENC[@]}" "${AENC[@]}" "$OUT/$NAME-1-speed.mp4"
else
  ffmpeg -y -v error -i "$IN" -vf "setpts=PTS/1.1" "${ENC[@]}" "$OUT/$NAME-1-speed.mp4"
fi
# 2 new first shot: punch-in zoom for the first 0.6 s
ffmpeg -y -v error -i "$IN" -vf "scale=w='trunc(1080*(1+0.14*max(0,1-t/0.6))/2)*2':h=-2:eval=frame,crop=1080:1920,setsar=1" "${ENC[@]}" -c:a copy "$OUT/$NAME-2-shot.mp4"
# 3 warmer grade
ffmpeg -y -v error -i "$IN" -vf "colorbalance=rs=0.07:gs=0.01:bs=-0.08:rm=0.05:bm=-0.06,eq=saturation=1.06" "${ENC[@]}" -c:a copy "$OUT/$NAME-3-warm.mp4"
# 4 new on-screen text
if [ -n "$TEXT" ]; then
  node "$HERE/overlay.js" "$TEXT" "$OUT/.overlay.png"
  ffmpeg -y -v error -i "$IN" -i "$OUT/.overlay.png" -filter_complex "[0:v][1:v]overlay=0:0:format=auto:enable='between(t,0.3,3.3)',format=yuv420p[v]" -map "[v]" -map 0:a? "${ENC[@]}" -c:a copy "$OUT/$NAME-4-text.mp4"
fi
# 5 different song(s)
i=0
for S in "${SONGS[@]}"; do
  i=$((i+1))
  ffmpeg -y -v error -i "$IN" -stream_loop -1 -i "$S" -filter_complex "[1:a]atrim=0:$DUR,afade=t=in:d=0.3,afade=t=out:st=$(python3 -c "print(max(0,$DUR-0.6))"):d=0.6,loudnorm=I=-14:TP=-1.5:LRA=11[a]" -map 0:v -map "[a]" -t "$DUR" -c:v copy "${AENC[@]}" -movflags +faststart "$OUT/$NAME-5-song$i.mp4"
done
rm -f "$OUT/.overlay.png"
{
echo "# Posting plan: $NAME"; echo
echo "Post as Trial Reels, a few hours apart. Compare after 24 hours: views from non-followers, 3-second hold, average watch time, shares."; echo
ls "$OUT" | grep '\.mp4$' | sed 's/^/- /'
} > "$OUT/POSTING-PLAN.md"
echo "done: $(ls "$OUT"/*.mp4 | wc -l) variants in $OUT"
