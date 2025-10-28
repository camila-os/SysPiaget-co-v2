from django.db import models
from datetime import date
from apps.login.models import Empleado
from rest_framework import viewsets, filters
from apps.secretarios.models import Alumno, Grado, Tutor
from apps.secretarios.serializers import AlumnoSerializer

# Create your models here.
class Lugar(models.Model):
    id_lugar = models.AutoField(primary_key=True)
    nombre_lugar = models.CharField(max_length=50)

    class Meta:
        db_table = 'lugares'
        managed = False

    def __str__(self):
        return self.nombre_lugar

class TipoIncidencia(models.Model):
    id_tipo_incidencia = models.AutoField(primary_key=True)
    tipo_incidencia_nombre = models.CharField(max_length=100)

    class Meta:
        db_table = 'tipo_incidencia'
        managed = False

    def __str__(self):
        return self.tipo_incidencia_nombre
    
class Incidencia(models.Model):
    id_incidencia = models.AutoField(primary_key=True)
    nombre_incidencia = models.CharField(max_length=150)
    tipo_incidencia = models.ForeignKey(TipoIncidencia, on_delete=models.PROTECT, db_column='id_tipo_incidencia')
    
    class Meta:
        db_table = 'incidencias'
        managed = False
    
    def __str__(self):
        return f"{self.nombre_incidencia} ({self.tipo_incidencia})"


class MedidaXAlumno(models.Model):
    id_medida_x_alumno = models.AutoField(primary_key=True, db_column='medida_alumno')  # ✅ NOMBRE CORRECTO
    incidencia = models.ForeignKey(Incidencia, on_delete=models.PROTECT, db_column='id_incidencia')
    id_alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, db_column='id_alumno')
    id_empleado = models.ForeignKey(Empleado, on_delete=models.PROTECT, db_column='id_empleado')
    id_lugar = models.ForeignKey(Lugar, on_delete=models.PROTECT, db_column='id_lugar')
    fecha_medida = models.DateField(auto_now_add=True)
    cantidad_dias = models.IntegerField(default=0)
    descripcion_caso = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'medidas_x_alumnos'
        ordering = ['-fecha_medida']
        managed = False
    
    def __str__(self):
        return f"Medida #{self.id_medida_x_alumno} - {self.id_alumno} - {self.incidencia}"
    
    @property
    def es_suspension(self):
        return self.cantidad_dias > 0

    def get_resumen(self):
        return {
            'id': self.id_medida_x_alumno,
            'alumno': str(self.id_alumno),
            'incidencia': self.incidencia.nombre_incidencia,
            'tipo_incidencia': str(self.incidencia.tipo_incidencia),
            'lugar': str(self.lugar),
            'dias_suspension': self.cantidad_dias,
            'tipo_reunion': self.get_tipo_reunion_display(),
            'fecha': self.fecha_medida.strftime('%d/%m/%Y %H:%M'),
            'estado': self.get_estado_display()
        }
    

class Reunion(models.Model):
    TIPO_REUNION_OPCIONES = [
        ('REUNIÓN INDIVIDUAL', 'Reunion Individual'),
        ('REUNIÓN GENERAL PADRES', 'Reunion General Padres'),
        ('REUNIÓN BILATERAL PADRES', 'Reunion Bilateral Padres')
    ]
    id_reunion = models.AutoField(primary_key=True)
    fecha_hora_reunion = models.DateTimeField()
    tipo_reunion =  models.CharField(
        max_length=30, 
        choices=TIPO_REUNION_OPCIONES,
        default='reunion general padres'
    )
    descripcion_reunion = models.CharField(max_length=255, blank=True, null=True)
    id_empleado = models.ForeignKey(Empleado, on_delete=models.PROTECT, db_column='id_empleado')

    def __str__(self):
        return f"Reunión #{self.id_reunion} - {self.tipo_reunion} - {self.fecha_hora_reunion}"
    
    class Meta:
        db_table = 'reuniones'
        managed = False


class Asistencia(models.Model):
    ESTADO_ASISTENCIA_OPCIONES = [
        ('SÍ', 'Sí'),
        ('NO', 'No'),
        ('SE RETIRÓ', 'Se retiró')
    ]
    id_asistencia = models.AutoField(primary_key=True)
    id_reunion = models.ForeignKey(Reunion, on_delete=models.PROTECT, db_column='id_reunion')
    id_tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, db_column='id_tutor')
    fecha_llegada_asistencia = models.DateTimeField()
    estado_asistencia = models.CharField(
        max_length=10,
        choices=ESTADO_ASISTENCIA_OPCIONES,
        default='no'
    )

    class Meta:
        db_table = 'asistencias'
        managed = False
        unique_together = (('id_reunion', 'id_tutor'),)
    
    def __str__(self):
        return f"Asistencia #{self.id_asistencia} - {self.id_tutor} - {self.get_estado_asistencia_display()}"


class ActExtracurricular(models.Model):
    id_act_extracurricular = models.AutoField(primary_key=True)
    nombre_act_extracurricular = models.CharField(max_length=100)
    destino_act_extracurricular = models.CharField(max_length=45)
    descripcion_act_extracurricular = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'act_extracurriculares'
        managed = False

    def __str__(self):
        return self.nombre_act_extracurricular
    

class ActExtracurricularXGrado(models.Model):
    id_act_extracurricular_x_grado = models.AutoField(primary_key=True)
    id_act_extracurricular = models.ForeignKey(ActExtracurricular, on_delete=models.CASCADE, db_column='id_act_extracurricular')
    id_grado = models.ForeignKey(Grado, on_delete=models.CASCADE, db_column='id_grado')
    fecha_hora_actividad = models.DateTimeField()
    fecha_hora_salida = models.DateTimeField()

    class Meta:
        db_table = 'act_extracurriculares_x_grados'
        managed = False
        unique_together = (('id_act_extracurricular', 'id_grado'),)

    def __str__(self):
        return f"Actividad extracurricular: {self.id_act_extracurricular} - Id Grado: {self.id_grado} - {self.fecha_hora_actividad}"
    

    class AlumnoViewSet(viewsets.ModelViewSet):
        queryset = Alumno.objects.all()
        serializer_class = AlumnoSerializer
        filter_backends = [filters.SearchFilter]
        search_fields = ['dni']