from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets, permissions, status
from django.db.models import Q
from apps.secretarios.models import Alumno
from apps.secretarios.serializers import AlumnoSerializer
from .models import Lugar, TipoIncidencia, MedidaXAlumno, Incidencia, Reunion, Asistencia, ActExtracurricular, ActExtracurricularXGrado
from .serializers import (
    LugarSerializer,
    TipoIncidenciaSerializer,
    IncidenciaSerializer, 
    MedidaXAlumnoSerializer, 
    ReunionSerializer, 
    AsistenciaSerializer, 
    ActExtracurricularSerializer, 
    ActExtracurricularXGradoSerializer
)

class LugarView(viewsets.ModelViewSet):
    serializer_class = LugarSerializer
    queryset = Lugar.objects.all()
    permission_classes = [permissions.AllowAny]

class TipoIncidenciaView(viewsets.ModelViewSet):
    queryset = TipoIncidencia.objects.all()
    serializer_class = TipoIncidenciaSerializer
    permission_classes = [permissions.AllowAny]

class IncidenciaView(viewsets.ModelViewSet):
    serializer_class = IncidenciaSerializer
    queryset = Incidencia.objects.all()
    permission_classes = [permissions.AllowAny]

# En views.py - MODIFICAR MedidaXAlumnoView
class MedidaXAlumnoView(viewsets.ModelViewSet):
    serializer_class = MedidaXAlumnoSerializer
    queryset = MedidaXAlumno.objects.all()
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        print("=== DEBUG CREATE MEDIDA ===")
        print("📥 Datos recibidos:", request.data)
        print("👤 Usuario autenticado:", request.user)
        
        try:
            # Validar serializer
            serializer = self.get_serializer(data=request.data)
            print("🔍 Serializer válido?", serializer.is_valid())
            
            if not serializer.is_valid():
                print("❌ Errores de serializer:", serializer.errors)
                return Response(serializer.errors, status=400)
            
            # Intentar guardar
            print("💾 Intentando guardar...")
            instance = serializer.save()
            print("✅ Medida guardada con ID:", instance.pk)
            
            return Response(serializer.data, status=201)
            
        except Exception as e:
            print("🚨 ERROR en create:", str(e))
            print("🚨 Tipo de error:", type(e))
            import traceback
            print("🚨 Traceback completo:")
            traceback.print_exc()
            
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"}, 
                status=500
            )

class ReunionView(viewsets.ModelViewSet):
    serializer_class = ReunionSerializer
    queryset = Reunion.objects.all()
    permission_classes = [permissions.AllowAny]

class AsistenciaView(viewsets.ModelViewSet):
    serializer_class = AsistenciaSerializer
    queryset = Asistencia.objects.all()
    permission_classes = [permissions.AllowAny]

class ActExtracurricularView(viewsets.ModelViewSet):
    serializer_class = ActExtracurricularSerializer
    queryset = ActExtracurricular.objects.all()
    permission_classes = [permissions.AllowAny]

class ActExtracurricularXGradoView(viewsets.ModelViewSet):
    serializer_class = ActExtracurricularXGradoSerializer
    queryset = ActExtracurricularXGrado.objects.all()
    permission_classes = [permissions.AllowAny]

@api_view(['GET'])
def buscar_alumno_por_dni(request):
    dni_alumno = request.GET.get('dni_alumno', '').strip()

    if not dni_alumno:
        return Response({'error': 'Debe proporcionar el dni del alumno.'}, status=status.HTTP_400_BAD_REQUEST)

    alumno = Alumno.objects.filter(dni_alumno=dni_alumno).first()

    if alumno is None:
        return Response({'error': f'No se encontró ningún alumno con DNI: {dni_alumno}'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AlumnoSerializer(alumno)
    return Response(serializer.data, status=status.HTTP_200_OK)

# En views.py - VERIFICAR que existe esta vista
@api_view(['GET'])
def listar_incidencias(request):
    """
    Lista todas las incidencias con filtros opcionales
    """
    try:
        # Obtener parámetros de filtro
        dni_alumno = request.GET.get('dni_alumno', '').strip()
        id_grado = request.GET.get('id_grado', '').strip()
        
        # Query base
        medidas = MedidaXAlumno.objects.all().select_related(
            'id_alumno',
            'incidencia', 
            'id_lugar',
            'id_empleado'
        ).order_by('-fecha_medida')
        
        # Aplicar filtros
        if dni_alumno:
            medidas = medidas.filter(id_alumno__dni_alumno=dni_alumno)
        
        if id_grado:
            medidas = medidas.filter(id_alumno__alumnos_grados__id_grado=id_grado)
        
        serializer = MedidaXAlumnoSerializer(medidas, many=True)
        
        return Response({
            'count': medidas.count(),
            'results': serializer.data
        })
        
    except Exception as e:
        return Response(
            {'error': f'Error al listar incidencias: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def detalle_incidencia(request, id_medida):
    """
    Obtiene el detalle de una incidencia específica
    """
    try:
        medida = MedidaXAlumno.objects.select_related(
            'id_alumno',
            'incidencia',
            'id_lugar',
            'id_empleado'
        ).get(id_medida_x_alumno=id_medida)
        
        serializer = MedidaXAlumnoSerializer(medida)
        return Response(serializer.data)
        
    except MedidaXAlumno.DoesNotExist:
        return Response(
            {'error': 'Incidencia no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # En views.py - AGREGAR esta vista
@api_view(['GET'])
def incidencias_por_tipo(request, id_tipo_incidencia):
    """
    Obtiene todas las incidencias de un tipo específico
    """
    try:
        incidencias = Incidencia.objects.filter(tipo_incidencia_id=id_tipo_incidencia)
        serializer = IncidenciaSerializer(incidencias, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def tipos_incidencias_con_incidencias(request):
    """
    Obtiene todos los tipos de incidencias con sus incidencias relacionadas
    """
    try:
        tipos = TipoIncidencia.objects.prefetch_related('incidencia_set').all()
        
        data = []
        for tipo in tipos:
            tipo_data = {
                'id_tipo_incidencia': tipo.id_tipo_incidencia,
                'tipo_incidencia_nombre': tipo.tipo_incidencia_nombre,
                'incidencias': IncidenciaSerializer(tipo.incidencia_set.all(), many=True).data
            }
            data.append(tipo_data)
        
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)