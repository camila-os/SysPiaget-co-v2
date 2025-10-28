from rest_framework import viewsets
from .models import Asignatura, DictadoClase
from .serializers import AsignaturaSerializer, DictadoClaseSerializer

class AsignaturaViewSet(viewsets.ModelViewSet):
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer


class DictadoClaseViewSet(viewsets.ModelViewSet):
    queryset = DictadoClase.objects.all()
    serializer_class = DictadoClaseSerializer
