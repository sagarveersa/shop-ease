import {
  CheckCircle2,
  CircleAlert,
  MessageCircle,
  Send,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { Navbar } from "../components/Navbar";

const WS_ENDPOINT =
  import.meta.env.VITE_CHAT_API_URL ||
  `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/ws/`;

const initialState = {
  connectionStatus: "connecting",
  registrationStatus: "pending",
  registrationMessage: "Registering staff...",
  staffId: "",
  staffName: "Support staff",
  rooms: {},
  roomOrder: [],
  activeRoomId: "",
  composerText: "",
  logItems: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "staff/socket-connected":
      return {
        ...state,
        connectionStatus: "connected",
        logItems: [...state.logItems, "WebSocket connected"],
      };
    case "staff/socket-failed":
      return {
        ...state,
        connectionStatus: "error",
        registrationStatus: "failed",
        registrationMessage: action.payload || "Failed to register staff",
        logItems: [...state.logItems, action.payload || "Socket error"],
      };
    case "staff/socket-closed":
      return {
        ...state,
        connectionStatus: "closed",
        logItems: [...state.logItems, "WebSocket disconnected"],
      };
    case "staff/session-resolved":
      return {
        ...state,
        staffId: action.payload.id || "staff",
        staffName: action.payload.name || "Support staff",
      };
    case "staff/register-success":
      return {
        ...state,
        registrationStatus: "success",
        registrationMessage: action.payload || "Staff registered",
        logItems: [...state.logItems, action.payload || "Staff registered"],
      };
    case "staff/register-pending":
      return {
        ...state,
        registrationStatus: "pending",
        registrationMessage: action.payload || "Registering staff...",
      };
    case "staff/unregister-success":
      return {
        ...state,
        registrationStatus: "pending",
        registrationMessage: action.payload || "Staff unregistered",
        rooms: {},
        roomOrder: [],
        activeRoomId: "",
        composerText: "",
        logItems: [...state.logItems, action.payload || "Staff unregistered"],
      };
    case "staff/register-failed":
      return {
        ...state,
        registrationStatus: "failed",
        registrationMessage: action.payload || "Failed to register staff",
        logItems: [
          ...state.logItems,
          action.payload || "Staff registration failed",
        ],
      };
    case "room/assign-success": {
      const { roomId, guestId, guestName, staffName } = action.payload;
      const existingRoom = state.rooms[roomId];
      const nextRoom = {
        roomId,
        guestId,
        guestName: guestName || existingRoom?.guestName || "Guest user",
        staffName: staffName || existingRoom?.staffName || state.staffName,
        status: "open",
        messages: existingRoom?.messages || [],
        isGuestTyping: existingRoom?.isGuestTyping || false,
      };
      return {
        ...state,
        rooms: {
          ...state.rooms,
          [roomId]: nextRoom,
        },
        roomOrder: state.roomOrder.includes(roomId)
          ? state.roomOrder
          : [roomId, ...state.roomOrder],
        activeRoomId: state.activeRoomId || roomId,
        logItems: [...state.logItems, `Room assigned: ${roomId}`],
      };
    }
    case "room/close-success": {
      const roomId = action.payload;
      const room = state.rooms[roomId];
      if (!room) return state;
      return {
        ...state,
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            status: "closed",
            isGuestTyping: false,
          },
        },
        logItems: [...state.logItems, `Room closed: ${roomId}`],
      };
    }
    case "room/guest-left-success": {
      const { roomId, guestId } = action.payload;
      const room = state.rooms[roomId];
      if (!room) return state;
      return {
        ...state,
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            status: "closed",
            isGuestTyping: false,
          },
        },
        logItems: [
          ...state.logItems,
          `Guest ${guestId} left room ${roomId}. Room closed.`,
        ],
      };
    }
    case "room/message-received": {
      const { roomId, senderId, content } = action.payload;
      if (!roomId || !content) return state;
      const room = state.rooms[roomId] || {
        roomId,
        guestId: "Unknown",
        status: "open",
        messages: [],
        isGuestTyping: false,
      };
      return {
        ...state,
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages: [
              ...room.messages,
              {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                senderId: senderId || "unknown",
                content,
              },
            ],
          },
        },
        roomOrder: state.roomOrder.includes(roomId)
          ? state.roomOrder
          : [roomId, ...state.roomOrder],
        activeRoomId: state.activeRoomId || roomId,
      };
    }
    case "room/typing-toggled": {
      const roomId = action.payload;
      const room = state.rooms[roomId];
      if (!room) return state;
      return {
        ...state,
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            isGuestTyping: !room.isGuestTyping,
          },
        },
      };
    }
    case "composer/update-success":
      return {
        ...state,
        composerText: action.payload,
      };
    case "room/activate-success":
      return {
        ...state,
        activeRoomId: action.payload,
      };
    case "composer/reset-success":
      return {
        ...state,
        composerText: "",
      };
    default:
      return state;
  }
}

