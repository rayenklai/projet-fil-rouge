from fastapi import APIRouter, HTTPException, status, Depends
from beanie import PydanticObjectId
from datetime import datetime
from typing import List
from app.models.models import Task, Project, User, Notification
from app.schemas.schemas import TaskCreate, TaskUpdate, TaskOut
from app.auth import get_current_user

router = APIRouter()


def _task_out(t: Task) -> dict:
    return {
        "id":          str(t.id),
        "titre":       t.titre,
        "description": t.description,
        "statut":      t.statut,
        "project_id":  str(t.project_id),
        "assignee_id": str(t.assignee_id) if t.assignee_id else None,
        "created_at":  t.created_at,
    }


async def _check_access(project_id: PydanticObjectId, user: User) -> Project:
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    if user.role != "enseignant" and user.id not in project.member_ids:
        raise HTTPException(status_code=403, detail="Accès refusé à ce projet")
    return project


# ── US2 : Créer et assigner une tâche ────────────────────────────────────────
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
):
    pid = PydanticObjectId(task_in.project_id)
    project = await _check_access(pid, current_user)

    # Verify assignee is a project member
    if task_in.assignee_id:
        aid = PydanticObjectId(task_in.assignee_id)
        if aid not in project.member_ids:
            raise HTTPException(status_code=400, detail="L'assigné doit être membre du projet")
    else:
        aid = None

    task = Task(
        titre       = task_in.titre,
        description = task_in.description,
        project_id  = pid,
        assignee_id = aid,
    )
    await task.insert()
    
    if aid:
        notif = Notification(
            user_id=aid,
            message=f"La tâche '{task.titre}' vous a été assignée dans le projet '{project.titre}'."
        )
        await notif.insert()

    return _task_out(task)


# ── Tâches d'un projet ────────────────────────────────────────────────────────
@router.get("/project/{project_id}")
async def list_tasks(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    await _check_access(PydanticObjectId(project_id), current_user)
    tasks = await Task.find(Task.project_id == PydanticObjectId(project_id)).to_list()
    return [_task_out(t) for t in tasks]


# ── US3 : Mettre à jour le statut d'une tâche ────────────────────────────────
@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
):
    task = await Task.get(PydanticObjectId(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="Tâche introuvable")

    await _check_access(task.project_id, current_user)

    old_assignee = task.assignee_id

    if task_update.statut is not None:
        task.statut = task_update.statut
    if task_update.titre is not None:
        task.titre = task_update.titre
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.assignee_id is not None:
        new_aid = PydanticObjectId(task_update.assignee_id)
        task.assignee_id = new_aid
        if new_aid != old_assignee:
            project = await Project.get(task.project_id)
            p_titre = project.titre if project else "un projet"
            notif = Notification(
                user_id=new_aid,
                message=f"La tâche '{task.titre}' vous a été assignée dans le projet '{p_titre}'."
            )
            await notif.insert()

    task.updated_at = datetime.utcnow()
    await task.save()
    return _task_out(task)


# ── Supprimer une tâche ────────────────────────────────────────────────────────
@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    task = await Task.get(PydanticObjectId(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    await _check_access(task.project_id, current_user)
    await task.delete()

