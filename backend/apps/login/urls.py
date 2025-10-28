# apps/login/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'empleados', views.EmpleadoView, basename='empleados')
router.register(r'roles', views.RolView, basename='roles')

urlpatterns = [
    # Login
    path('login/', views.LoginView.as_view(), name='login'),

    # Refresh de JWT
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # CRUD de empleados y roles vía router
    path('', include(router.urls)),

    # Check de autenticación
    path('auth/check/', views.check_auth, name='check_auth'),

    # ✅ CAMBIAR A: URL más simple y lógica
    path('cambiar-password/', views.cambiar_password, name='cambiar_password'),
]