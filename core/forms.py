from django import forms
from django.contrib.auth.forms import AuthenticationForm
from .models import Speaker


class CustomAuthenticationForm(AuthenticationForm):
    username = forms.CharField(
        widget=forms.TextInput(
            attrs={
                "class": "form-control mb-2",
                "placeholder": "Имя пользователя",
                "autofocus": True,
            }
        )
    )
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control mb-2",
                "placeholder": "Пароль",
            }
        )
    )


class SpeakerForm(forms.ModelForm):
    class Meta:
        model = Speaker
        fields = ["full_name", "topic", "time_limit"]
        widgets = {
            "full_name": forms.TextInput(
                attrs={
                    "class": "form-control mb-2",
                    "placeholder": "ФИО докладчика",
                }
            ),
            "topic": forms.TextInput(
                attrs={
                    "class": "form-control mb-2",
                    "placeholder": "Тема выступления",
                }
            ),
            "time_limit": forms.TimeInput(
                attrs={
                    "class": "form-control mb-2",
                    "placeholder": "Время (ЧЧ:ММ:СС)",
                    "type": "time",
                }
            ),
        }


class ExtraTimeForm(forms.Form):
    extra_time = forms.IntegerField(
        label="Доп. время (сек)",
        min_value=0,
        required=False,
        widget=forms.NumberInput(
            attrs={
                "class": "form-control mb-2",
                "placeholder": "Доп. время (сек)",
            }
        ),
    )
