from rest_framework import serializers
from .models import Alumno, AlumnoXGrado, Tutor, AlumnoXTutor, Grado, Colegios_procedencia, Parentesco
from datetime import date

# FLUJO: createAlumnoCompleto
class AlumnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alumno
        fields = '__all__'

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