import sys, numpy as np, cv2
from insightface.app import FaceAnalysis

app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
app.prepare(ctx_id=-1, det_size=(640, 640))

def emb(path):
    img = cv2.imread(path)
    if img is None:
        return None, "cannot read"
    faces = app.get(img)
    if not faces:
        return None, "no face detected"
    f = max(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]))
    return f.normed_embedding, None

ref = sys.argv[1]
e_ref, err = emb(ref)
if e_ref is None:
    print(f"REF ERROR ({ref}): {err}"); sys.exit(1)

for p in sys.argv[2:]:
    e, err = emb(p)
    if e is None:
        print(f"{p}: {err}")
        continue
    cos = float(np.dot(e_ref, e))
    print(f"{p}: cosine={cos:.3f}  (~{max(0,cos)*100:.0f}%)")
