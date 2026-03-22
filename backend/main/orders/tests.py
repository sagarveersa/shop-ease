from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from cart.models import Cart
from products.models import Product


User = get_user_model()


class CheckoutViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="checkout@example.com",
            password="strong-password-123",
        )
        self.client.force_authenticate(user=self.user)
        self.product = Product.objects.create(
            name="Desk Lamp",
            price=Decimal("49.99"),
            description="Warm light",
            stock=10,
        )
        self.second_product = Product.objects.create(
            name="Wireless Mouse",
            price=Decimal("29.50"),
            description="Compact mouse",
            stock=8,
        )

    def test_cart_checkout_creates_order_and_clears_cart(self):
        Cart.objects.create(user=self.user, product=self.product, quantity=2)
        Cart.objects.create(user=self.user, product=self.second_product, quantity=1)

        response = self.client.post(
            "/api/checkout/",
            {
                "source": "cart",
                "shipping_address": "221B Baker Street",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(len(response.data["items"]), 2)
        self.assertEqual(Decimal(response.data["total_amount"]), Decimal("129.48"))
        self.assertFalse(Cart.objects.filter(user=self.user).exists())

    def test_buy_now_checkout_creates_single_item_order_without_clearing_cart(self):
        Cart.objects.create(user=self.user, product=self.second_product, quantity=3)

        response = self.client.post(
            "/api/checkout/",
            {
                "source": "buy_now",
                "product_id": str(self.product.id),
                "quantity": 2,
                "shipping_address": "742 Evergreen Terrace",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["items"][0]["quantity"], 2)
        self.assertEqual(Decimal(response.data["total_amount"]), Decimal("99.98"))
        self.assertEqual(Cart.objects.filter(user=self.user).count(), 1)

    def test_cart_checkout_rejects_empty_cart(self):
        response = self.client.post(
            "/api/checkout/",
            {"source": "cart"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["source"][0], "Cart is empty.")

    def test_buy_now_requires_product_and_quantity(self):
        response = self.client.post(
            "/api/checkout/",
            {"source": "buy_now"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("product_id", response.data)
        self.assertIn("quantity", response.data)

    def test_order_creation_is_not_available_through_orders_viewset(self):
        response = self.client.post(
            "/api/orders/",
            {
                "shipping_address": "Somewhere",
                "items": [
                    {
                        "product_id": str(self.product.id),
                        "quantity": 1,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
