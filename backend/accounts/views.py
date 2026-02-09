from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .serializers import UserRegistrationSerializer, LoginSerializer

# Create your views here.

class UserRegistrationView(CreateAPIView):
    serializer_class=UserRegistrationSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = LoginSerializer

class CustomRefreshTokenView(TokenRefreshView):
    pass