import Router from "./router";

export interface SeamlessRouterOptions {
  /**
   * prefetch method can be either 'visible' or 'hover'
   * visible: prefetches all links that are currently visible on the page
   * hover: prefetches all links that are hovered over
   * undefined: no prefetching
   * @default undefined
   */
  prefetch?: "visible" | "hover";
  /**
   * if set value to false - page will be rerun scripts on the same url
   * @default true
   */
  ignoreSameUrl?: boolean;
}

export type SeamlessWindow = Window &
  typeof globalThis & { seamlessRouter: Router };
