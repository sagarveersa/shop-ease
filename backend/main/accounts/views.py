import secrets
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
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

from .utils import _map_auth0_user, _build_custom_jwt_payload, _build_frontend_redirect


class UserRegistrationView(CreateAPIView):
    authentication_classes=[]
    permission_classes=[AllowAny]
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
                picture=payload.get("picture") or None,
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
