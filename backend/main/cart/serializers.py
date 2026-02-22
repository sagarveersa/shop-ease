from rest_framework.serializers import ModelSerializer
from .models import Cart
from products.models import Product
from products.serializers import ProductSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class CartSerializer(ModelSerializer):
    # product = serializers.PrimaryKeyRelatedField(source='product.name', read_only=True)
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True)

    user = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = '__all__'
    
    def get_user(self, obj):
        print("Inside Serializer", obj)
        return obj.user.get_full_name()