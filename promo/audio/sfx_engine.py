"""Millisecond-aligned cinematic SFX engine for the 48s promo video."""

import numpy as np
from synth_core import (
    N_SAMPLES,
    SR,
    butter_filter,
    make_adsr,
    midi_to_hz,
    morph_lowpass,
    phase_from_freq,
    place_stereo,
    stereo_pan,
    stereo_reverb,
)


def _add_power_on(canvas, sr=SR):
    """Synthesize system power-on boot hum and startup chime at 0.00s."""
    n = int(0.85 * sr)
    t = np.arange(n) / float(sr)
    freq = 85.0 + 355.0 * (1.0 - np.exp(-t * 7.5))
    hum = np.sin(2.0 * np.pi * phase_from_freq(freq, sr)) * 0.28
    hum *= make_adsr(n, sr, 0.03, 0.12, 0.35, 0.35)
    place_stereo(canvas, np.column_stack((hum, hum)), 0.0, sr)
    chime_t = np.arange(int(0.65 * sr)) / float(sr)
    bell = (np.sin(2.0 * np.pi * 587.33 * chime_t) + 0.65 * np.sin(2.0 * np.pi * 880.0 * chime_t))
    bell *= np.exp(-chime_t * 6.5) * np.minimum(1.0, chime_t / 0.008) * 0.22
    place_stereo(canvas, np.column_stack((bell, bell)), 0.16, sr)


def _add_glitches(canvas, rng, sr=SR):
    """Add crisp subtle telemetry glitches at 0.30s, 0.80s, and 1.40s."""
    cues = ((0.30, -0.38, 2200.0), (0.80, 0.44, 3100.0), (1.40, -0.28, 2650.0))
    for t_s, pan, f_hz in cues:
        n = int(0.075 * sr)
        t = np.arange(n) / float(sr)
        gate = np.where(((t * 65.0).astype(int) % 2) == 0, 1.0, 0.2)
        tone = np.sin(2.0 * np.pi * (f_hz + 900.0 * np.sin(2.0 * np.pi * 55.0 * t)) * t)
        noise = butter_filter(rng.standard_normal(n), [1400.0, 6200.0], sr, "bandpass", 2)
        burst = (tone * 0.45 + noise * 0.55) * gate * np.exp(-t * 28.0) * 0.22
        place_stereo(canvas, stereo_pan(burst, pan), t_s, sr)


def _add_beat_drop_impact(canvas, rng, sr=SR):
    """Synthesize deep cinematic Impact and metallic Shimmer at 4.000s."""
    n_imp = int(1.35 * sr)
    t = np.arange(n_imp) / float(sr)
    sub_f = 29.0 + 96.0 * np.exp(-t * 14.0)
    sub = np.sin(2.0 * np.pi * phase_from_freq(sub_f, sr)) * np.exp(-t * 3.4) * 0.72
    boom_n = butter_filter(rng.standard_normal(n_imp), 420.0, sr, "lowpass", 3)
    boom = boom_n * np.exp(-t * 7.5) * 0.40
    impact = np.tanh((sub + boom) * 1.15)
    place_stereo(canvas, np.column_stack((impact, impact)), 4.00, sr)
    _add_metal_shimmer(canvas, rng, 4.00, sr)


def _add_metal_shimmer(canvas, rng, t_s, sr=SR):
    """Layer crystalline metallic stereo shimmer wash at beat drop."""
    n = int(1.85 * sr)
    t = np.arange(n) / float(sr)
    freqs = (587.33, 880.0, 1318.51, 1396.91, 1760.0)
    shimmer = np.zeros((n, 2))
    for idx, f_hz in enumerate(freqs):
        wave = np.sin(2.0 * np.pi * f_hz * t) * np.exp(-t * (1.9 + 0.32 * idx))
        pan = -0.6 + 0.3 * idx
        shimmer += stereo_pan(wave * 0.12, pan)
    air = butter_filter(rng.standard_normal((n, 2)), [3200.0, 9600.0], sr, "bandpass", 2)
    shimmer += air * np.exp(-t * 3.5)[:, None] * 0.18
    shimmer *= np.minimum(1.0, t / 0.012)[:, None]
    place_stereo(canvas, shimmer, t_s, sr)


