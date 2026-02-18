from django.db.models.signals import post_save
from django.contrib.auth import get_user_model
from django.dispatch import receiver

User = get_user_model()

@receiver(post_save, sender=User)
def profile_create(sender, instance, created, **kwargs):
    if created:
        print(f"User {instance} created!")
