from django.urls import path
from .views import UserRegistrationView, CustomRefreshTokenView, CustomTokenObtainPairView, UserDetailView

urlpatterns = [
    path('accounts/register/', UserRegistrationView.as_view(), name='register'),
    path('accounts/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('accounts/token/refresh/', CustomRefreshTokenView.as_view(), name='token-refresh'),
    path('accounts/profile/', UserDetailView.as_view(), name='user-details')
]