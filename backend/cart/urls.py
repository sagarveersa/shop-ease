from django.urls import path, include
from .views import CartView


urlpatterns = [
    path('cart/', CartView.as_view(), name='cart-list-create'),
    path('cart/<str:pk>/', CartView.as_view(), name='cart-retrieve'),
]