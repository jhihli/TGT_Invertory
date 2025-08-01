from rest_framework import serializers
from .models import Product, Photo


class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['id', 'path']


class ProductSerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(many=True, read_only=True)
    number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    vender = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    client = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    category = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    so_number = serializers.CharField(required=True, allow_blank=False, allow_null=False)
    barcode = serializers.CharField(required=True, allow_blank=False, allow_null=False)
    date = serializers.DateField(required=True, allow_null=False)
    weight = serializers.IntegerField(required=False, allow_null=True)
    noted = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    current_status = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ex_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = '__all__'
