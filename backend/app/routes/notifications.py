from fastapi import APIRouter, HTTPException, Depends
from beanie import PydanticObjectId
from app.models.models import Notification, User
from app.schemas.schemas import NotificationOut
from app.auth import get_current_user
from typing import List

router = APIRouter()

# ── Récupérer les notifications de l'utilisateur ──────────────────────────────
@router.get("/")
async def get_notifications(current_user: User = Depends(get_current_user)) -> List[NotificationOut]:
    notifications = await Notification.find(
        Notification.user_id == current_user.id
    ).sort("-created_at").limit(50).to_list()
    
    return [
        NotificationOut(
            id=str(notif.id),
            user_id=str(notif.user_id),
            message=notif.message,
            is_read=notif.is_read,
            created_at=notif.created_at
        )
        for notif in notifications
    ]

# ── Marquer une notification comme lue ────────────────────────────────────────
@router.patch("/{notif_id}/read")
async def mark_notification_as_read(
    notif_id: str,
    current_user: User = Depends(get_current_user)
):
    notif = await Notification.get(PydanticObjectId(notif_id))
    if not notif or notif.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    
    notif.is_read = True
    await notif.save()
    return {"message": "Notification lue"}

# ── Marquer toutes les notifications comme lues ───────────────────────────────
@router.patch("/read-all")
async def mark_all_as_read(current_user: User = Depends(get_current_user)):
    await Notification.find(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"$set": {"is_read": True}})
    
    return {"message": "Toutes les notifications ont été lues"}
