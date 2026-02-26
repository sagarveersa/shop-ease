from fastapi import FastAPI, WebSocket, Request, Depends, WebSocketDisconnect, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import engine, Base, get_db
from models import ChatRoom, ChatStatus, RoomMessage
from contextlib import asynccontextmanager
from websocket.pool import Pool
from websocket.handler import ws_handler
from jwt import decode_token
import uvicorn
from uuid import uuid4
from schemas import WsMessage
from pydantic import ValidationError, TypeAdapter
from sqlalchemy import select
from sqlalchemy.orm import Session
from uuid import UUID
import enum
import schemas

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print('Creating Pool...')
    app.state.pool = Pool()
    yield
    print("Shutting down")

app = FastAPI(lifespan=lifespan)
security = HTTPBearer()

@app.get('/api/chat/staff/rooms/')
async def get_staff_rooms(req: Request, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):

    token = credentials.credentials
    payload = decode_token(token)
    if not payload or not payload.get('is_staff'):
        return JSONResponse({"details": "Unauthorized"}, status_code=status.HTTP_401_UNAUTHORIZED)
    
    staff_id = payload.get('user_id')
    staff_name = payload.get('name')

    stmt = (
        select(ChatRoom)
        .where(
            ChatRoom.staff_id == staff_id,
        )
    )

    result = db.execute(stmt)
    sessions = result.scalars().all()
    return sessions

class ConnectionType(str, enum.Enum):
    STAFF = "staff"
    GUEST = "guest"

@app.websocket('/ws/')
async def websocket_customer(conn: WebSocket,  db: Session = Depends(get_db)):
    pool = conn.app.state.pool

    await conn.accept()
    await conn.send_text("websocket connected")

    ws_adaptor = TypeAdapter(WsMessage)

    try:
        while True:
            raw = await conn.receive_text()
            try:
                msg = ws_adaptor.validate_json(raw)
                await ws_handler(conn, pool, msg, db) 
            except ValidationError as e:
                await conn.send_json({
                    "type": "error",
                    "data": {
                        "errors": e.errors()
                    }
                })
    except WebSocketDisconnect: 
        await pool.remove_conn(conn)
        print("Client Disconnected") 


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8004, reload=True)

