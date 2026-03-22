from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Review
from .serializers import ReviewSerializer


class ReviewListCreateView(ListCreateAPIView):
    authentication_classes = [JWTAuthentication]
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]

        return [AllowAny()]

    def get_queryset(self):
        queryset = Review.objects.select_related("user", "product").all()
        product_id = self.request.query_params.get("product_id")
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        return queryset
