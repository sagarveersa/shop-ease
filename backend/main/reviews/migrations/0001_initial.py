from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0003_remove_profile_add_auth0_picture"),
        ("products", "0004_remove_category_fk"),
    ]

    operations = [
        migrations.CreateModel(
            name="Review",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("rating", models.PositiveSmallIntegerField()),
                ("comment", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="products.product")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="review",
            constraint=models.UniqueConstraint(fields=("user", "product"), name="unique_review_per_user_product"),
        ),
        migrations.AddConstraint(
            model_name="review",
            constraint=models.CheckConstraint(condition=models.Q(rating__gte=1, rating__lte=5), name="review_rating_between_1_and_5"),
        ),
    ]
