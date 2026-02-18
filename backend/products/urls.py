from django.urls import path
from .views import ProductsListView, CategoryListView, ProductDetailView

urlpatterns = [
    path('products/', ProductsListView.as_view(), name='products-list'),
    path('products/<str:id>/', ProductDetailView.as_view(), name='product-detail'),
    path('categories/', CategoryListView.as_view(), name='categories-list'),
]