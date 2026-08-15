#!/usr/bin/env python3
import argparse, json, math, random, re, shutil, struct, subprocess, tempfile, wave
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

PREMIUM_TRANSITIONS = {
    'liquid-splash': ('radial', 0.240, 'liquid-splash-ripple'),
    'ink-bloom': ('circleopen', 0.220, 'ink-bloom-matte'),
    'prism-refraction': ('hblur', 0.170, 'prism-refraction-bridge'),
    'particle-crystallize': ('pixelize', 0.150, 'particle-crystallize-resolve'),
    'light-sweep': ('diagtl', 0.140, 'cinematic-light-sweep'),
    'glass-ripple': ('circleclose', 0.200, 'glass-ripple-collapse'),
    'silk-fold': ('squeezeh', 0.180, 'silk-fold-reveal'),
    'luma-bloom': ('dissolve', 0.160, 'luma-bloom-resolve'),
}

TRANSITION_POOLS = {
    'premium': ['liquid-splash', 'prism-refraction', 'light-sweep', 'glass-ripple', 'luma-bloom'],
    'minimal': ['prism-refraction', 'light-sweep', 'luma-bloom'],
    'fashion': ['liquid-splash', 'ink-bloom', 'particle-crystallize', 'prism-refraction', 'silk-fold'],
    'fast_ecommerce': ['liquid-splash', 'particle-crystallize', 'light-sweep', 'prism-refraction'],
    'luxury': ['silk-fold', 'glass-ripple', 'ink-bloom', 'luma-bloom'],
    'cinematic': ['ink-bloom', 'glass-ripple', 'prism-refraction', 'luma-bloom'],
    'clean_commercial': ['light-sweep', 'prism-refraction', 'liquid-splash', 'luma-bloom'],
}

def run(args):
    command=list(args)
    if command and command[0] == 'ffmpeg' and '-loglevel' not in command:
        command=[command[0],'-hide_banner','-loglevel','error',*command[1:]]
    subprocess.run(command, check=True)

def capture(args):
    return subprocess.check_output(args, text=True)

def probe_duration(path):
    return probe_media(path)['duration']

def probe_media(path):
    data = json.loads(capture([
        'ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,width,height,avg_frame_rate',
        '-of','json',str(path)
    ]))
    video = next((stream for stream in data.get('streams', []) if stream.get('codec_type') == 'video'), None)
    if not video or not video.get('width') or not video.get('height'):
        raise SystemExit(f'No readable video stream: {path}')
    width, height = int(video['width']), int(video['height'])
    ratio = width / height
    orientation = 'landscape' if ratio > 1.05 else 'portrait' if ratio < 0.95 else 'square'
    return {
        'duration': float(data['format']['duration']),
        'width': width,
        'height': height,
        'aspect_ratio': round(ratio, 5),
        'orientation': orientation,
    }

def detect_scene_times(path, threshold=0.22):
    result=subprocess.run([
        'ffmpeg','-hide_banner','-i',str(path),'-vf',f"select='gt(scene,{threshold})',showinfo",
        '-an','-f','null','-'
    ],text=True,capture_output=True)
    values=[float(match) for match in re.findall(r'pts_time:([0-9.]+)',result.stderr)]
    return sorted(set(value for value in values if value > 0.1))

def probe_audio_peak_db(path):
    result=subprocess.run([
        'ffmpeg','-hide_banner','-i',str(path),'-af','volumedetect','-f','null','-'
    ],text=True,capture_output=True)
    match=re.search(r'max_volume:\s*(-?[0-9.]+)\s*dB',result.stderr,re.I)
    return float(match.group(1)) if match else None

def measure_visual_similarity(source, output, duration):
    if duration <= 0.5:
        return None
    graph=("[0:v]fps=12,scale=360:640:force_original_aspect_ratio=increase,crop=360:640,setsar=1[a];"
           "[1:v]fps=12,scale=360:640:force_original_aspect_ratio=increase,crop=360:640,setsar=1[b];"
           "[a][b]ssim")
    result=subprocess.run([
        'ffmpeg','-hide_banner','-t',f'{duration:.3f}','-i',str(source),
        '-t',f'{duration:.3f}','-i',str(output),'-filter_complex',graph,
        '-an','-f','null','-'
    ],text=True,capture_output=True)
    match=re.search(r'All:([0-9.]+)',result.stderr)
    return float(match.group(1)) if match else None

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

