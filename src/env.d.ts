/** Values that `vite.config.ts` puts into `import.meta.env`. */
interface ImportMetaEnv {
  /** Every app of the project and where it lives: for the strip that links the apps. */
  readonly APP_LINKS: ReadonlyArray<{ id: string; title: string; href: string }>
}
