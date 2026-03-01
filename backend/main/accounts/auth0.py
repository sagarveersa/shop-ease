from functools import lru_cache
import json
from urllib.parse import urlencode

import jwt
import requests
from jwt.algorithms import RSAAlgorithm

from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

def _normalized_auth0_domain():
    domain = (getattr(settings, "AUTH0_DOMAIN", "") or "").strip()
    if not domain:
        raise AuthenticationFailed("AUTH0_DOMAIN is not configured")
    if domain.startswith("https://"):
        domain = domain[len("https://") :]
    return domain.rstrip("/")


def _auth0_oauth_token_url():
    return f"https://{_normalized_auth0_domain()}/oauth/token"


def _auth0_authorize_url():
    return f"https://{_normalized_auth0_domain()}/authorize"


def _auth0_client_id():
    client_id = (getattr(settings, "AUTH0_CLIENT_ID", "") or "").strip()
    if not client_id:
        raise AuthenticationFailed("AUTH0_CLIENT_ID is not configured")
    return client_id


def _auth0_client_secret():
    client_secret = (getattr(settings, "AUTH0_CLIENT_SECRET", "") or "").strip()
    if not client_secret:
        raise AuthenticationFailed("AUTH0_CLIENT_SECRET is not configured")
    return client_secret


def _jwks_url():
    return f"https://{_normalized_auth0_domain()}/.well-known/jwks.json"

@lru_cache(maxsize=1)
def get_jwks():
    try:
        response = requests.get(_jwks_url(), timeout=5)
        response.raise_for_status()
    except requests.exceptions.RequestException as exc:
        raise AuthenticationFailed(
            f"Unable to fetch JWKS from {_jwks_url()}: {str(exc)}"
        ) from exc

    keys = response.json().get("keys")
    if not keys:
        raise AuthenticationFailed("JWKS response did not contain keys")
    return keys


def build_auth0_authorize_url(state, screen_hint=None):
    callback_url = (getattr(settings, "AUTH0_CALLBACK_URL", "") or "").strip()
    if not callback_url:
        raise AuthenticationFailed("AUTH0_CALLBACK_URL is not configured")

    params = {
        "response_type": "code",
        "client_id": _auth0_client_id(),
        "redirect_uri": callback_url,
        "scope": (getattr(settings, "AUTH0_SCOPE", "") or "openid profile email").strip(),
        "state": state,
    }

    audience = (getattr(settings, "API_AUDIENCE", "") or "").strip()
    if audience:
        params["audience"] = audience

    if screen_hint in {"login", "signup"}:
        params["screen_hint"] = screen_hint

    return f"{_auth0_authorize_url()}?{urlencode(params)}"


def exchange_auth0_code_for_tokens(code):
    callback_url = (getattr(settings, "AUTH0_CALLBACK_URL", "") or "").strip()
    if not callback_url:
        raise AuthenticationFailed("AUTH0_CALLBACK_URL is not configured")

    payload = {
        "grant_type": "authorization_code",
        "client_id": _auth0_client_id(),
        "client_secret": _auth0_client_secret(),
        "code": code,
        "redirect_uri": callback_url,
    }

    try:
        response = requests.post(_auth0_oauth_token_url(), json=payload, timeout=8)
        response.raise_for_status()
    except requests.exceptions.RequestException as exc:
        details = "Auth0 token exchange failed"
        if exc.response is not None:
            details = exc.response.text or details
        raise AuthenticationFailed(details) from exc

    data = response.json()
    id_token = data.get("id_token")
    if not id_token:
        raise AuthenticationFailed("Auth0 response missing id_token")
    return data


def decode_auth0_token(token, audience=None):
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    jwks = get_jwks()
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception as e:
        raise AuthenticationFailed(f"Invalid token format: {str(e)}")

    kid = unverified_header.get("kid")
    if not kid:
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
        public_key = RSAAlgorithm.from_jwk(json.dumps(rsa_key))
        expected_audience = audience if audience is not None else settings.API_AUDIENCE
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=expected_audience,
            issuer=f"https://{_normalized_auth0_domain()}/",
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token has expired")
    except (jwt.InvalidAudienceError, jwt.InvalidIssuerError):
        raise AuthenticationFailed("Incorrect claims, please check the audience and issuer")
    except jwt.InvalidTokenError as exc:
        raise AuthenticationFailed(f"Invalid authentication token: {str(exc)}")
    except Exception as e:
        raise AuthenticationFailed(f"Unable to parse authentication token: {str(e)}")
