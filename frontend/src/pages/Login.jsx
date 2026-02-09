import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authContext } from "../context/AuthContext";
import { UserService } from "../service/user.service";
import { Navbar } from "../components/Navbar";
import { toast } from "react-toastify";

export default function Login() {
  const {
    token,
    setToken,
    userID,
    loggedIn,
    setUserID,
    name,
    setName,
    setLoggedIn,
    logout,
  } = useContext(authContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // if user already logged in
  useEffect(() => {
    const verifyLogin = async () => {
      // verify the token and userID
      if (!loggedIn) return;
      const response = await UserService.authenticate(token, userID, name);
      if (response.success) {
        setLoggedIn(true);
        navigate("/explore");
      } else {
        logout();
      }
    };

    verifyLogin();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  const handleForm = async () => {
    setLoading(true);
    const response = await UserService.login(email, password);
    setLoading(false);
    if (!response.success) {
      setError(response.data.error);
      return;
    }

    const token = response.data.accessToken;
    const userID = response.data.userID;
    const name = response.data.name;
    if (!token || !userID || !name) {
      setError("Server Error");
      setLoggedIn(false);
      return;
    }

    setToken(token);
    localStorage.setItem("accessToken", token);

    setUserID(userID);
    localStorage.setItem("userID", userID);

    setName(name);
    localStorage.setItem("name", name);

    setError(null);
    setLoggedIn(true);
    navigate("/");
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {!loading && (
                <button
                  type="submit"
                  onClick={handleForm}
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
