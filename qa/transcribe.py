import sys
from faster_whisper import WhisperModel

model = WhisperModel(sys.argv[2] if len(sys.argv) > 2 else "small", device="cpu", compute_type="int8")
segments, info = model.transcribe(sys.argv[1], language="ar", beam_size=5)
text = " ".join(s.text.strip() for s in segments)
print("TRANSCRIPT:", text)
