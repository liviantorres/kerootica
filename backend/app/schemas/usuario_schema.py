from marshmallow import Schema, fields

class UsuarioSchema(Schema):
    id = fields.Integer(dump_only=True)
    nome = fields.String(required=True)
    email_login = fields.Email(required=True)
    senha = fields.String(
        required=True,
        load_only=True
    )

    perfil = fields.String(required=True)

    status = fields.Boolean(
        load_default=True
    )