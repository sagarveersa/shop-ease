from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import BaseUserManager
from django.core.exceptions import ValidationError

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be provided")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email=email, password=password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

# class Country(models.Model):
#     name = models.CharField(max_length=255)
#     code = models.CharField(max_length=2)

# class Province(models.Model):
#     name = models.CharField(max_length=255)
#     country = models.ForeignKey(Country, on_delete=models.CASCADE)

#     class Meta:
#         models.UniqueConstraint(
#             fields=["name", "country"],
#             name="state_country_unique_constraint"
#         )

# class City(models.Model):
#     name = models.CharField(max_length=255)
#     state = models.ForeignKey(Province, on_delete=models.CASCADE)

#     class Meta:
#         models.UniqueConstraint(
#             fields=["name", "state"],
#             name="city_state_unique_constraint"
#         )

# class Address(models.Model):
#     """
#     Address is a historical record kind of an archive and once a record is set it should not change even if 
#     related data changes.
#     """
#     country = models.ForeignKey(Country, on_delete=models.PROTECT)
#     province = models.ForeignKey(Province, on_delete=models.PROTECT)
#     city = models.ForeignKey(Province, on_delete=models.PROTECT)

#     address_line = models.TextField()
#     pincode = models.CharField(max_length=255)

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    profile_img = models.CharField(max_length=255)
    # address = models.ManyToManyField(Address)