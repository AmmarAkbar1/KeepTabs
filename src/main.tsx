import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"
import Home from "./pages/Home";
import LogIn from "./pages/LogIn";
import Partner from "./pages/Partner";
import Register from "./pages/Register";
import {createBrowserRouter, RouterProvider} from "react-router";

let router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {path: "/", element: <Home /> },
      {path: "/login", element: <LogIn /> },
      {path: "/partner", element: <Partner /> },
      {path: "/register", element: <Register /> }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
      <RouterProvider router={router} />
  </React.StrictMode>,
);
