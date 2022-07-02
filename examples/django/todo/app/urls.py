from django.urls import include, path

from . import views

urlpatterns = [
    path("", views.GetTodo),
    path("delete/<int:id>", views.DeleteTodo),
]
