from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet

router = DefaultRouter()
router.register('', OrderViewSet, basename='orders')

urlpatterns = [
    path('orders/', include(router.urls), name='orders-viewset')
]