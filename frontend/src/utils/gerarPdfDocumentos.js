// Utilitário para geração e impressão/salvamento em PDF de Ordens de Serviço, Receitas e Recibos da Kero Ótica

const formatarMoeda = (valor) => {
    const num = Number(valor) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarCPF = (cpf) => {
    if (!cpf) return '-';
    const clean = cpf.toString().replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
};

const formatarTelefone = (tel) => {
    if (!tel) return '-';
    const clean = tel.toString().replace(/\D/g, '');
    if (clean.length === 11) {
        return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
    }
    if (clean.length === 10) {
        return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
    }
    return tel;
};

const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const clean = dataStr.toString().replace(/\D/g, '');
    if (clean.length === 8) {
        return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
    }
    const d = new Date(dataStr);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
    return dataStr;
};

const formatarDataHora = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return formatarData(isoStr);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

const formatarGrau = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    const num = Number(val);
    if (isNaN(num)) return val;
    return (num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2));
};

const abrirJanelaImpressaoPDF = (tituloDocumento, conteudoHtml) => {
    const printWin = window.open('', '_blank', 'width=980,height=860');
    if (!printWin) {
        alert('Por favor, permita pop-ups no navegador para visualizar e salvar o PDF.');
        return;
    }

    const htmlCompleto = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <title>${tituloDocumento}</title>
    <style>
        @page {
            size: A4;
            margin: 12mm;
        }
        * {
            box-sizing: border-box;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: #E2E8F0;
            color: #0F172A;
            font-size: 12px;
        }
        .no-print-toolbar {
            position: sticky;
            top: 0;
            z-index: 100;
            background-color: #0B2B46;
            color: #FFFFFF;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .no-print-toolbar .toolbar-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .no-print-toolbar .toolbar-info strong {
            font-size: 14px;
        }
        .no-print-toolbar .toolbar-info span {
            font-size: 11px;
            color: #CBD5E1;
        }
        .no-print-toolbar .toolbar-buttons {
            display: flex;
            gap: 10px;
        }
        .btn-print {
            background-color: #215BA6;
            color: #FFFFFF;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
        }
        .btn-close {
            background-color: rgba(255, 255, 255, 0.12);
            color: #FFFFFF;
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 6px;
            padding: 8px 14px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }
        .a4-sheet {
            max-width: 210mm;
            margin: 20px auto;
            background-color: #FFFFFF;
            padding: 16mm;
            box-shadow: 0 8px 28px rgba(15, 23, 42, 0.15);
            border-radius: 6px;
        }
        .doc-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0B2B46;
            padding-bottom: 12px;
            margin-bottom: 14px;
        }
        .brand-title {
            font-size: 24px;
            font-weight: 900;
            color: #0B2B46;
            letter-spacing: -0.5px;
            margin: 0;
        }
        .brand-title span {
            color: #EAB308;
        }
        .brand-sub {
            font-size: 11px;
            color: #475569;
            margin-top: 3px;
        }
        .doc-meta {
            text-align: right;
        }
        .doc-meta .talao-num {
            font-size: 15px;
            font-weight: 800;
            color: #0B2B46;
            background-color: #F1F5F9;
            border: 1px solid #CBD5E1;
            padding: 4px 12px;
            border-radius: 4px;
            display: inline-block;
            margin-bottom: 4px;
        }
        .doc-meta div {
            font-size: 11px;
            color: #334155;
            margin-top: 2px;
        }
        .section-box {
            border: 1px solid #CBD5E1;
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 12px;
        }
        .section-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #0B2B46;
            text-transform: uppercase;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 5px;
            margin: 0 0 8px 0;
            display: flex;
            justify-content: space-between;
        }
        .info-grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 7px 14px;
        }
        .info-grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 7px 12px;
        }
        .field-item {
            display: flex;
            flex-direction: column;
        }
        .field-item.span-2 {
            grid-column: span 2;
        }
        .field-item.span-3 {
            grid-column: span 3;
        }
        .field-label {
            font-size: 10px;
            font-weight: 700;
            color: #215BA6;
            text-transform: uppercase;
        }
        .field-value {
            font-size: 12px;
            font-weight: 600;
            color: #0F172A;
        }
        table.pdf-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }
        table.pdf-table th {
            background-color: #F1F5F9;
            color: #0B2B46;
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #CBD5E1;
        }
        table.pdf-table td {
            padding: 6px 8px;
            border: 1px solid #CBD5E1;
            font-size: 11.5px;
            color: #1E293B;
        }
        .finance-summary-row {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            margin-top: 6px;
        }
        .fin-box {
            border: 1px solid #CBD5E1;
            background-color: #F8FAFC;
            border-radius: 5px;
            padding: 6px 8px;
            text-align: center;
        }
        .fin-box span {
            display: block;
            font-size: 9.5px;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
        }
        .fin-box strong {
            font-size: 12.5px;
            color: #0F172A;
        }
        .fin-box.highlight {
            background-color: #EFF6FF;
            border-color: #93C5FD;
        }
        .fin-box.highlight strong {
            color: #1D4ED8;
        }
        .signatures-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 26px;
            padding-top: 12px;
        }
        .sig-line {
            border-top: 1px solid #334155;
            text-align: center;
            padding-top: 5px;
            font-size: 11px;
            color: #334155;
        }
        .warranty-note {
            font-size: 10px;
            color: #475569;
            background-color: #F8FAFC;
            border: 1px dashed #94A3B8;
            border-radius: 5px;
            padding: 8px 10px;
            margin-top: 10px;
            line-height: 1.4;
        }
        @media print {
            body {
                background-color: #FFFFFF;
            }
            .no-print-toolbar {
                display: none !important;
            }
            .a4-sheet {
                margin: 0;
                padding: 0;
                box-shadow: none;
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="no-print-toolbar">
        <div class="toolbar-info">
            <strong>Visualização de Documento — ${tituloDocumento}</strong>
            <span>Na janela de impressão, escolha o destino "Salvar como PDF" para baixar o arquivo no computador.</span>
        </div>
        <div class="toolbar-buttons">
            <button class="btn-print" onclick="window.print()">Salvar como PDF / Imprimir</button>
            <button class="btn-close" onclick="window.close()">Fechar</button>
        </div>
    </div>
    <div class="a4-sheet">
        ${conteudoHtml}
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(htmlCompleto);
    printWin.document.close();
};

export function gerarPDFCompraCompleta(cliente, venda, receita, parcelas = []) {
    if (!cliente || !venda) return;

    const hoje = new Date();
    const dataVendaObj = venda.data_venda ? new Date(venda.data_venda) : hoje;
    const dataGarantiaObj = new Date(dataVendaObj);
    dataGarantiaObj.setFullYear(dataGarantiaObj.getFullYear() + 1);
    const garantiaAtiva = dataGarantiaObj >= hoje;

    const anoVenda = dataVendaObj.getFullYear() || hoje.getFullYear();
    const codigoValidacao = `KERO-${anoVenda}-T${String(venda.numero_talao).padStart(4, '0')}-ID${String(venda.id).padStart(3, '0')}`;

    const valorArmacao = Number(venda.valor_armacao) || 0;
    const valorLentes = Number(venda.valor_lentes) || 0;
    const valorAntiReflexo = Number(venda.valor_anti_reflexo) || 0;
    const subtotal = Number(venda.subtotal) || (valorArmacao + valorLentes + valorAntiReflexo);
    const desconto = Number(venda.desconto) || 0;
    const totalVenda = Number(venda.total) || 0;
    const entrada = Number(venda.entrada) || 0;

    const parcelasOrdenadas = [...parcelas].sort((a, b) => a.numero_parcela - b.numero_parcela);
    const parcelasPagas = parcelasOrdenadas.filter(p => p.status === 'Pago');
    const totalPagoParcelas = parcelasPagas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    const totalJaQuitado = parcelasOrdenadas.length > 0 ? Math.min(totalVenda, entrada + totalPagoParcelas) : totalVenda;
    const saldoDevedor = Math.max(0, totalVenda - totalJaQuitado);

    const olhoDireito = receita?.olhos?.find(o => o.olho === 'direito') || null;
    const olhoEsquerdo = receita?.olhos?.find(o => o.olho === 'esquerdo') || null;

    const htmlReceita = receita
        ? `
        <div class="section-box">
            <div class="section-title">
                <span>3. Prescrição / Receita Óptica Vinculada (Receita #${receita.id})</span>
                <span>Data da Receita: ${formatarData(receita.data_receita)}</span>
            </div>
            <div class="info-grid-4" style="margin-bottom: 8px;">
                <div class="field-item">
                    <span class="field-label">Optometrista / Examinador</span>
                    <span class="field-value">${receita.optometrista || 'Não informado'}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Tipo de Lente</span>
                    <span class="field-value">${receita.tipo_lente || '-'}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Tratamento</span>
                    <span class="field-value">${receita.tratamento || '-'}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Data de Retorno</span>
                    <span class="field-value">${receita.data_retorno ? formatarData(receita.data_retorno) : '12 meses'}</span>
                </div>
            </div>
            <table class="pdf-table">
                <thead>
                    <tr>
                        <th>Olho</th>
                        <th>Esférico (ESF)</th>
                        <th>Cilíndrico (CIL)</th>
                        <th>Eixo (°)</th>
                        <th>Acuidade Visual</th>
                        <th>Ceratometria</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Olho Direito (OD)</strong></td>
                        <td>${formatarGrau(olhoDireito?.esferico)}</td>
                        <td>${formatarGrau(olhoDireito?.cilindrico)}</td>
                        <td>${olhoDireito?.eixo !== null && olhoDireito?.eixo !== undefined ? `${olhoDireito.eixo}°` : '-'}</td>
                        <td>${olhoDireito?.acuidade_visual ?? '-'}</td>
                        <td>${receita.ceratometria_od || '-'}</td>
                    </tr>
                    <tr>
                        <td><strong>Olho Esquerdo (OE)</strong></td>
                        <td>${formatarGrau(olhoEsquerdo?.esferico)}</td>
                        <td>${formatarGrau(olhoEsquerdo?.cilindrico)}</td>
                        <td>${olhoEsquerdo?.eixo !== null && olhoEsquerdo?.eixo !== undefined ? `${olhoEsquerdo.eixo}°` : '-'}</td>
                        <td>${olhoEsquerdo?.acuidade_visual ?? '-'}</td>
                        <td>${receita.ceratometria_oe || '-'}</td>
                    </tr>
                </tbody>
            </table>
            ${receita.observacao ? `<div style="margin-top:6px;font-size:11px;"><strong>Observações:</strong> ${receita.observacao}</div>` : ''}
        </div>`
        : '';

    const htmlParcelas = parcelasOrdenadas.length > 0
        ? `
        <table class="pdf-table" style="margin-top: 10px;">
            <thead>
                <tr>
                    <th>Parcela</th>
                    <th>Vencimento</th>
                    <th>Forma de Pagamento</th>
                    <th>Valor</th>
                    <th>Data Pagamento</th>
                    <th>Situação / Validação</th>
                </tr>
            </thead>
            <tbody>
                ${parcelasOrdenadas.map(p => `
                    <tr>
                        <td><strong>${p.numero_parcela}ª / ${parcelasOrdenadas.length}</strong></td>
                        <td>${formatarData(p.data_vencimento)}</td>
                        <td>${p.forma_de_pagamento || '-'}</td>
                        <td><strong>${formatarMoeda(p.valor)}</strong></td>
                        <td>${p.status === 'Pago' && p.data_pagamento ? formatarData(p.data_pagamento) : '-'}</td>
                        <td><strong>${p.status === 'Pago' ? 'PAGO / VALIDADO' : 'EM ABERTO'}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`
        : `<div style="margin-top:8px;font-weight:700;color:#15803D;">Compra liquidada integralmente à vista no ato do pedido.</div>`;

    const conteudoHtml = `
        <div class="doc-header">
            <div>
                <h1 class="brand-title">kero<span>ótica</span></h1>
                <div class="brand-sub">Ordem de Serviço, Comprovante de Compra e Certificado de Garantia</div>
                <div class="brand-sub">Autenticação: <strong>${codigoValidacao}</strong></div>
            </div>
            <div class="doc-meta">
                <div class="talao-num">TALÃO Nº #${String(venda.numero_talao).padStart(4, '0')}</div>
                <div><strong>Data da Venda:</strong> ${formatarDataHora(venda.data_venda)}</div>
                <div><strong>Vendedor(a):</strong> ${venda.vendedor || '-'}</div>
                <div><strong>Status:</strong> ${saldoDevedor <= 0.01 ? 'QUITADA / VALIDADA' : 'EM ABERTO'}</div>
            </div>
        </div>

        <div class="section-box">
            <div class="section-title">
                <span>1. Dados Cadastrais do Cliente</span>
                <span>Ficha Nº ${cliente.numero_ficha || '-'}</span>
            </div>
            <div class="info-grid-3">
                <div class="field-item span-2">
                    <span class="field-label">Nome Completo</span>
                    <span class="field-value">${cliente.nome_completo}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">CPF / RG</span>
                    <span class="field-value">${formatarCPF(cliente.cpf)} ${cliente.rg ? ` / ${cliente.rg}` : ''}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Data de Nascimento</span>
                    <span class="field-value">${formatarData(cliente.data_nascimento)}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Telefones de Contato</span>
                    <span class="field-value">${formatarTelefone(cliente.telefone1)}${cliente.telefone2 ? ` / ${formatarTelefone(cliente.telefone2)}` : ''}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Filiação (Mãe / Pai)</span>
                    <span class="field-value">${cliente.nome_mae || '-'} / ${cliente.nome_pai || '-'}</span>
                </div>
                <div class="field-item span-3">
                    <span class="field-label">Endereço e Referência</span>
                    <span class="field-value">${cliente.endereco || '-'}${cliente.referencia ? ` — Ref: ${cliente.referencia}` : ''}</span>
                </div>
            </div>
        </div>

        <div class="section-box">
            <div class="section-title">
                <span>2. Especificação Técnica dos Produtos e Laboratório</span>
                <span>Laboratório: ${venda.laboratorio || 'Padrão / Interno'}</span>
            </div>
            <table class="pdf-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Referência / Descrição Técnica</th>
                        <th style="text-align: right;">Valor Unitário</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Armação</strong></td>
                        <td>${venda.referencia_armacao || 'Não especificada'}</td>
                        <td style="text-align: right;"><strong>${formatarMoeda(valorArmacao)}</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Lentes Oftálmicas</strong></td>
                        <td>${venda.referencia_lente || 'Não especificada'}${receita?.tipo_lente ? ` (${receita.tipo_lente})` : ''}</td>
                        <td style="text-align: right;"><strong>${formatarMoeda(valorLentes)}</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Tratamento / Anti-Reflexo</strong></td>
                        <td>${receita?.tratamento || 'Tratamento Anti-Reflexo'}</td>
                        <td style="text-align: right;"><strong>${formatarMoeda(valorAntiReflexo)}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        ${htmlReceita}

        <div class="section-box">
            <div class="section-title">
                <span>${receita ? '4' : '3'}. Demonstrativo Financeiro e Controle de Parcelas</span>
                <span>Emitido em ${hoje.toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="finance-summary-row">
                <div class="fin-box">
                    <span>Subtotal</span>
                    <strong>${formatarMoeda(subtotal)}</strong>
                </div>
                <div class="fin-box">
                    <span>Desconto</span>
                    <strong>- ${formatarMoeda(desconto)}</strong>
                </div>
                <div class="fin-box highlight">
                    <span>Total Final</span>
                    <strong>${formatarMoeda(totalVenda)}</strong>
                </div>
                <div class="fin-box">
                    <span>Entrada</span>
                    <strong>${formatarMoeda(entrada)}</strong>
                </div>
                <div class="fin-box">
                    <span>Total Quitado</span>
                    <strong>${formatarMoeda(totalJaQuitado)}</strong>
                </div>
                <div class="fin-box">
                    <span>Saldo a Pagar</span>
                    <strong>${formatarMoeda(saldoDevedor)}</strong>
                </div>
            </div>
            ${htmlParcelas}
        </div>

        <div class="warranty-note">
            <strong>TERMO DE GARANTIA E CONFERÊNCIA (${garantiaAtiva ? `VÁLIDA ATÉ ${dataGarantiaObj.toLocaleDateString('pt-BR')}` : 'EXPIRADA'}):</strong>
            A Kero Ótica garante a qualidade técnica dos produtos descritos nesta Ordem de Serviço pelo prazo de 12 (doze) meses a contar da data da compra contra eventuais defeitos de fabricação, mediante apresentação deste comprovante. Danos causados por mau uso, quedas, exposição a calor excessivo ou produtos químicos não estão cobertos.
        </div>

        <div class="signatures-row">
            <div class="sig-line">
                <strong>${cliente.nome_completo}</strong><br/>
                Assinatura do Cliente (CPF: ${formatarCPF(cliente.cpf)})
            </div>
            <div class="sig-line">
                <strong>Kero Ótica — ${venda.vendedor || 'Atendimento'}</strong><br/>
                Responsável pelo Atendimento / Validação
            </div>
        </div>
    `;

    abrirJanelaImpressaoPDF(`OS_Talao_${venda.numero_talao}_${cliente.nome_completo}`, conteudoHtml);
}

export function gerarPDFReceitaOptica(cliente, receita) {
    if (!cliente || !receita) return;

    const olhoDireito = receita?.olhos?.find(o => o.olho === 'direito') || null;
    const olhoEsquerdo = receita?.olhos?.find(o => o.olho === 'esquerdo') || null;

    const conteudoHtml = `
        <div class="doc-header">
            <div>
                <h1 class="brand-title">kero<span>ótica</span></h1>
                <div class="brand-sub">Ficha de Prescrição e Receita Óptica</div>
            </div>
            <div class="doc-meta">
                <div class="talao-num">RECEITA Nº #${String(receita.id).padStart(4, '0')}</div>
                <div><strong>Data da Receita:</strong> ${formatarData(receita.data_receita)}</div>
                <div><strong>Optometrista:</strong> ${receita.optometrista || 'Não informado'}</div>
            </div>
        </div>

        <div class="section-box">
            <div class="section-title">
                <span>Dados do Paciente / Cliente</span>
                <span>Ficha Nº ${cliente.numero_ficha || '-'}</span>
            </div>
            <div class="info-grid-3">
                <div class="field-item span-2">
                    <span class="field-label">Paciente</span>
                    <span class="field-value">${cliente.nome_completo}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">CPF</span>
                    <span class="field-value">${formatarCPF(cliente.cpf)}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Data de Nascimento</span>
                    <span class="field-value">${formatarData(cliente.data_nascimento)}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Telefone</span>
                    <span class="field-value">${formatarTelefone(cliente.telefone1)}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Data de Retorno</span>
                    <span class="field-value">${receita.data_retorno ? formatarData(receita.data_retorno) : '12 meses'}</span>
                </div>
            </div>
        </div>

        <div class="section-box">
            <div class="section-title">
                <span>Parâmetros Ópticos e Dioptrias</span>
                <span>Tipo de Lente: ${receita.tipo_lente || '-'} | Tratamento: ${receita.tratamento || '-'}</span>
            </div>
            <table class="pdf-table">
                <thead>
                    <tr>
                        <th>Olho</th>
                        <th>Esférico (ESF)</th>
                        <th>Cilíndrico (CIL)</th>
                        <th>Eixo (°)</th>
                        <th>Acuidade Visual</th>
                        <th>Ceratometria</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Olho Direito (OD)</strong></td>
                        <td>${formatarGrau(olhoDireito?.esferico)}</td>
                        <td>${formatarGrau(olhoDireito?.cilindrico)}</td>
                        <td>${olhoDireito?.eixo !== null && olhoDireito?.eixo !== undefined ? `${olhoDireito.eixo}°` : '-'}</td>
                        <td>${olhoDireito?.acuidade_visual ?? '-'}</td>
                        <td>${receita.ceratometria_od || '-'}</td>
                    </tr>
                    <tr>
                        <td><strong>Olho Esquerdo (OE)</strong></td>
                        <td>${formatarGrau(olhoEsquerdo?.esferico)}</td>
                        <td>${formatarGrau(olhoEsquerdo?.cilindrico)}</td>
                        <td>${olhoEsquerdo?.eixo !== null && olhoEsquerdo?.eixo !== undefined ? `${olhoEsquerdo.eixo}°` : '-'}</td>
                        <td>${olhoEsquerdo?.acuidade_visual ?? '-'}</td>
                        <td>${receita.ceratometria_oe || '-'}</td>
                    </tr>
                </tbody>
            </table>

            <div class="info-grid-3" style="margin-top: 10px;">
                <div class="field-item">
                    <span class="field-label">Condição Motora</span>
                    <span class="field-value">${receita.condicao_motora || '-'}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Qualidade da Lágrima</span>
                    <span class="field-value">${receita.lagrima || '-'}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Observações</span>
                    <span class="field-value">${receita.observacao || 'Sem observações adicionais.'}</span>
                </div>
            </div>
        </div>

        <div class="signatures-row">
            <div class="sig-line">
                <strong>${receita.optometrista || 'Profissional Responsável'}</strong><br/>
                Optometrista / Examinador
            </div>
            <div class="sig-line">
                <strong>${cliente.nome_completo}</strong><br/>
                Paciente / Cliente
            </div>
        </div>
    `;

    abrirJanelaImpressaoPDF(`Receita_${receita.id}_${cliente.nome_completo}`, conteudoHtml);
}

export function gerarPDFReciboParcela(cliente, venda, parcela, totalParcelas = 1) {
    if (!cliente || !venda || !parcela) return;

    const conteudoHtml = `
        <div class="doc-header">
            <div>
                <h1 class="brand-title">kero<span>ótica</span></h1>
                <div class="brand-sub">Comprovante e Recibo Oficial de Quitação de Parcela</div>
            </div>
            <div class="doc-meta">
                <div class="talao-num">RECIBO PARCELA ${parcela.numero_parcela}/${totalParcelas}</div>
                <div><strong>Talão de Origem:</strong> #${String(venda.numero_talao).padStart(4, '0')}</div>
                <div><strong>Status:</strong> VALIDADO E PAGO</div>
            </div>
        </div>

        <div class="section-box">
            <div class="section-title">
                <span>Declaração de Recebimento</span>
                <span>Valor Recebido: ${formatarMoeda(parcela.valor)}</span>
            </div>
            <p style="font-size: 13px; line-height: 1.6; margin: 8px 0;">
                Recebemos de <strong>${cliente.nome_completo}</strong>, inscrito(a) no CPF sob o nº
                <strong>${formatarCPF(cliente.cpf)}</strong> (Ficha <strong>${cliente.numero_ficha}</strong>),
                a importância de <strong>${formatarMoeda(parcela.valor)}</strong>, referente à
                <strong>${parcela.numero_parcela}ª parcela</strong> (de um total de ${totalParcelas}) do
                <strong>Talão de Compra Nº #${String(venda.numero_talao).padStart(4, '0')}</strong>.
            </p>
            <div class="info-grid-4" style="margin-top: 12px;">
                <div class="field-item">
                    <span class="field-label">Data de Vencimento</span>
                    <span class="field-value">${formatarData(parcela.data_vencimento)}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Data do Pagamento</span>
                    <span class="field-value">${formatarData(parcela.data_pagamento || new Date().toISOString())}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Forma de Pagamento</span>
                    <span class="field-value">${parcela.forma_de_pagamento || 'PIX'}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Situação</span>
                    <span class="field-value" style="color: #15803D;">PAGO / QUITADO</span>
                </div>
            </div>
        </div>

        <div class="signatures-row">
            <div class="sig-line">
                <strong>Kero Ótica</strong><br/>
                Caixa / Confirmação de Recebimento
            </div>
            <div class="sig-line">
                <strong>${cliente.nome_completo}</strong><br/>
                Cliente
            </div>
        </div>
    `;

    abrirJanelaImpressaoPDF(`Recibo_Parcela_${parcela.numero_parcela}_Talao_${venda.numero_talao}`, conteudoHtml);
}

export function gerarPDFExtratoParcelas(cliente, parcelas = []) {
    if (!cliente) return;

    const hoje = new Date();
    const pagas = parcelas.filter(p => p.status === 'Pago');
    const pendentes = parcelas.filter(p => p.status !== 'Pago');
    const totalPago = pagas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    const totalPendente = pendentes.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);

    const conteudoHtml = `
        <div class="doc-header">
            <div>
                <h1 class="brand-title">kero<span>ótica</span></h1>
                <div class="brand-sub">Extrato Geral de Parcelas e Posição Financeira do Cliente</div>
            </div>
            <div class="doc-meta">
                <div class="talao-num">EXTRATO DE PARCELAS</div>
                <div><strong>Data de Emissão:</strong> ${hoje.toLocaleDateString('pt-BR')}</div>
                <div><strong>Cliente:</strong> Ficha Nº ${cliente.numero_ficha || '-'}</div>
            </div>
        </div>

        <div class="section-box">
            <div class="section-title">
                <span>Identificação do Cliente</span>
                <span>CPF: ${formatarCPF(cliente.cpf)}</span>
            </div>
            <div class="info-grid-4">
                <div class="field-item span-2">
                    <span class="field-label">Nome Completo</span>
                    <span class="field-value">${cliente.nome_completo}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Telefone</span>
                    <span class="field-value">${formatarTelefone(cliente.telefone1)}</span>
                </div>
                <div class="field-item">
                    <span class="field-label">Resumo de Parcelas</span>
                    <span class="field-value">${pagas.length} paga(s) / ${pendentes.length} em aberto</span>
                </div>
            </div>
        </div>

        <div class="section-box">
            <div class="section-title">
                <span>Relação Completa de Parcelas (${parcelas.length})</span>
                <span>Total Quitado: ${formatarMoeda(totalPago)} | Saldo Pendente: ${formatarMoeda(totalPendente)}</span>
            </div>
            <table class="pdf-table">
                <thead>
                    <tr>
                        <th>Parcela</th>
                        <th>Talão</th>
                        <th>Vencimento</th>
                        <th>Forma</th>
                        <th>Valor</th>
                        <th>Data da Baixa</th>
                        <th>Situação</th>
                    </tr>
                </thead>
                <tbody>
                    ${parcelas.map(p => `
                        <tr>
                            <td><strong>${p.numero_parcela}ª Parcela</strong></td>
                            <td>#${String(p.numero_talao || '-').padStart(4, '0')}</td>
                            <td>${formatarData(p.data_vencimento)}</td>
                            <td>${p.forma_de_pagamento || '-'}</td>
                            <td><strong>${formatarMoeda(p.valor)}</strong></td>
                            <td>${p.status === 'Pago' && p.data_pagamento ? formatarData(p.data_pagamento) : '-'}</td>
                            <td><strong>${p.status === 'Pago' ? 'PAGO' : 'PENDENTE'}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="signatures-row">
            <div class="sig-line">
                <strong>Kero Ótica</strong><br/>
                Conferência Financeira
            </div>
            <div class="sig-line">
                <strong>${cliente.nome_completo}</strong><br/>
                Cliente
            </div>
        </div>
    `;

    abrirJanelaImpressaoPDF(`Extrato_Parcelas_${cliente.nome_completo}`, conteudoHtml);
}
