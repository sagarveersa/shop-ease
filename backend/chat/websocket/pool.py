from fastapi import WebSocket
from schemas import WsMessage
import random
from uuid import UUID
import schemas


class Pool:
    def __init__(self):
        self.connections: dict[UUID, WebSocket] = {}
        self.rooms: dict[UUID, set[WebSocket]] = {}
        self.staffs: set[UUID] = set()
        self.staff_names: dict[UUID, str] = {}
        self.waiting_rooms: set[UUID] = set()
        self.room_participants: dict[UUID, dict[str, UUID | str | None]] = {}
        self.room_history: dict[UUID, list[str]] = {}

    def connect(self, user_id: UUID, ws: WebSocket):
        self.connections[user_id] = ws

    def get_staff(self):
        if len(self.staffs) == 0:
            return None
        return random.choice(tuple(self.staffs))

    def get_staff_name(self, staff_id: UUID | None):
        if staff_id is None:
            return None
        return self.staff_names.get(staff_id, "Support staff")

    def add_room(self, room_id: UUID, guest_id: UUID, guest_name: str, ws: WebSocket):
        self.connect(guest_id, ws)
        self.join_room(room_id, ws)
        self.room_participants[room_id] = {
            "guest_id": guest_id,
            "guest_name": guest_name or "Guest user",
            "staff_id": None,
            "staff_name": None,
        }
        self.room_history.setdefault(room_id, [])

    def add_room_to_waitlist(self, room_id: UUID):
        self.waiting_rooms.add(room_id)

    def store_room_message(self, room_id: UUID, msg):
        self.room_history.setdefault(room_id, []).append(msg.model_dump_json())

    async def assign_staff_to_room(self, room_id: UUID, staff_id: UUID, staff_name: str | None = None):
        staff_ws = self.connections.get(staff_id)
        room_state = self.room_participants.get(room_id)
        if not staff_ws or not room_state:
            print("Staff ws connection or room state not found")
            return False

        resolved_staff_name = staff_name or self.get_staff_name(staff_id) or "Support staff"
        room_state["staff_id"] = staff_id
        room_state["staff_name"] = resolved_staff_name
        self.join_room(room_id, staff_ws)
        self.waiting_rooms.discard(room_id)

        room_assigned_msg = schemas.RoomAssignedEvent(
            type="RoomAssigned",
            data=schemas.RoomAssigned(
                room_id=room_id,
                guest_id=room_state["guest_id"],
                guest_name=room_state["guest_name"] or "Guest user",
                staff_id=staff_id,
                staff_name=resolved_staff_name,
            ),
        )
        await self.send_to_room(room_id, room_assigned_msg)

        for raw_message in self.room_history.get(room_id, []):
            await staff_ws.send_text(raw_message)

        return True

    async def assign_waiting_rooms(self, staff_id: UUID, staff_name: str | None = None):
        for room_id in list(self.waiting_rooms):
            await self.assign_staff_to_room(room_id, staff_id, staff_name)

    async def register_staff(self, staff_id: UUID, staff_name: str):
        self.staffs.add(staff_id)
        self.staff_names[staff_id] = staff_name or "Support staff"
        print("[Pool] staff successfully registered")
        await self.assign_waiting_rooms(staff_id, staff_name)

    def join_room(self, room_id: UUID, ws: WebSocket):
        self.rooms.setdefault(room_id, set()).add(ws)
        print("[Pool] room is joined")

    async def send_to_room(self, room_id: UUID, msg: WsMessage, sender: WebSocket = None):
        json_msg = msg.model_dump_json()
        print(f"[Pool] sending {json_msg} to room {room_id}")

        for ws in self.rooms.get(room_id, []):
            try:
                await ws.send_text(json_msg)
            except Exception:
                print("Error occured when broadcasting msg")

    async def send(self, receiver_id: UUID, msg: WsMessage):
        json_msg = msg.model_dump_json()
        try:
            await self.connections[receiver_id].send_text(json_msg)
        except Exception:
            print("Error sending message")

    def _drop_room(self, room_id: UUID):
        self.rooms.pop(room_id, None)
        self.waiting_rooms.discard(room_id)
        self.room_participants.pop(room_id, None)
        self.room_history.pop(room_id, None)

    async def unregister_staff(self, staff_id: UUID, ws: WebSocket):
        for room_id, room in list(self.rooms.items()):
            if ws not in room:
                continue

            print(f"[Pool][unregister_staff] ws found in room with id: {room_id}")
            room.remove(ws)

            room_state = self.room_participants.get(room_id)
            if room_state:
                room_state["staff_id"] = None
                room_state["staff_name"] = None
                if room:
                    self.waiting_rooms.add(room_id)

            msg = schemas.StaffLeftRoomEvent(
                type="StaffLeftRoom",
                data=schemas.StaffLeftRoomPayload(room_id=room_id, staff_id=staff_id),
            )
            await self.send_to_room(room_id, msg)

            if not room:
                self._drop_room(room_id)

        self.staffs.discard(staff_id)
        self.staff_names.pop(staff_id, None)
        print("[Pool][unregister_staff] staff unregistered")

        next_staff = self.get_staff()
        if next_staff is not None:
            await self.assign_waiting_rooms(next_staff, self.get_staff_name(next_staff))

    async def remove_conn(self, ws: WebSocket):
        user_id = None
        for key, value in list(self.connections.items()):
            if value == ws:
                print(f"[Pool][remove_conn] Found ws in connections list with id: {key}")
                user_id = key
                del self.connections[key]
                break

        if user_id is None:
            return

        is_staff = user_id in self.staffs
        if is_staff:
            print("[Pool][remove_conn] ws is a staff")
            await self.unregister_staff(user_id, ws)
            return

        print("[Pool][remove_conn] ws is not a staff")

        for room_id, room in list(self.rooms.items()):
            if ws not in room:
                continue

            print(f"[Pool][remove_conn] ws found in the room with id: {room_id}")
            room.remove(ws)
            self.waiting_rooms.discard(room_id)

            msg = schemas.GuestLeftRoomEvent(
                type="GuestLeftRoom",
                data=schemas.GuestLeftRoomPayload(room_id=room_id, guest_id=user_id),
            )
            await self.send_to_room(room_id, msg)
            self._drop_room(room_id)
