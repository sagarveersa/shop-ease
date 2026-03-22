from django.contrib import admin

from .models import InventoryRecord


@admin.register(InventoryRecord)
class InventoryRecordAdmin(admin.ModelAdmin):
    list_display = ("product", "quantity_available", "updated_at")
    search_fields = ("product__name",)
