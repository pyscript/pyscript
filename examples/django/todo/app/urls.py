from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.GetTodo),
    path('delete/<int:id>', views.DeleteTodo),
]
