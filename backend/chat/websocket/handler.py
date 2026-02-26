from schemas import WsMessage, ErrorResponse, ErrorPayload, SuccessResponse, SuccessPayload
from fastapi import WebSocket
from websocket.pool import Pool
from jwt import decode_token
from sqlalchemy.orm import Session
from models import ChatRoom, ChatStatus
from uuid import UUID
import schemas


async def register_staff_handler(ws: WebSocket, pool: Pool, msg: WsMessage):
    token = msg.data.token
    payload = decode_token(token)
    if not payload or not payload.get('is_staff'):
        error_msg = ErrorResponse(type="Error", data=ErrorPayload(details="Unauthorized"))
        await ws.send_json(error_msg.model_dump_json())
        return 
    
    staff_id = payload.get('user_id')
    await pool.register_staff(staff_id)
    pool.connect(staff_id, ws)

    success_msg = SuccessResponse(type="Success", data=SuccessPayload(details='Staff registered'))

    await ws.send_json(success_msg.model_dump_json())
    return

async def unregister_staff_handler(ws: WebSocket, pool: Pool, msg: WsMessage):
    token = msg.data.token
    payload = decode_token(token)
    if not payload or not payload.get('is_staff'):
        error_msg = ErrorResponse(type="Error", data=ErrorPayload(details="Unauthorized"))
        await ws.send_json(error_msg.model_dump_json())
        return 

    staff_id = payload.get('user_id')
    await pool.unregister_staff(staff_id, ws)


async def start_guest_room_handler(ws: WebSocket, pool: Pool, msg: WsMessage, db: Session):

    staff_id = pool.get_staff()
    if staff_id is None:
        print("No staff is available please wait...")
        response = schemas.StaffNotAvailableEvent(type="StaffNotAvailable")
        await ws.send_json(response.model_dump_json())

        pool.connect(msg.data.guest_id, ws)
        pool.add_guest_to_waitlist(msg.data.guest_id)
        return


    guest_id = msg.data.guest_id
    room = ChatRoom(guest_id=guest_id, staff_id=staff_id)
    db.add(room) # add to the session first
    db.commit() # insert into db
    db.refresh(room)
    
    # signal pool to add the staff to the room
    pool.assign_staff_to_room(room.id, staff_id)

    # add guest's ws connection to the connections set
    pool.connect(guest_id, ws)
    
    # add guest's ws to the room
    pool.join_room(room.id, ws)

    # send RoomAssigned message to staff
    room_assigned_msg = schemas.RoomAssignedEvent(type="RoomAssigned", data=schemas.RoomAssigned(room_id=room.id, guest_id=guest_id))
    await pool.send_to_room(room.id, room_assigned_msg, ws)

    response = schemas.RoomCreatedResponse(type="RoomCreated", data=schemas.RoomCreatedPayload(room_id=room.id))
    await ws.send_json(response.model_dump_json())

async def room_message_handler(ws: WebSocket, pool: Pool, msg: WsMessage):
    room_id = msg.data.room_id
    print(f"Message received for room with ID {room_id}: {type(room_id)}")
    await pool.send_to_room(room_id, msg, ws)

async def typing_toggle_handler(ws: WebSocket, pool: Pool, msg: WsMessage):
    room_id = msg.data.room_id
    await pool.send_to_room(room_id, msg, ws)


# Entry point handler
async def ws_handler(ws: WebSocket, pool: Pool, msg: WsMessage, db: Session):
    if msg.type == "RegisterStaff":
        await register_staff_handler(ws, pool, msg)
    elif msg.type == "StartGuestRoom":
        await start_guest_room_handler(ws, pool, msg, db)
    elif msg.type == "RoomMessage":
        await room_message_handler(ws, pool, msg)
    elif msg.type == "TypingToggle":
        await typing_toggle_handler(ws, pool, msg)
    elif msg.type == "UnregisterStaff":
        await unregister_staff_handler(ws, pool, msg)