function parseWsPayload(rawPayload) {
  if (typeof rawPayload !== "string") return null;
  try {
    const firstParse = JSON.parse(rawPayload);
    if (typeof firstParse === "string") {
      try {
        return JSON.parse(firstParse);
      } catch {
        return null;
      }
    }
    return firstParse;
  } catch {
    return null;
  }
}

function getStaffSessionFromToken(token) {
  if (!token) return { id: "staff", name: "Support staff" };

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return { id: "staff", name: "Support staff" };
    const normalized = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
    const claims = JSON.parse(atob(normalized));
    return {
      id: claims.staff_id || claims.user_id || claims.sub || claims.id || "staff",
      name: claims.name || "Support staff",
    };
  } catch {
    return { id: "staff", name: "Support staff" };
  }
}

export default function Staff() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(null);
  const scrollerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const localTypingByRoomRef = useRef({});
  const localTypingToggleEchoByRoomRef = useRef({});
  const previousActiveRoomRef = useRef("");

  const activeRoom = state.activeRoomId
    ? state.rooms[state.activeRoomId]
    : null;
  const canSend =
    state.connectionStatus === "connected" &&
    state.registrationStatus === "success" &&
    activeRoom?.status === "open" &&
    state.composerText.trim().length > 0;
  const canRegister =
    state.connectionStatus === "connected" &&
    state.registrationStatus !== "success";
  const canUnregister =
    state.connectionStatus === "connected" &&
    state.registrationStatus === "success";

  const sendTypingToggle = useCallback(
    (roomId) => {
      if (
        !roomId ||
        !socketRef.current ||
        state.connectionStatus !== "connected" ||
        state.registrationStatus !== "success"
      ) {
        return;
      }

      localTypingToggleEchoByRoomRef.current[roomId] =
        (localTypingToggleEchoByRoomRef.current[roomId] || 0) + 1;

      socketRef.current.send(
        JSON.stringify({
          type: "TypingToggle",
          data: {
            room_id: roomId,
          },
        }),
      );
    },
    [state.connectionStatus, state.registrationStatus],
  );

  const stopTypingForRoom = useCallback(
    (roomId) => {
      if (!roomId || !localTypingByRoomRef.current[roomId]) return;
      sendTypingToggle(roomId);
      localTypingByRoomRef.current[roomId] = false;
    },
    [sendTypingToggle],
  );

  const sendRegisterStaff = () => {
    if (!socketRef.current || state.connectionStatus !== "connected") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      dispatch({
        type: "staff/register-failed",
        payload: "Failed to register staff",
      });
      return;
    }

    dispatch({
      type: "staff/register-pending",
      payload: "Registering staff...",
    });

    socketRef.current.send(
      JSON.stringify({
        type: "RegisterStaff",
        data: {
          token,
        },
      }),
    );
  };

  const sendUnregisterStaff = () => {
    if (!socketRef.current || state.connectionStatus !== "connected") return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    Object.keys(localTypingByRoomRef.current).forEach((roomId) => {
      localTypingByRoomRef.current[roomId] = false;
    });
    clearTimeout(typingTimeoutRef.current);

    socketRef.current.send(
      JSON.stringify({
        type: "UnregisterStaff",
        data: {
          token,
        },
      }),
    );

    dispatch({
      type: "staff/unregister-success",
      payload: "Staff unregistered",
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const session = getStaffSessionFromToken(token);
    dispatch({ type: "staff/session-resolved", payload: session });

    const ws = new WebSocket(WS_ENDPOINT);
    socketRef.current = ws;

    ws.onopen = () => {
      dispatch({ type: "staff/socket-connected" });

      if (!token) {
        dispatch({
          type: "staff/register-failed",
          payload: "Failed to register staff",
        });
        return;
      }

      dispatch({
        type: "staff/register-pending",
        payload: "Registering staff...",
      });
      ws.send(
        JSON.stringify({
          type: "RegisterStaff",
          data: {
            token,
          },
        }),
      );
    };

    ws.onmessage = (event) => {
      const payload = parseWsPayload(event.data);
      if (!payload || typeof payload !== "object") return;

      if (payload.type === "Success") {
        dispatch({
          type: "staff/register-success",
          payload: payload?.data?.details || "Staff registered",
        });
        return;
      }

      if (payload.type === "Error") {
        dispatch({
          type: "staff/register-failed",
          payload: payload?.data?.details || "Failed to register staff",
        });
        return;
      }

      if (payload.type === "RoomAssigned") {
        dispatch({
          type: "room/assign-success",
          payload: {
            roomId: payload?.data?.room_id,
            guestId: payload?.data?.guest_id,
            guestName: payload?.data?.guest_name || "Guest user",
            staffName: payload?.data?.staff_name || "Support staff",
          },
        });
        return;
      }

      if (payload.type === "RoomClosed") {
        dispatch({
          type: "room/close-success",
          payload: payload?.data?.room_id,
        });
        return;
      }

      if (payload.type === "RoomMessage") {
        dispatch({
          type: "room/message-received",
          payload: {
            roomId: payload?.data?.room_id,
            senderId: payload?.data?.sender_id,
            content: payload?.data?.content,
          },
        });
        return;
      }

      if (payload.type === "TypingToggle") {
        const roomId = payload?.data?.room_id;
        if (!roomId) return;
        if ((localTypingToggleEchoByRoomRef.current[roomId] || 0) > 0) {
          localTypingToggleEchoByRoomRef.current[roomId] -= 1;
          return;
        }
        dispatch({ type: "room/typing-toggled", payload: roomId });
        return;
      }

      if (payload.type === "GuestLeftRoom") {
        dispatch({
          type: "room/guest-left-success",
          payload: {
            roomId: payload?.data?.room_id,
            guestId: payload?.data?.guest_id,
          },
        });
      }
    };

    ws.onerror = () => {
      dispatch({
        type: "staff/socket-failed",
        payload: "Failed to register staff",
      });
    };

    ws.onclose = () => {
      dispatch({ type: "staff/socket-closed" });
    };

    return () => {
      clearTimeout(typingTimeoutRef.current);
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [state.activeRoomId, activeRoom?.messages?.length]);

  const sendMessage = () => {
    if (!canSend || !socketRef.current || !activeRoom) return;
    socketRef.current.send(
      JSON.stringify({
        type: "RoomMessage",
        data: {
          room_id: activeRoom.roomId,
          sender_id: state.staffId,
          content: state.composerText.trim(),
        },
      }),
    );
    stopTypingForRoom(activeRoom.roomId);
    clearTimeout(typingTimeoutRef.current);
    dispatch({ type: "composer/reset-success" });
  };

  const handleComposerChange = (nextValue) => {
    dispatch({
      type: "composer/update-success",
      payload: nextValue,
    });

    if (!activeRoom || activeRoom.status !== "open") return;

    if (nextValue.trim().length === 0) {
      clearTimeout(typingTimeoutRef.current);
      stopTypingForRoom(activeRoom.roomId);
      return;
    }

    if (!localTypingByRoomRef.current[activeRoom.roomId]) {
      sendTypingToggle(activeRoom.roomId);
      localTypingByRoomRef.current[activeRoom.roomId] = true;
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTypingForRoom(activeRoom.roomId);
    }, 2000);
  };

  useEffect(() => {
    const prevRoomId = previousActiveRoomRef.current;
    if (prevRoomId && prevRoomId !== state.activeRoomId) {
      stopTypingForRoom(prevRoomId);
      clearTimeout(typingTimeoutRef.current);
    }
    previousActiveRoomRef.current = state.activeRoomId;
  }, [state.activeRoomId, stopTypingForRoom]);

  const registrationBadgeClass =
    state.registrationStatus === "success"
      ? "bg-green-500/15 text-green-300 border-green-500/30 light:bg-green-50 light:text-green-700 light:border-green-200"
      : state.registrationStatus === "failed"
        ? "bg-red-500/15 text-red-300 border-red-500/30 light:bg-red-50 light:text-red-600 light:border-red-200"
        : "bg-yellow-500/15 text-yellow-300 border-yellow-500/30 light:bg-yellow-50 light:text-yellow-700 light:border-yellow-200";

  return (
    <div className="h-[100dvh] bg-gray-950 light:bg-slate-50 text-white light:text-slate-900">
      <Navbar />

      <main className="mt-16 h-[calc(100dvh-4rem)] overflow-y-auto custom-scrollbar px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-2xl border border-gray-800 light:border-slate-200 bg-gray-900 light:bg-white p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-600/85 flex items-center justify-center">
                  <UserRound className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold">
                    Staff Chat Console
                  </h1>
                  <p className="text-sm text-gray-400 light:text-slate-500">
                    {state.staffName} · Sender ID: {state.staffId}
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${registrationBadgeClass}`}
              >
                {state.registrationStatus === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <CircleAlert className="h-4 w-4" />
                )}
                <span>{state.registrationMessage}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={sendRegisterStaff}
                  disabled={!canRegister}
                  className="rounded-lg border border-green-500/50 light:border-green-300 bg-green-600/25 light:bg-green-100 px-3 py-2 text-xs text-green-200 light:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600/40 light:hover:bg-green-200"
                >
                  Register Staff
                </button>
                <button
                  type="button"
                  onClick={sendUnregisterStaff}
                  disabled={!canUnregister}
                  className="rounded-lg border border-red-500/50 light:border-red-300 bg-red-600/20 light:bg-red-100 px-3 py-2 text-xs text-red-200 light:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600/35 light:hover:bg-red-200"
                >
                  Unregister Staff
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <aside className="lg:col-span-4 rounded-2xl border border-gray-800 light:border-slate-200 bg-gray-900 light:bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Assigned Rooms</h2>
                <span className="text-xs text-gray-400 light:text-slate-500">
                  {state.roomOrder.length} total
                </span>
              </div>

              <div className="space-y-2 max-h-[32rem] overflow-y-auto custom-scrollbar pr-1">
                {state.roomOrder.length === 0 ? (
                  <div className="rounded-lg border border-gray-800 light:border-slate-200 bg-gray-950/60 light:bg-slate-100 px-3 py-3 text-sm text-gray-400 light:text-slate-600">
                    Waiting for room assignments...
                  </div>
                ) : (
                  state.roomOrder.map((roomId) => {
                    const room = state.rooms[roomId];
                    const isActive = state.activeRoomId === roomId;
                    return (
                      <button
                        key={roomId}
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "room/activate-success",
                            payload: roomId,
                          })
                        }
                        className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                          isActive
                            ? "border-blue-500/40 bg-blue-600/15 light:border-blue-200 light:bg-blue-50"
                            : "border-gray-800 bg-gray-950/55 hover:border-gray-700 light:border-slate-200 light:bg-slate-100 light:hover:border-slate-300"
                        }`}
                      >
                        <p className="text-sm font-medium truncate">
                          {room.roomId}
                        </p>
                        <p className="text-xs text-gray-400 light:text-slate-500 mt-1 truncate">
                          Guest: {room.guestName || "Guest user"}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border ${
                              room.status === "open"
                                ? "bg-green-500/15 text-green-300 border-green-500/30 light:bg-green-50 light:text-green-700 light:border-green-200"
                                : "bg-gray-700/40 text-gray-300 border-gray-600 light:bg-slate-200 light:text-slate-600 light:border-slate-300"
                            }`}
                          >
                            {room.status}
                          </span>
                          <span className="text-[11px] text-gray-400 light:text-slate-500">
                            {room.messages.length} messages
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <section className="lg:col-span-8 rounded-2xl border border-gray-800 light:border-slate-200 bg-gray-900 light:bg-white overflow-hidden">
              <header className="px-4 py-3 border-b border-gray-800 light:border-slate-200 bg-gray-900/90 light:bg-white flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {activeRoom
                      ? `Room: ${activeRoom.roomId}`
                      : "No room selected"}
                  </p>
                  <p className="text-xs text-gray-400 light:text-slate-500">
                    {activeRoom
                      ? `Customer: ${activeRoom.guestName || "Guest user"}`
                      : "Select a room"}
                  </p>
                  {activeRoom?.status === "open" &&
                  activeRoom?.isGuestTyping ? (
                    <p className="text-xs text-blue-300 light:text-blue-600 mt-1">
                      {(activeRoom.guestName || "Guest user")} is typing...
                    </p>
                  ) : null}
                </div>
                <div className="text-xs text-gray-400 light:text-slate-500">
                  Connection: {state.connectionStatus}
                </div>
              </header>

              <div
                ref={scrollerRef}
                className="h-[24rem] overflow-y-auto custom-scrollbar px-3 py-3 space-y-2 bg-gray-950/60 light:bg-slate-50"
              >
                {!activeRoom ? (
                  <div className="rounded-lg border border-gray-800 light:border-slate-200 bg-gray-900/70 light:bg-white px-3 py-2 text-sm text-gray-400 light:text-slate-600">
                    No active room.
                  </div>
                ) : activeRoom.messages.length === 0 ? (
                  <div className="rounded-lg border border-gray-800 light:border-slate-200 bg-gray-900/70 light:bg-white px-3 py-2 text-sm text-gray-400 light:text-slate-600">
                    No messages yet.
                  </div>
                ) : (
                  activeRoom.messages.map((msg) => {
                    const isMine = msg.senderId === state.staffId;
                    return (
                      <div
                        key={msg.id}
                        className={`max-w-[82%] rounded-xl border px-3 py-2 ${
                          isMine
                            ? "ml-auto bg-blue-600/25 border-blue-500/40 text-blue-100 light:bg-blue-50 light:border-blue-200 light:text-blue-900"
                            : "mr-auto bg-gray-800/90 border-gray-700 text-gray-100 light:bg-white light:border-slate-200 light:text-slate-900"
                        }`}
                      >
                        <p className="text-[11px] text-gray-300 light:text-slate-500 mb-1">
                          {isMine
                            ? state.staffName
                            : activeRoom.guestName || "Guest user"}
                        </p>
                        <p className="text-sm leading-snug">{msg.content}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <footer className="border-t border-gray-800 light:border-slate-200 bg-gray-900 light:bg-white px-3 py-3">
                <div className="flex items-center gap-2">
                  <input
                    value={state.composerText}
                    onChange={(event) =>
                      handleComposerChange(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") sendMessage();
                    }}
                    disabled={!activeRoom || activeRoom.status !== "open"}
                    placeholder={
                      activeRoom?.status === "closed"
                        ? "Room is closed"
                        : "Type a message..."
                    }
                    className="w-full rounded-lg border border-gray-700 light:border-slate-300 bg-gray-800 light:bg-white px-3 py-2 text-sm text-white light:text-slate-900 placeholder:text-gray-500 light:placeholder:text-slate-500 outline-none focus:border-blue-500 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!canSend}
                    className="shrink-0 rounded-lg border border-blue-500/50 light:border-blue-300 bg-blue-600/30 light:bg-blue-100 px-3 py-2 text-blue-200 light:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600/45 light:hover:bg-blue-200"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </footer>
            </section>
          </section>

          <section className="rounded-2xl border border-gray-800 light:border-slate-200 bg-gray-900 light:bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4 text-blue-400 light:text-blue-600" />
              <h2 className="text-sm font-semibold">Event Log</h2>
            </div>
            <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-1 pr-1">
              {state.logItems.length === 0 ? (
                <p className="text-xs text-gray-500 light:text-slate-500">
                  No events yet.
                </p>
              ) : (
                state.logItems
                  .slice()
                  .reverse()
                  .map((item, index) => (
                    <p
                      key={`${item}-${index}`}
                      className="text-xs text-gray-400 light:text-slate-500"
                    >
                      {item}
                    </p>
                  ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
