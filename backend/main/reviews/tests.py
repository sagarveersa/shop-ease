from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from products.models import Product

from .models import Review
from .services import create_review, delete_review


User = get_user_model()


class ReviewApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="reviewer@example.com",
            password="strong-password-123",
        )
        self.second_user = User.objects.create_user(
            email="reviewer-two@example.com",
            password="strong-password-123",
        )
        self.product = Product.objects.create(
            name="Wireless Keyboard",
            price=Decimal("89.99"),
            description="Low-profile mechanical keyboard",
            stock=12,
        )

    def test_can_create_review_and_updates_product_metrics(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/reviews/",
            {
                "product_id": str(self.product.id),
                "rating": 5,
                "comment": "Excellent typing feel.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.product.refresh_from_db()
        self.assertEqual(self.product.rating_count, 1)
        self.assertEqual(self.product.avg_rating, 5)

    def test_review_list_can_be_filtered_by_product(self):
        create_review(user=self.user, product=self.product, rating=4, comment="Solid")
        other_product = Product.objects.create(
            name="Mouse Pad",
            price=Decimal("19.99"),
            description="Large desk mat",
            stock=20,
        )
        create_review(
            user=self.second_user,
            product=other_product,
            rating=3,
            comment="Decent",
        )

        response = self.client.get(f"/api/reviews/?product_id={self.product.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["rating"], 4)

    def test_duplicate_reviews_for_same_product_are_rejected(self):
        Review.objects.create(user=self.user, product=self.product, rating=4, comment="First")
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/reviews/",
            {
                "product_id": str(self.product.id),
                "rating": 5,
                "comment": "Second review",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("product_id", response.data)


class ReviewServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="signal@example.com",
            password="strong-password-123",
        )
        self.second_user = User.objects.create_user(
            email="signal-two@example.com",
            password="strong-password-123",
        )
        self.product = Product.objects.create(
            name="Desk Chair",
            price=Decimal("199.99"),
            description="Ergonomic support",
            stock=5,
        )

    def test_delete_review_recalculates_product_metrics(self):
        first_review = create_review(
            user=self.user,
            product=self.product,
            rating=5,
            comment="Very comfortable",
        )
        create_review(
            user=self.second_user,
            product=self.product,
            rating=3,
            comment="Pretty good",
        )

        self.product.refresh_from_db()
        self.assertEqual(self.product.rating_count, 2)
        self.assertEqual(self.product.avg_rating, 4)

        delete_review(review=first_review)
        self.product.refresh_from_db()

        self.assertEqual(self.product.rating_count, 1)
        self.assertEqual(self.product.avg_rating, 3)
