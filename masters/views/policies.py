"""
Статические страницы: политика, соглашение, согласие.
"""
from django.shortcuts import render


def privacy_policy(request):
    return render(request, 'masters/public/privacy.html')


def terms_of_service(request):
    return render(request, 'masters/public/terms.html')


def agree(request):
    return render(request, 'masters/public/agree.html')