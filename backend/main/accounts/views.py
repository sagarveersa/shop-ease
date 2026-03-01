import secrets
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView

from .auth0 import (
    build_auth0_authorize_url,
    decode_auth0_token,
    exchange_auth0_code_for_tokens,
)
from .serializers import (
    Auth0IDTokenPayloadSerializer,
    LoginSerializer,
    StaffLoginSerializer,
    UserDetailSerializer,
    UserProfileUpdateSerializer,
    UserRegistrationSerializer,
)


class UserRegistrationView(CreateAPIView):
    serializer_class = UserRegistrationSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = LoginSerializer


class StaffTokenObtainPairView(TokenObtainPairView):
    serializer_class = StaffLoginSerializer


class CustomRefreshTokenView(TokenRefreshView):
    pass


class UserDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        serializer = UserProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserDetailSerializer(request.user).data)


def _split_name(full_name):
    name_parts = (full_name or "").strip().split()
    if not name_parts:
        return "", ""
    first_name = name_parts[0]
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
    return first_name, last_name


def _sync_user_from_auth0(user, email, name):
    first_name, last_name = _split_name(name)
    changed = False

    if email and user.email != email:
        user.email = email
        changed = True
    if first_name and user.first_name != first_name:
        user.first_name = first_name
        changed = True
    if last_name and user.last_name != last_name:
        user.last_name = last_name
        changed = True

    if changed:
        user.save(update_fields=["email", "first_name", "last_name"])


def _map_auth0_user(auth0_id, email, name):
    user_model = get_user_model()

    user = user_model.objects.filter(auth0_id=auth0_id).first()
    if user:
        _sync_user_from_auth0(user, email, name)
        return user

    existing_by_email = user_model.objects.filter(email=email).first()
    if existing_by_email:
        if existing_by_email.auth0_id and existing_by_email.auth0_id != auth0_id:
            raise ValueError("This email is already linked to a different Auth0 account.")

        existing_by_email.auth0_id = auth0_id
        first_name, last_name = _split_name(name)
        if first_name:
            existing_by_email.first_name = first_name
        if last_name:
            existing_by_email.last_name = last_name
        existing_by_email.save(update_fields=["auth0_id", "first_name", "last_name"])
        return existing_by_email

    first_name, last_name = _split_name(name)
    user = user_model(
        email=email,
        auth0_id=auth0_id,
        first_name=first_name,
        last_name=last_name,
    )
    user.set_unusable_password()
    user.save()
    return user


def _build_custom_jwt_payload(user):
    refresh = RefreshToken.for_user(user)
    refresh["name"] = user.get_full_name()
    refresh["is_staff"] = user.is_staff

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "userID": str(user.id),
        "name": user.get_full_name() or user.email.split("@")[0],
        "isStaff": user.is_staff,
    }


def _build_frontend_redirect(base_url, query_params):
    encoded_query = urlencode(query_params)
    separator = "&" if "?" in base_url else "?"
    return f"{base_url}{separator}{encoded_query}"


class Auth0AuthorizationStartView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        state = secrets.token_urlsafe(32)
        screen_hint = request.query_params.get("screen_hint")

        authorize_url = build_auth0_authorize_url(state=state, screen_hint=screen_hint)
        response = redirect(authorize_url)
        response.set_cookie(
            "auth0_oauth_state",
            state,
            max_age=600,
            httponly=True,
            samesite="Lax",
            secure=not settings.DEBUG,
        )
        return response


class Auth0AuthorizationCallbackView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        frontend_success_url = getattr(
            settings,
            "AUTH0_FRONTEND_SUCCESS_URL",
            "http://localhost:5173/login",
        )
        frontend_failure_url = getattr(
            settings,
            "AUTH0_FRONTEND_FAILURE_URL",
            "http://localhost:5173/login",
        )

        code = request.query_params.get("code")
        state = request.query_params.get("state")
        expected_state = request.COOKIES.get("auth0_oauth_state")

        if not code:
            response = redirect(
                _build_frontend_redirect(
                    frontend_failure_url,
                    {"oauth_error": "Authorization code is missing."},
                )
            )
            response.delete_cookie("auth0_oauth_state")
            return response

        if not state or not expected_state or state != expected_state:
            response = redirect(
                _build_frontend_redirect(
                    frontend_failure_url,
                    {"oauth_error": "Invalid OAuth state."},
                )
            )
            response.delete_cookie("auth0_oauth_state")
            return response

        try:
            token_response = exchange_auth0_code_for_tokens(code)
            decoded_id_token = decode_auth0_token(
                token_response["id_token"],
                audience=settings.AUTH0_CLIENT_ID,
            )

            payload_serializer = Auth0IDTokenPayloadSerializer(data=decoded_id_token)
            payload_serializer.is_valid(raise_exception=True)
            payload = payload_serializer.validated_data

            user = _map_auth0_user(
                auth0_id=payload["sub"],
                email=payload["email"],
                name=payload.get("name") or payload["email"].split("@")[0],
            )
            jwt_payload = _build_custom_jwt_payload(user)

            success_query = {
                "oauth_success": "1",
                "access_token": jwt_payload["access"],
                "refresh_token": jwt_payload["refresh"],
                "user_id": jwt_payload["userID"],
                "name": jwt_payload["name"],
                "is_staff": str(jwt_payload["isStaff"]).lower(),
            }
            response = redirect(_build_frontend_redirect(frontend_success_url, success_query))
        except Exception as exc:
            response = redirect(
                _build_frontend_redirect(
                    frontend_failure_url,
                    {"oauth_error": str(exc)},
                )
            )

        response.delete_cookie("auth0_oauth_state")
        return response
