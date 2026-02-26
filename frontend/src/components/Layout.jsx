import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ChatBubble from "./ChatBubble";
import { useContext } from "react";
import { authContext } from "../context/AuthContext";

export default function Layout() {
  const { isStaff } = useContext(authContext);

  return (
    <>
      <Outlet />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        // transition={Bounce}
      />
      {!isStaff ? <ChatBubble /> : null}
    </>
  );
}
