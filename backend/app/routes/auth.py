from fastapi import APIRouter, HTTPException, status, Depends
from app.models.models import User
from app.schemas.schemas import UserCreate, UserOut, LoginRequest, TokenOut
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


def _user_out(user: User) -> dict:
    return {
        "id":     str(user.id),
        "nom":    user.nom,
        "prenom": user.prenom,
        "email":  user.email,
        "role":   user.role,
    }


# ── US4 : Inscription ───────────────────────────────────────────────────────
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    existing = await User.find_one(User.email == user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        nom      = user_in.nom,
        prenom   = user_in.prenom,
        email    = user_in.email,
        password = hash_password(user_in.password),
        role     = user_in.role,
    )
    await user.insert()
    return _user_out(user)


# ── US4 : Connexion ─────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenOut)
async def login(credentials: LoginRequest):
    user = await User.find_one(User.email == credentials.email)
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user":         _user_out(user),
    }


# ── Profil de l'utilisateur connecté ────────────────────────────────────────
@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return _user_out(current_user)


# ── Liste des utilisateurs (pour l'ajout de membres) ────────────────────────
@router.get("/users")
async def get_users(current_user: User = Depends(get_current_user)):
    users = await User.find(User.role == "etudiant").to_list()
    return [_user_out(u) for u in users]


# ── Liste des enseignants (pour assigner un enseignant à un projet) ─────────
@router.get("/enseignants")
async def get_enseignants(current_user: User = Depends(get_current_user)):
    users = await User.find(User.role == "enseignant").to_list()
    return [_user_out(u) for u in users]

