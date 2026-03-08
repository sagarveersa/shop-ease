from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_alter_user_options_user_auth0_id_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="auth0_picture",
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        migrations.DeleteModel(
            name="Profile",
        ),
    ]
