from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from .serializers.order_serializers import OrderDetailSerializer, OrderCreateSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import Order

# Create your views here.
class OrderViewSet(ModelViewSet):
    http_method_names=["get", "post"]
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def get_serializer_class(self):

        if self.action == "create":
            return OrderCreateSerializer

        return OrderDetailSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer, request)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer, request):
        serializer.save(user=request.user)


    
    