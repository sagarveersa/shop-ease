from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0003_migrate_category_fk_to_m2m"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="product",
            name="category",
        ),
    ]
