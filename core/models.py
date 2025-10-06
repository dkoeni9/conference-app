from datetime import datetime, date, timedelta
from django.db import models
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class Speaker(models.Model):
    full_name = models.CharField(max_length=200, verbose_name="ФИО докладчика")
    topic = models.CharField(max_length=300, verbose_name="Тема выступления")
    time_limit = models.PositiveIntegerField(default=300, verbose_name="Время (сек)")

    def __str__(self):
        return f'{self.full_name.split()[0]} {self.full_name.split()[1][0]}.{self.full_name.split()[2][0]}. — "{self.topic}"'


class Conference(models.Model):
    speaker = models.ForeignKey(
        Speaker, on_delete=models.SET_NULL, null=True, blank=True
    )
    start_time = models.DateTimeField(null=True, blank=True)
    is_running = models.BooleanField(default=False)

    def calculate_remaining_time(self):
        # Robust calculation:
        # prefer speaker.time_limit (seconds), fallback to speaker.duration (minutes -> seconds)
        speaker = getattr(self, "speaker", None)
        if not speaker:
            logger.debug("calculate_remaining_time: no speaker attached")
            return 0

        time_limit = getattr(speaker, "time_limit", None)
        if time_limit is None:
            duration = getattr(speaker, "duration", None)
            if duration is not None:
                time_limit = int(duration) * 60
            else:
                time_limit = 0

        # If not running, show full time_limit
        if not getattr(self, "is_running", False) or not getattr(
            self, "start_time", None
        ):
            logger.debug(
                "calculate_remaining_time: not running or no start_time; returning time_limit=%s",
                time_limit,
            )
            return int(time_limit)

        # running and has start_time — compute elapsed
        try:
            elapsed = int((timezone.now() - self.start_time).total_seconds())
        except Exception as exc:
            logger.exception(
                "calculate_remaining_time: error computing elapsed: %s", exc
            )
            return int(time_limit)

        remaining = max(0, int(time_limit) - elapsed)
        logger.debug(
            "calculate_remaining_time: time_limit=%s elapsed=%s remaining=%s",
            time_limit,
            elapsed,
            remaining,
        )
        return remaining

    def __str__(self):
        return f"Выступает: {self.speaker}"

    class Meta:
        verbose_name_plural = "Conference"
