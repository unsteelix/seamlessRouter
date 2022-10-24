import { SeamlessRouterOptions } from "./interfaces";

const defaultOpts = {
  prefetch: undefined,
  ignoreSameUrl: true,
};

class Router {
  public enabled = true;

  constructor(public opts?: SeamlessRouterOptions) {
    this.opts = { ...defaultOpts, ...(opts ?? {}) };

    if (window?.history) {
      document.addEventListener("click", (e) => this.onCustomClick(e));
      window.addEventListener("popstate", (e) => this.onCustomPop(e));

      window.onload = () => {
        if (opts?.prefetch === "visible") {
          observeAndPrefetch();
        } else if (opts?.prefetch === "hover") {
        }
      };
    } else {
      console.warn("seamless router is not supported in this browser");
      this.enabled = false;
    }
  }

  private async onCustomClick(e: MouseEvent) {
    const target: HTMLInputElement = e.target as HTMLInputElement;

    if (target?.nodeName === "A") {
      const { pathname, host } = <any>target;

      // console.log(
      //   `origin: ${origin}`,
      //   `nodeName: ${nodeName}`,
      //   `href: ${href}`,
      //   `pathname: ${pathname}`,
      //   `host: ${host}`
      // );

      // local link
      if (window.location.host === host) {
        e.preventDefault();

        if (window.location.pathname === pathname && this.opts?.ignoreSameUrl) {
          console.log(
            `=> ${pathname} don\`t go, because of ignoring same path`
          );
          return;
        }

        console.log(`=> ${pathname}`);

        // fetch new page
        const html = await fetchPage(pathname);

        // dom
        let ndp = new DOMParser();
        let nDoc = ndp.parseFromString(html, "text/html");

        const head = nDoc.getElementsByTagName("head")[0];
        const body = nDoc.getElementsByTagName("body")[0];

        const oldHead = document.getElementsByTagName("head")[0];

        // change URL
        window.history.pushState({}, "", pathname);
        document.body.replaceWith(body);

        replaceBody(body);
        mergeHeads(oldHead, head);

        // prefetch
        if (this.opts?.prefetch === "visible") {
          observeAndPrefetch();
        } else if (this.opts?.prefetch === "hover") {
        }
      } else {
        // external link
        if (!confirm("a you shure go to external site?")) {
          e.preventDefault();
        }
      }
    }
  }

  private async onCustomPop(e: PopStateEvent): Promise<void> {
    console.log("onCustomPop EVENT", e);
  }
}

/**
 * return 3 arrays:
 * old - nodes, that needs remove
 * new - nodes, that needs add
 * common - nodes, that stay untouchable
 */
export const getOldNewNodes = (oldHead: HTMLElement, newHead: HTMLElement) => {
  const oldNodes = oldHead.children;
  const newNodes = newHead.children;

  const listOld: Array<Element> = [];
  const listNew: Array<Element> = [];
  const listCommon: Array<Element> = [];

  // search old and common nodes
  for (let i = 0; i < oldNodes.length; i++) {
    let oldNode = oldNodes[i];
    let isCommon = false;

    for (let j = 0; j < newNodes.length; j++) {
      let newNode = newNodes[j];
      if (oldNode.isEqualNode(newNode)) {
        isCommon = true;
      }
    }

    if (isCommon) {
      listCommon.push(oldNode);
    } else {
      listOld.push(oldNode);
    }
  }

  // search new nodes
  for (let i = 0; i < newNodes.length; i++) {
    let newNode = newNodes[i];
    let isCommon = false;

    for (let j = 0; j < oldNodes.length; j++) {
      let oldNode = oldNodes[j];
      if (newNode.isEqualNode(oldNode)) {
        isCommon = true;
      }
    }

    if (!isCommon) {
      listNew.push(newNode);
    }
  }

  return [listOld, listNew, listCommon];
};

/**
 * return html
 */
