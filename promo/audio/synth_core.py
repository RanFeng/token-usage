"""Core DSP synthesizers and 120 BPM D-minor soundtrack generators."""

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DURATION = 48.0
N_SAMPLES = int(round(DURATION * SR))
BPM = 120.0
BEAT_S = 60.0 / BPM
BAR_S = 4.0 * BEAT_S


def midi_to_hz(midi):
    """Convert MIDI note number to frequency in Hz."""
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def phase_from_freq(freq, sr=SR):
    """Integrate instantaneous frequency array into phase in [0, 1)."""
    return np.cumsum(freq / float(sr)) % 1.0


def polyblep_saw(phase, freq, sr=SR):
    """Generate anti-aliased PolyBLEP sawtooth waveform in [-1, 1]."""
    dt = np.maximum(freq / float(sr), 1e-6)
    out = 2.0 * phase - 1.0
    t1 = phase / dt
    out -= np.where(phase < dt, t1 + t1 - t1 * t1 - 1.0, 0.0)
    t2 = (phase - 1.0) / dt
    out -= np.where(phase > 1.0 - dt, t2 * t2 + t2 + t2 + 1.0, 0.0)
    return out


def butter_filter(audio, cutoff, sr=SR, btype="lowpass", order=4):
    """Apply Butterworth SOS filter safely to mono or stereo audio."""
    nyq = 0.5 * sr
    norm = np.clip(np.asarray(cutoff) / nyq, 1e-4, 0.99)
    sos = butter(order, norm, btype=btype, output="sos")
    return sosfilt(sos, audio, axis=0)


def morph_lowpass(audio, cutoffs, env_norm, sr=SR):
    """Smoothly morph across 4 lowpass stages using env_norm in [0, 1]."""
    pos = np.clip(env_norm, 0.0, 1.0) * (len(cutoffs) - 1)
    idx0 = np.minimum(pos.astype(np.int32), len(cutoffs) - 2)
    frac = np.reshape(pos - idx0, (-1,) + (1,) * (audio.ndim - 1))
    stages = [butter_filter(audio, c, sr, "lowpass", 4) for c in cutoffs]
    stacked = np.stack(stages, axis=0)
    sel = np.arange(len(audio))
    return (1.0 - frac) * stacked[idx0, sel] + frac * stacked[idx0 + 1, sel]


