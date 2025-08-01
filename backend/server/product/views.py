
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Product, Photo
from .serializer import ProductSerializer, PhotoSerializer
from rest_framework import generics
from django.db.models import Sum, Q, Max, Max
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
from datetime import datetime

# Zebra Scanner API
@api_view(['POST'])
def scanner_api(request):
    """
    Zebra device product scan API
    入庫: action=inbound, 傳 date, barcode, so_number, weight, photos
    出貨: action=outbound, 傳 so_number, photos
    """
    action = request.data.get('action')
    if not action or action not in ['inbound', 'outbound']:
        return Response({'success': False, 'message': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

    if action == 'inbound':
        # 入庫: 建立新產品
        data = request.data
        # 只取必要欄位
        product_data = {
            'date': data.get('date', ''),
            'barcode': data.get('barcode', ''),
            'so_number': data.get('so_number', ''),
            'weight': data.get('weight', ''),
            'current_status': '0',
            'noted': data.get('noted', ''),
        }
        serializer = ProductSerializer(data=product_data)
        if serializer.is_valid():
            product = serializer.save()
            # 多張照片
            photos = request.FILES.getlist('photos')
            import os
            images_dir = r'D:\workplace\Images'
            os.makedirs(images_dir, exist_ok=True)
            so_number = product_data.get('so_number', 'photo')
            for idx, img in enumerate(photos, start=1):
                ext = os.path.splitext(img.name)[1]
                filename = f"{so_number}_{idx}{ext}"
                file_path = os.path.join(images_dir, filename)
                with open(file_path, 'wb+') as destination:
                    for chunk in img.chunks():
                        destination.write(chunk)
                # 僅存檔名到 DB
                Photo.objects.create(product=product, path=filename)
            return Response({'success': True, 'product': ProductSerializer(product).data})
        else:
            return Response({'success': False, 'message': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    elif action == 'outbound':
        # 出貨: 用 so_number 找產品，更新 ex_date 與照片
        so_number = request.data.get('so_number', '')
        if not so_number:
            return Response({'success': False, 'message': 'so_number required'}, status=status.HTTP_400_BAD_REQUEST)
        product = Product.objects.filter(so_number=so_number).first()
        if not product:
            return Response({'success': False, 'message': 'not found'}, status=status.HTTP_404_NOT_FOUND)
        # 更新 ex_date 為今天
        today = datetime.now().strftime('%Y-%m-%d')
        product.ex_date = today
        product.current_status = '1'
        product.save()
        # 多張照片
        photos = request.FILES.getlist('photos')
        import os
        images_dir = r'D:\workplace\Images'
        os.makedirs(images_dir, exist_ok=True)
        so_number = product.so_number if hasattr(product, 'so_number') else 'photo'
        # 取得目前已存在的照片數量
        exist_count = Photo.objects.filter(product=product, path__startswith=f"{so_number}_").count()
        for idx, img in enumerate(photos, start=1):
            ext = os.path.splitext(img.name)[1]
            filename = f"{so_number}_{exist_count + idx}{ext}"
            file_path = os.path.join(images_dir, filename)
            with open(file_path, 'wb+') as destination:
                for chunk in img.chunks():
                    destination.write(chunk)
            # 僅存檔名到 DB
            Photo.objects.create(product=product, path=filename)
        return Response({'success': True, 'product': ProductSerializer(product).data})

# 批次更新產品狀態 API
@api_view(['POST'])
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
                    # debug log
                    print(f"[DEBUG] product_data after dict conversion: {product_data}")
                    # 將 QueryDict 轉成普通 dict，並把所有 value 只取第一個
                    if hasattr(product_data, 'lists'):
                        product_data = {k: v[0] if isinstance(v, list) else v for k, v in product_data.lists()}
                    else:
                        product_data = dict(product_data)
                        for k, v in product_data.items():
                            if isinstance(v, list):
                                product_data[k] = v[0] if v else ''
                    # 轉型態
                    for key in ['so_number', 'weight', 'status', 'note', 'number', 'barcode', 'vender', 'client', 'category']:
                        val = product_data.get(key, '')
                        product_data[key] = str(val).strip()
                    # qty 轉 int
                    if 'qty' in product_data:
                        try:
                            product_data['qty'] = int(product_data['qty'])
                        except Exception:
                            product_data['qty'] = 0
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
                            product = serializer.save()
                            # 僅於單一產品時處理多圖
                            if len(products_data) == 1:
                                product_files = request.FILES.getlist('photos')
                                for img in product_files:
                                    Photo.objects.create(product=product, path=img)
                            created_products.append(ProductSerializer(product).data)
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

        # 2. 新增新圖片
        new_files = request.FILES.getlist('photos')
        for img in new_files:
            Photo.objects.create(product=product, path=img)

        # 3. 更新產品本身欄位
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'status' in data:
            data['current_status'] = data.pop('status')
        if 'note' in data:
            data['noted'] = data.pop('note')
        serializer = ProductSerializer(product, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProductSerializer(product).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
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
