from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .permissions import IsOwner
from .models import Cart
from .serializers import CartSerializer

class CartView(GenericAPIView, CreateModelMixin, ListModelMixin, RetrieveModelMixin):
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated, IsOwner]
    serializer_class=CartSerializer

    def get_queryset(self):
        return Cart.objects.select_related('product').filter(user=self.request.user)
    
    def get(self, request, *args, **kwargs):
        if "pk" in kwargs:
            return self.retrieve(request, *args, **kwargs)
        else:
            return self.list(request, *args, **kwargs)
    
    def post(self, request):
        serializer = CartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.request.user

        qs = self.get_queryset()
        try:
            cart_item = qs.get(user=user, product=serializer.validated_data['product'])
        except Cart.DoesNotExist:
            cart_item = None

        # check if the quantity is 0
        if serializer.validated_data['quantity'] == 0:
            # if cart item doesn't exist - return response 200 - idempotency
            if not cart_item:
                return Response({}, status=200)
            else:
                cart_item.delete()
                return Response({}, status=200)
        else:
            if not cart_item:
                # serializer was instantiated with data and hence .save() will run create method
                serializer.save(user=user)
            else:
                serializer = CartSerializer(cart_item, data=request.data, partial=True)
                serializer.is_valid()
                serializer.save(user=user)
     
            return Response(serializer.data, status=200)
    