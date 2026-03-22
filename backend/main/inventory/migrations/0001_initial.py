from django.db import migrations, models
import django.db.models.deletion
import uuid


def backfill_inventory_records(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    InventoryRecord = apps.get_model("inventory", "InventoryRecord")

    inventory_records = []
    for product in Product.objects.all():
        inventory_records.append(
            InventoryRecord(
                product_id=product.id,
                quantity_available=product.stock,
            )
        )

    InventoryRecord.objects.bulk_create(inventory_records)


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("products", "0004_remove_category_fk"),
    ]

    operations = [
        migrations.CreateModel(
            name="InventoryRecord",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("quantity_available", models.PositiveIntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("product", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="inventory", to="products.product")),
            ],
        ),
        migrations.RunPython(backfill_inventory_records, migrations.RunPython.noop),
    ]
