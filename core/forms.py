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
                "class": "form-control",
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


class SetupForm(forms.Form):
    operator_password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control mb-2",
                "placeholder": "Пароль",
            }
        )
    )
    operator_password_confirm = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control",
                "placeholder": "Подтверждение пароля",
            }
        )
    )

    screen_password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control mb-2",
                "placeholder": "Пароль",
            }
        )
    )
    screen_password_confirm = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control",
                "placeholder": "Подтверждение пароля",
            }
        )
    )

    def clean(self):
        cleaned_data = super().clean()

        operator_password = cleaned_data.get("operator_password")
        operator_password_confirm = cleaned_data.get("operator_password_confirm")
        if operator_password != operator_password_confirm:
            self.add_error("operator_password_confirm", "Пароли не совпадают")

        screen_password = cleaned_data.get("screen_password")
        screen_password_confirm = cleaned_data.get("screen_password_confirm")
        if screen_password != screen_password_confirm:
            self.add_error("screen_password_confirm", "Пароли не совпадают")
