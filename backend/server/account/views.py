from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import CustomUser
from .serializers import CustomUserSerializer
from rest_framework.permissions import IsAdminUser
from django.http import JsonResponse
# View to create a new user
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.hashers import check_password
from django.contrib.auth import authenticate

class UserListAPIView(generics.GenericAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer

    def get_permissions(self):
        """
        Allow unauthenticated POST (login), but require authentication for GET (list users)
        """
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = CustomUser.objects.all()
        role = self.request.query_params.get('role', None)
        username = self.request.query_params.get('username', None)

        if username:
            queryset = queryset.filter(username=username)  # Filter users by username
        if role:
            queryset = queryset.filter(role=role)  # Filter users by role
        return queryset

    def get(self, request, *args, **kwargs):
        """
        List users endpoint - requires authentication
        """
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """
        Login endpoint - returns user data if credentials are valid
        """
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
@permission_classes([IsAuthenticated])
def get_users(request):
    """
    Get list of users - requires authentication
    Optionally filter by role
    """
    role = request.query_params.get('role', None)
    if role:
        users = CustomUser.objects.filter(role=role)
    else:
        users = CustomUser.objects.all()  # Get all users if no role filter

    # Serialize the data
    serialized_data = CustomUserSerializer(users, many=True).data
    return Response(serialized_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    """
    Create new user - requires authentication
    Only authenticated users can create new users
    """
    if request.method == 'POST':
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
