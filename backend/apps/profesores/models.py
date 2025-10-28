from django.db import models

class Asignatura(models.Model):
    id_asignatura = models.AutoField(primary_key=True)
    nombre_asignatura = models.CharField(max_length=45)
    descripcion_asignatura = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'asignaturas'
        managed = True

    def __str__(self):
        return self.nombre_asignatura


class DictadoClase(models.Model):
    dictado_clase = models.AutoField(primary_key=True)
    id_grado = models.IntegerField()
    id_asignatura = models.IntegerField()
    dni_empleado = models.IntegerField()

    class Meta:
        db_table = 'dictados_clases'
        managed = True

    def __str__(self):
        return f"Dictado: {self.dictado_clase} - Grado: {self.id_grado} - Asignatura: {self.id_asignatura}"
