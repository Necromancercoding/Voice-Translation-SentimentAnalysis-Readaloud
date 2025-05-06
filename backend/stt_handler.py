import os
import subprocess
import tempfile
import whisper

# Load once at module import
_model = whisper.load_model("small")

def _convert_to_wav(input_path: str) -> str:
    """
    Use ffmpeg to convert input audio into a 16 kHz mono WAV file.
    Returns the path to the temp WAV.
    """
    # Create a temp file; ffmpeg will write into it
    tmp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_wav_path = tmp_wav.name
    tmp_wav.close()

    # ffmpeg command:
    cmd = [
        "ffmpeg",
        "-y",                # overwrite if exists
        "-i", input_path,    # input file
        "-ar", "16000",      # sample rate 16 kHz
        "-ac", "1",          # mono
        "-c:a", "pcm_s16le", # 16-bit PCM
        tmp_wav_path
    ]

    # Run quietly
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return tmp_wav_path

def transcribe_and_detect(audio_path: str, input_lang: str = "auto"):
    """
    Returns (transcript, detected_language).
    If input_lang != "auto", forces Whisper to use that language.
    On any error, returns ("", fallback_lang).
    """
    wav_path = None
    try:
        # 1. Convert to WAV for reliable decoding
        wav_path = _convert_to_wav(audio_path)

        # 2. Transcribe
        if input_lang != "auto":
            result = _model.transcribe(wav_path, language=input_lang)
            detected = input_lang
        else:
            result = _model.transcribe(wav_path)
            detected = result.get("language", "en")

        transcript = result.get("text", "").strip()
    except Exception as e:
        # Log the error and continue
        print(f"[stt_handler] WARNING: Whisper transcription failed: {e}")
        transcript = ""
        detected = input_lang if input_lang != "auto" else "en"
    finally:
        # 3. Clean up temp WAV
        if wav_path and os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except OSError:
                pass

    return transcript, detected
