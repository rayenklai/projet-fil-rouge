from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import TaskStatus


# ── Auth ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    nom:      str
    prenom:   str
    email:    EmailStr
    password: str
    role:     Optional[str] = "etudiant"

class UserOut(BaseModel):
    id:     str
    nom:    str
    prenom: str
    email:  str
    role:   str

class UserListOut(BaseModel):
    id:     str
    nom:    str
    prenom: str
    email:  str
    role:   str

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type:   str
    user:         UserOut


# ── Projects ────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    titre:       str
    description: Optional[str] = None
    date_debut:  Optional[datetime] = None
    date_fin:    Optional[datetime] = None
    enseignant_id: Optional[str] = None

class ProjectOut(BaseModel):
    id:          str
    titre:       str
    description: Optional[str]
    date_debut:  Optional[datetime]
    date_fin:    Optional[datetime]
    owner_id:    str
    member_ids:  List[str]
    enseignant_id: Optional[str] = None
    created_at:  datetime

class AddMemberRequest(BaseModel):
    user_id: str                             # MongoDB ObjectId as string


# ── Tasks ───────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    titre:       str
    description: Optional[str] = None
    project_id:  str
    assignee_id: Optional[str] = None

class TaskUpdate(BaseModel):
    statut:      Optional[TaskStatus] = None
    assignee_id: Optional[str] = None
    titre:       Optional[str] = None
    description: Optional[str] = None

class TaskOut(BaseModel):
    id:          str
    titre:       str
    description: Optional[str]
    statut:      TaskStatus
    project_id:  str
    assignee_id: Optional[str]
    created_at:  datetime


# ── Messages ────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    text: str

class MessageOut(BaseModel):
    id:            str
    project_id:    str
    sender_id:     str
    text:          str
    created_at:    datetime
    sender_nom:    str
    sender_prenom: str


# ── Notifications ───────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id:         str
    user_id:    str
    message:    str
    is_read:    bool
    created_at: datetime
