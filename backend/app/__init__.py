import os

from flask import Flask
from dotenv import load_dotenv

from app.extensions import db, migrate, ma, jwt
from app.routes.cliente_routes import cliente_bp
from app.routes.usuario_routes import usuario_bp
from app.routes.auth_route import auth_bp



def create_app():
    load_dotenv()

    app = Flask(__name__)

    # =========================
    # Banco de dados
    # =========================

    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME")

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"postgresql://{db_user}:{db_password}@"
        f"{db_host}:{db_port}/{db_name}"
    )

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # =========================
    # JWT
    # =========================

    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

    # =========================
    # Inicialização
    # =========================

    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)
    jwt.init_app(app)

    # =========================
    # Rotas
    # =========================

    app.register_blueprint(cliente_bp)
    app.register_blueprint(usuario_bp)
    app.register_blueprint(auth_bp)

    return app