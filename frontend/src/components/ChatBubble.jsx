import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const WS_ENDPOINT =
  import.meta.VITE_CHAT_API_URL || "ws://localhost:8004/api/ws/";

const initialState = {
  isOpen: false,
  connectionState: "connecting",
  roomId: "",
  inputValue: "",
  messages: [],
  isStaffTyping: false,
  isWaitingForStaff: false,
  isStartingRoom: false,
  roomClosedByStaff: false,
};

function buildMessage(role, content, extra = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    ...extra,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "chat/ui/opened":
      return {
        ...state,
        isOpen: true,
      };
    case "chat/ui/closed":
      return {
        ...state,
        isOpen: false,
      };
    case "chat/socket/connected":
      return {
        ...state,
        connectionState: "connected",
      };
    case "chat/socket/error":
      return {
        ...state,
        connectionState: "error",
        isStartingRoom: false,
        messages: [
          ...state.messages,
          buildMessage("system", "WebSocket connection failed.", {
            isError: true,
          }),
        ],
      };
    case "chat/socket/closed":
      return {
        ...state,
        connectionState: "closed",
        isStartingRoom: false,
      };
    case "chat/room-start/pending":
      return {
        ...state,
        isStartingRoom: true,
        roomClosedByStaff: false,
      };
    case "chat/room/created":
      return {
        ...state,
        isStartingRoom: false,
        isWaitingForStaff: false,
        isStaffTyping: false,
        roomClosedByStaff: false,
        roomId: action.payload || "",
        messages: [
          ...state.messages,
          buildMessage("system", "Connected to support room."),
        ],
      };
    case "chat/staff/waiting":
      return {
        ...state,
        isStartingRoom: false,
        isWaitingForStaff: true,
        messages: [
          ...state.messages,
          buildMessage("system", "Waiting for the staff..."),
        ],
      };
    case "chat/staff/available":
      return {
        ...state,
        isStartingRoom: false,
        isWaitingForStaff: false,
        messages: [
          ...state.messages,
          buildMessage("system", "A staff member is available. Starting chat..."),
        ],
      };
    case "chat/room/staff-closed":
      return {
        ...state,
        isStartingRoom: false,
        isWaitingForStaff: false,
        isStaffTyping: false,
        roomId: "",
        roomClosedByStaff: true,
        messages: [
          ...state.messages,
          buildMessage("system", "Staff has closed the room."),
        ],
      };
    case "chat/staff-typing/toggled":
      return {
        ...state,
        isStaffTyping: !state.isStaffTyping,
      };
    case "chat/system/error":
      return {
        ...state,
        isStartingRoom: false,
        messages: [
          ...state.messages,
          buildMessage("system", action.payload || "An error occurred.", {
            isError: true,
          }),
        ],
      };
    case "chat/message/received": {
      const { senderId, content, guestId } = action.payload;
      if (!content) return state;
      return {
        ...state,
        messages: [
          ...state.messages,
          buildMessage(senderId === guestId ? "me" : "other", content, {
            senderId,
          }),
        ],
      };
    }
    case "chat/input/updated":
      return {
        ...state,
        inputValue: action.payload,
      };
    case "chat/input/cleared":
      return {
        ...state,
        inputValue: "",
      };
    default:
      return state;
  }
}

