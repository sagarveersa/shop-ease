from fastapi import WebSocket
from typing import List
from schemas import CustomerMessage, StaffMessage
import random

class WsStaffConnection:
    def __init__(self, ws: WebSocket, id: str, staff_id: str):
        self.ws = ws
        self.id = id 
        self.staff_id = staff_id

class WsCustomerConnection:
    def __init__(self, ws: WebSocket, id: str, customer_id: str):
        self.id = id 
        self.ws = ws
        self.customer_id = customer_id


class Pool:
    def __init__(self):
        self.staff_connections: List[WsStaffConnection] = []
        self.customer_connections: List[WsCustomerConnection] = []
    
    def add_staff(self, ws: WsStaffConnection):
        self.staff_connections.append(ws)
        print("[Pool] staff successfully registered")
    
    def add_customer(self, ws: WsCustomerConnection):
        self.customer_connections.append(ws)
        print("[Pool] customer successfully registered")
    
    def send_to_staff(self, msg: CustomerMessage, receiver_id: str):
        receiver_conn = None 
        for conn in self.staff_connections:
            if(conn.staff_id == receiver_id):
                receiver_conn = conn 
                break
    
        if receiver_conn is not None:
            text = msg.model_dump_json(indent=2)
            receiver_conn.ws.send_text(text)
    
    def send_to_customer(self, msg: StaffMessage, receiver_id: str):
        receiver_conn = None 
        for conn in self.customer_connections:
            if(conn.customer_id == receiver_id):
                receiver_conn = conn 
                break
    
        if receiver_conn is not None:
            text = msg.model_dump_json(indent=2)
            receiver_conn.ws.send_text(text)
    
    def get_staff(self):
       idx = random.randint(0, len(self.staff_connections)-1)
       return self.staff_connections[idx].staff_id
