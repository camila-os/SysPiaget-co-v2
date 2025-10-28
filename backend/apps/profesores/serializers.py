from rest_framework import serializers
from .models import Asignatura, DictadoClase

class AsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignatura
        fields = '__all__'


class DictadoClaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = DictadoClase
        fields = '__all__'
