from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "name", "email", "password")

    def create(self, validated_data):
        print(validated_data)
        password = validated_data.pop("password")
        name = validated_data.pop("name", "").split(" ")
        validated_data["first_name"] = name[0]
        if len(name) == 2:
            validated_data["last_name"] = name[1]

        print(validated_data)

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs["email"], password=attrs["password"])
        if not user or not user.is_active:
            raise serializers.ValidationError("Invalid credentials")

        refresh = RefreshToken.for_user(user)
        name = user.get_full_name()
        refresh["name"] = user.get_full_name()
        refresh["is_staff"] = user.is_staff

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "userID": str(user.id),
            "name": str(name),
            "isStaff": user.is_staff,
        }


class StaffLoginSerializer(LoginSerializer):
    def validate(self, attrs):
        payload = super().validate(attrs)
        if not payload.get("isStaff"):
            raise serializers.ValidationError("Only staff accounts can use this login.")
        return payload


class UserDetailSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    profile_img = serializers.SerializerMethodField()

    class Meta:
        model = User
        exclude = ("password", "first_name", "last_name")

    def get_name(self, obj):
        return obj.get_full_name()

    def get_profile_img(self, obj):
        return obj.auth0_picture


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("name",)

    def validate(self, attrs):
        if self.instance and self.instance.auth0_id and "name" in attrs:
            raise serializers.ValidationError(
                {"name": "Name is managed by Auth0 for this account."}
            )
        return attrs

    def update(self, instance, validated_data):
        name = validated_data.pop("name", None)

        if name is not None:
            name_parts = name.strip().split()
            instance.first_name = name_parts[0] if name_parts else ""
            instance.last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
            instance.save(update_fields=["first_name", "last_name"])

        return instance


class Auth0PayloadSerializer(serializers.Serializer):
    iss = serializers.CharField()
    sub = serializers.CharField()
    aud = serializers.JSONField()
    iat = serializers.IntegerField()
    exp = serializers.IntegerField()
    azp = serializers.CharField(required=False, allow_blank=True)
    scope = serializers.CharField(required=False, allow_blank=True)


class Auth0IDTokenPayloadSerializer(serializers.Serializer):
    sub = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField(required=False, allow_blank=True)
    picture = serializers.URLField(required=False, allow_blank=True)


class Auth0UserMappingSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("id", "email", "name")
        read_only_fields = ("id",)

    def create(self, validated_data):
        name = validated_data.pop("name", "").strip().split()
        if name:
            validated_data["first_name"] = name[0]
            if len(name) > 1:
                validated_data["last_name"] = " ".join(name[1:])

        user = User(**validated_data)
        user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        name = validated_data.pop("name", "").strip().split()
        if name:
            instance.first_name = name[0]
            if len(name) > 1:
                instance.last_name = " ".join(name[1:])

        instance.email = validated_data.get("email", instance.email)
        instance.save()
        return instance
