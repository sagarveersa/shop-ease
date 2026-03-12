from django.db import migrations


def forwards(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    for product in Product.objects.exclude(category__isnull=True).iterator():
        product.categories.add(product.category)


def backwards(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    for product in Product.objects.exclude(categories__isnull=True).iterator():
        category = product.categories.first()
        product.category = category
        product.save(update_fields=["category"])


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0002_add_categories_m2m"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
