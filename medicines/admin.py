from django.contrib import admin

from .models import Medicine


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "category", "quantity", "reorder_level", "expiry_date", "supplier"]
    search_fields = ["code", "name", "category", "supplier"]
    list_filter = ["category"]
