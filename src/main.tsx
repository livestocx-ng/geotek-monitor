import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupBrowserHardening } from "./utils/browserHardening.ts";

setupBrowserHardening();

createRoot(document.getElementById("root")!).render(<App />);
