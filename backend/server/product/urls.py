from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.ProductListAPIView.as_view(), name='product-list'),
    path('products/<int:pk>/', views.product_detail, name='product-detail'),
    path('export/', views.get_all_products_for_export, name='export-products'),
]
