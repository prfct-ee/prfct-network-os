import { initPrfctNode } from "prfct-network-engine";
import React from "react";
import ReactDOM from "react-dom";
import { RedAlert } from "./components/RedAlert/RedAlert";
import "./index.scss";
import { Main } from "./pages/main/Main";

ReactDOM.render(
  <React.StrictMode>
    <RedAlert />
    <Main />
  </React.StrictMode>,
  document.getElementById("root")
);

const url = new URL(window.location.href);
const isReload = !!url.searchParams.get("reload");

const refresh = async () => {
  url.searchParams.set("rnd", Math.random().toString());
  const address = url.href;
  const response = await fetch(address);
  if (response.status === 200) {
    window.location.href = address;
  } else {
    setTimeout(refresh, 60 * 1000);
  }
};

if (isReload) {
  setTimeout(refresh, (30 + Math.random() * 60) * 60 * 1000);
}

initPrfctNode();
