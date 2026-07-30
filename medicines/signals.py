from django.db.models.signals import post_save
from django.dispatch import receiver

from notifications.models import Notification
from .models import Medicine


@receiver(post_save, sender=Medicine)
def check_medicine_alerts(sender, instance: Medicine, **kwargs):
    """
    Implements FR8/US-07: automatically create a notification when a medicine's
    stock falls below its reorder level, or when it is nearing its expiry date.
    Avoids duplicate spam by checking for an existing unread notification first.
    """
    if instance.is_low_stock:
        already_exists = Notification.objects.filter(
            title="Low stock alert", message__icontains=instance.name, read=False
        ).exists()
        if not already_exists:
            Notification.objects.create(
                title="Low stock alert",
                message=f"{instance.name} is low on stock ({instance.quantity} remaining).",
                type="warning",
            )

    if instance.is_expiring_soon:
        already_exists = Notification.objects.filter(
            title="Medicine expiring soon", message__icontains=instance.name, read=False
        ).exists()
        if not already_exists:
            Notification.objects.create(
                title="Medicine expiring soon",
                message=f"{instance.name} expires on {instance.expiry_date:%Y-%m-%d}.",
                type="warning",
            )
