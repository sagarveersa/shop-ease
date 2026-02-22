from rest_framework import serializers
from .models import Product, Category

class ProductSerializer(serializers.ModelSerializer):
    category = serializers.ReadOnlyField(source='category.name')
    class Meta:
        model = Product
        fields = "__all__"

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"