export const fetchPage = async (path: string): Promise<string> => {
  const res = await fetch(path);
  if (res.ok) {
    return await res.text();
  }
  console.warn("Error fetching new page: " + res.status, res.text);
  //throw new Error(res.text);
  return "";
};

/**
 * leave the same nodes
 * remove old nodes
 * add new nodes
 *
 * @param oldHead - dom el
 * @param newHead - dom el
 */
export const mergeHeads = (oldHead: any, newHead: any) => {
  const [oldNodes, newNodes, commonNodes] = getOldNewNodes(oldHead, newHead);

  // console.log("oldNodes", oldNodes);
  // console.log("newNodes", newNodes);
  // console.log("commonNodes", commonNodes);

  // clean from old nodes
  oldNodes.forEach((el: any) => {
    if ("dataset" in el && el.dataset["router"] !== "prefetch") {
      el.remove();
    }
  });

  // rerun scripts with data-router="reload"
  commonNodes.forEach((el: any) => {
    if (el.nodeName === "SCRIPT" && el.dataset["router"] === "reload") {
      el.remove();
      const headEl = document.createElement(el.nodeName);
      Array.prototype.forEach.call(el.attributes, (attr) => {
        const { name, value } = attr;
        headEl.setAttribute(name, value);
      });
      oldHead.appendChild(headEl);
      console.log(`rerun ${el.src}`);
    }
  });

  // add new nodes
  newNodes.forEach((el) => {
    const headEl = document.createElement(el.nodeName);
    Array.prototype.forEach.call(el.attributes, (attr) => {
      const { name, value } = attr;
      headEl.setAttribute(name, value);
    });
    oldHead.appendChild(headEl);
  });
};

export function replaceBody(newBody: Document["body"]): void {
  const nodesToPreserve = document.body.querySelectorAll(
    "[seamless-router-preserve]"
  );
  nodesToPreserve.forEach((oldDocElement) => {
    let nextDocElement = newBody.querySelector(
      '[seamless-router-preserve][id="' + oldDocElement.id + '"]'
    );
    if (nextDocElement) {
      const clone = oldDocElement.cloneNode(true);
      nextDocElement.replaceWith(clone);
    }
  });

  document.body.replaceWith(newBody);

  // Run scripts in body
  const bodyScripts = document.body.querySelectorAll("script");
  bodyScripts.forEach((el) => {
    reRunScript(el);
  });
}

const observeAndPrefetch = () => {
  let options = {
    root: null,
    rootMargin: "0px",
    threshold: 1.0,
  };

  const intersectionCallback = (entries: any[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        let elem = entry.target;

        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = elem.href;
        link.dataset["router"] = "prefetch";

        // check duplicate and insert
        let haveDuplicate = false;
        Array.from(
          document.querySelectorAll(
            `head link[data-router="prefetch"][href="${elem.href}"]`
          )
        ).forEach((el) => {
          if (el.isEqualNode(link)) {
            haveDuplicate = true;
          }
        });
        // add only new links
        if (!haveDuplicate) {
          document.head.append(link);
          console.log("prefetch: " + link.href);
        }
      }
    });
  };

  let observer = new IntersectionObserver(intersectionCallback, options);

  let targets: any = Array.from(document.querySelectorAll("body a"));

  targets.forEach((target: HTMLAnchorElement) => {
    if (isLocalUrl(target.href)) {
      observer.observe(target);
    } else {
      console.log("NOT prefetch: " + target.href);
    }
  });
};

// return true if url on this site, NOT on external site
export const isLocalUrl = (url: string) => {
  if (!url.includes("//") && !url.includes("http")) {
    return true;
  }

  let urlObj = new URL(url);

  if (window.location.host === urlObj.host) {
    return true;
  }
  return false;
};

export const reRunScript = (oldScript: HTMLScriptElement): void => {
  const newScript = document.createElement("script");
  const attrs = Array.from(oldScript.attributes);
  for (const { name, value } of attrs) {
    newScript[name] = value;
  }
  newScript.append(oldScript.textContent);
  oldScript.replaceWith(newScript);
};

export default Router;
