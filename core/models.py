from datetime import datetime, date, timedelta
from django.db import models
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class Speaker(models.Model):
    full_name = models.CharField(max_length=200, verbose_name="ФИО докладчика")
    topic = models.CharField(max_length=300, verbose_name="Тема выступления")
    time_limit = models.IntegerField(default=300, verbose_name="Время (сек)")

    def __str__(self):
        return f'{self.full_name.split()[0]} {self.full_name.split()[1][0]}.{self.full_name.split()[2][0]}. — "{self.topic}"'


class Conference(models.Model):
    speaker = models.ForeignKey(
        Speaker, on_delete=models.SET_NULL, null=True, blank=True
    )
    start_time = models.DateTimeField(null=True, blank=True)
    is_running = models.BooleanField(default=False)

    def __str__(self):
        return f"Выступает: {self.speaker}"

    class Meta:
        verbose_name_plural = "Conference"
