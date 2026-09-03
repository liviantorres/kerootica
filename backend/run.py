from app import create_app
from app.extensions import db
from flask_cors import CORS

app = create_app()
CORS(app)
# Inspeciona o banco e cria a tabela "usuarios" (e outras) se não existirem
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # host='0.0.0.0' é essencial para o Docker expor a porta corretamente para o seu Windows
    app.run(host='0.0.0.0', debug=True)