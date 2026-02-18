from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product

User = get_user_model()

# Create your models here.
class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE) 
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                name="unique_user_product_constraint"
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.product.name}"