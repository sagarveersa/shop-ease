from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from urllib.parse import urlencode

def _split_name(full_name):
    name_parts = (full_name or "").strip().split()
    if not name_parts:
        return "", ""
    first_name = name_parts[0]
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
    return first_name, last_name


def _sync_user_from_auth0(user, email, name, picture):
    first_name, last_name = _split_name(name)
    update_fields = []

    if email and user.email != email:
        user.email = email
        update_fields.append("email")
    if first_name and user.first_name != first_name:
        user.first_name = first_name
        update_fields.append("first_name")
    if last_name and user.last_name != last_name:
        user.last_name = last_name
        update_fields.append("last_name")
    if picture is not None and user.auth0_picture != picture:
        user.auth0_picture = picture
        update_fields.append("auth0_picture")

    if update_fields:
        user.save(update_fields=update_fields)


def _map_auth0_user(auth0_id, email, name, picture=None):
    user_model = get_user_model()

    user = user_model.objects.filter(auth0_id=auth0_id).first()
    if user:
        _sync_user_from_auth0(user, email, name, picture)
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
        if picture is not None:
            existing_by_email.auth0_picture = picture

        existing_by_email.save(
            update_fields=["auth0_id", "first_name", "last_name", "auth0_picture"]
        )
        return existing_by_email

    first_name, last_name = _split_name(name)
    user = user_model(
        email=email,
        auth0_id=auth0_id,
        auth0_picture=picture,
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

