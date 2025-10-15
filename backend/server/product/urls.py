from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.ProductListAPIView.as_view(), name='product-list'),
    path('products/<int:pk>/', views.product_detail, name='product-detail'),
    path('export/', views.get_all_products_for_export, name='export-products'),
    path('batch_update_status/', views.batch_update_status, name='batch-update-status'),
    path('scanner/', views.scanner_api, name='scanner-api'),
    path('find_so_number/', views.scanner_api, name='scanner_api'),
    path('cargos/', views.cargo_list, name='cargo-list'),
]
