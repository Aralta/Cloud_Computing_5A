from pydantic import BaseModel, EmailStr

# --- RECEPTION (Ce que le front envoie) ---

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- ENVOI (Ce que l'API répond) ---

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    
    class Config:
        from_attributes = True

# Réponse spécifique pour le Login (Token + Info User)
class LoginResponse(BaseModel):
    accessToken: str
    user: UserResponse