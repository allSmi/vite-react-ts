/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AAA: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ProcessInterface {
  env: {
    FOO: number,
    BAR: string
  }
}

declare const process: ProcessInterface

declare const __DEV__: string
