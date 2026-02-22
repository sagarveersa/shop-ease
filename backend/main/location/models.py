from django.db import models

class Country(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=2)

    def __str__(self):
        return self.name

class Province(models.Model):
    name = models.CharField(max_length=255)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)

    class Meta:
        models.UniqueConstraint(
            fields=["name", "country"],
            name="state_country_unique_constraint"
        )

    def __str__(self):
        return self.name

class City(models.Model):
    name = models.CharField(max_length=255)
    province = models.ForeignKey(Province, on_delete=models.CASCADE)

    class Meta:
        models.UniqueConstraint(
            fields=["name", "state"],
            name="city_state_unique_constraint"
        )

    def __str__(self):
        return self.name

class Address(models.Model):
    """
    Address is a historical record kind of an archive and once a record is set it should not change even if 
    related data changes.
    """
    country = models.ForeignKey(Country, on_delete=models.PROTECT)
    province = models.ForeignKey(Province, on_delete=models.PROTECT)
    city = models.ForeignKey(City, on_delete=models.PROTECT)

    address_line = models.TextField()
    pincode = models.CharField(max_length=255)


