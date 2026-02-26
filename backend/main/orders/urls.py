from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, send_test_mail_view

router = DefaultRouter()
router.register('', OrderViewSet, basename='orders')

urlpatterns = [
    path('orders/', include(router.urls), name='orders-viewset'),
    path('mail/test/', send_test_mail_view)
]