function safeParseMessage(raw) {
  if (typeof raw !== "string") return null;

  try {
    const parsed = JSON.parse(raw);

    // Some backends may double-encode payloads as JSON strings.
    if (typeof parsed === "string") {
      try {
        return JSON.parse(parsed);
      } catch {
        return null;
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

export default function ChatBubble({ endpoint = WS_ENDPOINT }) {
  const guestId = useMemo(() => uuidv4(), []);

  const [state, dispatch] = useReducer(reducer, initialState);

  const socketRef = useRef(null);
  const scrollerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasTypingStartedRef = useRef(false);
  const localTypingToggleEchoCountRef = useRef(0);
  const roomIdRef = useRef("");

  const sendStartGuestRoom = (force = false) => {
    if (
      !socketRef.current ||
      state.connectionState !== "connected" ||
      (!force && state.isStartingRoom)
    ) {
      return;
    }

    dispatch({ type: "chat/room-start/pending" });
    socketRef.current.send(
      JSON.stringify({
        type: "StartGuestRoom",
        data: {
          guest_id: guestId,
        },
      }),
    );
  };

  const sendTypingToggle = (targetRoomId) => {
    if (
      !socketRef.current ||
      !targetRoomId ||
      state.connectionState !== "connected"
    ) {
      return;
    }
    localTypingToggleEchoCountRef.current += 1;
    socketRef.current.send(
      JSON.stringify({
        type: "TypingToggle",
        data: {
          room_id: targetRoomId,
        },
      }),
    );
  };

  const stopTypingIfNeeded = () => {
    if (!hasTypingStartedRef.current || !state.roomId) return;
    sendTypingToggle(state.roomId);
    hasTypingStartedRef.current = false;
  };

  useEffect(() => {
    const socket = new WebSocket(endpoint);
    console.log(`sending ws request to ${endpoint}`);
    socketRef.current = socket;

    socket.onopen = () => {
      dispatch({ type: "chat/socket/connected" });
    };

    socket.onmessage = (event) => {
      const payload = safeParseMessage(event.data);
      if (!payload || typeof payload !== "object") return;

      if (payload.type === "RoomCreated") {
        hasTypingStartedRef.current = false;
        localTypingToggleEchoCountRef.current = 0;
        dispatch({
          type: "chat/room/created",
          payload: payload?.data?.room_id || "",
        });
        return;
      }

      if (payload.type === "StaffNotAvailable") {
        dispatch({ type: "chat/staff/waiting" });
        return;
      }

      if (payload.type === "StaffAvailable") {
        dispatch({ type: "chat/staff/available" });
        dispatch({ type: "chat/room-start/pending" });
        socket.send(
          JSON.stringify({
            type: "StartGuestRoom",
            data: {
              guest_id: guestId,
            },
          }),
        );
        return;
      }

      if (payload.type === "StaffLeftRoom") {
        clearTimeout(typingTimeoutRef.current);
        hasTypingStartedRef.current = false;
        dispatch({ type: "chat/room/staff-closed" });
        return;
      }

      if (payload.type === "TypingToggle") {
        const toggledRoomId = payload?.data?.room_id || "";
        if (!toggledRoomId || toggledRoomId !== roomIdRef.current) return;
        if (localTypingToggleEchoCountRef.current > 0) {
          localTypingToggleEchoCountRef.current -= 1;
          return;
        }
        dispatch({ type: "chat/staff-typing/toggled" });
        return;
      }

      if (payload.type === "Error") {
        dispatch({
          type: "chat/system/error",
          payload: payload?.data?.details || "An error occurred.",
        });
        return;
      }

      if (payload.type === "RoomMessage") {
        dispatch({
          type: "chat/message/received",
          payload: {
            senderId: payload?.data?.sender_id || "",
            content: payload?.data?.content || "",
            guestId,
          },
        });
      }
    };

    socket.onerror = () => {
      dispatch({ type: "chat/socket/error" });
    };

    socket.onclose = () => {
      dispatch({ type: "chat/socket/closed" });
    };

    return () => {
      clearTimeout(typingTimeoutRef.current);
      socket.close();
    };
  }, [endpoint, guestId]);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [state.messages, state.isOpen]);

  useEffect(() => {
    roomIdRef.current = state.roomId;
  }, [state.roomId]);

  const canSend =
    state.inputValue.trim().length > 0 &&
    state.connectionState === "connected" &&
    state.roomId;

  const canStartChat =
    state.connectionState === "connected" && !state.isStartingRoom;

  const sendMessage = () => {
    if (!canSend) return;

    socketRef.current.send(
      JSON.stringify({
        type: "RoomMessage",
        data: {
          room_id: state.roomId,
          content: state.inputValue.trim(),
          sender_id: guestId,
        },
      }),
    );

    stopTypingIfNeeded();
    clearTimeout(typingTimeoutRef.current);
    dispatch({ type: "chat/input/cleared" });
  };

  const handleInputChange = (nextValue) => {
    dispatch({
      type: "chat/input/updated",
      payload: nextValue,
    });

    if (!state.roomId || state.connectionState !== "connected") return;

    if (nextValue.trim().length === 0) {
      clearTimeout(typingTimeoutRef.current);
      stopTypingIfNeeded();
      return;
    }

    if (!hasTypingStartedRef.current) {
      sendTypingToggle(state.roomId);
      hasTypingStartedRef.current = true;
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTypingIfNeeded();
    }, 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {state.isOpen ? (
        <div className="w-[min(92vw,24rem)] h-[30rem] rounded-2xl border border-gray-800 bg-gray-900 text-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/95">
            <div>
              <p className="text-sm font-semibold text-gray-100">
                Live Support
              </p>
              <p className="text-xs text-gray-400">
                {state.connectionState === "connected"
                  ? state.roomId
                    ? "Connected"
                    : state.isWaitingForStaff
                      ? "Waiting for staff..."
                      : "Ready to start"
                  : state.connectionState === "connecting"
                    ? "Connecting..."
                    : "Offline"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: "chat/ui/closed" })}
              className="rounded-lg border border-gray-700 bg-gray-800 p-1.5 text-gray-300 hover:text-white hover:border-gray-600"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          <div
            ref={scrollerRef}
            className="h-[calc(100%-7.5rem)] overflow-y-auto custom-scrollbar px-3 py-3 space-y-2 bg-gray-950/60"
          >
            {!state.roomId ? (
              <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-3 py-2 text-sm text-gray-300 space-y-3">
                <p>
                  {state.isWaitingForStaff
                    ? "Waiting for the staff..."
                    : state.roomClosedByStaff
                      ? "The room was closed by staff."
                      : "Start chatting with support."}
                </p>
                <button
                  type="button"
                  onClick={sendStartGuestRoom}
                  disabled={!canStartChat}
                  className="rounded-lg border border-blue-500/50 bg-blue-600/30 px-3 py-1.5 text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600/45"
                >
                  {state.isStartingRoom ? "Starting..." : "Start Chat"}
                </button>
              </div>
            ) : state.messages.length === 0 ? (
              <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-3 py-2 text-sm text-gray-400">
                Start chatting with support.
              </div>
            ) : (
              state.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm border ${
                    msg.role === "me"
                      ? "ml-auto bg-blue-600/25 border-blue-500/40 text-blue-100"
                      : msg.role === "system"
                        ? msg.isError
                          ? "mx-auto bg-red-500/10 border-red-500/30 text-red-200"
                          : "mx-auto bg-gray-800/80 border-gray-700 text-gray-200"
                        : "mr-auto bg-gray-800/85 border-gray-700 text-gray-100"
                  }`}
                >
                  {msg.content}
                </div>
              ))
            )}
            {state.roomId && state.isStaffTyping ? (
              <div className="mr-auto inline-block rounded-lg border border-gray-700 bg-gray-800/85 px-3 py-1.5 text-xs text-gray-300">
                Staff is typing...
              </div>
            ) : null}
          </div>

          <div className="px-3 py-3 border-t border-gray-800 bg-gray-900">
            <div className="flex items-center gap-2">
              <input
                value={state.inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                disabled={!state.roomId}
                placeholder={
                  state.roomId ? "Type a message..." : "Waiting for room..."
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!canSend}
                className="shrink-0 rounded-lg border border-blue-500/50 bg-blue-600/30 px-3 py-2 text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600/45"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!state.isOpen ? (
        <button
          type="button"
          onClick={() => dispatch({ type: "chat/ui/opened" })}
          className="ml-auto flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/40 bg-blue-600/80 text-white shadow-lg hover:bg-blue-500"
          aria-label="Open chat"
        >
          <MessageCircle size={22} />
        </button>
      ) : null}
    </div>
  );
}
