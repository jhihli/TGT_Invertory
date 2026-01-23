
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from .models import Product, Photo, Cargo
from .serializer import ProductSerializer, PhotoSerializer, CargoSerializer
from rest_framework import generics
from django.db.models import Sum, Q, Max, Max
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
from datetime import datetime
from django.conf import settings
import os
import re

# File validation helper functions
def sanitize_filename(filename):
    """
    Sanitize filename to prevent path traversal attacks
    Removes directory separators and other dangerous characters
    """
    # Remove any path components
    filename = os.path.basename(filename)
    # Remove any non-alphanumeric characters except dots, hyphens, and underscores
    filename = re.sub(r'[^\w\s\-\.]', '', filename)
    # Replace spaces with underscores
    filename = filename.replace(' ', '_')
    # Limit filename length
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]
    return name + ext

def validate_file_upload(file):
    """
    Validate uploaded file for security
    Returns tuple: (is_valid, error_message)
    """
    if not file:
        return False, 'No file provided'

    # Get allowed extensions from settings
    allowed_extensions = os.getenv('ALLOWED_FILE_EXTENSIONS', '.jpg,.jpeg,.png,.gif,.webp').split(',')
    allowed_extensions = [ext.strip().lower() for ext in allowed_extensions]

    # Check file extension
    file_ext = os.path.splitext(file.name)[1].lower()
    if file_ext not in allowed_extensions:
        return False, f'File type not allowed. Allowed types: {", ".join(allowed_extensions)}'

    # Check file size
    max_size = int(os.getenv('MAX_UPLOAD_SIZE', '10485760'))  # Default 10MB
    if file.size > max_size:
        return False, f'File size exceeds maximum allowed size of {max_size / (1024*1024):.1f}MB'

    # Validate file content (basic check)
    try:
        file.seek(0)  # Reset file pointer
        # Read first few bytes to check file signature
        header = file.read(12)
        file.seek(0)  # Reset again for later use

        # Check for common image file signatures
        image_signatures = {
            b'\xff\xd8\xff': 'jpg',
            b'\x89PNG\r\n\x1a\n': 'png',
            b'GIF87a': 'gif',
            b'GIF89a': 'gif',
            b'RIFF': 'webp',  # WebP files start with RIFF
        }

        is_valid_image = False
        for signature, img_type in image_signatures.items():
            if header.startswith(signature):
                is_valid_image = True
                break

        if not is_valid_image:
            return False, 'Invalid image file format'

    except Exception as e:
        return False, f'Error validating file: {str(e)}'

    return True, None

class HasValidAPIKey(BasePermission):
    """
    Custom permission to check if the request contains a valid API Key.
    The API Key should be passed in the X-API-Key header.
    """
    def has_permission(self, request, view):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return False
        valid_api_key = settings.SCANNER_API_KEY
        return api_key == valid_api_key

class IsAuthenticatedOrHasAPIKey(BasePermission):
    """
    Allow access if user is authenticated with JWT OR has valid API Key.
    This allows both website users (JWT) and scanner/API clients (API Key) to access endpoints.
    """
    def has_permission(self, request, view):
        # Check for API Key first
        api_key = request.headers.get('X-API-Key')
        if api_key:
            valid_api_key = settings.SCANNER_API_KEY
            if api_key == valid_api_key:
                return True

        # Fall back to JWT authentication
        return IsAuthenticated().has_permission(request, view)

def save_file_safely(file, so_number, idx):
    """
    Safely save uploaded file with validation
    Returns tuple: (success, filename_or_error)
    """
    # Validate file
    is_valid, error_msg = validate_file_upload(file)
    if not is_valid:
        return False, error_msg

    # Sanitize filename
    original_ext = os.path.splitext(file.name)[1].lower()
    safe_so_number = re.sub(r'[^\w\-]', '_', str(so_number))
    filename = f"{safe_so_number}_{idx}{original_ext}"

    # Get media root from settings
    images_dir = os.getenv('MEDIA_ROOT', r'D:\workplace\Images')
    os.makedirs(images_dir, exist_ok=True)

    file_path = os.path.join(images_dir, filename)

    # Check if file already exists and generate unique name if needed
    counter = 1
    base_filename = filename
    while os.path.exists(file_path):
        name, ext = os.path.splitext(base_filename)
        filename = f"{name}_{counter}{ext}"
        file_path = os.path.join(images_dir, filename)
        counter += 1

    try:
        # Save file securely
        with open(file_path, 'wb') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        return True, filename
    except Exception as e:
        return False, f'Error saving file: {str(e)}'

