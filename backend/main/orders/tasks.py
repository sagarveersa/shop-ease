from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Order


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_order_confirmation_email(self, order_id):
    order = Order.objects.select_related("user").get(id=order_id)

    subject = "Order Confirmed 🎉"
    message = f"""
Hi {order.user.username},

Your order #{order.id} has been placed successfully.

Thank you for shopping with us!
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [order.user.email],
        fail_silently=False,
    )