from rest_framework import serializers
from django.conf import settings
from .models import Product, Photo, Cargo
import os


class CargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cargo
        fields = ['id', 'name']


class PhotoSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = ['id', 'path', 'url']

    def get_url(self, obj):
        """
        Return the full URL to access the photo.
        Uses PUBLIC_DOMAIN from settings or falls back to request host.
        """
        if not obj.path:
            return None

        # Get the public domain from environment or use request host
        public_domain = os.getenv('PUBLIC_DOMAIN', '')

        if public_domain:
            # Use the configured public domain
            media_path = obj.path.url  # e.g., /media/so123_1.png
            return f"{public_domain}{media_path}"
        else:
            # Fallback to request-based URL building
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.path.url)
            else:
                return obj.path.url


class ProductSerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(many=True, read_only=True)
    created_by_username = serializers.SerializerMethodField(read_only=True)
    cargo_name = serializers.SerializerMethodField(read_only=True)

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
    created_by = serializers.PrimaryKeyRelatedField(read_only=True, allow_null=True)
    cargo = serializers.PrimaryKeyRelatedField(queryset=Cargo.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Product
        fields = '__all__'

    def get_created_by_username(self, obj):
        """
        Return the username of the user who created this product.
        Returns 'Unknown' if no user is assigned.
        """
        if obj.created_by:
            return obj.created_by.username
        return 'Unknown'

    def get_cargo_name(self, obj):
        """
        Return the name of the cargo.
        Returns None if no cargo is assigned.
        """
        if obj.cargo:
            return obj.cargo.name
        return None
