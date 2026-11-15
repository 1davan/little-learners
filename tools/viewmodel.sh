#!/bin/sh
# usage: tools/viewmodel.sh <kind> <outdir> [emo]   → <outdir>/<kind>.png (3 angles) and <kind>-close.png (face close-up)
# Renders one model with the dev viewer in Electron. Run from the project root.
KIND=$1; OUT=$2; EMO=${3:-happy}
mkdir -p "$OUT"
STEPS="$OUT/.steps-$KIND.json"
cat > "$STEPS" <<J
[{"wait":2500,"js":"window.addEventListener('error',e=>console.error('UNCAUGHT',e.message,e.filename,e.lineno)); __ll.router.go('viewer',{kind:'$KIND',emo:'$EMO'}); 1"},
 {"wait":1500,"shot":"$KIND"},
 {"js":"__ll.router.go('viewer',{kind:'$KIND',emo:'$EMO',close:true}); 1"},
 {"wait":1500,"shot":"$KIND-close"}]
J
UD="${TMPDIR:-/tmp}/ll-view-$KIND-$$" npx electron tools/snap.js "$OUT" "$STEPS" >/dev/null 2>&1
grep -i "error\|uncaught" "$OUT/log.txt" | grep -v Autofill
echo "saved $OUT/$KIND.png and $OUT/$KIND-close.png"
