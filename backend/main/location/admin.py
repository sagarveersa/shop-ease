from django.contrib import admin
from .models import Address, Country, City, Province

# Register your models here.
admin.site.register(Address)
admin.site.register(Country)
admin.site.register(City)
admin.site.register(Province)
