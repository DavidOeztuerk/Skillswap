/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_AUTH_COOKIE_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
