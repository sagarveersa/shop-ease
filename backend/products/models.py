from django.db import models

# Create your models here.
class Categories(models.Model):
    name = models.CharField()

class Product(models.Model):
    name = models.CharField()
    category = models.ForeignKey(Categories, on_delete=models.SET_NULL)
    price = models.DecimalField(decimal_places=2)
    description = models.TextField()
