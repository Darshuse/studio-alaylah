import sys, numpy as np
from resemblyzer import VoiceEncoder, preprocess_wav

enc = VoiceEncoder()
ref = enc.embed_utterance(preprocess_wav(sys.argv[1]))  # عيّنة الأب الأصلية
for p in sys.argv[2:]:
    e = enc.embed_utterance(preprocess_wav(p))
    cos = float(np.dot(ref, e) / (np.linalg.norm(ref) * np.linalg.norm(e)))
    print(f"{p}: speaker_similarity={cos:.3f}  (~{cos*100:.0f}%)")
