from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse
import io
import os
from beanie import PydanticObjectId
from typing import List
from app.models.models import Project, User, Task
from app.schemas.schemas import ProjectCreate, ProjectOut, AddMemberRequest, ProjectSubmit
from app.auth import get_current_user

router = APIRouter()


def _project_out(p: Project) -> dict:
    return {
        "id":          str(p.id),
        "titre":       p.titre,
        "description": p.description,
        "date_debut":  p.date_debut,
        "date_fin":    p.date_fin,
        "owner_id":    str(p.owner_id),
        "member_ids":  [str(m) for m in p.member_ids],
        "enseignant_id": str(p.enseignant_id) if p.enseignant_id else None,
        "final_link":  p.final_link,
        "final_file_name": p.final_file_name,
        "created_at":  p.created_at,
    }


# ── US1 : Créer un projet ────────────────────────────────────────────────────
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
):
    ens_id = PydanticObjectId(project_in.enseignant_id) if project_in.enseignant_id else None
    project = Project(
        titre       = project_in.titre,
        description = project_in.description,
        date_debut  = project_in.date_debut,
        date_fin    = project_in.date_fin,
        owner_id    = current_user.id,
        member_ids  = [current_user.id],     # creator is auto-member
        enseignant_id = ens_id,
    )
    await project.insert()
    return _project_out(project)


# ── Liste des projets ─────────────────────────────────────────────────────────
@router.get("/")
async def list_projects(current_user: User = Depends(get_current_user)):
    if current_user.role == "enseignant":
        projects = await Project.find_all().to_list()
    else:
        projects = await Project.find(
            Project.member_ids == current_user.id
        ).to_list()
    return [_project_out(p) for p in projects]


