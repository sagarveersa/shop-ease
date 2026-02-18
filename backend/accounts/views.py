from rest_framework.response import Response
from rest_framework.generics import CreateAPIView
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .serializers import UserRegistrationSerializer, LoginSerializer, UserDetailSerializer

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

class ProfileView():
    pass
