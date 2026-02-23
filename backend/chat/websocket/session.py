from typing import Dict, List
from schemas import CustomerMessage, StaffMessage
from models import ChatSession, ChatStatus
from sqlalchemy.orm import Session
from sqlalchemy import select
from websocket.pool import Pool, WsStaffConnection, WsCustomerConnection

class SessionManager:
    def __init__(self):
        self.sessions: List[ChatSession]
        self.pool: Pool = Pool()
    
    def register_staff(self, ws: WsStaffConnection):
        self.pool.add_staff(ws)
    
    def register_customer(self, ws: WsCustomerConnection):
        self.pool.add_customer(ws)
    
    def send_to_staff(self, db: Session, msg: CustomerMessage, customer_id):
        session = self.get_session_by_customer_id(db, customer_id)
        if not session:
            session = self.create_session(db, customer_id)

        self.pool.send_to_staff(msg, session.staff_id)
        print("[SessionManager] message sent to staff")

    def send_to_customer(self, db: Session, msg: StaffMessage, customer_id: str):
        session = self.get_session_by_customer_id(db, customer_id)
        if not session:
            print("[SesssionManager] session with customer does not exist")
            return 

        self.pool.send_to_customer(msg, session.customer_id)
        print("[SessionManager] message sent to customer")

    def get_session_by_customer_id(self, db: Session, customer_id: str):
        # check if a session already exists or not
        for session in self.sessions:
            if session.customer_id == customer_id:
                return session
        
        # search for session in db
        stmt = (
           select(ChatSession)
           .where(
               ChatSession.customer_id == customer_id,
               ChatSession.status == ChatStatus.ACTIVE
           )
        )

        result = db.execute(stmt)
        session = result.scalars().one_or_none()

        if session is not None:
            self.sessions.append(session)
            return session
        
        return None
    
    def create_session(self, db: Session, customer_id: str): 
        session = self.get_session_by_customer_id(customer_id)
        if(session):
            return session

        # no session exist - create one
        staff_id = self.assign_staff()
        session = ChatSession(customer_id=customer_id, staff_id=staff_id, status=ChatStatus.ACTIVE)
        db.add(session)
        db.commit()
        db.refresh(session)
        self.sessions.append(session)
        return session
 
    def assign_staff(self):
        # pick a staff from pool
        return self.pool.get_staff()

    def remove_session(self, session_id):
        pass



        
