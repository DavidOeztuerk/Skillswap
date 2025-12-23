/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_AUTH_COOKIE_NAME?: string;
  readonly VITE_WEBRTC_STUN_URLS?: string;
  readonly VITE_WEBRTC_TURN_URLS?: string;
  readonly VITE_WEBRTC_TURN_USERNAME?: string;
  readonly VITE_WEBRTC_TURN_CREDENTIAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
