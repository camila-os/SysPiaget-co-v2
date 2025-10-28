from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from django.db.models.signals import post_delete
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)

class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=45, unique=True)

    class Meta:
        db_table = 'roles'
        managed = False

    def save(self, *args, **kwargs):
        self.nombre_rol = self.nombre_rol.strip().lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre_rol

class Empleado(models.Model):
    GENERO_OPCIONES = [('M','Masculino'),('F','Femenino')]
    ESTADO_OPCIONES = (
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
    )

    id_empleado = models.AutoField(primary_key=True)
    
    dni_validator = RegexValidator(
        regex=r'^[0-9]+$',
        message='El DNI solo puede contener dígitos.'
    )
    dni_empleado = models.CharField(
        max_length=8,
        unique=True,
        validators=[dni_validator]
    )

    nombre_validator = RegexValidator(
        regex=r'^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$',
        message='El nombre solo puede contener letras y espacios.'
    )
    nombre_empleado = models.CharField(max_length=35, validators=[nombre_validator])
    apellido_empleado = models.CharField(max_length=35, validators=[nombre_validator])

    telefono_validator = RegexValidator(
        regex=r'^\d*$',
        message='El teléfono solo puede contener números.'
    )
    telefono_empleado = models.CharField(
        max_length=13,
        null=True, 
        blank=True, 
        validators=[telefono_validator]
    )

    genero_empleado = models.CharField(max_length=1, choices=GENERO_OPCIONES)
    id_rol = models.ForeignKey(Rol, on_delete=models.DO_NOTHING, db_column='id_rol')
    estado_empleado = models.CharField(max_length=8, choices=ESTADO_OPCIONES, default='Activo')
    correo_empleado = models.CharField(max_length=45)
    primer_login = models.BooleanField(default=True)

    class Meta:
        db_table = 'empleados'
        managed = False
        ordering = ['apellido_empleado', 'nombre_empleado']

    def __str__(self):
        return f"{self.apellido_empleado}, {self.nombre_empleado}"

    def sync_user(self):
        """Sincroniza con User de Django para autenticación usando DNI"""
        user, created = User.objects.get_or_create(username=self.dni_empleado)
        if created:
            user.set_password(str(self.dni_empleado))
            user.save()
            self.primer_login = True
            self.save()
            logger.info(f"Usuario creado para empleado DNI: {self.dni_empleado}")
        return user

@receiver(post_delete, sender=Empleado)
def eliminar_usuario_asociado(sender, instance, **kwargs):
    """Señal que elimina el usuario cuando se elimina un empleado"""
    try:
        user = User.objects.get(username=instance.dni_empleado)
        user.delete()
        logger.info(f"Usuario {user.username} eliminado automáticamente")
    except User.DoesNotExist:
        logger.warning(f"No se encontró usuario para empleado {instance.dni_empleado}")
    except Exception as e:
        logger.error(f"Error eliminando usuario para empleado {instance.dni_empleado}: {e}")