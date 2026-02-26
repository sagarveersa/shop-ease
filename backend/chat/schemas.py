from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from uuid import UUID
from typing import Literal, Annotated, Union

# Payloads

class RegisterStaff(BaseModel):
    token: str

class StartGuestRoom(BaseModel):
    guest_id: UUID

class RoomMessage(BaseModel):
    room_id: UUID 
    sender_id: UUID
    content: str

class TypingToggle(BaseModel):
    room_id: UUID

class RoomClosed(BaseModel):
    room_id: UUID

class RoomAssigned(BaseModel):
    """
    This is sent to the staff which is assigned to the room
    """
    room_id: UUID
    guest_id: UUID

class ErrorPayload(BaseModel):
    details: str

class SuccessPayload(BaseModel):
    details: str

class RoomCreatedPayload(BaseModel):
    room_id: UUID

class GuestLeftRoomPayload(BaseModel):
    room_id: UUID
    guest_id: UUID

class StaffLeftRoomPayload(BaseModel):
    room_id: UUID
    staff_id: UUID

class UnregisterStaffPayload(BaseModel):
    token: str
    

# Events
class RegisterStaffEvent(BaseModel):
    type: Literal["RegisterStaff"]
    data: RegisterStaff

class UnregisterStaffEvent(BaseModel):
    type: Literal["UnregisterStaff"]
    data: UnregisterStaffPayload

class StartGuestRoomEvent(BaseModel):
    type: Literal["StartGuestRoom"]
    data: StartGuestRoom

class RoomMessageEvent(BaseModel):
    type: Literal["RoomMessage"]
    data: RoomMessage

class TypingToggleEvent(BaseModel):
    type: Literal["TypingToggle"]
    data: TypingToggle

class RoomClosedEvent(BaseModel):
    type: Literal["RoomClosed"]
    data: RoomClosed

class RoomAssignedEvent(BaseModel):
    type: Literal["RoomAssigned"]
    data: RoomAssigned

class GuestLeftRoomEvent(BaseModel):
    type: Literal["GuestLeftRoom"]
    data: GuestLeftRoomPayload

class StaffLeftRoomEvent(BaseModel):
    type: Literal["StaffLeftRoom"]
    data: StaffLeftRoomPayload

class StaffAvailableEvent(BaseModel):
    type: Literal["StaffAvailable"]

class StaffNotAvailableEvent(BaseModel):
    type: Literal["StaffNotAvailable"]

# Responses
class ErrorResponse(BaseModel):
    type: Literal["Error"]
    data: ErrorPayload

class SuccessResponse(BaseModel):
    type: Literal["Success"]
    data: SuccessPayload

class RoomCreatedResponse(BaseModel):
    type: Literal["RoomCreated"]
    data: RoomCreatedPayload

# Websocket Message
WsMessage = Annotated[
    Union[ErrorResponse, RegisterStaffEvent, StartGuestRoomEvent, RoomMessageEvent, TypingToggleEvent, RoomAssignedEvent, RoomClosedEvent, StaffLeftRoomEvent, GuestLeftRoomEvent, StaffAvailableEvent, StaffNotAvailableEvent, UnregisterStaffEvent],
    Field(discriminator="type")
]