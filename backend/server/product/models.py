from django.db import models
from django.utils import timezone
# Create your models here.


class Product(models.Model):
    # 移除 id 定義，讓 Django 自動處理
    number = models.CharField(max_length=50, default='')
    barcode = models.CharField(max_length=50, default='')
    qty = models.IntegerField(default=0)
    date = models.DateField(default=timezone.now)
    vender = models.CharField(max_length=10, default='')
    client = models.CharField(max_length=10, default='')
    category = models.CharField(max_length=20, default='')

    class Meta:
        db_table = "product"

    def __str__(self):
        return self.number
