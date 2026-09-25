// عميل الـAPI + تخزين التوكن (متصل بالباك عبر إعادة توجيه /api في next.config)
const TOKEN_KEY = "ft_token";
const FAMILY_KEY = "ft_family";
const NAME_KEY = "ft_name";

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function getDisplayName(): string | null {
  try { return localStorage.getItem(NAME_KEY); } catch { return null; }
}
export function setSession(token: string, familyId?: string, displayName?: string | null) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (familyId) localStorage.setItem(FAMILY_KEY, familyId);
    if (displayName) localStorage.setItem(NAME_KEY, displayName);
  } catch {}
}
export function clearSession() {
  try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(FAMILY_KEY); localStorage.removeItem(NAME_KEY); } catch {}
}

async function req(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const res = await fetch("/api/v1" + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = "خطأ (" + res.status + ")";
    try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("json") ? res.json() : res.text();
}

export type Story = { id: string; title: string | null; displayTitle?: string | null; status: string; sourceKind: string; textApproved: boolean; text?: string | null; createdAt: string | null; hasFilm?: boolean; coverUrl?: string | null };
export type AuthResponse = { token: string; userId: string; displayName: string | null; familyId: string };
export type Me = { userId: string; email: string; displayName: string | null; familyId: string | null; plan?: string; storyCredits?: number };
export type Entitlement = { plan: string; storyCredits: number };
export type Sku = { id: string; provider: string; currency: string; amount: number; credits: number; label: string };
export type Catalog = { items: Sku[]; instapayReady: boolean; instapayHandle: string; instapayName: string; cardsReady: boolean };
export type Payment = { id: string; provider: string; sku: string; credits: number; amount: number; currency: string; status: string; ref: string | null; createdAt: string | null };

export const api = {
  register: (b: { email: string; password: string; displayName?: string }): Promise<AuthResponse> =>
    req("/auth/register", { method: "POST", body: JSON.stringify(b) }),
  login: (b: { email: string; password: string }): Promise<AuthResponse> =>
    req("/auth/login", { method: "POST", body: JSON.stringify(b) }),
  me: (): Promise<Me> => req("/me"),
  entitlement: (): Promise<Entitlement> => req("/billing/entitlement"),
  redeem: (credits: number): Promise<Entitlement> =>
    req("/billing/redeem", { method: "POST", body: JSON.stringify({ credits }) }),
  catalog: (): Promise<Catalog> => req("/billing/catalog"),
  myPayments: (): Promise<Payment[]> => req("/billing/payments"),
  payInstapay: (sku: string, reference: string): Promise<Payment> =>
    req("/billing/manual/instapay", { method: "POST", body: JSON.stringify({ sku, reference }) }),
  checkout: (sku: string): Promise<{ url: string }> =>
    req("/billing/checkout", { method: "POST", body: JSON.stringify({ sku }) }),
  adminPending: (token: string): Promise<Payment[]> => req("/billing/admin/pending", { headers: { "X-Admin-Token": token } }),
  adminDecide: (token: string, id: string, action: "approve" | "reject"): Promise<{ applied: boolean }> =>
    req("/billing/admin/" + id + "/" + action, { method: "POST", headers: { "X-Admin-Token": token } }),
  subscribe: (): Promise<Entitlement> => req("/billing/subscribe", { method: "POST" }),
  createStory: (b: { title?: string | null; sourceKind: string }): Promise<Story> =>
    req("/stories", { method: "POST", body: JSON.stringify(b) }),
  listStories: (): Promise<Story[]> => req("/stories"),
  getStory: (id: string): Promise<Story> => req("/stories/" + id),
  saveText: (id: string, body: string): Promise<Story> =>
    req("/stories/" + id + "/text", { method: "POST", body: JSON.stringify({ body }) }),
  setTitle: (id: string, title: string): Promise<Story> =>
    req("/stories/" + id + "/title", { method: "POST", body: JSON.stringify({ title }) }),
  approveText: (id: string): Promise<Story> =>
    req("/stories/" + id + "/approve-text", { method: "POST" }),
  requestAudioUpload: (storyId: string, contentType: string): Promise<UploadTicket> =>
    req("/stories/" + storyId + "/audio", { method: "POST", body: JSON.stringify({ contentType }) }),
  generateScenes: (storyId: string, sceneCount = 4): Promise<Job> =>
    req("/stories/" + storyId + "/scenes/generate", { method: "POST", body: JSON.stringify({ sceneCount }) }),
  getJob: (jobId: string): Promise<Job> => req("/jobs/" + jobId),
  getScenes: (storyId: string): Promise<Scene[]> => req("/stories/" + storyId + "/scenes"),
  getFilm: (storyId: string): Promise<Film> => req("/stories/" + storyId + "/film"),
  getBook: (storyId: string): Promise<Book> => req("/stories/" + storyId + "/book"),
  listCharacters: (): Promise<Character[]> => req("/characters"),
  createCharacter: (b: { displayName: string; ageLabel?: string }): Promise<Character> =>
    req("/characters", { method: "POST", body: JSON.stringify(b) }),
  deleteCharacter: (id: string): Promise<string> => req("/characters/" + id, { method: "DELETE" }),
  requestPhotoUpload: (characterId: string, contentType: string): Promise<PhotoTicket> =>
    req("/characters/" + characterId + "/photo", { method: "POST", body: JSON.stringify({ contentType }) }),
  generateAvatar: (characterId: string): Promise<AvatarResult> =>
    req("/characters/" + characterId + "/avatar", { method: "POST" }),
  requestVoiceUpload: (characterId: string, contentType: string): Promise<PhotoTicket> =>
    req("/characters/" + characterId + "/voice", { method: "POST", body: JSON.stringify({ contentType }) }),
  cloneVoice: (characterId: string): Promise<VoiceResult> =>
    req("/characters/" + characterId + "/voice/clone", { method: "POST" }),
};

export type UploadTicket = { assetId: string; key: string; uploadUrl: string; getUrl: string };
export type PhotoTicket = { key: string; uploadUrl: string };
export type AvatarResult = { avatarUrl: string | null; identityReady: boolean };
export type VoiceResult = { voiceReady: boolean };
export type Job = { id: string; kind: string; status: string; progress: number; error: string | null };
export type Scene = { id: string; order: number; title: string; caption: string; imageUrl: string | null };
export type Film = { videoUrl: string | null; ready: boolean };
export type Book = { pdfUrl: string | null; ready: boolean };
export type Character = { id: string; displayName: string; ageLabel: string | null; identityReady: boolean;
  hasPhoto?: boolean; avatarUrl?: string | null; voiceReady?: boolean };

/** يرفع صورة الطفل مباشرة للتخزين عبر الرابط الموقّع، ثم يطلب توليد الأفاتار الكرتوني. */
export async function uploadChildPhoto(characterId: string, file: Blob): Promise<AvatarResult> {
  const contentType = file.type || "image/jpeg";
  const ticket = await api.requestPhotoUpload(characterId, contentType);
  const res = await fetch(ticket.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
  if (!res.ok) throw new Error("فشل رفع الصورة (" + res.status + ")");
  return api.generateAvatar(characterId);
}

/** يرفع عيّنة صوت الأب لبطاقته ثم يستنسخها (نسخة دائمة تُسرد بها كل القصص). */
export async function enrollParentVoice(characterId: string, blob: Blob): Promise<VoiceResult> {
  const contentType = blob.type || "audio/webm";
  const ticket = await api.requestVoiceUpload(characterId, contentType);
  const res = await fetch(ticket.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
  if (!res.ok) throw new Error("فشل رفع الصوت (" + res.status + ")");
  return api.cloneVoice(characterId);
}

/** يسجّل ويرفع الصوت مباشرة للتخزين عبر الرابط الموقّع (لا يمر عبر الـAPI). */
export async function uploadAudioBlob(storyId: string, blob: Blob): Promise<UploadTicket> {
  const contentType = blob.type || "audio/webm";
  const ticket = await api.requestAudioUpload(storyId, contentType);
  const res = await fetch(ticket.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
  if (!res.ok) throw new Error("فشل رفع الصوت (" + res.status + ")");
  return ticket;
}
