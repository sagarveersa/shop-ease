from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from .serializers import OrderDetailSerializer, OrderCreateSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .tasks import send_order_confirmation_email
from django.core.mail import send_mail
from django.http import HttpResponse
from analytics.mixpanel import track_event

# Create your views here.
class OrderViewSet(ModelViewSet):
    http_method_names=["get", "post"]
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        if self.action=="create":
            return Order.objects.filter(user=self.request.user)
        
        elif self.action in ["list", "cancel"]: 
            return Order.objects.prefetch_related('items', 'items__product').filter(user=self.request.user)

    def get_serializer_class(self):

        if self.action == "create":
            return OrderCreateSerializer

        return OrderDetailSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = self.perform_create(serializer, request)

        # send mail 
        try:
            send_order_confirmation_email.delay(order.id)
        except:
            print('[OrderViewSet] Error sending task to celery')

        track_event(
            "Order Successfully Placed",
            {
                "distinct_id": str(request.user.id),
                "$user_id": str(request.user.id),
                "order_id": str(order.id),
                "total_amount": float(order.total_amount),
                "items_count": order.items.count(),
            },
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer, request):
        return serializer.save(user=request.user)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()

        if order.status in [Order.Status.CANCELLED, Order.Status.DELIVERED, Order.Status.SHIPPED]:
            return Response(
                {"detail": "Order cannot be cancelled at this stage."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status"])

        serializer = OrderDetailSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

        
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
