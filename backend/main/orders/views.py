from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from .serializers import OrderDetailSerializer, OrderCreateSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .tasks import send_order_confirmation_email
from django.core.mail import send_mail
from django.http import HttpResponse

# Create your views here.
class OrderViewSet(ModelViewSet):
    http_method_names=["get", "post"]
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        if self.action=="create":
            return Order.objects.filter(user=self.request.user)
        
        return Order.objects.prefetch_related('items', 'items__product').all()

    def get_serializer_class(self):

        if self.action == "create":
            return OrderCreateSerializer

        return OrderDetailSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = self.perform_create(serializer, request)

        # send mail 
        send_order_confirmation_email.delay(order.id)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer, request):
        return serializer.save(user=request.user)

        
def send_test_mail_view(request):

    result = send_mail(
    subject="SMTP Test",
    message="If you receive this, app password works.",
    from_email="remedix70@gmail.com",
    recipient_list=["sagar74822@gmail.com"],
    fail_silently=False,
    ) 

    if(result == 1):
        return HttpResponse("Email sent")
    else:
        return HttpResponse("Email not sent")