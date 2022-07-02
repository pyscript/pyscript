from django.db import models

# Create your models here.


class Todo(models.Model):
    task = models.CharField(max_length=500)
    created_on = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.task
