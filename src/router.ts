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
    } else {
      console.warn("seamless router is not supported in this browser");
      this.enabled = false;
    }
  }

  private async onCustomClick(e: MouseEvent) {
    const target: HTMLInputElement = e.target as HTMLInputElement;

    if (target?.nodeName === "A") {
      const { baseURI, origin, nodeName, href, pathname, host } = <any>target;

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
          console.log(`=> ${pathname} don\`t go, because ignore same path`);
          return;
        }

        console.log(`=> ${pathname}`);

        // fetch new page
        fetchPage(pathname);

        const html = await fetchPage(pathname);

        // dom
        let ndp = new DOMParser();
        let nDoc = ndp.parseFromString(html, "text/html");

        const head = nDoc.getElementsByTagName("head")[0];
        const body = nDoc.getElementsByTagName("body")[0];

        const oldHead = document.getElementsByTagName("head")[0];

        // console.log("head", head);
        // console.log("body", body);

        //const dom: any = new JSDOM(html);
        //console.log("dom:", dom);

        document.body.replaceWith(body);

        //console.log("newPage:", html);

        // change URL
        window.history.pushState({}, "", pathname);
        //document.head.replaceWith(mergedHead);

        mergeHeads(oldHead, head);
      } else {
        // external link
        if (!confirm("a you shure go to external siet?")) {
          e.preventDefault();
        }
      }
    }
  }

  private onCustomPop(e: PopStateEvent): void {
    console.log("onCustomPop EVENT", e);
  }
}

export default Router;

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
  throw new Error(res.text);
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
  oldNodes.forEach((el) => el.remove());

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
