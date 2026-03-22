from django.db import transaction

from products.models import Product

from .models import InventoryRecord


class InsufficientStockError(Exception):
    def __init__(self, *, product_name, available_quantity):
        self.product_name = product_name
        self.available_quantity = available_quantity
        super().__init__(
            f"Only {available_quantity} item(s) available for {product_name}."
        )


def ensure_inventory_record(product):
    inventory_record, _ = InventoryRecord.objects.get_or_create(
        product=product,
        defaults={"quantity_available": product.stock},
    )
    return inventory_record


def get_available_stock(product):
    inventory_record = getattr(product, "inventory", None)
    if inventory_record is not None:
        return inventory_record.quantity_available

    return ensure_inventory_record(product).quantity_available


def sync_product_stock_cache(*, product_id, quantity_available):
    Product.objects.filter(id=product_id).update(stock=quantity_available)


@transaction.atomic
def set_inventory_quantity(*, product, quantity_available):
    product = Product.objects.select_for_update().get(id=product.id)
    inventory_record, _ = InventoryRecord.objects.select_for_update().get_or_create(
        product=product,
        defaults={"quantity_available": product.stock},
    )
    inventory_record.quantity_available = quantity_available
    inventory_record.save(update_fields=["quantity_available", "updated_at"])
    sync_product_stock_cache(
        product_id=product.id,
        quantity_available=quantity_available,
    )
    inventory_record.refresh_from_db()
    return inventory_record


def reserve_stock_for_items(*, items_data):
    normalized_quantities = {}
    ordered_product_ids = []

    for item in items_data:
        product_id = str(item["product_id"])
        if product_id not in normalized_quantities:
            normalized_quantities[product_id] = 0
            ordered_product_ids.append(product_id)
        normalized_quantities[product_id] += item["quantity"]

    inventory_map = {}
    inventory_records = (
        InventoryRecord.objects.select_for_update()
        .select_related("product")
        .filter(product_id__in=ordered_product_ids)
        .order_by("product_id")
    )
    for inventory_record in inventory_records:
        inventory_map[str(inventory_record.product_id)] = inventory_record

    for product_id in ordered_product_ids:
        if product_id in inventory_map:
            continue

        product = Product.objects.select_for_update().get(id=product_id)
        inventory_record, created = InventoryRecord.objects.get_or_create(
            product=product,
            defaults={"quantity_available": product.stock},
        )
        if not created:
            inventory_record = (
                InventoryRecord.objects.select_for_update()
                .select_related("product")
                .get(id=inventory_record.id)
            )
        inventory_map[product_id] = inventory_record

    for product_id, requested_quantity in normalized_quantities.items():
        inventory_record = inventory_map[product_id]
        if requested_quantity > inventory_record.quantity_available:
            raise InsufficientStockError(
                product_name=inventory_record.product.name,
                available_quantity=inventory_record.quantity_available,
            )

    for product_id, requested_quantity in normalized_quantities.items():
        inventory_record = inventory_map[product_id]
        inventory_record.quantity_available -= requested_quantity
        inventory_record.save(update_fields=["quantity_available", "updated_at"])
        sync_product_stock_cache(
            product_id=inventory_record.product_id,
            quantity_available=inventory_record.quantity_available,
        )

    reserved_items = []
    for item in items_data:
        inventory_record = inventory_map[str(item["product_id"])]
        reserved_items.append(
            {
                "product": inventory_record.product,
                "quantity": item["quantity"],
            }
        )

    return reserved_items


def release_stock_for_items(*, items_data):
    normalized_quantities = {}
    ordered_product_ids = []

    for item in items_data:
        product_id = str(item["product_id"])
        if product_id not in normalized_quantities:
            normalized_quantities[product_id] = 0
            ordered_product_ids.append(product_id)
        normalized_quantities[product_id] += item["quantity"]

    inventory_map = {}
    inventory_records = (
        InventoryRecord.objects.select_for_update()
        .select_related("product")
        .filter(product_id__in=ordered_product_ids)
        .order_by("product_id")
    )
    for inventory_record in inventory_records:
        inventory_map[str(inventory_record.product_id)] = inventory_record

    for product_id in ordered_product_ids:
        if product_id in inventory_map:
            continue

        product = Product.objects.select_for_update().get(id=product_id)
        inventory_record, created = InventoryRecord.objects.get_or_create(
            product=product,
            defaults={"quantity_available": product.stock},
        )
        if not created:
            inventory_record = (
                InventoryRecord.objects.select_for_update()
                .select_related("product")
                .get(id=inventory_record.id)
            )
        inventory_map[product_id] = inventory_record

    for product_id, quantity_to_release in normalized_quantities.items():
        inventory_record = inventory_map[product_id]
        inventory_record.quantity_available += quantity_to_release
        inventory_record.save(update_fields=["quantity_available", "updated_at"])
        sync_product_stock_cache(
            product_id=inventory_record.product_id,
            quantity_available=inventory_record.quantity_available,
        )