def make_adsr(n_samples, sr=SR, a=0.01, d=0.1, s=0.6, r=0.15):
    """Create smooth ADSR envelope array of length n_samples."""
    na = max(1, int(a * sr))
    nd = max(1, int(d * sr))
    nr = min(n_samples // 2, max(1, int(r * sr)))
    ns = max(0, n_samples - na - nd - nr)
    env = np.concatenate([
        np.linspace(0.0, 1.0, na, endpoint=False),
        np.linspace(1.0, s, nd, endpoint=False),
        np.full(ns, s),
        np.linspace(s, 0.0, nr),
    ])
    return env[:n_samples]


def stereo_pan(mono, pan):
    """Constant-power stereo panner with pan in [-1.0, 1.0]."""
    angle = np.clip(pan, -1.0, 1.0) * (np.pi * 0.25) + (np.pi * 0.25)
    return np.column_stack((mono * np.cos(angle), mono * np.sin(angle)))


def place_stereo(canvas, audio, start_s, sr=SR):
    """Add stereo buffer onto canvas safely within sample boundaries."""
    start = int(round(start_s * sr))
    c0 = max(0, start)
    c1 = min(len(canvas), start + len(audio))
    if c1 <= c0:
        return
    a0 = c0 - start
    canvas[c0:c1] += audio[a0:a0 + (c1 - c0)]


def sidechain_env(n_samples, sr=SR, start_s=4.0, end_s=42.0, depth=0.62):
    """Build 120 BPM beat-synced sidechain pumping gain curve."""
    t = np.arange(n_samples) / float(sr)
    beat_phase = (t % BEAT_S) / BEAT_S
    duck = 1.0 - depth * np.exp(-beat_phase * 5.2)
    active = (t >= start_s) & (t < end_s)
    return np.where(active, duck, 1.0)[:, None]


def stereo_reverb(audio, sr=SR, decay_s=1.8, wet=0.28, seed=42):
    """Apply velvet-noise convolution stereo hall reverb."""
    rng = np.random.default_rng(seed)
    ir_len = int((decay_s + 0.02) * sr)
    t = np.arange(ir_len) / float(sr)
    env = np.exp(-t * (6.9 / decay_s))
    ir = rng.standard_normal((ir_len, 2)) * env[:, None]
    ir[:int(0.018 * sr)] = 0.0
    ir = butter_filter(ir, [180.0, 7200.0], sr, "bandpass", 2)
    ir /= np.sqrt(np.sum(ir ** 2, axis=0)) + 1e-9
    wet_l = fftconvolve(audio[:, 0], ir[:, 0], mode="full")[:len(audio)]
    wet_r = fftconvolve(audio[:, 1], ir[:, 1], mode="full")[:len(audio)]
    return audio + wet * np.column_stack((wet_l, wet_r))


def ping_pong_delay(audio, sr=SR, d_l=0.25, d_r=0.375, fb=0.35, wet=0.26):
    """Apply filtered multi-tap stereo ping-pong delay."""
    out = np.zeros_like(audio)
    filtered = butter_filter(audio, [260.0, 4600.0], sr, "bandpass", 2)
    for step in range(1, 5):
        gain = fb ** (step - 1)
        place_stereo(out, filtered[:, :1] * np.array([[1.0, 0.25]]) * gain, step * d_l, sr)
        place_stereo(out, filtered[:, 1:] * np.array([[0.25, 1.0]]) * gain, step * d_r, sr)
    return audio + wet * out


def _chord_progression():
    """Return D-minor harmonic progression across 0..48s."""
    dm9 = (38, [50, 53, 57, 60, 64], [62, 65, 69, 72, 76, 81])
    bb = (34, [46, 50, 53, 57, 62], [58, 62, 65, 69, 74, 77])
    fmaj = (41, [53, 57, 60, 64, 67], [65, 69, 72, 76, 79, 81])
    cmaj = (36, [48, 52, 55, 60, 62], [60, 64, 67, 72, 74, 79])
    am7 = (33, [45, 48, 52, 55, 59], [60, 64, 67, 69, 72, 76])
    gm9 = (43, [55, 58, 62, 65, 69], [62, 65, 67, 70, 74, 77])
    csus = (36, [48, 53, 55, 60, 62], [60, 65, 67, 72, 74, 79])
    return [
        (0.0, 3.76, *dm9), (4.0, 2.0, *dm9),
        (6.0, 2.0, *dm9), (8.0, 2.0, *bb), (10.0, 2.0, *fmaj), (12.0, 1.0, *cmaj), (13.0, 1.0, *am7),
        (14.0, 2.0, *dm9), (16.0, 2.0, *bb), (18.0, 2.0, *fmaj), (20.0, 1.0, *cmaj), (21.0, 1.0, *am7),
        (22.0, 2.0, *dm9), (24.0, 2.0, *bb), (26.0, 2.0, *gm9), (28.0, 1.0, *csus), (29.0, 1.0, *am7),
        (30.0, 2.0, *dm9), (32.0, 2.0, *bb), (34.0, 1.0, *fmaj), (35.0, 1.0, *cmaj),
        (36.0, 2.0, *dm9), (38.0, 2.0, *bb), (40.0, 1.0, *fmaj), (41.0, 1.0, *cmaj),
        (42.0, 2.0, *dm9), (44.0, 1.1, *bb), (45.1, 1.4, *dm9),
    ]


def _make_kick_one(sr=SR):
    """Synthesize punchy cyber-tech kick drum with crisp transient click."""
    n = int(0.32 * sr)
    t = np.arange(n) / float(sr)
    freq = 46.0 + 135.0 * np.exp(-t * 48.0)
    body = np.sin(2.0 * np.pi * np.cumsum(freq / sr)) * np.exp(-t * 9.5)
    click = np.sin(2.0 * np.pi * 1900.0 * t) * np.exp(-t * 280.0) * 0.45
    kick = np.tanh((body + click) * 1.45) * 0.92
    return np.column_stack((kick, kick))


def synth_kick_track(n_samples=N_SAMPLES, sr=SR):
    """Render 4-on-the-floor kick drum across 4.0s..42.0s."""
    canvas = np.zeros((n_samples, 2), dtype=np.float64)
    kick = _make_kick_one(sr)
    for beat_idx in range(8, 84):
        place_stereo(canvas, kick, beat_idx * BEAT_S, sr)
    place_stereo(canvas, kick * 0.85, 42.0, sr)
    return canvas


def _make_snare_hit(rng, sr=SR, dur=0.22, tone_hz=185.0):
    """Synthesize tight layered clap/snare hit."""
    n = int(dur * sr)
    t = np.arange(n) / float(sr)
    body = np.sin(2.0 * np.pi * tone_hz * np.exp(-t * 14.0) * t) * np.exp(-t * 22.0)
    noise = butter_filter(rng.standard_normal((n, 2)), [900.0, 8800.0], sr, "bandpass", 2)
    snap = noise * np.exp(-t * 19.0)[:, None]
    return np.tanh((np.column_stack((body, body)) * 0.42 + snap * 0.56) * 1.45) * 0.68


def _add_intro_snare_roll(canvas, rng, sr=SR):
    """Add accelerating tension snare roll over 0.5..3.74s stopping for vacuum."""
    times = list(np.arange(0.5, 2.0, 0.25)) + list(np.arange(2.0, 3.0, 0.125))
    times += list(np.arange(3.0, 3.74, 0.0625))
    for t_s in times:
        amp = 0.14 + 0.58 * (t_s / 3.75) ** 1.7
        hit = _make_snare_hit(rng, sr, 0.11, 180.0 + 90.0 * (t_s / 3.75))
        place_stereo(canvas, hit * amp, t_s, sr)


def _add_hats_and_clicks(canvas, rng, sr=SR):
    """Add stereo 16th-note closed/open hi-hats across 4.0..42.0s."""
    hat_c = butter_filter(rng.standard_normal((int(0.06 * sr), 2)), 7200.0, sr, "highpass", 3)
    hat_c *= np.exp(-np.arange(len(hat_c)) / float(sr) * 85.0)[:, None] * 0.28
    hat_o = butter_filter(rng.standard_normal((int(0.20 * sr), 2)), 6200.0, sr, "highpass", 3)
    hat_o *= np.exp(-np.arange(len(hat_o)) / float(sr) * 18.0)[:, None] * 0.30
    hats = (hat_c, hat_o)
    pans = (-0.25, 0.28)
    for step in range(32, 336):
        accent = 0.45 + 0.55 * float((step % 4) == 2)
        pan = pans[step % 2]
        hat = hats[int((step % 8) == 6)]
        place_stereo(canvas, hat * accent * np.array([[1.0 - pan, 1.0 + pan]]), step * 0.125, sr)


def _add_tech_clicks(canvas, sr=SR):
    """Add crisp high-frequency security tech clicks during 22.0..30.0s."""
    n = int(0.025 * sr)
    t = np.arange(n) / float(sr)
    click = np.sin(2.0 * np.pi * (3400.0 + 1800.0 * np.exp(-t * 140.0)) * t)
    click *= np.exp(-t * 180.0) * 0.18
    steps = [s for s in range(176, 240) if (s % 4) in (1, 3)]
    for step in steps:
        pan = (0.45, -0.45)[int((step % 8) >= 4)]
        place_stereo(canvas, stereo_pan(click, pan), step * 0.125, sr)


def synth_percussion_track(n_samples=N_SAMPLES, sr=SR):
    """Render snares, claps, hi-hats, and security tech clicks."""
    rng = np.random.default_rng(101)
    canvas = np.zeros((n_samples, 2), dtype=np.float64)
    _add_intro_snare_roll(canvas, rng, sr)
    snare = _make_snare_hit(rng, sr, 0.24, 190.0)
    for beat_idx in range(9, 84, 2):
        place_stereo(canvas, snare * 0.72, beat_idx * BEAT_S, sr)
    _add_hats_and_clicks(canvas, rng, sr)
    _add_tech_clicks(canvas, sr)
    return canvas


def _render_bass_note(midi, dur_s, sr=SR, drive=1.0):
    """Synthesize warm Moog saw + tight sub sine bass note."""
    n = int(round(dur_s * sr))
    freq = np.full(n, midi_to_hz(midi))
    sub = np.sin(2.0 * np.pi * phase_from_freq(freq * 0.5, sr)) * 0.55
    saw = polyblep_saw(phase_from_freq(freq, sr), freq, sr)
    saw += polyblep_saw(phase_from_freq(freq * 1.003, sr), freq * 1.003, sr)
    t = np.arange(n) / float(sr)
    cutoff_env = np.exp(-t * 11.0) * 0.85 + 0.12
    filtered = morph_lowpass(saw[:, None], [180.0, 520.0, 1450.0, 3400.0], cutoff_env, sr)[:, 0]
    env = make_adsr(n, sr, 0.004, 0.08, 0.65, min(0.05, dur_s * 0.3))
    mono = np.tanh((sub + filtered * 0.52 * drive) * env) * 0.72
    return np.column_stack((mono, mono))


def _render_intro_sub(canvas, sr=SR):
    """Render deep pulsing D1/D2 sub-bass from 0.0..3.76s."""
    for pulse in range(0, 7):
        t_s = pulse * 0.5
        dur = 0.45 if t_s < 3.2 else 0.72
        note = _render_bass_note(38, dur, sr, drive=0.60)
        place_stereo(canvas, note * (0.26 + 0.055 * pulse), t_s, sr)


def _add_chord_bass(canvas, start_s, dur_s, bass_m, sr=SR):
    """Render one chord bar of rolling Moog bass onto canvas."""
    pattern = (0, 0, 12, 0, 0, 12, 0, 7)
    groove = int(start_s < 42.0)
    step_dur = (dur_s, 0.25)[groove]
    n_steps = max(1, int(round(dur_s / step_dur)))
    drive = (1.0, 1.28)[int(22.0 <= start_s < 30.0)]
    amp = (0.72, 0.90)[groove]
    for idx in range(n_steps):
        offset = (0, pattern[idx % len(pattern)])[groove]
        note = _render_bass_note(bass_m + offset, step_dur * 0.92, sr, drive) * amp
        place_stereo(canvas, note, start_s + idx * step_dur, sr)


def synth_sub_and_bass_track(n_samples=N_SAMPLES, sr=SR):
    """Render intro sub pulse, rolling Moog bassline, and outro sustain."""
    canvas = np.zeros((n_samples, 2), dtype=np.float64)
    _render_intro_sub(canvas, sr)
    for start_s, dur_s, bass_m, _, _ in _chord_progression()[1:]:
        _add_chord_bass(canvas, start_s, dur_s, bass_m, sr)
    return butter_filter(canvas, 34.0, sr, "highpass", 2)


def _detuned_voice(f0, n, pan_even, sr=SR):
    """Generate 3-detuned PolyBLEP saw voices panned left/right."""
    left, right = np.zeros(n), np.zeros(n)
    for idx, det in enumerate((-0.0045, 0.0, 0.0045)):
        freq = np.full(n, f0 * (1.0 + det))
        wave = polyblep_saw(phase_from_freq(freq, sr), freq, sr)
        pan = pan_even if idx % 2 == 0 else (1.0 - pan_even)
        left += wave * pan
        right += wave * (1.0 - pan)
    return left, right


def _synth_pad_chord(midis, dur_s, sr=SR):
    """Synthesize wide stereo detuned Supersaw pad chord."""
    n = int(round((dur_s + 0.30) * sr))
    left, right = np.zeros(n), np.zeros(n)
    for idx, midi in enumerate(midis):
        l_v, r_v = _detuned_voice(midi_to_hz(midi), n, 0.35 if idx % 2 == 0 else 0.65, sr)
        left += l_v
        right += r_v
    env = make_adsr(n, sr, 0.24, 0.25, 0.85, 0.45)
    return np.column_stack((left, right)) * (env[:, None] / (len(midis) * 1.8))


def _pad_cutoff_curve(n_samples=N_SAMPLES, sr=SR):
    """Build smooth filter opening curve across intro, groove, and apex."""
    t = np.arange(n_samples) / float(sr)
    c = np.full(n_samples, 0.42)
    c = np.where(t < 3.76, 0.05 + 0.58 * (t / 3.76) ** 1.4, c)
    c = np.where((t >= 30.0) & (t < 42.0), 0.86, c)
    c = np.where(t >= 42.0, np.maximum(0.12, 0.78 - 0.11 * (t - 42.0)), c)
    return c


def synth_pad_track(n_samples=N_SAMPLES, sr=SR):
    """Render dynamic filtered stereo Supersaw Pad track."""
    canvas = np.zeros((n_samples, 2), dtype=np.float64)
    for start_s, dur_s, _, chord_m, _ in _chord_progression():
        gain = (0.42, 0.58)[int(start_s >= 30.0)]
        gain = (gain, 0.46)[int(start_s < 4.0)]
        place_stereo(canvas, _synth_pad_chord(chord_m, dur_s, sr) * gain, start_s, sr)
    canvas = butter_filter(canvas, 150.0, sr, "highpass", 3)
    return morph_lowpass(canvas, [240.0, 760.0, 2200.0, 6600.0], _pad_cutoff_curve(n_samples, sr), sr)


def _make_arp_pluck(midi, dur_s, pan, sr=SR):
    """Synthesize crystalline FM bell + filtered saw arp pluck."""
    n = int(round(dur_s * sr))
    t = np.arange(n) / float(sr)
    f0 = midi_to_hz(midi)
    mod = np.sin(2.0 * np.pi * (f0 * 2.0) * t) * 1.6 * np.exp(-t * 28.0)
    bell = np.sin(2.0 * np.pi * f0 * t + mod)
    freq = np.full(n, f0)
    saw = polyblep_saw(phase_from_freq(freq, sr), freq, sr) * 0.35
    env = make_adsr(n, sr, 0.003, 0.14, 0.08, 0.08)
    return stereo_pan((bell * 0.75 + saw) * env * 0.42, pan)


def _add_chord_arp(canvas, start_s, dur_s, arp_m, sr=SR):
    """Render one chord bar of crystal arpeggio plucks onto canvas."""
    groove = int(start_s < 42.0)
    step = (0.25, 0.125)[groove]
    n_steps = int(round(dur_s / step))
    amp = (max(0.15, 0.75 - 0.14 * (start_s - 42.0)), 0.90)[groove]
    for idx in range(n_steps):
        midi = arp_m[idx % len(arp_m)]
        pan = 0.42 * np.sin(idx * 0.85)
        place_stereo(canvas, _make_arp_pluck(midi, step * 1.4, pan, sr) * amp, start_s + idx * step, sr)


def synth_arp_track(n_samples=N_SAMPLES, sr=SR):
    """Render crystal 16th/8th-note arpeggiator across 4.0..46.2s."""
    canvas = np.zeros((n_samples, 2), dtype=np.float64)
    for start_s, dur_s, _, _, arp_m in _chord_progression()[1:]:
        _add_chord_arp(canvas, start_s, dur_s, arp_m, sr)
    return butter_filter(canvas, 260.0, sr, "highpass", 2)


def _lead_notes():
    """Return expressive D-minor counter-melody notes for 30.0..42.0s Apex."""
    return [
        (30.00, 0.72, 81), (30.75, 0.24, 79), (31.00, 0.48, 77), (31.50, 0.48, 76),
        (32.00, 0.95, 74), (33.00, 0.48, 77), (33.50, 0.48, 79),
        (34.00, 0.72, 81), (34.75, 0.24, 84), (35.00, 0.95, 79),
        (36.00, 0.72, 81), (36.75, 0.24, 82), (37.00, 0.48, 84), (37.50, 0.48, 81),
        (38.00, 0.72, 86), (38.75, 0.24, 84), (39.00, 0.95, 82),
        (40.00, 0.72, 84), (40.75, 0.24, 81), (41.00, 0.48, 79), (41.50, 0.48, 76),
        (42.00, 1.80, 74),
    ]


def _make_lead_note(midi, dur_s, sr=SR):
    """Synthesize warm soaring counter-melody lead note with vibrato."""
    n = int(round((dur_s + 0.18) * sr))
    t = np.arange(n) / float(sr)
    vib = 1.0 + 0.0035 * np.sin(2.0 * np.pi * 5.4 * t) * np.clip((t - 0.12) / 0.15, 0.0, 1.0)
    f0 = midi_to_hz(midi) * vib
    w1 = polyblep_saw(phase_from_freq(f0 * 0.997, sr), f0, sr)
    w2 = polyblep_saw(phase_from_freq(f0 * 1.003, sr), f0, sr)
    sine = np.sin(2.0 * np.pi * phase_from_freq(f0, sr)) * 0.45
    tone = butter_filter(w1 + w2 + sine, 3800.0, sr, "lowpass", 3)
    env = make_adsr(n, sr, 0.035, 0.12, 0.78, 0.22)
    return stereo_pan(tone * env * 0.34, 0.06)


def synth_lead_track(n_samples=N_SAMPLES, sr=SR):
    """Render soaring counter-melody Lead Synth across 30.0..43.8s."""
    canvas = np.zeros((n_samples, 2), dtype=np.float64)
    for start_s, dur_s, midi in _lead_notes():
        amp = 0.65 if start_s >= 42.0 else 1.0
        place_stereo(canvas, _make_lead_note(midi, dur_s, sr) * amp, start_s, sr)
    return butter_filter(canvas, 240.0, sr, "highpass", 2)


def synth_riser_track(n_samples=N_SAMPLES, sr=SR):
    """Render 0.0..3.76s rising cyber sweep stopping cleanly for half-beat vacuum."""
    rng = np.random.default_rng(77)
    canvas = np.zeros((n_samples, 2), dtype=np.float64)
    n = int(3.76 * sr)
    t = np.arange(n) / float(sr)
    prog = t / 3.76
    noise = butter_filter(rng.standard_normal((n, 2)), 300.0, sr, "highpass", 2)
    swept = morph_lowpass(noise, [350.0, 1100.0, 3200.0, 8800.0], prog ** 1.4, sr)
    freq = 110.0 * (2.0 ** (3.8 * prog))
    tone = np.sin(2.0 * np.pi * phase_from_freq(freq, sr)) * 0.30
    env = (prog ** 1.5) * np.minimum(1.0, (3.76 - t) / 0.025)
    place_stereo(canvas, (swept * 0.38 + np.column_stack((tone, tone))) * env[:, None], 0.0, sr)
    return canvas
