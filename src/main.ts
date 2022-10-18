import "./style.css";
import typescriptLogo from "./typescript.svg";
import { setupCounter } from "./counter";
import Router from "./router";

new Router({
  ignoreSameUrl: false,
});

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
    <div class="test-wrap">
      [1]:<a href="/tt/test.html">local test link</a><br>
      [2]:<a href="//ya.ru">external test link</a><br>
      [3]:<a href="/t/d/test2.html">deep dive</a><br>
    </div>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
