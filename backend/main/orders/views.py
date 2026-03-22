from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from .serializers import (
    OrderDetailSerializer,
    OrderCheckoutSerializer,
)
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .tasks import send_order_confirmation_email
from django.core.mail import send_mail
from django.http import HttpResponse
from analytics.mixpanel import track_event


def finalize_order_creation(*, order, user):
    try:
        send_order_confirmation_email.delay(order.id)
    except Exception:
        print('[OrderViewSet] Error sending task to celery')

    track_event(
        "Order Successfully Placed",
        {
            "distinct_id": str(user.id),
            "$user_id": str(user.id),
            "order_id": str(order.id),
            "total_amount": float(order.total_amount),
            "items_count": order.items.count(),
        },
    )

# Create your views here.
class OrderViewSet(ReadOnlyModelViewSet):
    http_method_names=["get", "post"]
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        if self.action in ["list", "retrieve", "cancel"]: 
            return Order.objects.prefetch_related('items', 'items__product').filter(user=self.request.user)

    def get_serializer_class(self):
        return OrderDetailSerializer

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


class CheckoutView(GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = OrderCheckoutSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(user=request.user)
        finalize_order_creation(order=order, user=request.user)

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )

        
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
