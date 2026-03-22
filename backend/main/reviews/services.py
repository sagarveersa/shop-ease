from django.db import transaction
from django.db.models import Avg, Count

from products.models import Product

from .models import Review


def sync_product_review_metrics(*, product_id):
    Product.objects.select_for_update().get(id=product_id)
    aggregates = Review.objects.filter(product_id=product_id).aggregate(
        avg_rating=Avg("rating"),
        rating_count=Count("id"),
    )

    Product.objects.filter(id=product_id).update(
        avg_rating=float(aggregates["avg_rating"] or 0),
        rating_count=aggregates["rating_count"] or 0,
    )


@transaction.atomic
def create_review(*, user, product, rating, comment):
    review = Review.objects.create(
        user=user,
        product=product,
        rating=rating,
        comment=comment,
    )
    sync_product_review_metrics(product_id=product.id)
    return review


@transaction.atomic
def delete_review(*, review):
    product_id = review.product_id
    review.delete()
    sync_product_review_metrics(product_id=product_id)
