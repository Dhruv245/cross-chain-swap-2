import React, { lazy } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import MainLayout from "./layouts/MainLayout.tsx";

const Swap = lazy(() => import("./pages/Swap.tsx"));
const Faucet = lazy(() => import("./pages/Faucet.tsx"));
const App = lazy(() => import("./pages/App.tsx"));

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <App />
      },

      {
        path: "/faucet",
        element: <Faucet />
      },
      {
        path: "/swap",
        element: <Swap />
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
