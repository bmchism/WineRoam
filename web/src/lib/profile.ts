// User profile extras (display name override, phone for notifications, favorite
// wine). Stored per-user locally; phone opts into SMS notifications.
export interface Profile {
  displayName: string;
  phone: string;
  notify: boolean;
  favorite: string;
}

const key = (uid: string) => `wine.profile.${uid}`;
const EMPTY: Profile = { displayName: "", phone: "", notify: false, favorite: "" };

export function loadProfile(uid: string): Profile {
  try {
    const raw = localStorage.getItem(key(uid));
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function saveProfile(uid: string, p: Profile) {
  localStorage.setItem(key(uid), JSON.stringify(p));
}
