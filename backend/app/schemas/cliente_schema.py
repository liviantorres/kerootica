from marshmallow import Schema, fields, validate

class ClienteSchema(Schema):
    # A Aduana: Define o que entra e o que sai
    id = fields.Int(dump_only=True)
    numero_ficha = fields.Str(required=False)
    nome_completo = fields.Str(required=True, validate=validate.Length(min=3))
    cpf = fields.Str(required=True, validate=validate.Length(equal=11))
    telefone1 = fields.Str(required=True)
    data_cadastro = fields.DateTime(dump_only=True)