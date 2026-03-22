from rest_framework import serializers
from .models import OrderItem, Order
from django.db import transaction
from products.models import Product
from cart.models import Cart


def create_order_with_items(*, user, shipping_address, items_data):
    with transaction.atomic():
        order = Order.objects.create(
            user=user,
            shipping_address=shipping_address,
            total_amount=0,
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
                subtotal=price * quantity
            )

            total += price * quantity

        order.total_amount = total
        order.save(update_fields=["total_amount"])

    return order

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


class OrderCheckoutSerializer(serializers.Serializer):
    class Source:
        CART = "cart"
        BUY_NOW = "buy_now"
        CHOICES = (
            (CART, "Cart"),
            (BUY_NOW, "Buy now"),
        )

    source = serializers.ChoiceField(choices=Source.CHOICES)
    shipping_address = serializers.CharField(required=False, allow_blank=True, default="")
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        required=False,
    )
    quantity = serializers.IntegerField(required=False, min_value=1)

    def validate(self, attrs):
        user = self.context['request'].user
        source = attrs['source']

        if source == self.Source.CART:
            if attrs.get('product_id') is not None or attrs.get('quantity') is not None:
                raise serializers.ValidationError(
                    "Cart checkout does not accept product_id or quantity."
                )

            if not Cart.objects.filter(user=user).exists():
                raise serializers.ValidationError({"source": "Cart is empty."})

        if source == self.Source.BUY_NOW:
            if attrs.get('product_id') is None:
                raise serializers.ValidationError({"product_id": "This field is required."})

            if attrs.get('quantity') is None:
                raise serializers.ValidationError({"quantity": "This field is required."})

        return attrs

    def create(self, validated_data):
        user = validated_data['user']
        shipping_address = validated_data.get('shipping_address', "")
        source = validated_data['source']

        if source == self.Source.BUY_NOW:
            return create_order_with_items(
                user=user,
                shipping_address=shipping_address,
                items_data=[
                    {
                        "product_id": validated_data['product_id'].id,
                        "quantity": validated_data['quantity'],
                    }
                ],
            )

        with transaction.atomic():
            cart_items = list(
                Cart.objects.select_for_update()
                .select_related("product")
                .filter(user=user)
            )

            if not cart_items:
                raise serializers.ValidationError({"source": "Cart is empty."})

            order = create_order_with_items(
                user=user,
                shipping_address=shipping_address,
                items_data=[
                    {
                        "product_id": cart_item.product_id,
                        "quantity": cart_item.quantity,
                    }
                    for cart_item in cart_items
                ],
            )

            Cart.objects.filter(id__in=[cart_item.id for cart_item in cart_items]).delete()

        return order

class OrderUpdateSerializer(serializers.Serializer):
    pass
