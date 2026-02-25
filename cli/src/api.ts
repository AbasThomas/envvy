import axios from "axios";

import { readGlobalConfig } from "./config.js";

export function createApiClient() {
  const config = readGlobalConfig();
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: 20_000,
    headers: config.token
      ? {
          Authorization: `Bearer ${config.token}`,
        }
      : undefined,
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (!axios.isAxiosError(error)) {
        return Promise.reject(error);
      }

      const status = error.response?.status;
      const serverError = error.response?.data as { error?: string } | undefined;
      if (status === 401) {
        const detail = serverError?.error ?? "Unauthorized";
        const isLoginEndpoint = String(error.config?.url ?? "").includes("/api/cli/login");
        const message = isLoginEndpoint
          ? detail
          : `${detail}. Run \`envii login\` again to refresh your token.`;
        return Promise.reject(
          new Error(message),
        );
      }

      return Promise.reject(error);
    },
  );

  return client;
}
