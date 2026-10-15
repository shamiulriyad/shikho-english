/// <reference types="vite/client" />

// Only VITE_* variables reach the browser bundle. Never put secrets here.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Homepage walkthrough video; see .env.example */
  readonly VITE_DEMO_VIDEO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
