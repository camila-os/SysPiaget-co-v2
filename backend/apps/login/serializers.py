from rest_framework import serializers
from .models import Rol, Empleado
import re

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = "__all__"

    def validate_nombre_rol(self, value):
        valor_normalizado = value.strip().lower()
        
        queryset = Rol.objects.filter(nombre_rol=valor_normalizado)
        if self.instance:
            queryset = queryset.exclude(id_rol=self.instance.id_rol)
        
        if queryset.exists():
            raise serializers.ValidationError("Ese rol ya existe")
        
        return valor_normalizado

class EmpleadoSerializer(serializers.ModelSerializer):
    id_rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all())
    rol_nombre = serializers.CharField(source='id_rol.nombre_rol', read_only=True)

    class Meta:
        model = Empleado
        fields = [
            'id_empleado',
            'dni_empleado',
            'nombre_empleado',
            'apellido_empleado',
            'telefono_empleado',
            'correo_empleado',
            'genero_empleado',
            'id_rol',
            'rol_nombre',
            'estado_empleado',
            'primer_login'
        ]

    def validate_dni_empleado(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("El DNI solo puede contener números.")
        
        # VALIDACIÓN DE LONGITUD PARA DNI
        if len(value) < 8:
            raise serializers.ValidationError("El DNI debe tener al menos 8 dígitos.")
        if len(value) > 8:
            raise serializers.ValidationError("El DNI no puede tener más de 8 dígitos.")
        
        # Validar unicidad
        if self.instance is None:
            if Empleado.objects.filter(dni_empleado=value).exists():
                raise serializers.ValidationError("Ya existe un empleado con este DNI.")
        else:
            if Empleado.objects.filter(dni_empleado=value).exclude(id_empleado=self.instance.id_empleado).exists():
                raise serializers.ValidationError("Ya existe otro empleado con este DNI.")
        
        return value

    def validate_nombre_empleado(self, value):
        value = value.strip()
        

        if not re.fullmatch(r"^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$", value):
            raise serializers.ValidationError("El nombre solo puede contener letras, acentos y espacios.")
        
        # Validar longitud
        if len(value) > 35:
            raise serializers.ValidationError("El nombre no puede tener más de 35 caracteres.")
        if len(value) < 2:
            raise serializers.ValidationError("El nombre debe tener al menos 2 caracteres.")
            
        return value

    def validate_apellido_empleado(self, value):
        value = value.strip()
        
        if not re.fullmatch(r"^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$", value):
            raise serializers.ValidationError("El apellido solo puede contener letras, acentos y espacios.")
        
        # Validar longitud
        if len(value) > 35:
            raise serializers.ValidationError("El apellido no puede tener más de 35 caracteres.")
        if len(value) < 2:
            raise serializers.ValidationError("El apellido debe tener al menos 2 caracteres.")
            
        return value

    def validate_telefono_empleado(self, value):
        if value:  # Solo validar si tiene valor (puede ser null/blank)
            if not value.isdigit():
                raise serializers.ValidationError("El teléfono solo puede contener números.")
            
            # VALIDACIÓN DE LONGITUD PARA TELÉFONO
            if len(value) < 10:
                raise serializers.ValidationError("El teléfono debe tener al menos 10 dígitos.")
            if len(value) > 13:
                raise serializers.ValidationError("El teléfono no puede tener más de 13 dígitos.")
        
        return value

    def validate_correo_empleado(self, value):
        if value:
            if '@' not in value:
                raise serializers.ValidationError("Ingrese un correo electrónico válido.")
            if len(value) > 45:
                raise serializers.ValidationError("El correo no puede tener más de 45 caracteres.")
        return value.strip().lower()

    def create(self, validated_data):
        empleado = Empleado.objects.create(**validated_data)
        empleado.sync_user()
        return empleado

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        instance.sync_user()
        return instance