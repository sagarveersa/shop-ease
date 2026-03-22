from rest_framework import serializers

from products.models import Product

from .models import Review
from .services import create_review


class ReviewSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source="product",
        write_only=True,
        required=False,
    )
    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "product_id",
            "product",
            "user_name",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "product", "user_name", "created_at", "updated_at"]

    def get_user_name(self, obj):
        full_name = obj.user.get_full_name().strip()
        if full_name:
            return full_name

        email = getattr(obj.user, "email", "")
        if email:
            return email.split("@")[0]

        return "Anonymous"

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.method == "POST":
            product = attrs.get("product")
            if product is None:
                raise serializers.ValidationError({"product_id": "This field is required."})

            if Review.objects.filter(user=request.user, product=product).exists():
                raise serializers.ValidationError(
                    {"product_id": "You have already reviewed this product."}
                )

        return attrs

    def create(self, validated_data):
        return create_review(user=self.context["request"].user, **validated_data)
