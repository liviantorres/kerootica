from marshmallow import Schema, fields
from app.schemas.receita_olho_schema import ReceitaOlhoSchema

class ReceitaSchema(Schema):
    
    id = fields.Int(
        dump_only=True
    )

    cliente_id = fields.Int(required=True, allow_none=False)
    
    optometrista = fields.Str(required=False)
    
    tipo_lente = fields.Str(required=False)
    
    tratamento = fields.Str(required=False)
    
    ceratometria_od = fields.Str(required=False, allow_none=True)

    ceratometria_oe = fields.Str(required=False, allow_none=True)
    
    observacao = fields.Str(required=False, allow_none=True)
 
    condicao_motora = fields.Str(required=False, allow_none=True)
    
    lagrima = fields.Str(required=False, allow_none=True)
    
    data_retorno = fields.Date(required=False, allow_none=True)
    
    data_receita = fields.DateTime(dump_only=True)
    
    olhos = fields.Nested(
            ReceitaOlhoSchema,
            many=True,
            required=True
        )