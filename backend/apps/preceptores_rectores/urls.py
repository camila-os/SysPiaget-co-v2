from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'lugares', views.LugarView, basename='lugar')
router.register(r'tipos-incidencias', views.TipoIncidenciaView, basename='tipoincidencia')
router.register(r'incidencias', views.IncidenciaView, basename='incidencia')
router.register(r'medidas', views.MedidaXAlumnoView, basename='medida')
router.register(r'reuniones', views.ReunionView, basename='reunion')
router.register(r'asistencias', views.AsistenciaView, basename='asistencia')
router.register(r'act-extracurriculares', views.ActExtracurricularView, basename='actextracurricular')
router.register(r'actividades-grados', views.ActExtracurricularXGradoView, basename='actgrados')

urlpatterns = [
    path('', include(router.urls)),
    
    # ✅ URLs EXISTENTES
    path('alumnos/buscar/', views.buscar_alumno_por_dni, name='buscar_alumno_por_dni'),
    path('incidencias/listar/', views.listar_incidencias, name='listar_incidencias'),
    path('incidencias/<int:id_medida>/', views.detalle_incidencia, name='detalle_incidencia'),
    path('tipos-incidencias-completo/', views.tipos_incidencias_con_incidencias, name='tipos_incidencias_completo'),
    path('incidencias-por-tipo/<int:id_tipo_incidencia>/', views.incidencias_por_tipo, name='incidencias_por_tipo'),
    path('alumnos/', views.todos_los_alumnos, name='todos-los-alumnos'),
    path('alumnos/por-grado/<int:id_grado>/', views.alumnos_por_grado, name='alumnos-por-grado'),
]