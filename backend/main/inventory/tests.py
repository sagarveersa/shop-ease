from decimal import Decimal

from django.test import TestCase

from products.models import Product

from .models import InventoryRecord
from .services import (
    InsufficientStockError,
    release_stock_for_items,
    reserve_stock_for_items,
    set_inventory_quantity,
)


class InventoryServiceTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Gaming Monitor",
            price=Decimal("299.99"),
            description="144Hz display",
            stock=6,
        )

    def test_set_inventory_quantity_updates_product_stock_cache(self):
        inventory_record = set_inventory_quantity(product=self.product, quantity_available=4)

        self.product.refresh_from_db()
        self.assertEqual(inventory_record.quantity_available, 4)
        self.assertEqual(self.product.stock, 4)

    def test_reserve_stock_for_items_reduces_inventory(self):
        InventoryRecord.objects.create(product=self.product, quantity_available=5)

        reserved_items = reserve_stock_for_items(
            items_data=[{"product_id": str(self.product.id), "quantity": 2}]
        )

        self.product.refresh_from_db()
        inventory_record = InventoryRecord.objects.get(product=self.product)
        self.assertEqual(len(reserved_items), 1)
        self.assertEqual(inventory_record.quantity_available, 3)
        self.assertEqual(self.product.stock, 3)

    def test_reserve_stock_for_items_raises_when_not_enough_stock(self):
        InventoryRecord.objects.create(product=self.product, quantity_available=1)

        with self.assertRaises(InsufficientStockError):
            reserve_stock_for_items(
                items_data=[{"product_id": str(self.product.id), "quantity": 2}]
            )

    def test_release_stock_for_items_increases_inventory(self):
        InventoryRecord.objects.create(product=self.product, quantity_available=2)

        release_stock_for_items(
            items_data=[{"product_id": str(self.product.id), "quantity": 3}]
        )

        self.product.refresh_from_db()
        inventory_record = InventoryRecord.objects.get(product=self.product)
        self.assertEqual(inventory_record.quantity_available, 5)
        self.assertEqual(self.product.stock, 5)
