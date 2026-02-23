from fastapi import FastAPI, WebSocket, Request, Depends
from fastapi.responses import JSONResponse
from database import engine, Base, get_db
from models import ChatSession, ChatStatus
from schemas import ChatSessionCreate, ChatSessionOut

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.websocket('/ws/staff/{access_token}/')
async def websocket_staff(websocket: WebSocket, access_token: str):
    pass

@app.websocket('/ws/customer/{access_token}/')
async def websocket_customer(websocket: WebSocket, access_token: str):
    pass