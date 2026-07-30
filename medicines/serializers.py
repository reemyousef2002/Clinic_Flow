from rest_framework import serializers

from .models import Medicine


class MedicineSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)
    is_expiring_soon = serializers.BooleanField(read_only=True)

    class Meta:
        model = Medicine
        fields = [
            "id", "code", "name", "category", "quantity", "price", "supplier",
            "expiry_date", "reorder_level", "is_low_stock", "is_expiring_soon", "created_at",
        ]
        read_only_fields = ["id", "code", "created_at"]
