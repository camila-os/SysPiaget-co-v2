from rest_framework import serializers
from .models import Alumno, AlumnoXGrado, Tutor, AlumnoXTutor, Grado, Colegios_procedencia, Parentesco
from datetime import date

class AlumnoSerializer(serializers.ModelSerializer):
    # ✅ AGREGAR CAMPOS PARA INFORMACIÓN DE GRADO
    id_grado = serializers.SerializerMethodField()
    nombre_grado = serializers.SerializerMethodField()
    grado_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Alumno
        fields = [
            'id_alumno', 
            'dni_alumno', 
            'nombre_alumno', 
            'apellido_alumno',
            'fecha_nacimiento_alumno',
            'genero_alumno',
            'estado_alumno',
            'observaciones_alumno',
            'id_grado',
            'nombre_grado', 
            'grado_info'
        ]
    
    def get_id_grado(self, obj):
        """Obtener el ID del grado activo del alumno"""
        grado_activo = obj.alumnoxgrado_set.filter(activo=True).first()
        return grado_activo.id_grado.id_grado if grado_activo and grado_activo.id_grado else None
    
    def get_nombre_grado(self, obj):
        """Obtener el nombre del grado activo"""
        grado_activo = obj.alumnoxgrado_set.filter(activo=True).first()
        return grado_activo.id_grado.nombre_grado if grado_activo and grado_activo.id_grado else 'No asignado'
    
    def get_grado_info(self, obj):
        """Obtener información completa del grado"""
        grado_activo = obj.alumnoxgrado_set.filter(activo=True).first()
        if grado_activo and grado_activo.id_grado:
            return {
                'id_grado': grado_activo.id_grado.id_grado,
                'nombre_grado': grado_activo.id_grado.nombre_grado,
                'asientos_disponibles': grado_activo.id_grado.asientos_disponibles
            }
        return None

# FLUJO: createAlumnoCompleto  
class AlumnoXGradoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlumnoXGrado
        fields = '__all__'

# FLUJO: RegistrarTutor
class TutorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tutor
        fields = '__all__'

# FLUJO: createAlumnoCompleto
class AlumnoXTutorSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlumnoXTutor
        fields = '__all__'

# FLUJO: AlumnoForm
class GradoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grado
        fields = '__all__'

# FLUJO: AlumnoForm
class ColegioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Colegios_procedencia
        fields = '__all__'

# FLUJO: RegistrarTutor
class ParentescoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parentesco
        fields = '__all__'