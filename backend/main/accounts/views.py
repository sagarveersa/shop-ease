from rest_framework.response import Response
from rest_framework.generics import CreateAPIView
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from urllib3 import request
from .serializers import UserRegistrationSerializer, LoginSerializer, UserDetailSerializer, Auth0PayloadSerializer, Auth0UserMappingSerializer
from .auth0 import decode_auth0_token
from django.contrib.auth import get_user_model

# Create your views here.

class UserRegistrationView(CreateAPIView):
    serializer_class=UserRegistrationSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = LoginSerializer

class CustomRefreshTokenView(TokenRefreshView):
    pass

class UserDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

   
class ProfileViewSet(ModelViewSet):
    serializer_class = [] 
    
class UserMappingView(APIView):

    def post(self, request, *args, **kwargs):
        # Logic to create user mapping goes here
        try:
            token = request.headers.get('Authorization', '').split(' ')[1]  # Extract token from header
        except Exception as e:
            return Response({"details": f"Token missing: {str(e)}"}, status=400)
            
        decoded_token = None
        try:
            decoded_token = decode_auth0_token(token)
        except Exception as e:
            return Response({"details": f"Invalid token: {str(e)}"}, status=400)
        
        serializer = Auth0PayloadSerializer(data=decoded_token)
        if not serializer.is_valid():
            return Response({"details": "Invalid token payload"}, status=400)
        
        data = request.data
        serializer = Auth0UserMappingSerializer(data=data)
        try:
            if not serializer.is_valid():
                return Response({"details": "Invalid data"}, status=400)
        except Exception as e:
            return Response({"details": f"Invalid data: {str(e)}"}, status=400)

        serializer.save() 
        return Response({"message": "User mapping created successfully."}, status=201)

    def patch(self, request, *args, **kwargs):
        try:
            token = request.headers.get('Authorization', '').split(' ')[1]  # Extract token from header
        except Exception as e:
            return Response({"details": f"Token missing: {str(e)}"}, status=400)

        decoded_token = None
        try:
            decoded_token = decode_auth0_token(token)
        except Exception as e:
            return Response({"details": f"Invalid token: {str(e)}"}, status=400)

        serializer = Auth0PayloadSerializer(data=decoded_token)
        if not serializer.is_valid():
            return Response({"details": "Invalid token payload"}, status=400)

        data = request.data
        try:
            user = get_user_model().objects.get(auth0_id=decoded_token.get('sub'))
        except get_user_model().DoesNotExist:
            return Response({"details": "User not found"}, status=404) 

        serializer = Auth0UserMappingSerializer(user, data=data, partial=True)
        try:
            if not serializer.is_valid():
                return Response({"details": "Invalid data"}, status=400)
        except Exception as e:
            return Response({"details": f"Invalid data: {str(e)}"}, status=400)
        
        serializer.save()
        return Response({"message": "User mapping updated successfully."}, status=205)

    def get(self, request, *args, **kwargs):
        try:
            token = request.headers.get('Authorization', '').split(' ')[1]  # Extract token from header
        except Exception as e:
            return Response({"details": f"Token missing: {str(e)}"}, status=400)

        decoded_token = None
        try:
            decoded_token = decode_auth0_token(token)
        except Exception as e:
            return Response({"details": f"Invalid token: {str(e)}"}, status=400)

        serializer = Auth0PayloadSerializer(data=decoded_token)
        if not serializer.is_valid():
            return Response({"details": "Invalid token payload"}, status=400)

        auth0_id = decoded_token.get('sub')
        try:
            user = get_user_model().objects.get(auth0_id=auth0_id)
        except get_user_model().DoesNotExist:
            return Response({"details": "User mapping not found"}, status=404)

        user_serializer = UserDetailSerializer(user)
        return Response(user_serializer.data)
    
def authenticate_auth0_user(token):
    try:
        decoded_token = decode_auth0_token(token)
        auth0_id = decoded_token.get('sub')
        user = get_user_model().objects.get(auth0_id=auth0_id)
        return user
    except Exception as e:
        return None