from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Empleado, Rol
from apps.secretarios.models import Tutor  # ✅ IMPORTAR TUTOR
from .serializers import EmpleadoSerializer, RolSerializer
from .permissions import IsDirector

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        dni = request.data.get("dni")
        password = request.data.get("password")

        if not dni or not password:
            return Response({"error": "DNI y contraseña requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=dni, password=password)
        if not user:
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

        # Primero verificar si es un empleado
        try:
            empleado = Empleado.objects.get(dni_empleado=dni)
            if empleado.estado_empleado == 'Inactivo':
                return Response({"error": "Cuenta desactivada"}, status=status.HTTP_403_FORBIDDEN)
                
            rol = empleado.id_rol.nombre_rol
            nombre = empleado.nombre_empleado
            apellido = empleado.apellido_empleado
            primer_login = empleado.primer_login
            
        except Empleado.DoesNotExist:
            # Si no es empleado, verificar si es tutor
            try:
                tutor = Tutor.objects.get(dni_tutor=int(dni))  # Convertir a int ya que en Tutor es IntegerField
                if tutor.estado_tutor == 'Inactivo':
                    return Response({"error": "Cuenta desactivada"}, status=status.HTTP_403_FORBIDDEN)
                    
                rol = 'tutor'
                nombre = tutor.nombre_tutor
                apellido = tutor.apellido_tutor
                primer_login = tutor.primer_login
                
            except (Tutor.DoesNotExist, ValueError):
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        refresh = RefreshToken.for_user(user)
        response_data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "username": user.username,
            "dni": dni,
            "rol": rol,
            "nombre": nombre,
            "apellido": apellido,
            "primer_login": primer_login,
        }

        if primer_login:
            response_data["message"] = "Primer login, debe cambiar contraseña"

        return Response(response_data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth(request):
    try:
        empleado = Empleado.objects.get(dni_empleado=request.user.username)
        rol = empleado.id_rol.nombre_rol
        # ✅ AGREGAR INFORMACIÓN DEL EMPLEADO
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "rol": rol,
            "id_empleado": empleado.id_empleado,  # ✅ NUEVO
            "dni_empleado": empleado.dni_empleado,  # ✅ NUEVO
            "nombre": empleado.nombre_empleado,  # ✅ NUEVO
            "apellido": empleado.apellido_empleado,  # ✅ NUEVO
            "primer_login": empleado.primer_login  # ✅ NUEVO
        })
    except Empleado.DoesNotExist:
        try:
            # Intentar buscar como tutor (convertir username a int)
            tutor = Tutor.objects.get(dni_tutor=int(request.user.username))
            rol = 'tutor'
            # ✅ AGREGAR INFORMACIÓN DEL TUTOR
            return Response({
                "id": request.user.id,
                "username": request.user.username,
                "rol": rol,
                "id_tutor": tutor.id_tutor,  # ✅ NUEVO
                "dni_tutor": tutor.dni_tutor,  # ✅ NUEVO
                "nombre": tutor.nombre_tutor,  # ✅ NUEVO
                "apellido": tutor.apellido_tutor,  # ✅ NUEVO
                "primer_login": tutor.primer_login  # ✅ NUEVO
            })
        except (Tutor.DoesNotExist, ValueError):
            rol = None

    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "rol": rol
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cambiar_password(request):
    user = request.user
    nueva = request.data.get("nueva")
    
    if not nueva:
        return Response({"error": "Se requiere nueva contraseña"}, status=400)
    
    if len(nueva) < 4:
        return Response({"error": "La contraseña debe tener al menos 4 caracteres"}, status=400)

    user.set_password(nueva)
    user.save()

    # Actualizar primer_login tanto para empleados como tutores
    try:
        empleado = Empleado.objects.get(dni_empleado=user.username)
        empleado.primer_login = False
        empleado.save()
    except Empleado.DoesNotExist:
        try:
            tutor = Tutor.objects.get(dni_tutor=int(user.username))
            tutor.primer_login = False
            tutor.save()
        except (Tutor.DoesNotExist, ValueError):
            pass  # No es ni empleado ni tutor

    return Response({"message": "Contraseña actualizada correctamente"})

class EmpleadoView(viewsets.ModelViewSet):
    queryset = Empleado.objects.all()
    serializer_class = EmpleadoSerializer
    permission_classes = [IsAuthenticated, IsDirector]
    lookup_field = 'dni_empleado'

    def list(self, request, *args, **kwargs):
        try:
            empleados = self.get_queryset()
            serializer = self.get_serializer(empleados, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": f"Error al listar empleados: {str(e)}"}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            empleado = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=False)
            serializer.is_valid(raise_exception=True)
            empleado = serializer.save()
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": f"Error al eliminar empleado: {str(e)}"}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RolView(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            roles = self.get_queryset()
            serializer = self.get_serializer(roles, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": f"Error al listar roles: {str(e)}"}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)