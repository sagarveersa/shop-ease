import django_filters
from .models import Product, Category

class ProductFilterset(django_filters.FilterSet):
    # category = django_filters.CharFilter(field_name="category__name", lookup_expr="exact")
    # category = django_filters.ModelMultipleChoiceFilter(
    #     field_name="category",
    #     queryset=Category.objects.all(),
    #     to_field_name="name",
    # )
    category = django_filters.BaseInFilter(
        field_name="category__name",
        lookup_expr="in"
    )

    class Meta:
        model = Product
        fields = []

