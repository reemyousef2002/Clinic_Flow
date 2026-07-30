from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("patients.urls")),
    path("api/", include("doctors.urls")),
    path("api/", include("appointments.urls")),
    path("api/", include("medicines.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include("dashboard.urls")),
]
