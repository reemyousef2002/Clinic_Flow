import uuid

from django.db import models, transaction


class Medicine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(
        max_length=20, unique=True, editable=False, blank=True,
        help_text="Human-friendly code (e.g. MED-0001) — easy to search/reference at the pharmacy counter.",
    )
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    supplier = models.CharField(max_length=150)
    expiry_date = models.DateField()
    reorder_level = models.PositiveIntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.code} — {self.name}"

    def save(self, *args, **kwargs):
        if not self.code:
            with transaction.atomic():
                last = (
                    Medicine.objects.select_for_update()
                    .exclude(code="")
                    .order_by("-code")
                    .first()
                )
                last_num = int(last.code.split("-")[1]) if last else 0
                self.code = f"MED-{last_num + 1:04d}"
        super().save(*args, **kwargs)

    @property
    def is_low_stock(self):
        return self.quantity <= self.reorder_level

    @property
    def is_expiring_soon(self):
        from datetime import date, timedelta
        return self.expiry_date <= date.today() + timedelta(days=30)
