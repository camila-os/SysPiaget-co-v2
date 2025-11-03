from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from .models import Alumno, Tutor, Grado, Colegios_procedencia, Parentesco
from .serializers import (
    AlumnoSerializer, 
    AlumnoXGradoSerializer, 
    TutorSerializer, 
    AlumnoXTutorSerializer,
    GradoSerializer,
    ColegioSerializer, 
    ParentescoSerializer
)

# VERIFICACIÓN DNI EMPLEADO - AGREGAR ESTA VIEW
@api_view(['GET'])
def verificar_dni_empleado(request, dni):
    """Verificar si DNI de empleado ya existe"""
    try:
        # Importar el modelo de empleados desde apps.login
        from apps.login.models import Empleado
        
        empleado = Empleado.objects.filter(dni_empleado=dni).first()
        if empleado:
            return Response({
                'dni': dni,
                'existe': True,
                'activo': empleado.estado_empleado == 'Activo',  # Ajusta según tu campo
                'mensaje': f'Empleado {empleado.nombre_empleado} {empleado.apellido_empleado}',
                'empleado_data': {
                    'id_empleado': empleado.id_empleado,
                    'nombre_empleado': empleado.nombre_empleado,
                    'apellido_empleado': empleado.apellido_empleado,
                    'estado_empleado': empleado.estado_empleado
                }
            })
        else:
            return Response({
                'dni': dni,
                'existe': False,
                'activo': False,
                'mensaje': 'DNI disponible - No es empleado'
            })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#  FLUJO: AlumnoForm - Grados y Colegios
