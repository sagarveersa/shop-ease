from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class ChatStatus(str, Enum):
    active = "active"
    resolved = "resolved"

class CustomerMessage(BaseModel):
    customer_name: str
    msg: str

class StaffMessage(BaseModel):
    staff_name: str
    msg: str