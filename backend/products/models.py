from django.db import models

# Create your models here.
class Category(models.Model):
    class Meta:
        db_table = "categories"
    name = models.CharField(unique=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField()
    category = models.ForeignKey(Category, null=True, on_delete=models.SET_NULL)
    price = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.TextField()
    image_url = models.CharField(default="https://images.unsplash.com/photo-1505740420928-5e560c06d30e")
    
    # following fields are for caching
    avg_rating = models.FloatField(default=0) 
    rating_count = models.IntegerField(default=0)
    stock = models.IntegerField(default=0)

    def __str__(self):
        return self.name
