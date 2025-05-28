from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Product
from .serializer import ProductSerializer
from rest_framework import generics
from django.db.models import Sum, Q, Max, Max
from rest_framework.pagination import PageNumberPagination
from django.db import transaction


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

    def post(self, request, *args, **kwargs):
        """
        Handles bulk product creation. Accepts a list of products.
        """
        try:
            with transaction.atomic():
                products_data = request.data if isinstance(request.data, list) else [request.data]
                created_products = []
                errors = []
              
                for product_data in products_data:
                    # Convert qty to integer if it's a string
                    if 'qty' in product_data and isinstance(product_data['qty'], str):
                        try:
                            product_data['qty'] = int(product_data['qty'])
                        except ValueError:
                            product_data['qty'] = 0

                    serializer = ProductSerializer(data=product_data)
                    if serializer.is_valid():
                        try:
                            product = serializer.save()
                            created_products.append(serializer.data)
                        except Exception as e:
                            errors.append({
                                'data': product_data,
                                'error': str(e)
                            })
                    else:
                        print("Validation errors:", serializer.errors)  # Debug log
                        errors.append({
                            'data': product_data,
                            'errors': serializer.errors
                        })

                if errors and not created_products:
                    # If no products were created successfully, roll back and return error
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
            print("Exception occurred:", str(e))  # Debug log
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
            
            # Update the product with new data
            serializer = ProductSerializer(product, data=request.data, partial=True)
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



# @api_view(['GET'])
# def get_products(request):
#     Products = Product.objects.all()
#     serializedData = ProductSerializer(Products, many=True).data
#     return Response(serializedData)


# @api_view(['POST'])
# def create_product(request):
#     data = request.data
#     serializer = ProductSerializer(data=data)
#     if serializer.is_valid():
#         serializer.save()  # save the data to the database
#         return Response(serializer.data, status=status.HTTP_201_CREATED)
#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def product_detail(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    elif request.method == 'PUT':
        data = request.data
        serializer = ProductSerializer(product, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
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
