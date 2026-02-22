import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./components/Layout";
import PrivateRoute from "./context/PrivateRoute";
import { Cart } from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import Product from "./pages/Product";
import { Products } from "./pages/Products";
import Profile from "./pages/Profile";
import Register from "./pages/Register";

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
        path: "/profile",
        element: <Profile />,
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
      {
        path: "/orders",
        element: (
          <PrivateRoute>
            <Orders />
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
