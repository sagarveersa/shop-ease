from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
from django.conf import settings as api_settings
from django.utils.translation import gettext_lazy as _
from .auth0 import decode_auth0_token

class Auth0JWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None 
        
        token = self.get_raw_token(header)
        if token is None:
            return None 
        
        validated_token = self.get_validated_token(token)

        return self.get_user(validated_token), validated_token
    
    def get_validated_token(self, raw_token):
        try:
            payload = decode_auth0_token(raw_token)
            return payload
        except Exception as e:
            raise InvalidToken(_("Invalid token: {0}".format(str(e))))
    
    def get_user(self, validated_token):
        try:
            auth0_id = validated_token['sub']
        except KeyError:
            raise InvalidToken(_("Token does not contain 'sub' claim"))
        
        try:
            user = self.user_model.objects.get(auth0_id=auth0_id)
        except self.user_model.DoesNotExist:
            raise AuthenticationFailed(_("User not found"), code="user_not_found")
        
        if api_settings.CHECK_USER_IS_ACTIVE and not user.is_active:
            raise AuthenticationFailed(_("User is inactive"), code="user_inactive")

        return user