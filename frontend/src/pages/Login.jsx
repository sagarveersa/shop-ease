import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Navbar } from "../components/Navbar";
import { authContext } from "../context/AuthContext";
import { baseURL } from "../service/api";

export default function Login() {
  const {
    setToken,
    loggedIn,
    setUserID,
    setName,
    setIsStaff,
    useAuth0,
    loginWithAuth0,
    authError,
    isAuthLoading,
  } = useContext(authContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    if (authError) {
      toast.error(authError);
    }
  }, [authError]);

  useEffect(() => {
    if (loggedIn) {
      navigate("/products");
    }
  }, [loggedIn, navigate]);

  if (loggedIn) {
    return <Navigate to="/products" />;
  }

  const handleLocalAuth = async () => {
    setLoading(true);

    try {
      const response = await axios.post(`${baseURL}accounts/login/`, {
        email: email,
        password: password,
      });

      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;

      const userID = response.data.userID;
      const name = response.data.name ? response.data.name : "Unnamed";
      const isStaff = response.data.isStaff;
      if (!accessToken || !refreshToken || !userID || !name) {
        setError("Server Error");
        return;
      }

      setToken(accessToken);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      setUserID(userID);
      localStorage.setItem("userID", userID);

      setName(name);
      localStorage.setItem("name", name);

      setIsStaff(isStaff);
      localStorage.setItem("isStaff", isStaff);

      setError(null);
      navigate("/");
    } catch (error) {
      setError(error?.response?.data?.detail || "Login failed");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth0Login = () => {
    loginWithAuth0({
      authorizationParams: {
        screen_hint: "login",
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      },
    });
  };

  return (
    <div className="bg-gray-950 min-h-screen">
      <Navbar />

      <div className="mt-16 flex items-center justify-center p-4 pt-12">
        <div className="w-full max-w-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-800">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Log in</h1>
              <p className="text-gray-400 text-sm">
                Enter your details to get started
              </p>
            </div>

            {!useAuth0 ? (
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {!loading && (
                  <button
                    type="submit"
                    onClick={() => {
                      handleLocalAuth();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Login
                  </button>
                )}
                {loading && (
                  <button className="flex flex-row justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]">
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {!isAuthLoading ? (
                  <button
                    onClick={handleAuth0Login}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Login with Auth0
                  </button>
                ) : (
                  <button className="flex flex-row justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]">
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  </button>
                )}
              </div>
            )}

            <div className="mt-5 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?
                <Link
                  to="/register"
                  className="text-blue-500 hover:text-blue-400 font-medium transition"
                >
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
