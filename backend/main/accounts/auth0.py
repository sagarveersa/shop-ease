import requests 
import jwt

from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

JWKS_URL = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
print(f"JWKS_URL: {JWKS_URL}")

def get_jwks():
    response = requests.get(JWKS_URL)
    if response.status_code != 200:
        raise AuthenticationFailed("Unable to fetch JWKS")
    return response.json()["keys"]

def decode_auth0_token(token):
    # print(f"Decoding token: {token}")
    # print(f"Using JWKS URL: {JWKS_URL}")
    jwks = get_jwks()
    # print(f"JWKS keys: {jwks}")
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception as e:
        # token is not a JWT or malformed
        raise AuthenticationFailed(f"Invalid token format: {str(e)}")

    kid = unverified_header.get("kid")
    if not kid:
        # header exists but lacks kid field
        raise AuthenticationFailed("Token header missing 'kid'")

    rsa_key = {}
    for key in jwks:
        if key.get("kid") == kid:
            rsa_key = {
                "kty": key.get("kty"),
                "kid": key.get("kid"),
                "use": key.get("use"),
                "n": key.get("n"),
                "e": key.get("e"),
            }
    if not rsa_key:
        raise AuthenticationFailed("Unable to find appropriate key")
    
    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.API_AUDIENCE,
            issuer=f"https://{settings.AUTH0_DOMAIN}/"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token has expired")
    except jwt.JWTClaimsError:
        raise AuthenticationFailed("Incorrect claims, please check the audience and issuer")
    except Exception as e:
        raise AuthenticationFailed(f"Unable to parse authentication token: {str(e)}")