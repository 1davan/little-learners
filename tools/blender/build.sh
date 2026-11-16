#!/bin/sh
# usage: tools/blender/build.sh [kind ...]   (no args = every creature in tools/blender/creatures)
# Builds app/assets/models/<kind>.glb with Blender and refreshes app/assets/models/index.json.
cd "$(dirname "$0")/../.."
BL=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
KINDS="$*"
[ -z "$KINDS" ] && KINDS=$(ls tools/blender/creatures/*.py | xargs -n1 basename | sed 's/\.py$//')
for k in $KINDS; do
  "$BL" -b --factory-startup --python "tools/blender/creatures/$k.py" 2>&1 | grep -E "WROTE|Error|Traceback|line [0-9]+|rror:" || echo "FAILED $k"
done
ls app/assets/models/*.glb | xargs -n1 basename | sed 's/\.glb$//' | python3 -c "import sys,json; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))" > app/assets/models/index.json.tmp && mv app/assets/models/index.json.tmp app/assets/models/index.json
echo "index: $(cat app/assets/models/index.json)"
