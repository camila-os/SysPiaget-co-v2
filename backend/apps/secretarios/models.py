from django.db import models
from datetime import date
from django.contrib.auth.models import User  #  AGREGAR
from django.db.models.signals import post_delete, post_save  #  AGREGAR
from django.dispatch import receiver  #  AGREGAR
import logging  #  AGREGAR

logger = logging.getLogger(__name__)

class Parentesco(models.Model):
    id_parentesco = models.AutoField(primary_key=True)
    parentesco_nombre = models.CharField(max_length=45)

    class Meta:
        db_table = 'parentescos'
        managed = False

    def __str__(self):
        return self.parentesco_nombre
    
    

class Tutor(models.Model):
    GENERO_OPCIONES = [('M','Masculino'),('F','Femenino'),('O', 'Otro')]
    ESTADO_OPCIONES = (
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
    )

    id_tutor = models.AutoField(primary_key=True)
    dni_tutor = models.IntegerField(unique=True)
    nombre_tutor = models.CharField(max_length=35)
    apellido_tutor = models.CharField(max_length=35)
    telefono_tutor = models.CharField(max_length=15)
    correo_tutor = models.EmailField(max_length=100, unique=True)
    genero_tutor = models.CharField(max_length=1, choices=GENERO_OPCIONES)
    estado_tutor = models.CharField(max_length=10, choices=ESTADO_OPCIONES, default="Activo")
    primer_login = models.BooleanField(default=True)

    class Meta:
        db_table = 'tutores'
        managed = True
        ordering = ['apellido_tutor', 'nombre_tutor']

    def __str__(self):
        return f"{self.apellido_tutor}, {self.nombre_tutor} (DNI: {self.dni_tutor})"

    def sync_user(self):
        """Sincroniza con User de Django para autenticación usando DNI - MISMÁ LOGICA QUE EMPLEADOS"""
        try:
            user, created = User.objects.get_or_create(username=str(self.dni_tutor))
            if created:
                user.set_password(str(self.dni_tutor))  # Contraseña temporal = DNI
                user.save()
                self.primer_login = True
                self.save()
                logger.info(f" Usuario creado automáticamente para tutor DNI: {self.dni_tutor}")
            else:
                logger.info(f" Usuario ya existía para tutor DNI: {self.dni_tutor}")
            return user
        except Exception as e:
            logger.error(f" Error creando usuario para tutor {self.dni_tutor}: {e}")
            return None

#  SEÑAL PARA CREAR USUARIO AUTOMÁTICAMENTE AL CREAR TUTOR
@receiver(post_save, sender=Tutor)
def crear_usuario_para_tutor(sender, instance, created, **kwargs):
    """Señal que crea el usuario automáticamente cuando se crea un tutor - MISMÁ LOGICA QUE EMPLEADOS"""
    if created:
        logger.info(f" Ejecutando señal post_save para tutor DNI: {instance.dni_tutor}")
        instance.sync_user()

#  SEÑAL PARA ELIMINAR USUARIO AL ELIMINAR TUTOR
@receiver(post_delete, sender=Tutor)
def eliminar_usuario_tutor(sender, instance, **kwargs):
    """Señal que elimina el usuario cuando se elimina un tutor - MISMÁ LOGICA QUE EMPLEADOS"""
    try:
        user = User.objects.get(username=str(instance.dni_tutor))
        user.delete()
        logger.info(f" Usuario {user.username} eliminado automáticamente para tutor")
    except User.DoesNotExist:
        logger.warning(f" No se encontró usuario para tutor {instance.dni_tutor}")
    except Exception as e:
        logger.error(f" Error eliminando usuario para tutor {instance.dni_tutor}: {e}")

class Alumno(models.Model):
    GENERO_OPCIONES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro')
    ]
    ESTADO_OPCIONES = [
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
    ]

    id_alumno = models.AutoField(primary_key=True)
    dni_alumno = models.IntegerField(unique=True)
    nombre_alumno = models.CharField(max_length=35)
    apellido_alumno = models.CharField(max_length=35)
    fecha_nacimiento_alumno = models.DateField()
    genero_alumno = models.CharField(max_length=1, choices=GENERO_OPCIONES)
    observaciones_alumno = models.CharField(max_length=250, blank=True, null=True)
    estado_alumno = models.CharField(max_length=10, choices=ESTADO_OPCIONES, default='Activo')

    class Meta:
        db_table = 'alumnos'
        managed = True
        ordering = ['apellido_alumno', 'nombre_alumno']

    def __str__(self):
        return f"{self.apellido_alumno}, {self.nombre_alumno} (DNI: {self.dni_alumno})"

    def get_edad(self):
        if self.fecha_nacimiento_alumno:
            today = date.today()
            return today.year - self.fecha_nacimiento_alumno.year - (
                (today.month, today.day) < (self.fecha_nacimiento_alumno.month, self.fecha_nacimiento_alumno.day)
            )
        return None

class Grado(models.Model):
    id_grado = models.AutoField(primary_key=True)
    nombre_grado = models.CharField(max_length=50)
    asientos_disponibles = models.IntegerField()

    class Meta:
        db_table = 'grados'
        managed = False
        ordering = ['nombre_grado']

    def __str__(self):
        return f"{self.nombre_grado} - {self.asientos_disponibles} asientos"

class Colegios_procedencia(models.Model):
    id = models.AutoField(primary_key=True)
    nro_colegio_procedencia = models.IntegerField(unique=True, blank=True, null=True)
    nombre_colegio_procedencia = models.CharField(max_length=150, blank=False, null=False)

    class Meta:
        db_table = 'colegios_procedencia'
        managed = False
        ordering = ['nombre_colegio_procedencia']

    def __str__(self):
        return self.nombre_colegio_procedencia

class AlumnoXGrado(models.Model):
    id_alumno_x_grado = models.AutoField(primary_key=True, db_column='id_alumno_x_grado')
    id_alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, db_column='id_alumno')
    id_grado = models.ForeignKey(Grado, on_delete=models.CASCADE, db_column='id_grado')
    
    # CORREGIDO: Referenciar el ID (PK) del colegio
    id_colegio_procedencia = models.ForeignKey(
        Colegios_procedencia, 
        on_delete=models.CASCADE, 
        db_column='id_colegio_procedencia'
    )
    
    fecha_inscripcion = models.DateField(auto_now_add=True, db_column='fecha_inscripcion')
    activo = models.BooleanField(default=True, db_column='activo')
    
    class Meta:
        db_table = 'alumnos_x_grados'
        unique_together = ['id_alumno', 'id_grado']
    
class AlumnoXTutor(models.Model):
    id_alumno_x_tutor = models.AutoField(primary_key=True)
    id_tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, db_column='id_tutor')
    id_alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, db_column='id_alumno', related_name='alumnos_tutores')
    id_parentesco = models.ForeignKey(Parentesco, on_delete=models.CASCADE, db_column='id_parentesco')

    class Meta:
        db_table = 'alumno_x_tutor'
        managed = False
        unique_together = ('id_alumno', 'id_tutor')

    def __str__(self):
        return f"Alumno: {self.id_alumno} - Tutor: {self.id_tutor} - Parentesco: {self.id_parentesco}"
