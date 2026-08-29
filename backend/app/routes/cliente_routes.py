from flask import Blueprint
from app.controllers.cliente_controller import ClienteController

cliente_bp = Blueprint('cliente_bp', __name__)

# Route limpa, apenas mapeia a URL para o Controller
@cliente_bp.route('/', methods=['POST'])
def criar_cliente():
    return ClienteController.criar()