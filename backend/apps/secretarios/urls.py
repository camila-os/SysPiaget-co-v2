# secretario/urls.py - AGREGAR ESTAS URLs NUEVAS

from django.urls import path
from . import views

urlpatterns = [
    # 🔍 ENDPOINTS DE VERIFICACIÓN (NUEVOS)
    path('alumnos/verificar-dni/<int:dni>/', views.verificar_dni_alumno, name='verificar-dni-alumno'),
    path('tutores/verificar-dni/<int:dni>/', views.verificar_dni_tutor, name='verificar-dni-tutor'),
    path('tutores/verificar-email/', views.verificar_email_tutor, name='verificar-email-tutor'),
    path('tutores/verificar-telefono/', views.verificar_telefono_tutor, name='verificar-telefono-tutor'),
    path('tutores/verificar-activo/<int:dni>/', views.verificar_tutor_activo_by_dni, name='verificar-tutor-activo'),
    path('grados/verificar-cupos/<int:id_grado>/', views.verificar_cupos_grado, name='verificar-cupos-grado'),
    path('alumnos/buscar-por-dni/<int:dni>/', views.get_alumno_by_dni, name='get-alumno-by-dni'),
    path('empleados/verificar-dni/<int:dni>/', views.verificar_dni_empleado, name='verificar-dni-empleado'),

    path('alumnos/por-grado/<int:id_grado>/', views.alumnos_por_grado, name='alumnos-por-grado'),

    # ENDPOINTS EXISTENTES (MANTENER)
    path('grados/', views.grados_list, name='grados-list'),
    path('colegios/', views.colegios_list, name='colegios-list'),
    path('colegios/crear/', views.crear_colegio, name='crear-colegio'),
    path('tutores/', views.tutores_list, name='tutores-list'),
    path('tutores/crear/', views.crear_tutor, name='crear-tutor'),
    path('parentescos/', views.parentescos_list, name='parentescos-list'),
    path('parentescos/crear/', views.crear_parentesco, name='crear-parentesco'),
    path('alumnos/', views.alumnos_list, name='alumnos-list'),
    path('alumno-completo/', views.create_alumno_completo, name='create-alumno-completo'),
]