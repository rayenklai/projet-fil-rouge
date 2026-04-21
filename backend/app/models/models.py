from beanie import Document, Link, PydanticObjectId
from pydantic import EmailStr, Field
from typing import Optional, List
from datetime import datetime
import enum


class TaskStatus(str, enum.Enum):
    todo        = "À faire"
    in_progress = "En cours"
    done        = "Terminé"


class User(Document):
    nom:        str
    prenom:     str
    email:      EmailStr
    password:   str                          # bcrypt hash
    role:       str = "etudiant"             # etudiant | enseignant
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"                       # MongoDB collection name
        indexes = ["email"]                  # unique index via beanie


class Project(Document):
    titre:       str
    description: Optional[str] = None
    date_debut:  Optional[datetime] = None
    date_fin:    Optional[datetime] = None
    owner_id:    PydanticObjectId           # ref → User._id
    member_ids:  List[PydanticObjectId] = [] # refs → User._id
    enseignant_id: Optional[PydanticObjectId] = None  # ref → User (enseignant)
    created_at:  datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "projects"


class Task(Document):
    titre:       str
    description: Optional[str] = None
    statut:      TaskStatus = TaskStatus.todo
    project_id:  PydanticObjectId           # ref → Project._id
    assignee_id: Optional[PydanticObjectId] = None  # ref → User._id
    created_at:  datetime = Field(default_factory=datetime.utcnow)
    updated_at:  Optional[datetime] = None

    class Settings:
        name = "tasks"


class Message(Document):
    project_id: PydanticObjectId
    sender_id:  PydanticObjectId
    text:       str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "messages"


class Notification(Document):
    user_id:    PydanticObjectId
    message:    str
    is_read:    bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"

