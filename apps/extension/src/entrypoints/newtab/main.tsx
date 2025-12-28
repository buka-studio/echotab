// export default function Newtab() {

//   // return <App />;
// }

import React from "react";
import ReactDOM from "react-dom/client";

import App from "../../App";

// import "@/assets/tailwind.css";

ReactDOM.createRoot(document.querySelector(".echotab-root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
