from rest_framework import serializers
from .models import OrderItem, Order
from django.db import transaction
from products.models import Product

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.PrimaryKeyRelatedField(source='product.name', read_only=True)
    image_url = serializers.PrimaryKeyRelatedField(source='product.image_url', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'product_price', 'quantity', 'subtotal', 'image_url']

class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    # this uses reverse relationship

    class Meta:
        model = Order 
        fields = ["id", "status", "total_amount", "shipping_address", "created_at", "items"]

class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1)

class OrderCreateSerializer(serializers.Serializer):
    shipping_address = serializers.CharField()
    items = OrderItemCreateSerializer(many=True)

    def create(self, validated_data):
        user = validated_data.get('user')
        # user is being inserted in the APIView manually during .save(user=user) method call
        items_data = validated_data.pop('items')

        with transaction.atomic():
            order = Order.objects.create(
                user = user,
                shipping_address = validated_data['shipping_address'],
                total_amount=0
            )

            total = 0
            
            for item in items_data:
                product = Product.objects.select_for_update().get(
                    id=item['product_id']
                )

                price = product.price 
                quantity = item['quantity']

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    product_price=price,
                    quantity=quantity,
                    subtotal=price*quantity
                )

                total += price * quantity
            
            order.total_amount = total
            order.save(update_fields=["total_amount"])
        
        return order

class OrderUpdateSerializer(serializers.Serializer):
    pass
