from rest_framework import serializers
from .models import Product, Category

class ProductSerializer(serializers.ModelSerializer):
    categories = serializers.SlugRelatedField(
        slug_field="name",
        many=True,
        read_only=True,
    )
    stock = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()

    def get_stock(self, obj):
        inventory_record = getattr(obj, "inventory", None)
        if inventory_record is not None:
            return inventory_record.quantity_available

        return obj.stock

    def get_is_in_stock(self, obj):
        return self.get_stock(obj) > 0

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "categories",
            "price",
            "description",
            "image_url",
            "avg_rating",
            "rating_count",
            "stock",
            "is_in_stock",
        ]

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"
