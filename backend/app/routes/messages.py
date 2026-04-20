from fastapi import APIRouter, HTTPException, status, Depends
from beanie import PydanticObjectId
from typing import List
from app.models.models import Message, Project, User
from app.schemas.schemas import MessageCreate, MessageOut
from app.auth import get_current_user

router = APIRouter()

# ── Envoyer un message dans un projet ──────────────────────────────────────────
@router.post("/project/{project_id}", status_code=status.HTTP_201_CREATED)
async def create_message(
    project_id: str,
    message_in: MessageCreate,
    current_user: User = Depends(get_current_user),
):
    pid = PydanticObjectId(project_id)
    project = await Project.get(pid)
    
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    
    if current_user.role != "enseignant" and current_user.id not in project.member_ids:
        raise HTTPException(status_code=403, detail="Accès refusé")

    message = Message(
        project_id=pid,
        sender_id=current_user.id,
        text=message_in.text
    )
    await message.insert()

    return {
        "id": str(message.id),
        "project_id": str(message.project_id),
        "sender_id": str(message.sender_id),
        "text": message.text,
        "created_at": message.created_at,
        "sender_nom": current_user.nom,
        "sender_prenom": current_user.prenom
    }

# ── Récupérer les messages d'un projet ─────────────────────────────────────────
@router.get("/project/{project_id}")
async def get_messages(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    pid = PydanticObjectId(project_id)
    project = await Project.get(pid)
    
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    
    if current_user.role != "enseignant" and current_user.id not in project.member_ids:
        raise HTTPException(status_code=403, detail="Accès refusé")

    messages = await Message.find(Message.project_id == pid).sort("created_at").to_list()
    
    # Enrichir avec les noms des expéditeurs
    out = []
    for msg in messages:
        sender = await User.get(msg.sender_id)
        out.append({
            "id": str(msg.id),
            "project_id": str(msg.project_id),
            "sender_id": str(msg.sender_id),
            "text": msg.text,
            "created_at": msg.created_at,
            "sender_nom": sender.nom if sender else "Inconnu",
            "sender_prenom": sender.prenom if sender else ""
        })
        
    return out
