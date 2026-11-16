#!/bin/sh
# usage: tools/viewmodel.sh <kind> <outdir> [emo]
#  → <outdir>/<kind>.png (front, 3/4, side), <kind>-close.png (face close-up),
#    <kind>-motion.png (just after a sideways shove + drop: shows spring ears/tails and skinning),
#    <kind>-pose.png (arms/wings/claws rotated + head turned, to check the rig contract)
# Renders one model with the dev viewer in Electron. Run from the project root.
KIND=$1; OUT=$2; EMO=${3:-happy}
mkdir -p "$OUT"
STEPS="$OUT/.steps-$KIND.json"
cat > "$STEPS" <<J
[{"wait":2500,"js":"window.addEventListener('error',e=>console.error('UNCAUGHT',e.message,e.filename,e.lineno)); __ll.router.go('viewer',{kind:'$KIND',emo:'$EMO'}); 1"},
 {"wait":1500,"shot":"$KIND"},
 {"js":"__ll.router.go('viewer',{kind:'$KIND',emo:'$EMO',close:true}); 1"},
 {"wait":1500,"shot":"$KIND-close"},
 {"js":"const m=__ll.current.models[0]; m.userData.kick&&m.userData.kick({x:5,y:2,z:0}); m.position.y=0.7; setTimeout(()=>m.position.y=0,60); 1"},
 {"wait":170,"shot":"$KIND-motion"},
 {"wait":1200,"js":"const u=__ll.current.models[0].userData; for(const k of ['arms','wings','claws']) (u[k]||[]).forEach((b,i)=>{b.rotation.z += (i?-1:1)*0.9;}); if(u.head){u.head.rotation.y=0.5; u.head.rotation.x=0.2;} (u.trunk||[]).forEach(b=>b.rotation.x-=0.4); 1"},
 {"wait":300,"shot":"$KIND-pose"}]
J
UD="${TMPDIR:-/tmp}/ll-view-$KIND-$$" npx electron tools/snap.js "$OUT" "$STEPS" >/dev/null 2>&1
grep -i "error\|uncaught\|failed" "$OUT/log.txt" | grep -v Autofill
echo "saved $OUT/$KIND.png, $KIND-close.png, $KIND-motion.png, $KIND-pose.png"
