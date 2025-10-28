from rest_framework import serializers
from .models import Lugar, TipoIncidencia, Incidencia, MedidaXAlumno, Reunion, Asistencia, ActExtracurricular, ActExtracurricularXGrado

class LugarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lugar
        fields ='__all__'


class TipoIncidenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoIncidencia
        fields = '__all__'


class IncidenciaSerializer(serializers.ModelSerializer):
    tipo_incidencia_nombre = serializers.CharField(source='tipo_incidencia.tipo_incidencia_nombre', read_only=True)
    
    class Meta:
        model = Incidencia
        fields = ['id_incidencia', 'nombre_incidencia', 'tipo_incidencia', 'tipo_incidencia_nombre']


# En serializers.py - MODIFICAR MedidaXAlumnoSerializer
class MedidaXAlumnoSerializer(serializers.ModelSerializer):
    alumno_nombre = serializers.CharField(source='id_alumno.nombre_alumno', read_only=True)
    incidencia_nombre = serializers.CharField(source='incidencia.nombre_incidencia', read_only=True)
    lugar_nombre = serializers.CharField(source='id_lugar.nombre_lugar', read_only=True)
    empleado_nombre = serializers.CharField(source='id_empleado.nombre_empleado', read_only=True)

    # Incluir el DNI del alumno
    dni_alumno = serializers.CharField(source='id_alumno.dni_alumno', read_only=True)
    
    # ✅ Campos calculados (solo lectura)
    tipo_medida = serializers.CharField(read_only=True)
    tipo_medida_display = serializers.CharField(read_only=True)
    es_suspension = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = MedidaXAlumno
        fields = [
            'id_medida_x_alumno',
            'incidencia', 
            'id_alumno',
            'id_empleado', 
            'id_lugar',
            'fecha_medida',
            'cantidad_dias',
            'descripcion_caso',
            # Campos relacionados
            'alumno_nombre',
            'incidencia_nombre', 
            'lugar_nombre',
            'empleado_nombre',
            'dni_alumno',
            # Campos calculados (solo lectura)
            'tipo_medida',
            'tipo_medida_display', 
            'es_suspension',
        ]
        read_only_fields = ['tipo_medida', 'tipo_medida_display', 'es_suspension']
    
    def validate_cantidad_dias(self, value):
        """Validar que los días no sean negativos"""
        if value < 0:
            raise serializers.ValidationError("La cantidad de días no puede ser negativa")
        return value
    
    def create(self, validated_data):
        """Sobrescribir create para asegurar que tipo_medida no se envíe"""
        # Remover tipo_medida si está presente (por si acaso)
        validated_data.pop('tipo_medida', None)
        validated_data.pop('tipo_medida_display', None)
        validated_data.pop('es_suspension', None)
        
        print("Creando medida con datos:", validated_data)
        return super().create(validated_data)


class ReunionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reunion
        fields = '__all__'


class AsistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asistencia
        fields = '__all__'


class ActExtracurricularSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActExtracurricular
        fields = '__all__'


class ActExtracurricularXGradoSerializer(serializers.ModelSerializer):
    class Meta:
        model =ActExtracurricularXGrado
        fields = '__all__'