# ── Détail d'un projet ────────────────────────────────────────────────────────
@router.get("/{project_id}")
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await Project.get(PydanticObjectId(project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return _project_out(project)


# ── Ajouter un membre au projet ───────────────────────────────────────────────
@router.post("/{project_id}/members", status_code=status.HTTP_201_CREATED)
async def add_member(
    project_id: str,
    body: AddMemberRequest,
    current_user: User = Depends(get_current_user),
):
    project = await Project.get(PydanticObjectId(project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut ajouter des membres")

    new_member_id = PydanticObjectId(body.user_id)
    if new_member_id in project.member_ids:
        raise HTTPException(status_code=400, detail="L'utilisateur est déjà membre")

    # Verify user exists
    user = await User.get(new_member_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    project.member_ids.append(new_member_id)
    await project.save()
    return {"message": "Membre ajouté avec succès"}


# ── Membres d'un projet ────────────────────────────────────────────────────────
@router.get("/{project_id}/members")
async def list_members(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await Project.get(PydanticObjectId(project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    members = []
    for uid in project.member_ids:
        user = await User.get(uid)
        if user:
            members.append({
                "id":     str(user.id),
                "nom":    user.nom,
                "prenom": user.prenom,
                "email":  user.email,
            })
    return members


# ── Dashboard Enseignant (Statistiques) ─────────────────────────────────────────
@router.get("/dashboard/stats")
async def dashboard_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != "enseignant":
        raise HTTPException(status_code=403, detail="Accès réservé aux enseignants")

    projects = await Project.find_all().to_list()
    stats = []
    
    for p in projects:
        tasks = await Task.find(Task.project_id == p.id).to_list()
        total = len(tasks)
        todo = sum(1 for t in tasks if t.statut == "À faire")
        in_progress = sum(1 for t in tasks if t.statut == "En cours")
        done = sum(1 for t in tasks if t.statut == "Terminé")
        
        stats.append({
            "project": _project_out(p),
            "stats": {
                "total": total,
                "todo": todo,
                "in_progress": in_progress,
                "done": done
            }
        })
        
    return stats


# ── US5 : Exporter Rapport PDF ──────────────────────────────────────────────
@router.get("/{project_id}/report/pdf")
async def export_pdf(project_id: str, current_user: User = Depends(get_current_user)):
    try:
        from fpdf import FPDF
    except ImportError:
        raise HTTPException(status_code=500, detail="Librairie PDF non installée")
    
    project = await Project.get(PydanticObjectId(project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    
    if current_user.role != "enseignant" and current_user.id not in project.member_ids:
        raise HTTPException(status_code=403, detail="Accès refusé")

    tasks = await Task.find(Task.project_id == project.id).to_list()
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", size=16, style="B")
    
    safe_titre = project.titre.encode('latin-1', 'replace').decode('latin-1')
    pdf.cell(0, 10, txt=f"Rapport de Projet : {safe_titre}", ln=True, align="C")
    
    pdf.set_font("helvetica", size=12)
    pdf.ln(10)
    
    safe_desc = (project.description or 'Aucune').encode('latin-1', 'replace').decode('latin-1')
    pdf.multi_cell(0, 10, txt=f"Description : {safe_desc}")
    pdf.cell(0, 10, txt=f"Date de creation : {project.created_at.strftime('%d/%m/%Y')}", ln=True)
    if project.date_fin:
        pdf.cell(0, 10, txt=f"Date de fin : {project.date_fin.strftime('%d/%m/%Y')}", ln=True)
    
    pdf.ln(10)
    pdf.set_font("helvetica", size=14, style="B")
    pdf.cell(0, 10, txt="Avancement des taches", ln=True)
    
    todo = sum(1 for t in tasks if t.statut == "À faire")
    in_progress = sum(1 for t in tasks if t.statut == "En cours")
    done = sum(1 for t in tasks if t.statut == "Terminé")
    total = len(tasks)
    
    pdf.set_font("helvetica", size=12)
    pdf.cell(0, 10, txt=f"Total: {total}", ln=True)
    pdf.cell(0, 10, txt=f"A faire: {todo}", ln=True)
    pdf.cell(0, 10, txt=f"En cours: {in_progress}", ln=True)
    pdf.cell(0, 10, txt=f"Terminees: {done}", ln=True)
    
    pdf.ln(10)
    pdf.set_font("helvetica", size=14, style="B")
    pdf.cell(0, 10, txt="Liste des Membres", ln=True)
    pdf.set_font("helvetica", size=12)
    for uid in project.member_ids:
        user = await User.get(uid)
        if user:
            name = f"{user.prenom} {user.nom}".encode('latin-1', 'replace').decode('latin-1')
            pdf.cell(0, 10, txt=f"- {name} ({user.email})", ln=True)
            
    pdf_bytes = pdf.output(dest='S')
    
    return StreamingResponse(
        io.BytesIO(bytes(pdf_bytes)),
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=rapport_{project_id}.pdf"}
    )


# ── Supprimer un projet ────────────────────────────────────────────────────────
@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await Project.get(PydanticObjectId(project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le créateur peut supprimer le projet")
    
    await Task.find(Task.project_id == project.id).delete()
    from app.models.models import Message
    await Message.find(Message.project_id == project.id).delete()

    await project.delete()


# ── Retirer un membre du projet ───────────────────────────────────────────────
@router.delete("/{project_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: str,
    member_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await Project.get(PydanticObjectId(project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le créateur peut retirer des membres")
    
    mid = PydanticObjectId(member_id)
    if mid == project.owner_id:
        raise HTTPException(status_code=400, detail="Le créateur ne peut pas être retiré du projet")
        
    if mid in project.member_ids:
        project.member_ids.remove(mid)
        await project.save()
        
        tasks = await Task.find(Task.project_id == project.id, Task.assignee_id == mid).to_list()
        for t in tasks:
            t.assignee_id = None
            await t.save()

# ── Soumettre le lien du projet final ──────────────────────────────────────────
@router.patch("/{project_id}/submit", status_code=status.HTTP_200_OK)
async def submit_final_project(
    project_id: str,
    body: ProjectSubmit,
    current_user: User = Depends(get_current_user),
):
    project = await Project.get(PydanticObjectId(project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le créateur peut soumettre le projet final")
        
    project.final_link = body.final_link
    await project.save()
    
    return _project_out(project)


# ── Uploader un fichier final ─────────────────────────────────────────────────
@router.post("/{project_id}/upload", status_code=status.HTTP_200_OK)
async def upload_final_file(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    project = await Project.get(PydanticObjectId(project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le créateur peut uploader le projet final")
    
    # Save the file
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_name = f"{project_id}_{file.filename}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        
    project.final_file_path = file_path
    project.final_file_name = file.filename
    await project.save()
    
    return _project_out(project)


# ── Télécharger un fichier final ──────────────────────────────────────────────
@router.get("/{project_id}/download")
async def download_final_file(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await Project.get(PydanticObjectId(project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    # Check access
    if current_user.role != "enseignant" and current_user.id not in project.member_ids:
        raise HTTPException(status_code=403, detail="Accès refusé")
        
    if not project.final_file_path or not os.path.exists(project.final_file_path):
        raise HTTPException(status_code=404, detail="Fichier introuvable")
        
    return FileResponse(
        path=project.final_file_path, 
        filename=project.final_file_name,
        media_type="application/octet-stream"
    )
