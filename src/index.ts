import Router from "./router";
import { SeamlessRouterOptions, SeamlessWindow } from "./interfaces";

export default (opts?: SeamlessRouterOptions): Router => {
  const router = new Router(opts);

  console.log("🔥 seamlessRouter engaged");
  if (window) {
    const seamlessWindows = window as SeamlessWindow;
    seamlessWindows.seamlessRouter = router;
  }

  return router;
};
