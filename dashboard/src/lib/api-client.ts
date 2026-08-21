export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

function baseUrl() {
  return process.env.API_URL ?? "http://localhost:4000/api/v1";
}

async function request<T>(
  method: Method,
  path: string,
  { token, body }: { token?: string | null; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = json?.error?.message ?? `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return json?.data as T;
}

export const apiClient = {
  get: <T>(path: string, token?: string | null) => request<T>("GET", path, { token }),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>("POST", path, { token, body }),
  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>("PATCH", path, { token, body }),
  delete: <T>(path: string, token?: string | null) => request<T>("DELETE", path, { token }),
};
