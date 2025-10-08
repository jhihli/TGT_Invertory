from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import CustomUser
from .serializers import CustomUserSerializer
from rest_framework.permissions import IsAdminUser
from django.http import JsonResponse
# View to create a new user
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.contrib.auth.hashers import check_password
from django.contrib.auth import authenticate

class UserListAPIView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    ##permission_classes = [IsAuthenticated]  # Allow only authenticated users
    
    def get_queryset(self):
        queryset = CustomUser.objects.all()
        role = self.request.query_params.get('role', None)
        username = self.request.query_params.get('username', None)
       
        if username:
            queryset = queryset.filter(username=username)  # Filter users by username
        if role:
            queryset = queryset.filter(role=role)  # Filter users by role
        return queryset
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(username=username, password=password)
        if user is not None:
            serializer = CustomUserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_users(request):
    # Optionally filter by role if passed as query parameter
    role = request.query_params.get('role', None)
    if role:
        users = CustomUser.objects.filter(role=role)
    else:
        users = CustomUser.objects.all()  # Get all users if no role filter
    
    # Serialize the data
    serialized_data = CustomUserSerializer(users, many=True).data
    return Response(serialized_data)


@api_view(['POST'])
def create_user(request):
    if request.method == 'POST':
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
