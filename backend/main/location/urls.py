from django.urls import path, include
from .views import CountryView, ProvinceView, CityView

urlpatterns = [
    path('location/countries/', CountryView.as_view(), name='countries-list' ),
    path('location/countries/provinces/', ProvinceView.as_view(), name='provinces-list'),
    path('location/countries/provinces/cities/', CityView.as_view(), name='cities-list')
]
