from fastapi import WebSocket
from typing import List, Dict
from schemas import WsMessage
import random
from uuid import UUID
import schemas

class Pool:
    def __init__(self):
        self.connections: dict[UUID, WebSocket] = {}
        self.rooms: dict[UUID, set[WebSocket]] = {}
        self.staffs: set[UUID] = set()
        self.guests_waitlist: set[UUID] = set()
    
    def connect(self, user_id: UUID, ws: WebSocket):
        self.connections[user_id] = ws

    def get_staff(self):
        if(len(self.staffs) == 0):
            return None
        staff_id = random.choice(tuple(self.staffs))
        return staff_id
    
    def add_guest_to_waitlist(self, guest_id: UUID):
        self.guests_waitlist.add(guest_id)

    def assign_staff_to_room(self, room_id: UUID, staff_id: UUID):
        staff_ws = self.connections[staff_id]
        if not staff_ws:
            print("Staff ws connection not found")
            return

        self.rooms.setdefault(room_id, set()).add(staff_ws)
         
    async def register_staff(self, staff_id: UUID):
        self.staffs.add(staff_id)

        # notify waitlisted users that staff is available
        msg = schemas.StaffAvailableEvent(type="StaffAvailable")
        waiters = self.guests_waitlist.copy()
        for id in waiters: 
            await self.send(id, msg)
            self.guests_waitlist.discard(id)
                
        print('[Pool] staff successfully registered')
    
    def join_room(self, room_id: UUID, ws: WebSocket):
        self.rooms.setdefault(room_id, set()).add(ws)
        print('[Pool] room is joined')

    def leave_room(self, room_id: UUID, ws: WebSocket):
        self.rooms[room_id].discard(ws)
        if not self.rooms[room_id]:
            del self.rooms[room_id]
        
        print('[Pool] room left')
    
    async def send_to_room(self, room_id: UUID, msg: WsMessage, sender: WebSocket = None):
        json_msg = msg.model_dump_json()
        # print(f"Rooms available: {self.rooms}")
        print(f"[Pool] sending {json_msg} to room {room_id}")
        # print(f"Room has following participants: {self.rooms.get(room_id, [])}")
     
        for ws in self.rooms.get(room_id, []):
            try:
                await ws.send_text(json_msg)
            except Exception:
                print("Error occured when broadcasting msg")
                pass

    
    async def send(self, receiver_id: UUID, msg: WsMessage):
        json_msg = msg.model_dump_json()
        try:
            await self.connections[receiver_id].send_json(json_msg)
        except:
            print("Error sending message")
    
    async def unregister_staff(self, staff_id: UUID, ws: WebSocket):
        for room_id, room in list(self.rooms.items()):
            if ws in room:
                print(f"[Pool][unregister_staff] ws found in room with id: {room_id}")
                room.remove(ws)

                # notify the room
                msg = schemas.StaffLeftRoomEvent(type="StaffLeftRoom", data=schemas.StaffLeftRoomPayload(room_id=room_id, staff_id=staff_id))
                await self.send_to_room(room_id, msg)
        
        self.staffs.discard(staff_id) 
        print("[Pool][unregister_staff] staff unregistered")
    
    async def remove_conn(self, ws: WebSocket):
        id = None
        for key, value in list(self.connections.items()):
            if value == ws:
                print(f"[Pool][remove_conn] Found ws in connections list with id: {key}")
                id = key
                del self.connections[key]
        
        
        is_staff = id in self.staffs
        if is_staff:
            print(f"[Pool][remove_conn] ws is a staff")
            self.staffs.remove(id)
        else:
            print(f"[Pool][remove_conn] ws is not a staff")

        # remove id from rooms
        for key, room in list(self.rooms.items()):
            try:
                # .remove raises error if element does not exist in set
                if ws in room:
                    print(f"[Pool][remove_conn] ws found in the room with id: {key}")
                    room.remove(ws)
                else:
                    raise Exception

                room_id = key
                # notify the room that this has left
                if is_staff:
                    msg = schemas.StaffLeftRoomEvent(type="StaffLeftRoom", data=schemas.StaffLeftRoomPayload(room_id=room_id, staff_id=id))
                    await self.send_to_room(room_id, msg)
                else:
                    msg = schemas.GuestLeftRoomEvent(type="GuestLeftRoom", data=schemas.GuestLeftRoomPayload(room_id=room_id, guest_id=id))
                    await self.send_to_room(room_id, msg)
            except Exception as e:
                print(e)
                print(f"[Pool][remove_conn] ws not found in room with id: {key}")
            