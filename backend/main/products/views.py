from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import ProductSerializer, CategorySerializer
from .models import Product, Category
from .filters import ProductFilterset

class ProductsListView(ListAPIView):
    serializer_class=ProductSerializer
    filter_backends=[DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class=ProductFilterset
    search_fields = ["name", "description"]
    ordering_fields = ["price"]

    def get_queryset(self):
        return Product.objects.select_related('category').all()

class ProductDetailView(RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class=ProductSerializer
    lookup_field='id'
    lookup_url_kwarg='id'

    def get_queryset(self):
        return Product.objects.select_related('category').all()

class CategoryListView(ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer