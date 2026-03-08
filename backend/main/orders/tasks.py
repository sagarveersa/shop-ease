from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Order


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_order_confirmation_email(self, order_id):
    order = Order.objects.select_related("user").get(id=order_id)

    subject = "Order Confirmed 🎉"
    message = f"""
Hi {order.user.get_full_name() or order.user.email},

Your order of {order.total_amount} has been confirmed! 

Here are the details of your order:
- Order ID: {order.id}
- Total Amount: {order.total_amount}
- Products: {', '.join(item.product.name for item in order.items.all())}

Thank you for shopping with us!
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [order.user.email],
        fail_silently=False,
    )