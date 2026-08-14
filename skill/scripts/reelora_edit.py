#!/usr/bin/env python3
import argparse, json, math, random, shutil, struct, subprocess, tempfile, wave
from pathlib import Path

PRESETS = {
    'premium': (122, 'viral-fashion'),
    'fashion': (126, 'viral-fashion'),
    'fast_ecommerce': (132, 'commercial-pop'),
    'luxury': (112, 'luxury-runway'),
    'minimal': (108, 'clean-pop'),
    'cinematic': (102, 'dreamy-viral'),
    'clean_commercial': (118, 'commercial-pop'),
}

RHYTHM_PATTERNS = {
    'fashion': [2.0, 1.0, 1.5, 2.5, 1.0, 2.0, 1.0, 1.5, 2.0, 1.0],
    'fast_ecommerce': [1.0, 1.0, 1.5, 1.0, 2.0, 1.0, 1.0, 1.5, 1.0, 2.0],
    'premium': [2.0, 1.5, 2.5, 1.0, 2.0, 1.0, 1.5, 2.5, 1.0, 2.0],
    'luxury': [3.0, 2.0, 3.5, 1.5, 3.0, 2.0, 3.0, 1.5],
    'minimal': [2.5, 2.0, 3.0, 1.5, 2.5, 2.0, 3.0, 1.5],
    'cinematic': [3.0, 2.0, 4.0, 2.0, 3.0, 2.0, 4.0],
    'clean_commercial': [2.0, 1.5, 2.5, 1.5, 2.0, 1.5, 2.5, 1.5],
}

def run(args):
    subprocess.run(args, check=True)

def capture(args):
    return subprocess.check_output(args, text=True)

def probe_duration(path):
    data = json.loads(capture(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(path)]))
    return float(data['format']['duration'])

def ensure_tools():
    for exe in ('ffmpeg','ffprobe'):
        if shutil.which(exe) is None:
            raise SystemExit(f'{exe} is required on PATH')

def choose_bpm(style, highlight):
    bpm, mood = PRESETS.get(style, PRESETS['premium'])
    if highlight in ('logo','print') and style in ('premium','fashion'):
        return 128, 'streetwear-dark'
    if highlight in ('fabric','neckline','sleeves') and style in ('premium','fashion'):
        return 116, 'clean-pop'
    if highlight == 'top_wear' and style in ('premium','fashion'):
        return 124, 'viral-fashion'
    return bpm, mood

def make_music(path, duration, bpm, mood):
    sr = 44100
    frames = max(1, int(duration * sr))
    beat = 60.0 / bpm
    rng = random.Random(f'reelora:{bpm}:{mood}')
    roots = [55.0, 65.406, 73.416, 49.0] if 'dark' not in mood else [49.0, 55.0, 43.654, 46.249]
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
        block = bytearray()
        for i in range(frames):
            t = i / sr
            beat_pos = t / beat
            b = int(beat_pos)
            phase = beat_pos - b
            bar = b // 4
            section = int(t / max(1.0, duration) * 5)
            root = roots[bar % len(roots)]
            since = phase * beat
            kick_env = math.exp(-since * 20.0)
            kick = math.sin(2*math.pi*(48 + 65*math.exp(-since*25))*since) * kick_env * (0.46 if section != 0 else 0.28)
            snare_dist = min(abs((beat_pos % 4)-1), abs((beat_pos % 4)-3))
            snare_env = math.exp(-max(0.0, snare_dist*beat)*22.0) if snare_dist < 0.18 else 0.0
            noise = rng.uniform(-1,1)
            snare = noise * snare_env * (0.16 if section != 0 else 0.08)
            half = (t % (beat/2.0))
            hat = rng.uniform(-1,1) * math.exp(-half*70.0) * (0.045 if section in (1,2,4) else 0.025)
            bass_env = min(1.0, since*14.0) * math.exp(-since*3.0)
            bass = (math.sin(2*math.pi*root*t) + 0.20*math.sin(2*math.pi*root*2*t)) * bass_env * (0.13 if section != 3 else 0.08)
            chord = (math.sin(2*math.pi*root*2*t) + 0.55*math.sin(2*math.pi*root*2.5*t) + 0.38*math.sin(2*math.pi*root*3*t)) * (0.018 if section == 0 else 0.026)
            arp = math.sin(2*math.pi*(root*4)*t) * math.exp(-(t % (beat/2))*8) * (0.026 if section in (1,2,4) else 0.012)
            riser = 0.0
            if section == 1:
                sec_pos = (t % max(beat*4, 0.1)) / max(beat*4, 0.1)
                riser = rng.uniform(-1,1) * sec_pos * 0.018
            x = math.tanh((kick+snare+hat+bass+chord+arp+riser)*1.12)
            l = int(max(-1,min(1,x + hat*0.12))*32767)
            r = int(max(-1,min(1,x - hat*0.12 + chord*0.10))*32767)
            block += struct.pack('<hh', l, r)
            if len(block) >= 65536:
                w.writeframesraw(block); block.clear()
        if block: w.writeframesraw(block)

