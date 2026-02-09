import Login from "./pages/Login";
import Register from "./pages/Register";
import Product from "./pages/Product";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Products } from "./pages/Products";
import { Cart } from "./pages/Cart";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import PrivateRoute from "./context/PrivateRoute";
import Layout from "./components/Layout";
import "react-toastify/dist/ReactToastify.css";

const router = createBrowserRouter([
  {
    path: "",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/products",
        element: <Products />,
      },
      {
        path: "/cart",
        element: (
          <PrivateRoute>
            <Cart />
          </PrivateRoute>
        ),
      },
      {
        path: "/product/:id",
        element: <Product />,
      },
      {
        path: "/checkout",
        element: (
          <PrivateRoute>
            <Checkout />
          </PrivateRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
