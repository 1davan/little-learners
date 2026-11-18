#!/bin/sh
# Visual QA: play one game at one level with autoplay and take N screenshots spread across the play,
# then tile them into a contact sheet for review.
# usage: tools/qa-shots.sh <gameId> <level 0|1|2> <outdir> [shots=10] [interval_ms=3500]
#  → <outdir>/<game>-L<level>/shot01.png … and <outdir>/<game>-L<level>-sheet.jpg (5 x 2 grid)
# Run from the project root. One electron at a time.
G=$1; L=$2; OUT=$3; N=${4:-10}; IV=${5:-3500}
D="$OUT/$G-L$L"; rm -rf "$D"; mkdir -p "$D"
python3 - "$G" "$L" "$D" "$N" "$IV" <<'EOF'
import json, sys, re
g, l, d, n, iv = sys.argv[1], int(sys.argv[2]), sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
src = open('tools/autoplay.js').read()
src = re.sub(r"window.__seq = \[[^\]]*\]", "window.__seq = ['%s']" % g, src)
# Teleport/snap detector: logs any character whose position jumps more than 0.35 units between two frames
MON = r'''(function(){const last=new Map();function tick(){const c=__ll.current;if(c&&c.root){c.root.traverse(o=>{const u=o.userData;if(!u||!u.creature||!o.visible||(u.kind||'').startsWith('prop_'))return;const p=o.getWorldPosition(new o.position.constructor());const q=last.get(o);if(q&&p.distanceTo(q)>0.35)console.error('TELEPORT',u.kind,p.distanceTo(q).toFixed(2),'at',performance.now()|0);last.set(o,p);});}requestAnimationFrame(tick);}requestAnimationFrame(tick);})();
'''
steps = [{"wait": 2500, "js": "localStorage.clear(); localStorage.setItem('ll.v1', JSON.stringify({settings:{level:%d}})); setTimeout(()=>location.reload(),50); 1" % l},
         {"wait": 8000, "js": "window.addEventListener('error',e=>console.error('UNCAUGHT',e.message,e.filename,e.lineno));\n" + MON + src}]
for i in range(n):
    steps.append({"wait": iv, "shot": "shot%02d" % (i + 1)})
json.dump(steps, open(d + '/steps.json', 'w'))
EOF
UD="${TMPDIR:-/tmp}/qa-ud-$G-$L-$$" ./node_modules/.bin/electron tools/snap.js "$D" "$D/steps.json" >/dev/null 2>&1
grep -E "UNCAUGHT|REJECT|AUTOERR|TELEPORT" "$D/log.txt" | head -12
ffmpeg -v error -y -f image2 -c:v mjpeg -pattern_type glob -i "$D/shot*.png" -vf "scale=640:-1,tile=5x2:padding=4:color=white" -frames:v 1 "$OUT/$G-L$L-sheet.jpg"
echo "sheet: $OUT/$G-L$L-sheet.jpg"
