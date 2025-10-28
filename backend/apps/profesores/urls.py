from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'asignaturas', views.AsignaturaViewSet, basename='asignatura')
router.register(r'dictados', views.DictadoClaseViewSet, basename='dictado')

urlpatterns = router.urls
