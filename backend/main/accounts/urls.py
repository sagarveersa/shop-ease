from django.urls import path
from .views import UserRegistrationView, CustomRefreshTokenView, CustomTokenObtainPairView, UserDetailView, UserMappingView, authenticate_auth0_user

urlpatterns = [
    path('accounts/register/', UserRegistrationView.as_view(), name='register'),
    path('accounts/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('accounts/token/refresh/', CustomRefreshTokenView.as_view(), name='token-refresh'),
    path('accounts/profile/', UserDetailView.as_view(), name='user-details'),
    path('accounts/auth0/', UserMappingView.as_view(), name='auth0-register'),
    path('accounts/auth0/authenticate/', authenticate_auth0_user, name='auth0-authenticate'),
]