@api_view(['GET'])
def grados_list(request):
    """Obtener lista de grados para AlumnoForm"""
    try:
        grados = Grado.objects.all()
        serializer = GradoSerializer(grados, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def colegios_list(request):
    """Obtener lista de colegios para AlumnoForm"""
    try:
        colegios = Colegios_procedencia.objects.all()
        serializer = ColegioSerializer(colegios, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def crear_colegio(request):
    """Crear nuevo Colegio para RegistrarAlumno"""
    try:
        serializer = ColegioSerializer(data=request.data)
        if serializer.is_valid():
            colegio = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

#  FLUJO: RegistrarTutor - Tutores y Parentescos
@api_view(['GET'])
def tutores_list(request):
    """Obtener lista de tutores para RegistrarTutor"""
    try:
        tutores = Tutor.objects.all()
        serializer = TutorSerializer(tutores, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def crear_tutor(request):
    """Crear nuevo tutor para RegistrarTutor"""
    try:
        serializer = TutorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def parentescos_list(request):
    """Obtener lista de parentescos para RegistrarTutor"""
    try:
        parentescos = Parentesco.objects.all()
        serializer = ParentescoSerializer(parentescos, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
@api_view(['POST'])
def crear_parentesco(request):
    """Crear nuevo parentesco"""
    try:
        serializer = ParentescoSerializer(data=request.data)
        if serializer.is_valid():
            parentesco = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def alumnos_list(request):
    """Obtener lista de alumnos CON información de grado"""
    try:
        # ✅ INCLUIR LAS RELACIONES EN LA CONSULTA
        alumnos = Alumno.objects.all().prefetch_related(
            'alumnoxgrado_set__id_grado'
        )
        serializer = AlumnoSerializer(alumnos, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
def alumnos_por_grado(request, id_grado):
    """Obtener todos los alumnos de un grado específico"""
    try:
        # Filtrar alumnos que tienen relación activa con el grado especificado
        alumnos = Alumno.objects.filter(
            alumnoxgrado__id_grado=id_grado,
            alumnoxgrado__activo=True,
            estado_alumno='Activo'
        ).prefetch_related(
            'alumnoxgrado_set__id_grado'
        ).distinct()
        
        serializer = AlumnoSerializer(alumnos, many=True)
        
        return Response({
            'grado_id': id_grado,
            'count': alumnos.count(),
            'alumnos': serializer.data
        })
        
    except Exception as e:
        return Response(
            {'error': f'Error al obtener alumnos por grado: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# OPCIÓN ALTERNATIVA: GET para obtener todos los alumnos completos
@api_view(['GET'])
def get_all_alumnos_completos(request):
    """Obtener todos los alumnos completos (usando el serializer mejorado)"""
    try:
        alumnos = Alumno.objects.all().prefetch_related(
            'alumnoxgrado_set__id_grado',
            'alumnos_tutores__id_tutor',
            'alumnos_tutores__id_parentesco'
        )
        serializer = AlumnoSerializer(alumnos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Error interno del servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            


#  FLUJO: createAlumnoCompleto - Registro Completo
@api_view(['POST']) 
@transaction.atomic
def create_alumno_completo(request):
    """
    Crea alumno, relación con grado y relación con tutor en una transacción
    """
    try:
        data = request.data
        print(" Datos recibidos para alumno completo:", data)

        # Extraer datos
        alumno_data = data.get('alumno', {})
        relacion_grado_data = data.get('relacionGrado', {})
        relacion_tutor_data = data.get('relacionTutor', {})

        # Validar que tengamos todos los datos necesarios
        if not alumno_data or not relacion_grado_data or not relacion_tutor_data:
            return Response({
                'error': 'Datos incompletos. Se requieren alumno, relacionGrado y relacionTutor'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 1. CREAR ALUMNO
        alumno_serializer = AlumnoSerializer(data=alumno_data)
        if not alumno_serializer.is_valid():
            return Response({
                'error': 'Error en datos del alumno',
                'detalles': alumno_serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        alumno = alumno_serializer.save()
        print(f" Alumno creado: {alumno.id_alumno}")

        # 2. CREAR RELACIÓN ALUMNO-GRADO
        relacion_grado_data['id_alumno'] = alumno.id_alumno
        relacion_grado_serializer = AlumnoXGradoSerializer(data=relacion_grado_data)
        if not relacion_grado_serializer.is_valid():
            return Response({
                'error': 'Error en relación con grado',
                'detalles': relacion_grado_serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        relacion_grado = relacion_grado_serializer.save()
        print(f" Relación grado creada: {relacion_grado.id_alumno_x_grado}")

        # 3. CREAR RELACIÓN ALUMNO-TUTOR
        relacion_tutor_data['id_alumno'] = alumno.id_alumno
        relacion_tutor_serializer = AlumnoXTutorSerializer(data=relacion_tutor_data)
        if not relacion_tutor_serializer.is_valid():
            return Response({
                'error': 'Error en relación con tutor',
                'detalles': relacion_tutor_serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        relacion_tutor = relacion_tutor_serializer.save()
        print(f" Relación tutor creada: {relacion_tutor.id_alumno_x_tutor}")

        # 4. ACTUALIZAR ASIENTOS DISPONIBLES EN EL GRADO
        try:
            grado = Grado.objects.get(id_grado=relacion_grado_data['id_grado'])
            if grado.asientos_disponibles > 0:
                grado.asientos_disponibles -= 1
                grado.save()
                print(f" Asientos actualizados: {grado.asientos_disponibles} disponibles")
            else:
                return Response({
                    'error': 'No hay asientos disponibles en el grado seleccionado'
                }, status=status.HTTP_400_BAD_REQUEST)

        except Grado.DoesNotExist:
            return Response({
                'error': 'Grado no encontrado'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Éxito - todo se guardó correctamente
        return Response({
            'success': True,
            'message': 'Alumno, relación con grado y relación con tutor creados exitosamente',
            'alumno_id': alumno.id_alumno,
            'alumno_dni': alumno.dni_alumno,
            'relacion_grado_id': relacion_grado.id_alumno_x_grado,
            'relacion_tutor_id': relacion_tutor.id_alumno_x_tutor
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"❌ Error en create_alumno_completo: {str(e)}")
        return Response({
            'error': f'Error interno del servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#  VERIFICACIÓN DNI ALUMNO
@api_view(['GET'])
def verificar_dni_alumno(request, dni):
    """Verificar si DNI de alumno ya existe"""
    try:
        existe = Alumno.objects.filter(dni_alumno=dni).exists()
        return Response({
            'dni': dni,
            'existe': existe,
            'mensaje': f'DNI {dni} {"ya está registrado" if existe else "disponible"}'
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#  VERIFICACIÓN DNI TUTOR
@api_view(['GET'])
def verificar_dni_tutor(request, dni):
    """Verificar si DNI de tutor ya existe"""
    try:
        tutor = Tutor.objects.filter(dni_tutor=dni).first()
        if tutor:
            return Response({
                'dni': dni,
                'existe': True,
                'activo': tutor.estado_tutor == 'Activo',
                'mensaje': f'Tutor {tutor.nombre_tutor} {tutor.apellido_tutor} ({dni}) - Estado: {tutor.estado_tutor}',
                'tutor_data': {
                    'id_tutor': tutor.id_tutor,
                    'nombre_tutor': tutor.nombre_tutor,
                    'apellido_tutor': tutor.apellido_tutor,
                    'estado_tutor': tutor.estado_tutor
                }
            })
        else:
            return Response({
                'dni': dni,
                'existe': False,
                'activo': False,
                'mensaje': 'DNI disponible para nuevo tutor'
            })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#  VERIFICACIÓN EMAIL TUTOR
@api_view(['GET'])
def verificar_email_tutor(request):
    """Verificar si email de tutor ya existe"""
    try:
        email = request.GET.get('email', '')
        if not email:
            return Response({'error': 'Email requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        tutor = Tutor.objects.filter(correo_tutor=email).first()
        if tutor:
            return Response({
                'email': email,
                'existe': True,
                'activo': tutor.estado_tutor == 'Activo',
                'mensaje': f'Email ya registrado - Tutor: {tutor.nombre_tutor} {tutor.apellido_tutor}',
                'tutor_data': {
                    'id_tutor': tutor.id_tutor,
                    'nombre_tutor': tutor.nombre_tutor,
                    'apellido_tutor': tutor.apellido_tutor,
                    'estado_tutor': tutor.estado_tutor
                }
            })
        else:
            return Response({
                'email': email,
                'existe': False,
                'activo': False,
                'mensaje': 'Email disponible'
            })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#  VERIFICACIÓN TELÉFONO TUTOR
@api_view(['GET'])
def verificar_telefono_tutor(request):
    """Verificar si teléfono de tutor ya existe"""
    try:
        telefono = request.GET.get('telefono', '')
        if not telefono:
            return Response({'error': 'Teléfono requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        tutor = Tutor.objects.filter(telefono_tutor=telefono).first()
        if tutor:
            return Response({
                'telefono': telefono,
                'existe': True,
                'activo': tutor.estado_tutor == 'Activo',
                'mensaje': f'Teléfono ya registrado - Tutor: {tutor.nombre_tutor} {tutor.apellido_tutor}',
                'tutor_data': {
                    'id_tutor': tutor.id_tutor,
                    'nombre_tutor': tutor.nombre_tutor,
                    'apellido_tutor': tutor.apellido_tutor,
                    'estado_tutor': tutor.estado_tutor
                }
            })
        else:
            return Response({
                'telefono': telefono,
                'existe': False,
                'activo': False,
                'mensaje': 'Teléfono disponible'
            })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#  VERIFICACIÓN TUTOR ACTIVO POR DNI
@api_view(['GET'])
def verificar_tutor_activo_by_dni(request, dni):
    """Verificar específicamente si un tutor está ACTIVO por DNI"""
    try:
        tutor = Tutor.objects.filter(dni_tutor=dni).first()
        
        if tutor:
            return Response({
                'existe': True,
                'activo': tutor.estado_tutor == 'Activo',
                'tutorInactivo': tutor if tutor.estado_tutor != 'Activo' else None,
                'mensaje': f'Tutor {tutor.nombre_tutor} {tutor.apellido_tutor} - Estado: {tutor.estado_tutor}'
            })
        else:
            return Response({
                'existe': False,
                'activo': False,
                'tutorInactivo': None,
                'mensaje': 'No existe tutor con este DNI'
            })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#  VERIFICACIÓN CUPOS GRADO
@api_view(['GET'])
def verificar_cupos_grado(request, id_grado):
    """Verificar cupos disponibles en un grado"""
    try:
        grado = Grado.objects.filter(id_grado=id_grado).first()
        if not grado:
            return Response({'error': 'Grado no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'id_grado': grado.id_grado,
            'nombre_grado': grado.nombre_grado,
            'asientos_disponibles': grado.asientos_disponibles,
            'tiene_cupos': grado.asientos_disponibles > 0,
            'mensaje': f'{grado.nombre_grado} - {grado.asientos_disponibles} cupos disponibles'
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#  OBTENER ALUMNO POR DNI (para verificación)
@api_view(['GET'])
def get_alumno_by_dni(request, dni):
    """Obtener alumno por DNI (para verificación)"""
    try:
        alumno = Alumno.objects.filter(dni_alumno=dni).first()
        if alumno:
            return Response({
                'existe': True,
                'alumno': {
                    'id_alumno': alumno.id_alumno,
                    'dni_alumno': alumno.dni_alumno,
                    'nombre_alumno': alumno.nombre_alumno,
                    'apellido_alumno': alumno.apellido_alumno,
                    'estado_alumno': alumno.estado_alumno
                }
            })
        else:
            return Response({
                'existe': False,
                'alumno': None
            })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)    