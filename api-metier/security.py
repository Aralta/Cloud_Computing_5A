from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from uuid import UUID
import jwt

security = HTTPBearer()
SECRET_KEY = "SECRET_KEY_USERS_SERVICE"
ALGORITHM = "HS256"

def get_current_user(token=Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    