def _make_whoosh_one(rng, pan_dir, sr=SR):
    """Build single 0.50s stereo airy whoosh peaking at +0.22s."""
    n = int(0.50 * sr)
    t = np.arange(n) / float(sr)
    peak = 0.22
    env = np.where(t < peak, (t / peak) ** 2.1, np.exp(-(t - peak) * 10.5))
    noise = butter_filter(rng.standard_normal((n, 2)), 260.0, sr, "highpass", 2)
    swept = morph_lowpass(noise, [360.0, 1200.0, 3200.0, 6400.0], env, sr)
    pan = np.linspace(-0.72 * pan_dir, 0.72 * pan_dir, n)
    stereo_w = np.column_stack((1.0 - 0.45 * pan, 1.0 + 0.45 * pan))
    return swept * env[:, None] * stereo_w * 0.42


def _add_whooshes(canvas, rng, sr=SR):
    """Place stereo airy transition whooshes peaking at exact scene cuts."""
    cuts = (6.00, 14.00, 22.00, 30.00, 36.00, 42.00)
    for idx, t_cut in enumerate(cuts):
        pan_dir = -1.0 if idx % 2 else 1.0
        place_stereo(canvas, _make_whoosh_one(rng, pan_dir, sr), t_cut - 0.22, sr)


def _add_compact_pulse(canvas, sr=SR):
    """Synthesize Compact compression chirp + pulse confirmation at 10.50s."""
    n_zip = int(0.11 * sr)
    tz = np.arange(n_zip) / float(sr)
    f_zip = 1500.0 * np.exp(-tz * 15.0)
    zip_w = np.sin(2.0 * np.pi * phase_from_freq(f_zip, sr)) * make_adsr(n_zip, sr, 0.004, 0.05, 0.4, 0.03)
    place_stereo(canvas, stereo_pan(zip_w * 0.42, -0.22), 10.50, sr)
    for offset, f_hz, pan in ((0.09, 698.46, 0.18), (0.17, 1046.50, 0.26)):
        n_p = int(0.28 * sr)
        tp = np.arange(n_p) / float(sr)
        tone = (np.sin(2.0 * np.pi * f_hz * tp) + 0.3 * np.sin(4.0 * np.pi * f_hz * tp))
        tone *= np.exp(-tp * 9.5) * np.minimum(1.0, tp / 0.004) * 0.40
        place_stereo(canvas, stereo_pan(tone, pan), 10.50 + offset, sr)


def _add_roi_golden_chord(canvas, sr=SR):
    """Synthesize warm luminous Fmaj9 golden harvest chime at 18.00s."""
    notes = (65, 69, 72, 76, 79)
    for idx, midi in enumerate(notes):
        n = int(1.65 * sr)
        t = np.arange(n) / float(sr)
        f0 = midi_to_hz(midi)
        bell = np.sin(2.0 * np.pi * f0 * t) + 0.20 * np.sin(2.0 * np.pi * (2.0 * f0) * t)
        bell *= np.exp(-t * (2.3 + 0.24 * idx)) * np.minimum(1.0, t / 0.015) * 0.24
        pan = -0.45 + 0.225 * idx
        place_stereo(canvas, stereo_pan(bell, pan), 18.00 + idx * 0.032, sr)


def _add_dlp_laser_and_locks(canvas, rng, sr=SR):
    """Synthesize 25.0..28.2s DLP laser scan sweep and 3 lock chimes."""
    n = int(3.05 * sr)
    t = np.arange(n) / float(sr)
    sweep_f = 420.0 + 360.0 * np.sin(2.0 * np.pi * 0.55 * t)
    beam = np.sin(2.0 * np.pi * phase_from_freq(sweep_f, sr)) * 0.11
    beam += np.sin(2.0 * np.pi * phase_from_freq(sweep_f * 2.01, sr)) * 0.05
    hiss = butter_filter(rng.standard_normal(n), [1800.0, 5000.0], sr, "bandpass", 2) * 0.11
    env = make_adsr(n, sr, 0.12, 0.2, 0.85, 0.25)
    pan_l = np.sin(2.0 * np.pi * 0.45 * t) * 0.55
    stereo = np.column_stack(((beam + hiss) * (1.0 - pan_l), (beam + hiss) * (1.0 + pan_l))) * env[:, None]
    place_stereo(canvas, stereo, 25.00, sr)
    _add_lock_chimes(canvas, sr)


