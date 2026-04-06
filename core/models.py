from datetime import datetime, date, timedelta
import re
from django.db import models
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class Speaker(models.Model):
    full_name = models.CharField(max_length=200, verbose_name="ФИО докладчика")
    topic = models.CharField(
        max_length=300, verbose_name="Тема выступления", blank=True
    )
    time_limit = models.DurationField(
        default=timedelta(seconds=300), verbose_name="Время (ЧЧ:ММ:СС)"
    )
    initial_time_limit = models.DurationField(
        default=timedelta(seconds=300), verbose_name="Изначальное время (ЧЧ:ММ:СС)"
    )

    @staticmethod
    def _collapse_initials_spacing(value: str) -> str:
        if not value:
            return value

        normalized = " ".join(value.split())
        match = re.fullmatch(r"([^\s]+)\s+([A-Za-zА-Яа-яЁё])\.\s*([A-Za-zА-Яа-яЁё])\.?", normalized)
        if not match:
            return normalized

        surname, first_initial, second_initial = match.groups()
        return f"{surname.capitalize()} {first_initial.upper()}.{second_initial.upper()}."

    @property
    def time_limit_seconds(self):
        """Возвращает время в секундах"""
        return int(self.time_limit.total_seconds())

    @property
    def initial_time_limit_seconds(self):
        """Возвращает время в секундах"""
        return int(self.initial_time_limit.total_seconds())

    @property
    def time_limit_formatted(self):
        """Получить время в формате MM:SS"""
        total_seconds = int(self.time_limit.total_seconds())
        is_negative = total_seconds < 0
        abs_seconds = abs(total_seconds)
        minutes = abs_seconds // 60
        seconds = abs_seconds % 60
        formatted = f"{minutes:02d}:{seconds:02d}"
        return f"-{formatted}" if is_negative else formatted

    @property
    def formatted_name(self):
        return self._normalize_text(self.full_name)

    @property
    def short_name(self):
        normalized_name = self._normalize_text(self.full_name)
        compact_match = re.fullmatch(
            r"([^\s]+)\s+([A-Za-zА-Яа-яЁё])\.([A-Za-zА-Яа-яЁё])\.",
            normalized_name,
        )
        if compact_match:
            surname, first_initial, second_initial = compact_match.groups()
            return f"{surname} {first_initial.upper()}.{second_initial.upper()}."

        parts = [part for part in normalized_name.split() if part.strip()]
        if not parts:
            return ""
        surname = parts[0].capitalize()
        initials = ""
        if len(parts) >= 2 and parts[1]:
            initials += f" {parts[1][0].upper()}."
        if len(parts) >= 3 and parts[2]:
            initials += f"{parts[2][0].upper()}."
        return surname + initials

    @staticmethod
    def _normalize_text(s: str) -> str:
        if not s:
            return s
        collapsed = Speaker._collapse_initials_spacing(s)
        if re.fullmatch(r"([^\s]+)\s+[A-Za-zА-ЯЁ]\.[A-Za-zА-ЯЁ]\.", collapsed, flags=re.IGNORECASE):
            return collapsed
        return collapsed.title()

    def save(
        self,
        *args,
        force_insert: bool = False,
        force_update: bool = False,
        using=None,
        update_fields=None,
    ):
        if update_fields is None or "full_name" in update_fields:
            if getattr(self, "full_name", None):
                self.full_name = self._normalize_text(self.full_name)

        if self.time_limit.total_seconds() < 0:
            self.time_limit = timedelta(seconds=0)

        if getattr(self, "_state", None) and getattr(self._state, "adding", False):
            self.initial_time_limit = self.time_limit

        super().save(
            *args,
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields,
        )

    def __str__(self):
        return f'{self.full_name} — "{self.topic}"'


class Conference(models.Model):
    singleton_enforcer = models.BooleanField(default=True, unique=True, editable=False)
    speaker = models.ForeignKey(
        Speaker, on_delete=models.SET_NULL, null=True, blank=True
    )
    is_running = models.BooleanField(default=False)
    # Visibility flags
    show_name = models.BooleanField(default=True)
    show_topic = models.BooleanField(default=True)

    def __str__(self):
        return f"Выступает: {self.speaker}"

    class Meta:
        verbose_name_plural = "Conference"
