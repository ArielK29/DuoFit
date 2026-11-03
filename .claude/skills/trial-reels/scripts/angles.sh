#!/usr/bin/env bash
# angles.sh <input> <out_dir> [action_x action_y]
# Five creative reframings of ONE clip. Burned-in captions stay readable in every variant.
# action_x/y = where the action is (0..1, default 0.45 0.78). Source should be >= 1080x1920.
set -euo pipefail
IN="$1"; OUT="$2"; AX="${3:-0.45}"; AY="${4:-0.78}"
mkdir -p "$OUT"; NAME="$(basename "${IN%.*}" | cut -c1-24)"
D="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")"
E=(-c:v libx264 -crf 18 -pix_fmt yuv420p -r 30 -movflags +faststart -c:a aac -b:a 192k -map "[v]" -map 0:a?)
BASE="scale=1080:1920:flags=lanczos,setsar=1"

# 1 caption lock: push-in on the action, top band (captions) stays untouched
ffmpeg -y -v error -i "$IN" -filter_complex "
[0:v]$BASE,split=2[o][z];
[z]scale=w='trunc(1080*(1+0.35*t/$D)/2)*2':h=-2:eval=frame:flags=lanczos,crop=1080:1920:x='(iw-1080)*$AX':y='ih-1920',setsar=1[zz];
[o]crop=1080:660:0:0[top];
[zz][top]overlay=0:0,drawbox=x=0:y=656:w=1080:h=8:color=0xFF00A8:t=fill,format=yuv420p[v]" "${E[@]}" "$OUT/$NAME-angle-1-captionlock.mp4"

# 2 stack: wide shot with captions on top, tight shot of the action below
ffmpeg -y -v error -i "$IN" -filter_complex "
[0:v]$BASE,split=2[a][b];
[a]crop=1080:960:0:280[top];
[b]scale=1836:3264:flags=lanczos,crop=1080:960:x='1836*$AX-540':y='3264*$AY-480'[bot];
[top][bot]vstack,drawbox=x=0:y=954:w=1080:h=12:color=0xFF00A8:t=fill,format=yuv420p[v]" "${E[@]}" "$OUT/$NAME-angle-2-stack.mp4"

# 3 tilted frame on a blurred backdrop: whole picture visible
ffmpeg -y -v error -i "$IN" -filter_complex "
[0:v]$BASE,split=2[bg][fg];
[bg]scale=1512:2688,crop=1080:1920,boxblur=40:4,eq=brightness=-0.12:saturation=1.3[b];
[fg]scale=900:-2,format=yuva420p,rotate=-0.07:c=none:ow=rotw(-0.07):oh=roth(-0.07)[f];
[b][f]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p[v]" "${E[@]}" "$OUT/$NAME-angle-3-tilted.mp4"

# 4 motion echo: ghost trail behind every movement
ffmpeg -y -v error -i "$IN" -filter_complex "
[0:v]$BASE,tmix=frames=5:weights='5 4 3 2 1',eq=saturation=1.15:contrast=1.05,format=yuv420p[v]" "${E[@]}" "$OUT/$NAME-angle-4-echo.mp4"

# 5 neon grade in the brand colors (magenta shadows, cyan highlights)
ffmpeg -y -v error -i "$IN" -filter_complex "
[0:v]$BASE,colorbalance=rs=0.28:gs=-0.10:bs=0.22:rh=-0.22:gh=0.08:bh=0.22,eq=contrast=1.12:saturation=1.2,format=yuv420p[v]" "${E[@]}" "$OUT/$NAME-angle-5-neon.mp4"
echo "done: 5 angle variants in $OUT"
