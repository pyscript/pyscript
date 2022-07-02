from django.http import HttpResponse
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Todo
from .serializers import TodoSerializer


# Create your views here.
@api_view(["GET", "POST"])
def GetTodo(request):
    if request.method == "GET":
        try:
            todo = Todo.objects.all()
        except:
            return HttpResponse(status=404)
        serializer = TodoSerializer(todo, many=True)
        return Response(serializer.data)
    if request.method == "POST":
        print(request.data)
        serializer = TodoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return HttpResponse(status=201)


@api_view(["DELETE"])
def DeleteTodo(request, id):
    if request.method == "DELETE":
        try:
            todo = Todo.objects.get(pk=id)
        except:
            return HttpResponse(status=404)
        data = {}
        operation = todo.delete()
        if operation:
            data["success"] = "deleted"
            return Response(data)
        else:
            data["success"] = "error"
