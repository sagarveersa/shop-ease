from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .mixpanel import track_event


def _get_authenticated_user(request):
    if getattr(request, "user", None) and request.user.is_authenticated:
        return request.user

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None

    try:
        auth_result = JWTAuthentication().authenticate(request)
    except Exception:
        return None

    if not auth_result:
        return None

    user, _ = auth_result
    return user


class AnalyticsTrackView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        event = request.data.get("event")
        properties = request.data.get("properties", {})
        anonymous_id = request.data.get("anonymous_id")

        if not event or not isinstance(event, str):
            return Response(
                {"detail": "event is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(properties, dict):
            return Response(
                {"detail": "properties must be an object"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not anonymous_id or not isinstance(anonymous_id, str):
            return Response(
                {"detail": "anonymous_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = _get_authenticated_user(request)
        distinct_id = str(user.id) if user else anonymous_id

        full_properties = {
            "distinct_id": distinct_id,
            "anonymous_id": anonymous_id,
            **properties,
        }
        if user:
            full_properties["$user_id"] = str(user.id)

        if not track_event(event, full_properties):
            return Response(
                {"detail": "Mixpanel request failed"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({"status": "ok"}, status=status.HTTP_202_ACCEPTED)


class AnalyticsIdentifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        anonymous_id = request.data.get("anonymous_id")

        if not anonymous_id or not isinstance(anonymous_id, str):
            return Response(
                {"detail": "anonymous_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = _get_authenticated_user(request)
        if not user:
            return Response(
                {"detail": "authenticated user required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not track_event(
            "$identify",
            {
                "$identified_id": str(user.id),
                "$anon_id": anonymous_id,
            },
        ):
            return Response(
                {"detail": "Mixpanel request failed"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({"status": "ok"}, status=status.HTTP_202_ACCEPTED)
