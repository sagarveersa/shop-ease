from django.urls import path
from .views import (
    Auth0AuthorizationCallbackView,
    Auth0AuthorizationStartView,
    UserRegistrationView,
    CustomRefreshTokenView,
    CustomTokenObtainPairView,
    StaffTokenObtainPairView,
    UserDetailView,
)

urlpatterns = [
    path('accounts/register/', UserRegistrationView.as_view(), name='register'),
    path('accounts/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('accounts/staff/login/', StaffTokenObtainPairView.as_view(), name='staff-login'),
    path('accounts/token/refresh/', CustomRefreshTokenView.as_view(), name='token-refresh'),
    path('accounts/profile/', UserDetailView.as_view(), name='user-details'),
    path('accounts/oauth/authorize/', Auth0AuthorizationStartView.as_view(), name='auth0-oauth-authorize'),
    path('accounts/oauth/token/', Auth0AuthorizationCallbackView.as_view(), name='auth0-oauth-token'),
]