def normalize_pattern(style, target, bpm, count):
    beat = 60.0 / bpm
    pattern = RHYTHM_PATTERNS.get(style, RHYTHM_PATTERNS['premium'])
    vals = [pattern[i % len(pattern)] * beat for i in range(count)]
    total = sum(vals)
    scale = target / total if total else 1.0
    vals = [max(0.55, min(2.6, v*scale)) for v in vals]
    scale2 = target / sum(vals)
    return [v*scale2 for v in vals]

def source_windows(inputs, durations):
    out=[]
    for idx, p in enumerate(inputs):
        d=durations[idx]
        for frac in (0.12,0.42,0.72):
            out.append((p, max(0.0, d*frac)))
    return out

def render_part(src, start, dur, output, width=1080, height=1920):
    vf=(f"scale={width}:{height}:force_original_aspect_ratio=increase,"
        f"crop={width}:{height}:(iw-{width})/2:(ih-{height})/2,fps=30")
    run(['ffmpeg','-y','-ss',f'{start:.3f}','-t',f'{dur:.3f}','-i',str(src),'-vf',vf,'-an','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',str(output)])

def render_outro(src, output, width=1080, height=1920):
    vf=(f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
        f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black,fps=30")
    run(['ffmpeg','-y','-i',str(src),'-vf',vf,'-an','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',str(output)])

def transition_spec(style, i):
    if style in ('fashion','fast_ecommerce'):
        if i % 5 == 0: return ('smoothleft', 0.085, 'micro-whip')
        if i % 7 == 0: return ('fadeblack', 0.065, 'micro-dip')
        return ('fade', 0.025, 'beat-cut')
    if style in ('luxury','cinematic'):
        if i % 5 == 0: return ('fadeblack', 0.080, 'soft-dip')
        return ('fade', 0.030, 'clean-cut')
    if i % 6 == 0: return ('smoothleft', 0.075, 'micro-motion')
    return ('fade', 0.025, 'clean-cut')

def compose(parts, durations, output, music, style, flash=True):
    args=['ffmpeg','-y']
    for p in parts: args += ['-i',str(p)]
    args += ['-stream_loop','-1','-i',str(music)]
    filters=[]; prev='0:v'; timeline=durations[0]
    audit=[]
    for i in range(1,len(parts)):
        name, td, label=transition_spec(style,i)
        td=min(td, durations[i-1]*0.15, durations[i]*0.15)
        td=max(0.018, td)
        off=max(0.001,timeline-td)
        out=f'v{i}'
        filters.append(f'[{prev}][{i}:v]xfade=transition={name}:duration={td:.3f}:offset={off:.3f}[{out}]')
        audit.append({'index':i,'type':label,'ffmpeg':name,'duration':round(td,3),'at':round(off,3)})
        prev=out; timeline += durations[i]-td
    if flash and len(parts) >= 5:
        moment=max(0.5, timeline*0.38)
        out='vflash'
        filters.append(f"[{prev}]eq=brightness=0.032:contrast=1.006:enable='between(t,{moment-0.025:.3f},{moment+0.045:.3f})'[{out}]")
        prev=out
        audit.append({'type':'single-soft-flash','at':round(moment,3),'duration':0.07})
    graph=';'.join(filters)
    music_idx=len(parts)
    fade=max(0.0,timeline-0.45)
    args += ['-filter_complex',graph,'-map',f'[{prev}]','-map',f'{music_idx}:a:0','-c:v','libx264','-preset','veryfast','-crf','19','-c:a','aac','-b:a','192k','-af',f'loudnorm=I=-14:LRA=6:TP=-1.5,aresample=48000,afade=t=in:st=0:d=0.18,afade=t=out:st={fade:.3f}:d=0.4','-t',f'{timeline:.3f}','-pix_fmt','yuv420p','-movflags','+faststart',str(output)]
    run(args)
    return timeline,audit

def main():
    ap=argparse.ArgumentParser(description='Reelora deterministic FFmpeg editor for ChatGPT Skill runtimes.')
    ap.add_argument('--input', action='append', required=True, help='Raw input video; repeat for multiple videos.')
    ap.add_argument('--outro', required=True)
    ap.add_argument('--output', required=True)
    ap.add_argument('--music', help='Optional supplied music. If omitted, Reelora generates an original trend-inspired instrumental.')
    ap.add_argument('--style', default='fashion', choices=sorted(PRESETS))
    ap.add_argument('--highlight', default='general')
    ap.add_argument('--content-duration', type=float, default=11.0, help='Seconds before outro.')
    ap.add_argument('--shots', type=int, default=8)
    ap.add_argument('--no-flash', action='store_true')
    args=ap.parse_args()
    ensure_tools()
    inputs=[Path(x).resolve() for x in args.input]
    outro=Path(args.outro).resolve(); output=Path(args.output).resolve()
    for p in inputs+[outro]:
        if not p.exists(): raise SystemExit(f'Missing media: {p}')
    bpm,mood=choose_bpm(args.style,args.highlight)
    src_durations=[probe_duration(p) for p in inputs]
    count=max(4,min(args.shots,12))
    shot_durations=normalize_pattern(args.style,max(6.0,min(args.content_duration,30.0)),bpm,count)
    windows=source_windows(inputs,src_durations)
    with tempfile.TemporaryDirectory(prefix='reelora-skill-') as td:
        td=Path(td); parts=[]; actual=[]
        for i,dur in enumerate(shot_durations):
            src,anchor=windows[i % len(windows)]
            src_d=probe_duration(src)
            start=min(max(0.0,anchor), max(0.0,src_d-dur-0.05))
            safe=min(dur,max(0.35,src_d-start-0.02))
            part=td/f'shot-{i:02d}.mp4'; render_part(src,start,safe,part); parts.append(part); actual.append(safe)
        outro_part=td/'outro.mp4'; render_outro(outro,outro_part); outro_d=probe_duration(outro_part)
        parts.append(outro_part); actual.append(outro_d)
        if args.music:
            music=Path(args.music).resolve()
            if not music.exists(): raise SystemExit(f'Missing music: {music}')
            music_source='user-supplied'
        else:
            music=td/'reelora-original.wav'; make_music(music,sum(actual)+1.0,bpm,mood); music_source='reelora-original'
        output.parent.mkdir(parents=True,exist_ok=True)
        final_d,audit=compose(parts,actual,output,music,args.style,not args.no_flash)
    print(json.dumps({'output':str(output),'duration':round(final_d,3),'music_source':music_source,'music_mood':mood,'bpm':bpm,'source_audio_replaced':True,'transitions':audit},indent=2))

if __name__=='__main__': main()
