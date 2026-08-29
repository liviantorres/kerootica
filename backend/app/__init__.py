import os
from flask import Flask
from dotenv import load_dotenv
from app.extensions import db, migrate, ma


def create_app():
    load_dotenv()

    app = Flask(__name__)

    # Configurações do Banco de Dados
    db_user = os.getenv('DB_USER')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_port = os.getenv('DB_PORT', '5432')
    db_name = os.getenv('DB_NAME')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Inicializa as extensões
    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)

    # Registra as rotas (Blueprints)
    from app.routes.cliente_routes import cliente_bp
    from app.routes.usuario_routes import usuario_bp

    app.register_blueprint(cliente_bp, url_prefix='/api/clientes')
    app.register_blueprint(usuario_bp)

    return app