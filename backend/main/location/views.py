from django.shortcuts import render
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from .serializers import CitySerializer, CountrySerializer, ProvinceSerializer
from .models import Country, Province, City

class CountryView(ListAPIView):
    serializer_class = CountrySerializer
    queryset = Country.objects.all()

class ProvinceView(ListAPIView):
    
    def list(self, request, *args, **kwargs):
        serializer = ProvinceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        provinces = Province.objects.filter(country=serializer.validated_data['country'])

        serializer = ProvinceSerializer(instance=provinces, many=True)
        return Response(serializer.data)

class CityView(ListAPIView):
    def list(self, request, *args, **kwargs):
        serializer = CitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cities = City.objects.filter(province=serializer.validated_data['province'])
        serializer=CitySerializer(instance=cities, many=True)

        return Response(serializer.data)