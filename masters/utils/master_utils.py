from django.shortcuts import get_object_or_404
from django.http import Http404
import logging

from ..models import Master

logger = logging.getLogger(__name__)


def get_master_by_identifier(identifier):
    if not identifier:
        logger.warning("Пустой identifier мастера")
        raise Http404("Идентификатор мастера не указан")
    
    if identifier.startswith('id'):
        try:
            master_id = int(identifier[2:])
            return get_object_or_404(Master, id=master_id)
        except ValueError:
            logger.warning(f"Неверный формат ID мастера: {identifier}")
            raise Http404("Неверный ID мастера")
    else:
        return get_object_or_404(Master, login=identifier)