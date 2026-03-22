from django.db.models import Avg, Count
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from products.models import Product

from .models import Review


def sync_product_review_metrics(product_id):
    aggregates = Review.objects.filter(product_id=product_id).aggregate(
        avg_rating=Avg("rating"),
        rating_count=Count("id"),
    )

    Product.objects.filter(id=product_id).update(
        avg_rating=float(aggregates["avg_rating"] or 0),
        rating_count=aggregates["rating_count"] or 0,
    )


@receiver(post_save, sender=Review)
def update_product_reviews_after_save(sender, instance, **kwargs):
    sync_product_review_metrics(instance.product_id)


@receiver(post_delete, sender=Review)
def update_product_reviews_after_delete(sender, instance, **kwargs):
    sync_product_review_metrics(instance.product_id)
