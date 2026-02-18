import { useEffect, useReducer } from "react";
import { User, Mail, Phone, MapPin } from "lucide-react";
import { api } from "../service/api";

/* ---------------- Reducer ---------------- */

const initialState = {
  status: "loading",
  user: null,
  form: {},
  error: null,
  editing: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "fetch/start":
      return { ...state, status: "loading" };

    case "fetch/success":
      return {
        ...state,
        status: "ready",
        user: action.payload,
        form: action.payload,
      };

    case "fetch/error":
      return { ...state, status: "error", error: action.error };

    case "edit/toggle":
      return { ...state, editing: !state.editing };

    case "form/update":
      return {
        ...state,
        form: { ...state.form, ...action.payload },
      };

    case "save/start":
      return { ...state, status: "saving" };

    case "save/success":
      return {
        ...state,
        status: "ready",
        editing: false,
        user: action.payload,
        form: action.payload,
      };

    case "save/error":
      return { ...state, status: "error", error: action.error };

    default:
      return state;
  }
}

/* ---------------- Component ---------------- */

export default function ProfilePage() {
  const [state, dispatch] = useReducer(reducer, initialState);

  /* -------- Fetch user -------- */

  useEffect(() => {
    async function fetchUser() {
      dispatch({ type: "fetch/start" });

      try {
        const res = await api.get("users/me/");
        dispatch({ type: "fetch/success", payload: res.data });
      } catch {
        dispatch({
          type: "fetch/error",
          error: "Failed to load profile",
        });
      }
    }

    fetchUser();
  }, []);

  /* -------- Save profile -------- */

  async function handleSave() {
    dispatch({ type: "save/start" });

    try {
      const res = await api.patch("users/me/", state.form);

      dispatch({
        type: "save/success",
        payload: res.data,
      });
    } catch {
      dispatch({
        type: "save/error",
        error: "Failed to update profile",
      });
    }
  }

  if (state.status === "loading") return <PageLoader />;

  const user = state.form;

  return (
    <div className="min-h-screen bg-[#0B1628] text-white px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">My Profile</h1>

          {!state.editing ? (
            <button
              onClick={() => dispatch({ type: "edit/toggle" })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => dispatch({ type: "edit/toggle" })}
                className="px-4 py-2 bg-gray-700 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 rounded-lg"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Card */}
        <div className="bg-[#162338] border border-white/10 rounded-2xl p-6 space-y-6">
          <Field
            icon={<User size={18} />}
            label="Full Name"
            value={user.name}
            editable={state.editing}
            onChange={(v) =>
              dispatch({
                type: "form/update",
                payload: { name: v },
              })
            }
          />

          <Field
            icon={<Mail size={18} />}
            label="Email"
            value={user.email}
            disabled
          />

          <Field
            icon={<Phone size={18} />}
            label="Phone"
            value={user.phone}
            editable={state.editing}
            onChange={(v) =>
              dispatch({
                type: "form/update",
                payload: { phone: v },
              })
            }
          />

          <Field
            icon={<MapPin size={18} />}
            label="Address"
            value={user.address}
            editable={state.editing}
            onChange={(v) =>
              dispatch({
                type: "form/update",
                payload: { address: v },
              })
            }
          />

          <Field
            label="City"
            value={user.city}
            editable={state.editing}
            onChange={(v) =>
              dispatch({
                type: "form/update",
                payload: { city: v },
              })
            }
          />

          <Field
            label="State"
            value={user.state}
            editable={state.editing}
            onChange={(v) =>
              dispatch({
                type: "form/update",
                payload: { state: v },
              })
            }
          />

          <Field
            label="Pincode"
            value={user.pincode}
            editable={state.editing}
            onChange={(v) =>
              dispatch({
                type: "form/update",
                payload: { pincode: v },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