# Zebra Scanner API
@api_view(['POST'])
@permission_classes([HasValidAPIKey])
def scanner_api(request):
    """
    Zebra device product scan API
    入庫: action=inbound, 傳 date, barcode, so_number, weight, photos
    出貨: action=outbound, 傳 so_number, photos
    """
    action = request.data.get('action')
    if not action:
        return Response({'success': False, 'message': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

    # 新增 find_so_number 查詢
    if action == 'find_so_number':
        barcode = request.data.get('barcode', '')
        if not barcode:
            return Response({'success': False, 'message': 'barcode required'}, status=status.HTTP_400_BAD_REQUEST)
        product = Product.objects.filter(barcode=barcode).first()
        if not product:
            return Response({'success': False, 'message': 'not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'so_number': product.so_number})

    if action == 'inbound':
        # 入庫: 建立新產品
        data = request.data
        # 只取必要欄位
        product_data = {
            'date': data.get('date', ''),
            'barcode': data.get('barcode', ''),
            'so_number': data.get('so_number', ''),
            'number': data.get('number', ''),
            'vender': data.get('vender', ''),
            'weight': data.get('weight', ''),
            'current_status': '0',
            'noted': data.get('noted', ''),
        }
        serializer = ProductSerializer(data=product_data)
        if serializer.is_valid():
            # Auto-assign created_by based on username from request
            created_by_user = None
            username = data.get('created_by_username')

            if username:
                from account.models import CustomUser
                try:
                    created_by_user = CustomUser.objects.get(username=username)
                except CustomUser.DoesNotExist:
                    pass  # User not found, created_by will be None
            elif request.user and request.user.is_authenticated:
                created_by_user = request.user

            # Save product with created_by
            if created_by_user:
                product = serializer.save(created_by=created_by_user)
            else:
                product = serializer.save()

            # Handle photo uploads with validation
            photos = request.FILES.getlist('photos')
            so_number = product_data.get('so_number', 'photo')
            failed_uploads = []

            for idx, img in enumerate(photos, start=1):
                success, result = save_file_safely(img, so_number, idx)
                if success:
                    # Save filename to database
                    Photo.objects.create(product=product, path=result)
                else:
                    failed_uploads.append({'file': img.name, 'error': result})

            response_data = {'success': True, 'product': ProductSerializer(product, context={'request': request}).data}
            if failed_uploads:
                response_data['warning'] = f'{len(failed_uploads)} file(s) failed to upload'
                response_data['failed_uploads'] = failed_uploads

            return Response(response_data)
        else:
            return Response({'success': False, 'message': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    elif action == 'outbound':
        # 出貨: 用 so_number 找產品，更新 ex_date 與照片
        so_number = request.data.get('so_number', '')
        if not so_number:
            return Response({'success': False, 'message': 'so_number required'}, status=status.HTTP_400_BAD_REQUEST)
        products = Product.objects.filter(so_number=so_number)
        if not products.exists():
            return Response({'success': False, 'message': 'not found'}, status=status.HTTP_404_NOT_FOUND)
        # 更新所有產品的 ex_date 和 current_status
        today = datetime.now().strftime('%Y-%m-%d')
        products.update(ex_date=today, current_status='1')

        # 處理照片，只存到最新 date 的產品（若多個同日，取 first）
        latest_date = products.aggregate(Max('date'))['date__max']
        target_product = products.filter(date=latest_date).first()

        # Handle photo uploads with validation
        photos = request.FILES.getlist('photos')
        so_number_val = so_number if so_number else 'photo'
        # 取得目前已存在的照片數量
        exist_count = Photo.objects.filter(product=target_product, path__startswith=f"{so_number_val}_").count() if target_product else 0
        failed_uploads = []

        for idx, img in enumerate(photos, start=1):
            success, result = save_file_safely(img, so_number_val, exist_count + idx)
            if success:
                # Save filename to database
                if target_product:
                    Photo.objects.create(product=target_product, path=result)
            else:
                failed_uploads.append({'file': img.name, 'error': result})

        # Build response
        response_data = {'success': True, 'product': ProductSerializer(products.first()).data}
        if failed_uploads:
            response_data['warning'] = f'{len(failed_uploads)} file(s) failed to upload'
            response_data['failed_uploads'] = failed_uploads

        return Response(response_data)

# 批次更新產品狀態 API
@api_view(['POST'])
@permission_classes([IsAuthenticatedOrHasAPIKey])
def batch_update_status(request):
    """
    批次更新多個產品的 current_status
    POST body: {"ids": [1,2,3], "current_status": "0"}
    """
    try:
        data = request.data
        ids = data.get('ids', [])
        target_status = data.get('current_status', None)
        ex_date = data.get('ex_date', None)
        if not ids or target_status not in ['0', '1']:
            return Response({'success': False, 'message': 'Invalid ids or status'}, status=status.HTTP_400_BAD_REQUEST)
        update_fields = {'current_status': target_status}
        if ex_date:
            update_fields['ex_date'] = ex_date
        updated = Product.objects.filter(id__in=ids).update(**update_fields)
        return Response({'success': True, 'message': f'已更新 {updated} 筆產品狀態', 'updated_count': updated})
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StandardPagination(PageNumberPagination):
    page_size = 100  # Must match ITEMS_PER_PAGE
    page_size_query_param = 'page_size'
    max_page_size = 100
# endpoints
class ProductListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticatedOrHasAPIKey]
    serializer_class = ProductSerializer
    pagination_class = StandardPagination
    
    def get_queryset(self):
        queryset = Product.objects.all()
        search = self.request.query_params.get('search', None)
        product_id = self.request.query_params.get('id', None)
        sort_field = self.request.query_params.get('sortField', None)
        sort_order = self.request.query_params.get('sortOrder', 'asc')
        
        
        # Handle ID filter
        if product_id:
            return queryset.filter(id=product_id)


        # Handle search
        if search:
            queryset = queryset.filter(
                Q(barcode__icontains=search) |
                Q(number__icontains=search) |
                Q(qty__icontains=search) |
                Q(date__icontains=search)
            )
        
        # Handle sorting
        if sort_field:
            # Add minus sign for descending order
            order_by = f"-{sort_field}" if sort_order == 'desc' else sort_field
            queryset = queryset.order_by(order_by)
        else:
            # Default sorting by date
            queryset = queryset.order_by('date')
            
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        # If ID was provided in query params, return single object
        product_id = self.request.query_params.get('id', None)
        if product_id and queryset.exists():
            serializer = self.get_serializer(queryset.first())
            return Response({
                'results': [serializer.data]  # Wrap in list to maintain consistent format
            })
        
        #paginate_queryset will call StandardPagination
        page = self.paginate_queryset(queryset)    #handle page 2..
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # Fallback for non-paginated case (shouldn't happen with pagination_class)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count(),
        })

    #create-form will go here
    def post(self, request, *args, **kwargs):
        """
        Handles bulk product creation. Accepts a list of products.
        支援多圖上傳，將每張圖片存入 Photo 並關聯到 Product。
        """
        try:
            with transaction.atomic():
                products_data = request.data if isinstance(request.data, list) else [request.data]
                created_products = []
                errors = []

                for idx, product_data in enumerate(products_data):
                    # 將 QueryDict 轉成普通 dict，並把所有 value 只取第一個
                    if hasattr(product_data, 'lists'):
                        product_data = {k: v[0] if isinstance(v, list) else v for k, v in product_data.lists()}
                    else:
                        product_data = dict(product_data)
                        for k, v in product_data.items():
                            if isinstance(v, list):
                                product_data[k] = v[0] if v else ''
                    # 轉型態
                    for key in ['so_number', 'status', 'note', 'number', 'barcode', 'vender', 'client', 'category']:
                        val = product_data.get(key, '')
                        product_data[key] = str(val).strip()
                    # qty 轉 int
                    if 'qty' in product_data:
                        try:
                            product_data['qty'] = int(product_data['qty'])
                        except Exception:
                            product_data['qty'] = 0
                    # weight 轉 int or None
                    if 'weight' in product_data:
                        weight_val = product_data['weight']
                        if weight_val == '' or weight_val is None:
                            product_data['weight'] = None
                        else:
                            try:
                                product_data['weight'] = int(weight_val)
                            except (ValueError, TypeError):
                                product_data['weight'] = None
                    # date 格式
                    if 'date' in product_data:
                        product_data['date'] = str(product_data['date']).strip()
                    # so_number 必填
                    so_number_val = product_data.get('so_number', '')
                    if not so_number_val or (isinstance(so_number_val, str) and so_number_val.strip() == ''):
                        errors.append({
                            'data': product_data,
                            'errors': {'so_number': ['This field is required.']}
                        })
                        continue

                    # 優先用 current_status/noted，若沒有才用 status/note
                    if 'current_status' not in product_data and 'status' in product_data:
                        product_data['current_status'] = product_data.pop('status')
                    if 'noted' not in product_data and 'note' in product_data:
                        product_data['noted'] = product_data.pop('note')
                    # 保證 current_status/noted 欄位存在
                    if 'current_status' not in product_data:
                        product_data['current_status'] = ''
                    if 'noted' not in product_data:
                        product_data['noted'] = ''

                    serializer = ProductSerializer(data=product_data)
                    if serializer.is_valid():
                        try:
                            # Auto-assign created_by based on username from request
                            created_by_user = None
                            username = product_data.get('created_by_username') or request.data.get('created_by_username')

                            if username:
                                from account.models import CustomUser
                                try:
                                    created_by_user = CustomUser.objects.get(username=username)
                                except CustomUser.DoesNotExist:
                                    pass  # User not found, created_by will be None
                            elif request.user and request.user.is_authenticated:
                                created_by_user = request.user

                            # Save product with created_by
                            if created_by_user:
                                product = serializer.save(created_by=created_by_user)
                            else:
                                product = serializer.save()

                            # 僅於單一產品時處理多圖
                            if len(products_data) == 1:
                                product_files = request.FILES.getlist('photos')
                                so_number_val = product_data.get('so_number', 'photo')
                                failed_uploads = []

                                for idx, img in enumerate(product_files, start=1):
                                    success, result = save_file_safely(img, so_number_val, idx)
                                    if success:
                                        Photo.objects.create(product=product, path=result)
                                    else:
                                        failed_uploads.append({'file': img.name, 'error': result})

                                # Include upload warnings in product data if any failed
                                product_serialized = ProductSerializer(product, context={'request': request}).data
                                if failed_uploads:
                                    product_serialized['upload_warnings'] = failed_uploads
                                created_products.append(product_serialized)
                            else:
                                created_products.append(ProductSerializer(product, context={'request': request}).data)
                        except Exception as e:
                            errors.append({
                                'data': product_data,
                                'error': str(e)
                            })
                    else:
                        errors.append({
                            'data': product_data,
                            'errors': serializer.errors
                        })

                if errors and not created_products:
                    raise Exception(f"Failed to create any products: {errors}")

                response_data = {
                    'success': len(errors) == 0,
                    'created_count': len(created_products),
                    'total_count': len(products_data),
                    'created_products': created_products,
                }

                if errors:
                    response_data['errors'] = errors
                
                status_code = (
                    status.HTTP_201_CREATED if len(errors) == 0
                    else status.HTTP_207_MULTI_STATUS if created_products
                    else status.HTTP_400_BAD_REQUEST
                )

                return Response(response_data, status=status_code)

        except Exception as e:
            return Response(
                {
                    'success': False,
                    'error': str(e),
                    'message': 'Failed to create products'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    def put(self, request, *args, **kwargs):
        """
        Handles product updates. Expects product ID in the URL and updated data in request body.
        """
        # Get product ID from URL parameters
        product_id = kwargs.get('pk') or request.query_params.get('id')
        if not product_id:
            return Response(
                {'error': 'Product ID is required for updates'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get the product instance
            product = Product.objects.get(pk=product_id)

            # 處理 status/note 別名
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            if 'status' in data:
                data['current_status'] = data.pop('status')
            if 'note' in data:
                data['noted'] = data.pop('note')

            # Update the product with new data
            serializer = ProductSerializer(product, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Product.DoesNotExist:
            return Response(
                {'error': f'Product with ID {product_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update product: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

#edit-from will go here
@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticatedOrHasAPIKey])
def product_detail(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        # 先刪除所有關聯照片（包含檔案）
        photos = Photo.objects.filter(product=product)
        for photo in photos:
            if photo.path:
                photo.path.delete(save=False)  # 刪除Local實體檔案
            photo.delete()  # 刪除資料庫紀錄
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    elif request.method == 'PUT':
        # 1. 先處理圖片刪除
        delete_photo_ids = []
        if hasattr(request.data, 'getlist'):
            delete_photo_ids = request.data.getlist('delete_photo_ids')
        elif 'delete_photo_ids' in request.data:
            val = request.data.get('delete_photo_ids')
            if isinstance(val, list):
                delete_photo_ids = val
            elif isinstance(val, str):
                if ',' in val:
                    delete_photo_ids = val.split(',')
                elif val.strip():
                    delete_photo_ids = [val.strip()]
        delete_photo_ids = [int(pid) for pid in delete_photo_ids if str(pid).strip()]
        for pid in delete_photo_ids:
            photo = Photo.objects.filter(id=pid, product=product).first()
            if photo:
                photo.path.delete(save=False)  # 刪除實體檔案
                photo.delete()                 # 刪除資料庫紀錄

        # 2. 新增新圖片 with validation
        new_files = request.FILES.getlist('photos')
        so_number_val = product.so_number if product.so_number else 'photo'
        # Get current photo count for indexing
        current_photo_count = Photo.objects.filter(product=product).count()

        for idx, img in enumerate(new_files, start=1):
            success, result = save_file_safely(img, so_number_val, current_photo_count + idx)
            if success:
                Photo.objects.create(product=product, path=result)
            # Note: In edit mode, we silently skip invalid files rather than showing errors

        # 3. 更新產品本身欄位
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'status' in data:
            data['current_status'] = data.pop('status')
        if 'note' in data:
            data['noted'] = data.pop('note')
        serializer = ProductSerializer(product, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(ProductSerializer(product, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrHasAPIKey])
def get_all_products_for_export(request):
    """
    獲取符合條件的產品進行匯出
    支援搜索和分類過濾
    """
    search = request.query_params.get('search', '')
    # category = request.query_params.get('category', None)
    categories = request.query_params.getlist('category')
    # 解析搜索查詢參數
    # 移除可能包含的 category 參數
    search_params = dict(request.query_params)
    search_params.pop('category', None)
    search = ''.join(search_params.get('search', ['']))
    
    queryset = Product.objects.all()
    if categories:  # If there are categories, e.g., ['1', '3']
        queryset = queryset.filter(category__in=categories)
    # 處理搜索條件
    if search:
        queryset = queryset.filter(
            Q(barcode__icontains=search) |
            Q(number__icontains=search) |
            Q(qty__icontains=search) |
            Q(date__icontains=search)
        )
    
    # 處理分類過濾
    # if category:
    #     queryset = queryset.filter(category=category)
    
    serializer = ProductSerializer(queryset, many=True)
    return Response(serializer.data)


# Cargo API endpoints
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrHasAPIKey])
def cargo_list(request):
    """
    List all cargos or create a new cargo
    """
    if request.method == 'GET':
        cargos = Cargo.objects.all().order_by('name')
        serializer = CargoSerializer(cargos, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = CargoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
