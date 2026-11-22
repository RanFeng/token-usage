"""Master soundtrack & SFX assembly, normalization, and verification script."""

import os
import subprocess
import numpy as np
from scipy.io import wavfile

from sfx_engine import build_sfx_track
from synth_core import (
    N_SAMPLES,
    SR,
    butter_filter,
    ping_pong_delay,
    sidechain_env,
    stereo_reverb,
    synth_arp_track,
    synth_kick_track,
    synth_lead_track,
    synth_pad_track,
    synth_percussion_track,
    synth_riser_track,
    synth_sub_and_bass_track,
)

FFMPEG_BIN = "/opt/homebrew/bin/ffmpeg"
FFPROBE_BIN = "/opt/homebrew/bin/ffprobe"


def _vacuum_dip(n_samples=N_SAMPLES, sr=SR):
    """Carve dramatic half-beat pre-drop vacuum across 3.76..3.998s."""
    t = np.arange(n_samples) / float(sr)
    down = np.clip((3.780 - t) / 0.018, 0.0, 1.0)
    up = np.clip((t - 3.988) / 0.012, 0.0, 1.0)
    mask = np.where((t >= 3.762) & (t < 3.988), 0.04 + 0.96 * down, 1.0)
    mask = np.where((t >= 3.988) & (t < 4.000), 0.04 + 0.96 * up, mask)
    return mask[:, None]


def _outro_fade(n_samples=N_SAMPLES, sr=SR):
    """Apply smooth raised-cosine fade from 46.75s to complete silence at 47.92s."""
    t = np.arange(n_samples) / float(sr)
    prog = np.clip((t - 46.75) / 1.17, 0.0, 1.0)
    gain = 0.5 * (1.0 + np.cos(np.pi * prog))
    gain = np.where(t >= 47.92, 0.0, gain)
    return gain[:, None]


def build_music_bus(n_samples=N_SAMPLES, sr=SR):
    """Synthesize, sidechain, spatialize, and balance all musical stems."""
    sc_bass = sidechain_env(n_samples, sr, 4.0, 42.0, depth=0.68)
    sc_pad = sidechain_env(n_samples, sr, 4.0, 42.0, depth=0.50)
    kick = synth_kick_track(n_samples, sr) * 0.68
    perc = synth_percussion_track(n_samples, sr) * 0.62
    bass = synth_sub_and_bass_track(n_samples, sr) * sc_bass * 0.56
    pad = stereo_reverb(synth_pad_track(n_samples, sr) * sc_pad, sr, 2.4, 0.42, 11) * 0.72
    arp = ping_pong_delay(synth_arp_track(n_samples, sr), sr, 0.25, 0.375, 0.38, 0.28)
    arp = stereo_reverb(arp * sc_pad, sr, 2.0, 0.34, 22) * 0.66
    lead = ping_pong_delay(synth_lead_track(n_samples, sr), sr, 0.25, 0.375, 0.36, 0.28)
    lead = stereo_reverb(lead, sr, 1.9, 0.32, 33) * 0.62
    riser = synth_riser_track(n_samples, sr) * 0.48
    music = (kick + perc + bass + pad + arp + lead + riser) * _vacuum_dip(n_samples, sr)
    return music


def master_mix(music, sfx, n_samples=N_SAMPLES, sr=SR):
    """Combine music + SFX, clean frequency extremes, fade outro, and soft-clip."""
    combined = music + sfx * 0.86
    cleaned = butter_filter(combined, 26.0, sr, "highpass", 2)
    cleaned = butter_filter(cleaned, 19500.0, sr, "lowpass", 4)
    faded = cleaned * _outro_fade(n_samples, sr)
    limited = np.tanh(faded * 0.90) / 1.04
    return np.clip(np.round(limited * 32767.0), -32768, 32767).astype(np.int16)


def normalize_with_ffmpeg(raw_path, out_path):
    """Run FFmpeg EBU R128 loudness normalization to -14 LUFS / -1.0 dBTP."""
    cmd = [
        FFMPEG_BIN, "-y", "-i", raw_path,
        "-af", "loudnorm=I=-14:TP=-1.0:LRA=7",
        "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", out_path,
    ]
    subprocess.run(cmd, check=True)


def verify_output(out_path):
    """Inspect final WAV using ffprobe and ffmpeg volumedetect."""
    probe = subprocess.run(
        [FFPROBE_BIN, "-v", "error", "-show_entries",
         "stream=sample_rate,channels,duration,bits_per_sample",
         "-of", "default=noprint_wrappers=1", out_path],
        check=True, capture_output=True, text=True,
    )
    vol = subprocess.run(
        [FFMPEG_BIN, "-i", out_path, "-af", "volumedetect", "-f", "null", "-"],
        check=True, capture_output=True, text=True,
    )
    print("=== FFPROBE ===")
    print(probe.stdout.strip())
    print("=== VOLUMEDETECT ===")
    lines = [ln for ln in vol.stderr.splitlines() if "Parsed_volumedetect" in ln]
    print("\n".join(lines))


def main():
    """Generate soundtrack_raw.wav, normalize to soundtrack.wav, and verify."""
    promo_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    build_dir = os.path.join(promo_dir, "build")
    os.makedirs(build_dir, exist_ok=True)
    raw_path = os.path.join(build_dir, "soundtrack_raw.wav")
    out_path = os.path.join(build_dir, "soundtrack.wav")
    music = build_music_bus(N_SAMPLES, SR)
    sfx = build_sfx_track(N_SAMPLES, SR)
    pcm = master_mix(music, sfx, N_SAMPLES, SR)
    wavfile.write(raw_path, SR, pcm)
    normalize_with_ffmpeg(raw_path, out_path)
    verify_output(out_path)


if __name__ == "__main__":
    main()
