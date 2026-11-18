#!/usr/bin/env python3
"""Generate the spoken voice lines with fal.ai (Gemini TTS, voice Sulafat) -> app/assets/voice/<id>.ogg + index.json.

usage: python3 tools/voice/gen.py lines.txt [--voice Sulafat] [--key-file ~/Downloads/fal_key.txt]
lines.txt: one caption per line (as the game shows it). Already-generated lines are skipped.
  A line may also give the text the voice should say when it differs from the caption, and a style note:
      caption => spoken text / style note        e.g.   A! => Ay! / Say the letter name A, like "ay".
  The index key is always the caption; the spoken text (and the note, added to the style) is what is sent.
The key is read from the key file (never printed). The index maps a normalised caption -> file, matching
voiceKey() in app/src/engine/speech.js.
"""
import sys, os, re, json, hashlib, subprocess, urllib.request, argparse, concurrent.futures as cf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'app', 'assets', 'voice')


def key_of(text):
    t = re.sub(r"[^a-z0-9' ]+", ' ', text.lower())
    return re.sub(r'\s+', ' ', t).strip()


def speakable(text):
    # drop emoji / symbols, keep words and simple punctuation; emphasise CAPS words gently
    t = re.sub(r"[^\w\s'!?,.\-]", ' ', text)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


STYLE = 'Say warmly, clearly and cheerfully, like a kind preschool teacher talking to a two-year-old.'


def split_line(ln):
    """'caption => spoken / style note' -> (caption, spoken, note); a plain line -> (line, line, '')"""
    if ' => ' not in ln:
        return ln, ln, ''
    cap, rest = ln.split(' => ', 1)
    spoken, note = (rest.split(' / ', 1) + [''])[:2] if ' / ' in rest else (rest, '')
    return cap.strip(), spoken.strip() or cap.strip(), note.strip()


def gen(text, voice, k, note=''):
    style = STYLE + (' ' + note if note else '')
    body = json.dumps({'prompt': speakable(text), 'style_instructions': style, 'voice': voice, 'output_format': 'mp3'}).encode()
    req = urllib.request.Request('https://fal.run/fal-ai/gemini-tts', data=body,
                                 headers={'Authorization': 'Key ' + k, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=180) as r:
        url = json.load(r)['audio']['url']
    with urllib.request.urlopen(url, timeout=120) as r:
        return r.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('lines')
    ap.add_argument('--voice', default='Sulafat')
    ap.add_argument('--key-file', default=os.path.expanduser('~/Downloads/fal_key.txt'))
    a = ap.parse_args()
    k = open(a.key_file).read().strip()
    os.makedirs(OUT, exist_ok=True)
    idx_path = os.path.join(OUT, 'index.json')
    idx = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
    lines = []
    spoken = {}
    for ln in open(a.lines, encoding='utf-8'):
        ln = ln.strip()
        cap, say, note = split_line(ln) if ln else ('', '', '')
        if cap and key_of(cap) and key_of(cap) not in idx and cap not in lines:
            lines.append(cap)
            spoken[cap] = (say, note)
    print('to generate:', len(lines))

    def one(text):
        kk = key_of(text)
        fid = hashlib.sha1((a.voice + '|' + kk).encode()).hexdigest()[:12] + '.ogg'
        mp3 = os.path.join(OUT, fid + '.mp3')
        say, note = spoken.get(text, (text, ''))
        try:
            audio = gen(say, a.voice, k, note)  # fetch first, so a failed request never leaves an empty file
            open(mp3, 'wb').write(audio)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-vn', '-ac', '1', '-ar', '48000',
                            '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-2',
                            '-c:a', 'libopus', '-b:a', '48k', os.path.join(OUT, fid)], check=True)
            os.remove(mp3)
            return kk, fid
        except Exception as e:
            print('FAILED', repr(text), e)
            return kk, None

    with cf.ThreadPoolExecutor(6) as ex:
        for kk, fid in ex.map(one, lines):
            if fid:
                idx[kk] = fid
    json.dump(idx, open(idx_path, 'w'), indent=0, sort_keys=True)
    print('index size', len(idx))


if __name__ == '__main__':
    main()
