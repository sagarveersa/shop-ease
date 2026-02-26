import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const WS_ENDPOINT = "ws://localhost:8004/ws/";

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

  const [isOpen, setIsOpen] = useState(false);
  const [connectionState, setConnectionState] = useState("connecting");
  const [roomId, setRoomId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isStaffTyping, setIsStaffTyping] = useState(false);
  const [isWaitingForStaff, setIsWaitingForStaff] = useState(false);
  const [isStartingRoom, setIsStartingRoom] = useState(false);
  const [roomClosedByStaff, setRoomClosedByStaff] = useState(false);

  const socketRef = useRef(null);
  const scrollerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasTypingStartedRef = useRef(false);
  const localTypingToggleEchoCountRef = useRef(0);
  const roomIdRef = useRef("");

  const sendStartGuestRoom = (force = false) => {
    if (
      !socketRef.current ||
      connectionState !== "connected" ||
      (!force && isStartingRoom)
    ) {
      return;
    }

    setIsStartingRoom(true);
    setRoomClosedByStaff(false);
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
    if (!socketRef.current || !targetRoomId || connectionState !== "connected") {
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
    if (!hasTypingStartedRef.current || !roomId) return;
    sendTypingToggle(roomId);
    hasTypingStartedRef.current = false;
  };

  useEffect(() => {
    const socket = new WebSocket(endpoint);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionState("connected");
    };

    socket.onmessage = (event) => {
      const payload = safeParseMessage(event.data);
      if (!payload || typeof payload !== "object") return;

      if (payload.type === "RoomCreated") {
        setIsStartingRoom(false);
        setIsWaitingForStaff(false);
        setIsStaffTyping(false);
        setRoomClosedByStaff(false);
        hasTypingStartedRef.current = false;
        localTypingToggleEchoCountRef.current = 0;
        setRoomId(payload?.data?.room_id || "");
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-system-room-created`,
            role: "system",
            content: "Connected to support room.",
          },
        ]);
        return;
      }

      if (payload.type === "StaffNotAvailable") {
        setIsStartingRoom(false);
        setIsWaitingForStaff(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-system-staff-not-available`,
            role: "system",
            content: "Waiting for the staff...",
          },
        ]);
        return;
      }

      if (payload.type === "StaffAvailable") {
        setIsStartingRoom(false);
        setIsWaitingForStaff(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-system-staff-available`,
            role: "system",
            content: "A staff member is available. Starting chat...",
          },
        ]);
        setIsStartingRoom(true);
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
        setIsStartingRoom(false);
        setIsWaitingForStaff(false);
        setIsStaffTyping(false);
        clearTimeout(typingTimeoutRef.current);
        hasTypingStartedRef.current = false;
        setRoomId("");
        setRoomClosedByStaff(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-system-staff-left`,
            role: "system",
            content: "Staff has closed the room.",
          },
        ]);
        return;
      }

      if (payload.type === "TypingToggle") {
        const toggledRoomId = payload?.data?.room_id || "";
        if (!toggledRoomId || toggledRoomId !== roomIdRef.current) return;
        if (localTypingToggleEchoCountRef.current > 0) {
          localTypingToggleEchoCountRef.current -= 1;
          return;
        }
        setIsStaffTyping((prev) => !prev);
        return;
      }

      if (payload.type === "Error") {
        setIsStartingRoom(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-system-error`,
            role: "system",
            content: payload?.data?.details || "An error occurred.",
            isError: true,
          },
        ]);
        return;
      }

      if (payload.type === "RoomMessage") {
        const senderId = payload?.data?.sender_id || "";
        const content = payload?.data?.content || "";

        if (!content) return;

        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            role: senderId === guestId ? "me" : "other",
            content,
            senderId,
          },
        ]);
      }
    };

    socket.onerror = () => {
      setConnectionState("error");
      setIsStartingRoom(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-system-socket-error`,
          role: "system",
          content: "WebSocket connection failed.",
          isError: true,
        },
      ]);
    };

    socket.onclose = () => {
      setConnectionState("closed");
      setIsStartingRoom(false);
    };

    return () => {
      clearTimeout(typingTimeoutRef.current);
      socket.close();
    };
  }, [endpoint, guestId]);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const canSend =
    inputValue.trim().length > 0 && connectionState === "connected" && roomId;

  const canStartChat = connectionState === "connected" && !isStartingRoom;

  const sendMessage = () => {
    if (!canSend) return;

    socketRef.current.send(
      JSON.stringify({
        type: "RoomMessage",
        data: {
          room_id: roomId,
          content: inputValue.trim(),
          sender_id: guestId,
        },
      }),
    );

    stopTypingIfNeeded();
    clearTimeout(typingTimeoutRef.current);
    setInputValue("");
  };

  const handleInputChange = (nextValue) => {
    setInputValue(nextValue);

    if (!roomId || connectionState !== "connected") return;

    if (nextValue.trim().length === 0) {
      clearTimeout(typingTimeoutRef.current);
      stopTypingIfNeeded();
      return;
    }

    if (!hasTypingStartedRef.current) {
      sendTypingToggle(roomId);
      hasTypingStartedRef.current = true;
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTypingIfNeeded();
    }, 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="w-[min(92vw,24rem)] h-[30rem] rounded-2xl border border-gray-800 bg-gray-900 text-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/95">
            <div>
              <p className="text-sm font-semibold text-gray-100">Live Support</p>
              <p className="text-xs text-gray-400">
                {connectionState === "connected"
                  ? roomId
                    ? "Connected"
                    : isWaitingForStaff
                      ? "Waiting for staff..."
                      : "Ready to start"
                  : connectionState === "connecting"
                    ? "Connecting..."
                    : "Offline"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
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
            {!roomId ? (
              <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-3 py-2 text-sm text-gray-300 space-y-3">
                <p>
                  {isWaitingForStaff
                    ? "Waiting for the staff..."
                    : roomClosedByStaff
                      ? "The room was closed by staff."
                      : "Start chatting with support."}
                </p>
                <button
                  type="button"
                  onClick={sendStartGuestRoom}
                  disabled={!canStartChat}
                  className="rounded-lg border border-blue-500/50 bg-blue-600/30 px-3 py-1.5 text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600/45"
                >
                  {isStartingRoom ? "Starting..." : "Start Chat"}
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-3 py-2 text-sm text-gray-400">
                Start chatting with support.
              </div>
            ) : (
              messages.map((msg) => (
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
            {roomId && isStaffTyping ? (
              <div className="mr-auto inline-block rounded-lg border border-gray-700 bg-gray-800/85 px-3 py-1.5 text-xs text-gray-300">
                Staff is typing...
              </div>
            ) : null}
          </div>

          <div className="px-3 py-3 border-t border-gray-800 bg-gray-900">
            <div className="flex items-center gap-2">
              <input
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                disabled={!roomId}
                placeholder={roomId ? "Type a message..." : "Waiting for room..."}
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

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="ml-auto flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/40 bg-blue-600/80 text-white shadow-lg hover:bg-blue-500"
          aria-label="Open chat"
        >
          <MessageCircle size={22} />
        </button>
      ) : null}
    </div>
  );
}
