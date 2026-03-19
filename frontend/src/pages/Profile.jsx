import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { useContext, useEffect, useReducer, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Navbar } from "../components/Navbar";
import { authContext } from "../context/AuthContext";
import { api } from "../service/api";

const initialState = {
  status: "idle",
  saveStatus: "idle",
  error: null,
  saveError: null,
  isEditing: false,
  profile: null,
  form: {
    name: "",
    email: "",
  },
};

function profileReducer(state, action) {
  switch (action.type) {
    case "profile/fetch-request":
      return { ...state, status: "loading", error: null };

    case "profile/fetch-success":
      return {
        ...state,
        status: "success",
        error: null,
        profile: action.payload,
        form: {
          name: action.payload.name || "",
          email: action.payload.email || "",
        },
      };

    case "profile/fetch-failure":
      return { ...state, status: "error", error: action.payload };

    case "profile/edit-start":
      return { ...state, isEditing: true, saveError: null };

    case "profile/edit-cancel":
      return {
        ...state,
        isEditing: false,
        saveError: null,
        form: {
          name: state.profile?.name || "",
          email: state.profile?.email || "",
        },
      };

    case "profile/form-update":
      return {
        ...state,
        form: {
          ...state.form,
          [action.payload.field]: action.payload.value,
        },
      };

    case "profile/save-request":
      return { ...state, saveStatus: "loading", saveError: null };

    case "profile/save-success":
      return {
        ...state,
        saveStatus: "success",
        isEditing: false,
        saveError: null,
        profile: action.payload,
        form: {
          name: action.payload.name || "",
          email: action.payload.email || "",
        },
      };

    case "profile/save-failure":
      return {
        ...state,
        saveStatus: "error",
        saveError: action.payload,
      };

    default:
      return state;
  }
}

function formatMemberSince(dateString) {
  if (!dateString) return "N/A";

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

export default function Profile() {
  const { loggedIn, isStaff, setName } = useContext(authContext);
  const [state, dispatch] = useReducer(profileReducer, initialState);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;

    const controller = new AbortController();

    async function loadProfile() {
      dispatch({ type: "profile/fetch-request" });
      try {
        const response = await api.get("accounts/profile/", {
          signal: controller.signal,
        });
        dispatch({ type: "profile/fetch-success", payload: response.data });
      } catch (error) {
        if (error.name === "CanceledError") return;

        dispatch({
          type: "profile/fetch-failure",
          payload:
            error?.response?.data?.detail ||
            error?.response?.data?.details ||
            "Failed to load profile",
        });
      }
    }

    loadProfile();
    return () => controller.abort();
  }, [loggedIn]);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [state.profile?.profileImg]);

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  const profile = state.profile;
  const isAuth0Account = Boolean(profile?.auth0Id);
  const avatarSrc = profile?.profileImg || "";
  const showAvatar = Boolean(avatarSrc) && !avatarLoadError;

  const onChange = (field, value) => {
    dispatch({
      type: "profile/form-update",
      payload: { field, value },
    });
  };

  const onSave = async () => {
    if (isAuth0Account) {
      toast.info("Name is managed by Auth0 for this account.");
      return;
    }

    dispatch({ type: "profile/save-request" });

    try {
      const payload = {
        name: state.form.name.trim(),
      };
      const response = await api.patch("accounts/profile/", payload);

      dispatch({ type: "profile/save-success", payload: response.data });
      setName(response.data.name || "Unnamed");
      localStorage.setItem("name", response.data.name || "Unnamed");
      toast.success("Profile updated");
    } catch (error) {
      dispatch({
        type: "profile/save-failure",
        payload:
          error?.response?.data?.detail ||
          error?.response?.data?.details ||
          "Failed to save profile",
      });
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.details ||
          "Failed to save profile",
      );
    }
  };

  return (
    <div className="h-[100dvh] bg-gray-950 light:bg-slate-50 text-white light:text-slate-900">
      <Navbar />

      <main className="mt-16 h-[calc(100dvh-4rem)] overflow-y-auto custom-scrollbar px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="rounded-2xl border border-gray-800 light:border-slate-200 bg-gray-900 light:bg-white p-6 md:p-8">
            {state.status === "loading" ? (
              <p className="text-gray-300 light:text-slate-600">
                Loading profile...
              </p>
            ) : null}

            {state.status === "error" ? (
              <div className="rounded-xl border border-red-500/40 light:border-red-200 bg-red-500/10 light:bg-red-50 p-4 text-red-300 light:text-red-600">
                {state.error}
              </div>
            ) : null}

            {state.status === "success" && profile ? (
              <>
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-blue-600/90 flex items-center justify-center">
                      {showAvatar ? (
                        <img
                          src={avatarSrc}
                          alt={profile.name || "User avatar"}
                          className="h-full w-full object-cover"
                          onError={() => setAvatarLoadError(true)}
                        />
                      ) : (
                        <UserRound className="h-8 w-8" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold md:text-3xl">
                        {profile.name || "Unnamed"}
                      </h1>
                      <p className="text-gray-400 light:text-slate-500">
                        Member since {formatMemberSince(profile.dateJoined)}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 light:border-slate-200 px-4 py-2 text-sm font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{isStaff ? "Staff Account" : "Customer Account"}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-gray-300 light:text-slate-600">
                      Name
                    </label>
                    <input
                      type="text"
                      value={state.form.name}
                      disabled={!state.isEditing || isAuth0Account}
                      onChange={(e) => onChange("name", e.target.value)}
                      className="w-full rounded-lg border border-gray-700 light:border-slate-300 bg-gray-800 light:bg-white px-4 py-2.5 text-white light:text-slate-900 placeholder-gray-500 light:placeholder-slate-500 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                    {isAuth0Account ? (
                      <p className="mt-2 text-xs text-gray-400 light:text-slate-500">
                        Name is managed by Auth0.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-300 light:text-slate-600">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400 light:text-slate-500" />
                      <input
                        type="email"
                        value={state.form.email}
                        disabled
                        readOnly
                        className="w-full rounded-lg border border-gray-700 light:border-slate-300 bg-gray-800 light:bg-white py-2.5 pl-10 pr-4 text-white light:text-slate-900 placeholder-gray-500 light:placeholder-slate-500 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </div>
                  </div>
                </div>

                {state.saveError ? (
                  <div className="mt-4 rounded-lg border border-red-500/40 light:border-red-200 bg-red-500/10 light:bg-red-50 p-3 text-sm text-red-300 light:text-red-600">
                    {state.saveError}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  {!state.isEditing && !isAuth0Account ? (
                    <button
                      onClick={() => dispatch({ type: "profile/edit-start" })}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                    >
                      Edit Profile
                    </button>
                  ) : !isAuth0Account ? (
                    <>
                      <button
                        onClick={onSave}
                        disabled={state.saveStatus === "loading"}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition"
                      >
                        {state.saveStatus === "loading" ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => dispatch({ type: "profile/edit-cancel" })}
                        disabled={state.saveStatus === "loading"}
                        className="rounded-lg border border-gray-700 light:border-slate-300 bg-gray-800 light:bg-white px-4 py-2 text-sm font-medium text-gray-200 light:text-slate-700 hover:bg-gray-700 light:hover:bg-slate-100 disabled:opacity-60 transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                </div>
              </>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
