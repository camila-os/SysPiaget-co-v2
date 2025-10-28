from rest_framework.permissions import BasePermission
from .models import Empleado

class IsDirector(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            empleado = Empleado.objects.get(dni_empleado=request.user.username)
            return empleado.id_rol.nombre_rol.lower() == "director"
        except Empleado.DoesNotExist:
            return False