def scene_segments(duration, scenes=None, desired=4):
    clean_scenes=sorted(set(t for t in (scenes or []) if 0.1 < t < duration-0.1))
    boundaries=[0.0,*clean_scenes,duration]
    segments=[]
    for index in range(len(boundaries)-1):
        raw_start,raw_end=boundaries[index],boundaries[index+1]
        raw_duration=raw_end-raw_start
        if raw_duration < 0.55:
            continue
        trim=min(0.12,max(0.035,raw_duration*0.065))
        usable=min(3.2,raw_duration-trim*2)
        if usable >= 0.55:
            segments.append((raw_start+trim,usable))

    # A long take with no scene cuts still needs multiple real edit windows.
    if not clean_scenes and len(segments) < desired:
        segment_duration=min(2.4,max(0.6,duration/max(desired,1)*0.82))
        for index in range(desired):
            fraction=(index+0.35)/max(desired,1)
            start=min(max(0.04,duration*fraction-segment_duration/2),max(0.0,duration-segment_duration-0.04))
            candidate=(start,min(segment_duration,max(0.55,duration-start-0.04)))
            if not any(abs(existing[0]-candidate[0]) < 0.18 for existing in segments):
                segments.append(candidate)
    return sorted(segments,key=lambda item:item[0])

def pick_evenly(items, count):
    if count >= len(items):
        return list(items)
    if count <= 1:
        return [items[len(items)//2]]
    indices=[]
    for index in range(count):
        selected=round(index*(len(items)-1)/(count-1))
        if selected not in indices:
            indices.append(selected)
    return [items[index] for index in indices]

def recreate_sequence(items):
    if len(items) < 2:
        return list(items)
    order=[len(items)//2]
    left,right=0,len(items)-1
    while len(order) < len(items):
        if left not in order: order.append(left)
        if right not in order: order.append(right)
        left += 1; right -= 1
    return [items[index] for index in order[:len(items)]]

def source_windows(inputs, durations, count=8, remix_mode=None, scene_times=None):
    if not inputs:
        return []
    if count < len(inputs):
        raise ValueError('Shot count must be at least the number of uploaded videos.')

    allocations = [count // len(inputs)] * len(inputs)
    for idx in range(count % len(inputs)):
        allocations[idx] += 1

    if remix_mode in ('re_edit','recreate'):
        scene_times=scene_times or [[] for _ in inputs]
        queues=[]
        for source_index,p in enumerate(inputs):
            source_count=allocations[source_index]
            candidates=scene_segments(durations[source_index],scene_times[source_index],source_count)
            selected=pick_evenly(candidates,min(source_count,len(candidates)))
            if len(selected) < source_count:
                raise ValueError(f'Uploaded video {source_index+1} does not contain enough distinct edit windows.')
            if remix_mode == 'recreate':
                selected=recreate_sequence(selected)
            queues.append([(p,start,source_index,window_duration) for start,window_duration in selected])

        if remix_mode == 're_edit':
            return [window for queue in queues for window in queue]

        out=[]; round_index=0
        while any(queues):
            source_order=range(len(inputs)) if round_index % 2 == 0 else reversed(range(len(inputs)))
            for source_index in source_order:
                if queues[source_index]:
                    out.append(queues[source_index].pop(0))
            round_index += 1
        return out

    out=[]
    fractions=(0.12,0.42,0.72,0.26,0.58,0.86)
    for round_index in range(max(allocations)):
        for source_index, p in enumerate(inputs):
            if round_index >= allocations[source_index]:
                continue
            frac=fractions[round_index % len(fractions)]
            start=max(0.0,durations[source_index]*frac)
            out.append((p,start,source_index,min(3.2,max(0.55,durations[source_index]-start-0.04))))
    return out

def resolve_reframe_mode(width, height, requested='auto', has_tracked_region=False):
    ratio = width / height
    orientation = 'landscape' if ratio > 1.05 else 'portrait' if ratio < 0.95 else 'square'
    if orientation == 'portrait': return 'native_portrait'
    if orientation == 'square': return 'smart_crop'
    if requested == 'smart_crop': return 'smart_crop'
    if requested == 'blur_fill': return 'blur_fill'
    return 'smart_crop' if has_tracked_region else 'blur_fill'

def animation_spec(style, index, enabled=True):
    if not enabled:
        return ('locked-static-frame', 0.0, 0.0, 0.0, 0.0, 0.0)
    if index % 4 == 0:
        return ('hero-frame-breathe', 0.010, 2.0, 1.5, 0.20, 0.16)
    if style in ('fashion', 'fast_ecommerce'):
        return ('kinetic-product-arc', 0.022, 8.0, 4.0, 0.42, 0.31)
    if style in ('luxury', 'cinematic'):
        return ('silk-camera-float', 0.016, 4.0, 3.0, 0.22, 0.18)
    return ('product-parallax-orbit', 0.018, 6.0, 3.5, 0.30, 0.24)

def render_part(src, start, dur, output, style='fashion', index=0, animation=True, landscape_reframe='auto', width=1080, height=1920):
    label, overscan, xamp, yamp, xfreq, yfreq = animation_spec(style, index, animation)
    info=probe_media(src)
    reframe=resolve_reframe_mode(info['width'],info['height'],landscape_reframe)
    sw=round(width*(1+overscan)); sh=round(height*(1+overscan)); phase=index*0.73
    x=f"max(0,min(iw-{width},(iw-{width})/2+sin(t*{xfreq:.3f}+{phase:.3f})*{xamp:.3f}))"
    y=f"max(0,min(ih-{height},(ih-{height})/2+cos(t*{yfreq:.3f}+{phase:.3f})*{yamp:.3f}))"
    post=f"crop={width}:{height}:x='{x}':y='{y}',setsar=1,fps=30"
    cmd=['ffmpeg','-y','-ss',f'{start:.3f}','-t',f'{dur:.3f}','-i',str(src)]
    if reframe == 'blur_fill':
        vf=(f"[0:v]split=2[bg][fg];"
            f"[bg]scale={sw}:{sh}:force_original_aspect_ratio=increase,crop={sw}:{sh},gblur=sigma=28,eq=brightness=-0.055:saturation=0.82[bgv];"
            f"[fg]scale={sw}:{sh}:force_original_aspect_ratio=decrease[fgv];"
            f"[bgv][fgv]overlay=(W-w)/2:(H-h)/2,{post}[vout]")
        cmd += ['-filter_complex',vf,'-map','[vout]']
    else:
        vf=f"scale={sw}:{sh}:force_original_aspect_ratio=increase,{post}"
        cmd += ['-vf',vf]
    cmd += ['-an','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',str(output)]
    run(cmd)
    return {
        'index': index+1,
        'type': label,
        'real_pixels_only': True,
        'source_orientation': info['orientation'],
        'source_size': f"{info['width']}x{info['height']}",
        'vertical_reframe': reframe,
        'output_size': f'{width}x{height}',
    }

def render_outro(src, output, width=1080, height=1920):
    vf=(f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
        f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black,fps=30")
    run(['ffmpeg','-y','-i',str(src),'-vf',vf,'-an','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',str(output)])

def transition_spec(style, i, intensity='balanced', premium=True, outro=False, families=None):
    if outro:
        return ('fadeblack', 0.110, 'outro-safe-dip', 'outro-safe-dip', False)
    cadence = 3 if style in ('fashion','fast_ecommerce') else 4
    if not premium or i % cadence:
        return ('fade', 0.025, 'beat-cut', 'beat-cut', False)
    pool=families or TRANSITION_POOLS.get(style,TRANSITION_POOLS['premium'])
    family=pool[(i*3+len(pool))%len(pool)]
    name, duration, label=PREMIUM_TRANSITIONS[family]
    scale={'subtle':0.76,'balanced':1.0,'bold':1.2}[intensity]
    return (name, max(0.10,min(0.34,duration*scale)), label, family, True)

def compose(parts, durations, output, music, style, flash=True, premium=True, intensity='balanced', families=None, has_outro=True):
    args=['ffmpeg','-y']
    for p in parts: args += ['-i',str(p)]
    args += ['-stream_loop','-1','-i',str(music)]
    filters=[]; prev='0:v'; timeline=durations[0]
    audit=[]
    for i in range(1,len(parts)):
        name, td, label, family, is_premium=transition_spec(style,i,intensity,premium,has_outro and i==len(parts)-1,families)
        td=min(td, durations[i-1]*0.25, durations[i]*0.25)
        td=max(0.018, td)
        off=max(0.001,timeline-td)
        out=f'v{i}'
        filters.append(f'[{prev}][{i}:v]xfade=transition={name}:duration={td:.3f}:offset={off:.3f}[{out}]')
        audit.append({'index':i,'type':label,'family':family,'premium':is_premium,'ffmpeg':name,'duration':round(td,3),'at':round(off,3),'real_pixels_only':True})
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
    ap.add_argument('--outro', help='Optional supplied ending/outro. AI-video remix mode can render without one.')
    ap.add_argument('--output', required=True)
    ap.add_argument('--music', help='Optional supplied music. If omitted, Reelora generates an original trend-inspired instrumental.')
    ap.add_argument('--style', default='fashion', choices=sorted(PRESETS))
    ap.add_argument('--highlight', default='general')
    ap.add_argument('--content-duration', type=float, help='Seconds before outro. AI remix caps this below total source duration to prevent pass-through.')
    ap.add_argument('--shots', type=int, help='Requested shot count. Omit for automatic genuine-remix pacing.')
    ap.add_argument('--no-flash', action='store_true')
    ap.add_argument('--no-premium-effects', action='store_true', help='Use clean beat cuts and an outro-safe dip only.')
    ap.add_argument('--no-animation-effects', action='store_true', help='Disable premium real-pixel crop/parallax animation.')
    ap.add_argument('--transition-intensity', default='balanced', choices=('subtle','balanced','bold'))
    ap.add_argument('--transition-family', action='append', choices=sorted(PREMIUM_TRANSITIONS), help='Allow one premium family; repeat to build an allowlist.')
    ap.add_argument('--remix-ai-video', action='store_true', help='Treat all repeated --input generated videos as sources and rebuild them into one Reel.')
    ap.add_argument('--remix-mode', default='re_edit', choices=('re_edit','recreate'), help='re_edit preserves story order; recreate rebuilds the sequence from the strongest existing moments.')
    ap.add_argument('--landscape-reframe', default='auto', choices=('auto','smart_crop','blur_fill'), help='Automatic landscape-to-9:16 behavior. auto uses blurred real-pixel fill when no tracked crop exists.')
    args=ap.parse_args()
    ensure_tools()
    inputs=[Path(x).resolve() for x in args.input]
    if len(inputs) > 20:
        raise SystemExit('Reelora supports at most 20 uploaded videos in one guaranteed-coverage edit')
    outro=Path(args.outro).resolve() if args.outro else None; output=Path(args.output).resolve()
    for p in inputs+([outro] if outro else []):
        if not p.exists(): raise SystemExit(f'Missing media: {p}')
    bpm,mood=choose_bpm(args.style,args.highlight)
    src_durations=[probe_duration(p) for p in inputs]
    detected_scenes=[detect_scene_times(p) for p in inputs] if args.remix_ai_video else [[] for _ in inputs]
    if args.shots is not None:
        count=max(len(inputs),min(args.shots,20))
    elif args.remix_ai_video:
        available=sum(len(scene_segments(duration,detected_scenes[index],4)) for index,duration in enumerate(src_durations))
        desired=max(len(inputs),min(12,round(sum(src_durations)*0.55)))
        if len(inputs) == 1 and available >= 5:
            available -= 1
        count=max(min(4,available),min(desired,available))
    else:
        count=max(4,min(8,20))

    if args.remix_ai_video:
        factor=0.64 if args.remix_mode == 'recreate' else 0.76
        automatic_target=min(24.0,sum(src_durations)*factor)
        content_target=max(1.0,min(args.content_duration if args.content_duration is not None else automatic_target,sum(src_durations)*0.90,30.0))
    else:
        content_target=max(6.0,min(args.content_duration if args.content_duration is not None else 11.0,30.0))

    shot_durations=normalize_pattern(args.style,content_target,bpm,count)
    windows=source_windows(inputs,src_durations,count,args.remix_mode if args.remix_ai_video else None,detected_scenes)
    with tempfile.TemporaryDirectory(prefix='reelora-skill-') as td:
        td=Path(td); parts=[]; actual=[]
        animations=[]; selected_sources=[]; selected_source_durations=[]; selected_windows=[]
        for i,dur in enumerate(shot_durations):
            src,anchor,source_index,window_duration=windows[i % len(windows)]
            src_d=probe_duration(src)
            requested=min(dur,window_duration)
            start=min(max(0.0,anchor), max(0.0,src_d-requested-0.05))
            safe=min(requested,max(0.35,src_d-start-0.02))
            part=td/f'shot-{i:02d}.mp4'
            animation=render_part(src,start,safe,part,args.style,i,not args.no_animation_effects,args.landscape_reframe)
            animation['source_index']=source_index; animation['upload_number']=source_index+1
            animations.append(animation); selected_sources.append(source_index); selected_source_durations.append(safe)
            selected_windows.append({'shot_index':i,'source_index':source_index,'upload_number':source_index+1,'start':round(start,3),'duration':round(safe,3)})
            parts.append(part); actual.append(safe)
        if outro:
            outro_part=td/'outro.mp4'; render_outro(outro,outro_part); outro_d=probe_duration(outro_part)
            parts.append(outro_part); actual.append(outro_d)
        if args.music:
            music=Path(args.music).resolve()
            if not music.exists(): raise SystemExit(f'Missing music: {music}')
            music_source='user-supplied'
        else:
            music=td/'reelora-original.wav'; make_music(music,sum(actual)+1.0,bpm,mood); music_source='reelora-original'
        output.parent.mkdir(parents=True,exist_ok=True)
        final_d,audit=compose(parts,actual,output,music,args.style,not args.no_flash,not args.no_premium_effects,args.transition_intensity,args.transition_family,bool(outro))
    source_usage=[{'source_index':idx,'upload_number':idx+1,'shot_count':selected_sources.count(idx),'planned_duration':round(sum(d for source,d in zip(selected_sources,selected_source_durations) if source == idx),3)} for idx in range(len(inputs))]
    audio_peak_db=probe_audio_peak_db(output)
    if audio_peak_db is None or audio_peak_db < -55:
        raise SystemExit(f'Reelora render failed: replacement music/audio is effectively silent ({audio_peak_db} dB peak)')
    visual_similarity=None
    if args.remix_ai_video and len(inputs) == 1:
        visual_similarity=measure_visual_similarity(inputs[0],output,min(src_durations[0],content_target,final_d))
        if visual_similarity is not None and visual_similarity >= 0.94:
            raise SystemExit(f'Reelora render failed: output is {visual_similarity*100:.1f}% visually identical to the source; a real cut/re-edit/rearrangement is required')
    materially_reedited=not args.remix_ai_video or visual_similarity is None or visual_similarity < 0.94
    print(json.dumps({'output':str(output),'duration':round(final_d,3),'content_target':round(content_target,3),'music_source':music_source,'music_mood':mood,'bpm':bpm,'source_audio_replaced':True,'audio_peak_db':audio_peak_db,'ai_video_remix':args.remix_ai_video,'remix_mode':args.remix_mode if args.remix_ai_video else None,'materially_reedited':materially_reedited,'visual_similarity_to_source':round(visual_similarity,6) if visual_similarity is not None else None,'preserve_source_sequence':args.remix_ai_video and args.remix_mode == 're_edit','use_all_uploaded_videos':True,'all_uploaded_videos_used':all(item['shot_count'] > 0 for item in source_usage),'source_usage':source_usage,'detected_scene_times':detected_scenes,'selected_windows':selected_windows,'automatic_vertical_reframe':True,'landscape_reframe':args.landscape_reframe,'source_media':[probe_media(p) for p in inputs],'outro_supplied':bool(outro),'premium_transition_effects':not args.no_premium_effects,'premium_animation_effects':not args.no_animation_effects,'transition_intensity':args.transition_intensity,'transition_families':args.transition_family or TRANSITION_POOLS.get(args.style,TRANSITION_POOLS['premium']),'animations':animations,'transitions':audit},indent=2))

if __name__=='__main__': main()
