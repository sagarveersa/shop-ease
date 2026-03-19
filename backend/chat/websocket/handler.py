from schemas import WsMessage, ErrorResponse, ErrorPayload, SuccessResponse, SuccessPayload
from fastapi import WebSocket
from websocket.pool import Pool
from jwt import decode_token
from sqlalchemy.orm import Session
from models import ChatRoom
import schemas


async def register_staff_handler(ws: WebSocket, pool: Pool, msg: WsMessage):
    token = msg.data.token
    payload = decode_token(token)
    if not payload or not payload.get("is_staff"):
        error_msg = ErrorResponse(type="Error", data=ErrorPayload(details="Unauthorized"))
        await ws.send_json(error_msg.model_dump_json())
        return

    staff_id = payload.get("user_id")
    staff_name = payload.get("name") or "Support staff"
    pool.connect(staff_id, ws)
    await pool.register_staff(staff_id, staff_name)

    success_msg = SuccessResponse(type="Success", data=SuccessPayload(details="Staff registered"))
    await ws.send_json(success_msg.model_dump_json())


async def unregister_staff_handler(ws: WebSocket, pool: Pool, msg: WsMessage):
    token = msg.data.token
    payload = decode_token(token)
    if not payload or not payload.get("is_staff"):
        error_msg = ErrorResponse(type="Error", data=ErrorPayload(details="Unauthorized"))
        await ws.send_json(error_msg.model_dump_json())
        return

    staff_id = payload.get("user_id")
    await pool.unregister_staff(staff_id, ws)


async def start_guest_room_handler(ws: WebSocket, pool: Pool, msg: WsMessage, db: Session):
    guest_id = msg.data.guest_id
    guest_name = msg.data.guest_name or "Guest user"
    staff_id = pool.get_staff()

    room = ChatRoom(guest_id=guest_id, staff_id=staff_id)
    db.add(room)
    db.commit()
    db.refresh(room)

    pool.add_room(room.id, guest_id, guest_name, ws)

    response = schemas.RoomCreatedResponse(
        type="RoomCreated",
        data=schemas.RoomCreatedPayload(
            room_id=room.id,
            staff_id=staff_id,
            staff_name=pool.get_staff_name(staff_id),
        ),
    )
    await ws.send_json(response.model_dump_json())

    if staff_id is None:
        print("No staff is available please wait...")
        pool.add_room_to_waitlist(room.id)
        waiting_response = schemas.StaffNotAvailableEvent(type="StaffNotAvailable")
        await ws.send_json(waiting_response.model_dump_json())
        return

    await pool.assign_staff_to_room(room.id, staff_id, pool.get_staff_name(staff_id))


async def room_message_handler(ws: WebSocket, pool: Pool, msg: WsMessage):
    room_id = msg.data.room_id
    print(f"Message received for room with ID {room_id}: {type(room_id)}")
    pool.store_room_message(room_id, msg)
    await pool.send_to_room(room_id, msg, ws)


async def typing_toggle_handler(ws: WebSocket, pool: Pool, msg: WsMessage):
    room_id = msg.data.room_id
    await pool.send_to_room(room_id, msg, ws)


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
