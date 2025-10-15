from django.db import models
from django.utils import timezone
from django.conf import settings
# Create your models here.


class Cargo(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "cargo"

    def __str__(self):
        return self.name


class Product(models.Model):
    # 移除 id 定義，讓 Django 自動處理
    number = models.CharField(max_length=50, default='', blank=True, null=True)
    barcode = models.CharField(max_length=50)  # 必填
    qty = models.IntegerField(default=0, blank=True, null=True)
    date = models.DateField()  # 必填
    vender = models.CharField(max_length=10, default='', blank=True, null=True)
    client = models.CharField(max_length=10, default='', blank=True, null=True)
    category = models.CharField(max_length=20, default='', blank=True, null=True)
    so_number = models.CharField(max_length=100)  # 必填
    weight = models.IntegerField(default=0, blank=True, null=True)
    noted = models.TextField(max_length=300, default='', blank=True, null=True)
    current_status = models.CharField(max_length=1, default='0', blank=True, null=True)  # 預設為 0:入庫
    ex_date = models.DateField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name='Created By'
    )
    cargo = models.ForeignKey(
        Cargo,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name='Cargo'
    )

    class Meta:
        db_table = "product"

    def __str__(self):
        return self.number

class Photo(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="photos")
    path = models.ImageField(upload_to='')

    class Meta:
        db_table = "photo"

    def __str__(self):
        return f"Photo for {self.product.number} at {self.path}"
