
const ACCESS_TOKEN_KEY = "krown_admin_access_token";

export function setToken(accessToken: string) {
    if (typeof window !== "undefined") {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
}

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearToken(){
  if (typeof window !== "undefined") {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
}
