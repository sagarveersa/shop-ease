from jose import jwt, JWTError
import base64
from config import settings

PUBLIC_KEY = base64.b64decode(settings.jwt_public_key_b64).decode()

def decode_token(token: str):
    try: 
        payload = jwt.decode(
            token,
            PUBLIC_KEY,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer
        )
        return payload 
    except JWTError:
        return None