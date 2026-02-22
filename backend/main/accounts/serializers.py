from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Profile

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    name = serializers.CharField(write_only=True)

    class Meta:
        model = User 
        fields = ('id', 'name', 'email', 'password')
    
    def create(self, validated_data):
        print(validated_data)
        password = validated_data.pop('password')
        name = validated_data.pop('name', '').split(" ")
        validated_data['first_name'] = name[0]
        if(len(name)==2):
            validated_data['last_name'] = name[1]

        print(validated_data)
        
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email=serializers.CharField(write_only=True)
    password=serializers.CharField(write_only=True)

    access=serializers.CharField(read_only=True)
    refresh=serializers.CharField(read_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs['email'], password=attrs['password'])
        if not user or not user.is_active:
            raise serializers.ValidationError("Invalid credentials")

        refresh = RefreshToken.for_user(user)        
        name = user.get_full_name()

        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'userID': str(user.id),
            'name': str(name)
        }

class UserDetailSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User 
        # fields = '__all__'
        exclude = ('password', 'first_name', 'last_name')
    
    def get_name(self, obj):
        return obj.get_full_name()