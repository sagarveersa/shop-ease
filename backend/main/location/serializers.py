from rest_framework import serializers
from .models import Address, Country, City, Province

class AddressSerializer(serializers.ModelSerializer):
    """
    Write:
        country: India
        province: Haryana
        city: Karnal
        address_line: "Gali No 47, Nissing"
        pincode: 132040
    
    Read: 
        same as write
    """
    country = serializers.SlugRelatedField(queryset=Country.objects.all(), slug_field='name')
    province = serializers.SlugRelatedField(queryset=Province.objects.all(), slug_field='name')
    city = serializers.SlugRelatedField(queryset=City.objects.all(), slug_field='name')

    class Meta:
        model = Address 
        fields = ('country', 'province', 'city', 'address_line', 'pincode')

class CountrySerializer(serializers.ModelSerializer): 
    class Meta:
        model = Country
        fields = ('id', 'name', )

class ProvinceSerializer(serializers.ModelSerializer):
    country = serializers.PrimaryKeyRelatedField(queryset=Country.objects.all(), write_only=True)

    class Meta:
        model = Province
        fields = ('id', 'name', 'country')
        read_only_fields = ('id', 'name')

class CitySerializer(serializers.ModelSerializer):
    province = serializers.PrimaryKeyRelatedField(queryset=Province.objects.all(), write_only=True)

    class Meta:
        model = City
        fields = ('id', 'name', 'province')
        read_only_fields=('id', 'name')