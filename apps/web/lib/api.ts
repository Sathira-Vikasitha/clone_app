export const API_URL = "http://localhost:4000/api";

export async function apiFetch(path: string, options?: RequestInit) {
  const isFormData = options?.body instanceof FormData;

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options?.headers || {}),
    },
    credentials: "include",
  });
}
