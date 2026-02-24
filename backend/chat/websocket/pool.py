from fastapi import WebSocket
from typing import List, Dict
from schemas import WsMessage
import random
from uuid import UUID

class Pool:
    def __init__(self):
        self.connections: dict[UUID, WebSocket] = {}
        self.rooms: dict[UUID, set[WebSocket]] = {}
        self.staffs: set[UUID] = set()
    
    def connect(self, user_id: UUID, ws: WebSocket):
        self.connections[user_id] = ws

    def get_staff(self):
        if(len(self.staffs) == 0):
            return None
        staff_id = random.choice(tuple(self.staffs))
        return staff_id

    def assign_staff_to_room(self, room_id: UUID, staff_id: UUID):
        staff_ws = self.connections[staff_id]
        if not staff_ws:
            print("Staff ws connection not found")
            return

        self.rooms.setdefault(room_id, set()).add(staff_ws)
         
    def register_staff(self, staff_id):
        self.staffs.add(staff_id)
        print('[Pool] staff successfully registered')
    
    def remove_staff(self, staff_id):
        self.staffs.discard(staff_id)
        print('[Pool] staff removed')
    
    def join_room(self, room_id, ws: WebSocket):
        self.rooms.setdefault(room_id, set()).add(ws)
        print('[Pool] room is joined')

    def leave_room(self, room_id, ws: WebSocket):
        self.rooms[room_id].discard(ws)
        if not self.rooms[room_id]:
            del self.rooms[room_id]
        
        print('[Pool] room left')
    
    async def send_to_room(self, room_id: str, msg: WsMessage, sender: WebSocket):
        json_msg = msg.model_dump_json()
        for ws in self.rooms.get(room_id, []):
            if ws is not sender:
                try:
                    await ws.send_text(json_msg)
                except Exception:
                    print("Error occured when broadcasting msg")
                    pass

    
    async def send(self, receiver_id: UUID, msg: WsMessage):
        json_msg = msg.model_dump_json()
        try:
            self.connections[receiver_id].send_json(json_msg)
        except:
            print("Error sending message")