def _add_lock_chimes(canvas, sr=SR):
    """Add 3 crisp data-lock chimes aligned with DLP redaction capsules."""
    locks = ((25.85, 880.0, 1318.51, 0.15), (26.85, 1046.50, 1567.98, 0.28), (27.95, 1174.66, 1760.0, 0.40))
    for t_s, f1, f2, pan in locks:
        n = int(0.32 * sr)
        t = np.arange(n) / float(sr)
        c1 = np.sin(2.0 * np.pi * f1 * t) * np.exp(-t * 15.0)
        c2 = np.sin(2.0 * np.pi * f2 * np.maximum(0.0, t - 0.045)) * np.exp(-np.maximum(0.0, t - 0.045) * 13.0)
        tone = (c1 + np.where(t >= 0.045, c2, 0.0)) * np.minimum(1.0, t / 0.003) * 0.40
        place_stereo(canvas, stereo_pan(tone, pan), t_s, sr)


def _add_sonar_pings(canvas, sr=SR):
    """Synthesize 4 clear stereo-panned radar sonar pings across 31.5..35.0s."""
    pings = ((31.50, 880.0, -0.68), (32.65, 1046.50, 0.55), (33.80, 1174.66, 0.72), (34.95, 1396.91, -0.52))
    for t_s, f_hz, pan in pings:
        n = int(1.05 * sr)
        t = np.arange(n) / float(sr)
        core = np.sin(2.0 * np.pi * f_hz * t) + 0.18 * np.sin(4.0 * np.pi * f_hz * t)
        tap = np.sin(2.0 * np.pi * (f_hz * 1.5) * t) * np.exp(-t * 220.0) * 0.35
        ping = (core * np.exp(-t * 4.2) + tap) * np.minimum(1.0, t / 0.003) * 0.40
        place_stereo(canvas, stereo_pan(ping, pan), t_s, sr)


def _add_typing_and_pops(canvas, rng, sr=SR):
    """Synthesize tactile mechanical typing and UI table pops across 37.0..41.0s."""
    for idx in range(18):
        t_s = 37.02 + idx * 0.095 + rng.uniform(-0.012, 0.012)
        n = int(0.036 * sr)
        t = np.arange(n) / float(sr)
        thock = np.sin(2.0 * np.pi * rng.uniform(195.0, 255.0) * t) * np.exp(-t * 135.0)
        switch = butter_filter(rng.standard_normal(n), [2400.0, 5400.0], sr, "bandpass", 2) * np.exp(-t * 175.0)
        key = (thock * 0.58 + switch * 0.42) * 0.48
        place_stereo(canvas, stereo_pan(key, rng.uniform(0.24, 0.50)), t_s, sr)
    _add_table_pops(canvas, sr)


def _add_table_pops(canvas, sr=SR):
    """Add 5 gentle ascending UI table item pop chimes across 39.15..40.75s."""
    pops = ((39.15, 587.33), (39.55, 698.46), (39.95, 783.99), (40.35, 880.0), (40.75, 1046.50))
    for idx, (t_s, f_hz) in enumerate(pops):
        n = int(0.22 * sr)
        t = np.arange(n) / float(sr)
        glide = f_hz * (1.0 - 0.18 * np.exp(-t * 120.0))
        pop = np.sin(2.0 * np.pi * phase_from_freq(glide, sr)) * np.exp(-t * 15.0) * 0.42
        place_stereo(canvas, stereo_pan(pop, 0.25 + 0.06 * idx), t_s, sr)


def build_sfx_track(n_samples=N_SAMPLES, sr=SR):
    """Render and reverb-polish all millisecond-aligned cinematic SFX."""
    rng = np.random.default_rng(2026)
    dry = np.zeros((n_samples, 2), dtype=np.float64)
    wet_bus = np.zeros((n_samples, 2), dtype=np.float64)
    _add_power_on(dry, sr)
    _add_glitches(dry, rng, sr)
    _add_beat_drop_impact(dry, rng, sr)
    _add_whooshes(wet_bus, rng, sr)
    _add_compact_pulse(wet_bus, sr)
    _add_roi_golden_chord(wet_bus, sr)
    _add_dlp_laser_and_locks(wet_bus, rng, sr)
    _add_sonar_pings(wet_bus, sr)
    _add_typing_and_pops(dry, rng, sr)
    wet_polished = stereo_reverb(wet_bus, sr, decay_s=1.45, wet=0.28, seed=99)
    return butter_filter(dry + wet_polished, 28.0, sr, "highpass", 2)
