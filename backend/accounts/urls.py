from django.urls import path
from .views import UserRegistrationView, CustomRefreshTokenView, CustomTokenObtainPairView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', CustomRefreshTokenView.as_view(), name='token-refresh'),
]