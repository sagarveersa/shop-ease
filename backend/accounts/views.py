from rest_framework.response import Response
from rest_framework.generics import CreateAPIView
from rest_framework.views import APIView, ListAPIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .serializers import UserRegistrationSerializer, LoginSerializer, UserDetailSerializer, AvailableRegionsSerializers

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

class AvailableRegionsView(ListAPIView):
    serializer_class=AvailableRegionsSerializers
    
class ProfileViewSet(ModelViewSet):
    serializer_class = [] 
    

