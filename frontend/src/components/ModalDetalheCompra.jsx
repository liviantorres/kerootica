import React, { useState } from 'react';
import './styles/ModalDetalheCompra.css';

const FORMAS_PAGAMENTO = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'];

export function ModalDetalheCompra({
    isOpen,
    onClose,
    venda,
    cliente,
    receita,
    parcelas = [],
    onValidarParcela,
    onReabrirParcela,
    onQuitarTodasParcelas,
    onGerarPDFCompra,
    onGerarPDFReciboParcela
}) {
    const [loadingParcelaId, setLoadingParcelaId] = useState(null);
    const [loadingQuitarTodas, setLoadingQuitarTodas] = useState(false);
    const [formasSelecionadas, setFormasSelecionadas] = useState({});

    if (!isOpen || !venda || !cliente) return null;

    const hoje = new Date();

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

    // Cálculos financeiros detalhados da compra
    const valorArmacao = Number(venda.valor_armacao) || 0;
    const valorLentes = Number(venda.valor_lentes) || 0;
    const valorAntiReflexo = Number(venda.valor_anti_reflexo) || 0;
    const subtotal = Number(venda.subtotal) || (valorArmacao + valorLentes + valorAntiReflexo);
    const desconto = Number(venda.desconto) || 0;
    const percentualDesconto = subtotal > 0 ? ((desconto / subtotal) * 100).toFixed(1) : '0.0';
    const totalVenda = Number(venda.total) || 0;
    const entrada = Number(venda.entrada) || 0;

    const parcelasOrdenadas = [...parcelas].sort((a, b) => a.numero_parcela - b.numero_parcela);
    const parcelasPagas = parcelasOrdenadas.filter(p => p.status === 'Pago');
    const parcelasPendentes = parcelasOrdenadas.filter(p => p.status !== 'Pago');
    const parcelasAtrasadas = parcelasPendentes.filter(
        p => p.status === 'Vencido' || (p.data_vencimento && new Date(p.data_vencimento) < hoje)
    );

    const totalPagoParcelas = parcelasPagas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    const totalJaQuitado = parcelasOrdenadas.length > 0
        ? Math.min(totalVenda, entrada + totalPagoParcelas)
        : totalVenda;
    const saldoDevedor = Math.max(0, totalVenda - totalJaQuitado);
    const progressoQuitacao = totalVenda > 0 ? Math.min(100, Math.round((totalJaQuitado / totalVenda) * 100)) : 100;

    const compraQuitada = saldoDevedor <= 0.01 || parcelasPendentes.length === 0;

    // Cálculo de Garantia (12 meses a partir da venda)
    const dataVendaObj = venda.data_venda ? new Date(venda.data_venda) : new Date();
    const dataGarantiaObj = new Date(dataVendaObj);
    dataGarantiaObj.setFullYear(dataGarantiaObj.getFullYear() + 1);
    const garantiaAtiva = dataGarantiaObj >= hoje;
    const diasRestantesGarantia = Math.max(0, Math.ceil((dataGarantiaObj - hoje) / (1000 * 60 * 60 * 24)));

    // Código de validação / autenticidade da Ordem de Serviço
    const anoVenda = dataVendaObj.getFullYear() || new Date().getFullYear();
    const codigoValidacao = `KERO-${anoVenda}-T${String(venda.numero_talao).padStart(4, '0')}-ID${String(venda.id).padStart(3, '0')}`;

    // Olhos da receita vinculada
    const olhoDireito = receita?.olhos?.find(o => o.olho === 'direito') || null;
    const olhoEsquerdo = receita?.olhos?.find(o => o.olho === 'esquerdo') || null;

    const handleValidarClick = async (parcela) => {
        setLoadingParcelaId(parcela.id);
        try {
            const forma = formasSelecionadas[parcela.id] || parcela.forma_de_pagamento || 'PIX';
            await onValidarParcela(parcela, forma);
        } finally {
            setLoadingParcelaId(null);
        }
    };

    const handleReabrirClick = async (parcela) => {
        setLoadingParcelaId(parcela.id);
        try {
            await onReabrirParcela(parcela);
        } finally {
            setLoadingParcelaId(null);
        }
    };

    const handleQuitarTodasClick = async () => {
        if (parcelasPendentes.length === 0) return;
        setLoadingQuitarTodas(true);
        try {
            await onQuitarTodasParcelas(parcelasPendentes);
        } finally {
            setLoadingQuitarTodas(false);
        }
    };

    return (
        <div className="modal-compra-overlay" onClick={onClose}>
            <div className="modal-compra-container" onClick={e => e.stopPropagation()}>
                {/* Cabeçalho da Ordem de Serviço */}
                <div className="modal-compra-header">
                    <div className="modal-compra-titulo-bloco">
                        <div className="modal-compra-top-badges">
                            <span className="os-talao-badge">TALÃO Nº #{String(venda.numero_talao).padStart(4, '0')}</span>
                            <span className="os-codigo-badge" title="Código de Validação Interna">
                                Autenticação: {codigoValidacao}
                            </span>
                            <span className={`os-status-badge ${compraQuitada ? 'quitada' : parcelasAtrasadas.length > 0 ? 'atrasada' : 'aberta'}`}>
                                {compraQuitada
                                    ? 'Compra Validada e Quitada'
                                    : parcelasAtrasadas.length > 0
                                        ? `${parcelasAtrasadas.length} Parcela(s) em Atraso`
                                        : `Em Aberto (${parcelasPagas.length}/${parcelasOrdenadas.length} Pagas)`}
                            </span>
                            <span className={`os-garantia-badge ${garantiaAtiva ? 'ativa' : 'expirada'}`}>
                                {garantiaAtiva
                                    ? `Garantia Ativa (${diasRestantesGarantia} dias restantes)`
                                    : 'Garantia Finalizada'}
                            </span>
                        </div>
                        <h2>Ordem de Serviço e Detalhamento da Compra</h2>
                        <p>
                            Registrada em <strong>{formatarDataHora(venda.data_venda)}</strong> por{' '}
                            <strong>{venda.vendedor || 'Não informado'}</strong> • Cliente:{' '}
                            <strong>{cliente.nome_completo}</strong> (Ficha {cliente.numero_ficha})
                        </p>
                    </div>

                    <div className="modal-compra-header-actions">
                        <button
                            type="button"
                            className="btn-os-pdf"
                            onClick={() => onGerarPDFCompra(venda, receita, parcelasOrdenadas)}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="12" y1="18" x2="12" y2="12"></line>
                                <polyline points="9 15 12 18 15 15"></polyline>
                            </svg>
                            Salvar PDF / Imprimir OS
                        </button>

                        {!compraQuitada && parcelasPendentes.length > 0 && (
                            <button
                                type="button"
                                className="btn-os-quitar-tudo"
                                onClick={handleQuitarTodasClick}
                                disabled={loadingQuitarTodas}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                {loadingQuitarTodas ? 'Validando...' : 'Quitar Todas as Parcelas'}
                            </button>
                        )}

                        <button type="button" className="btn-os-fechar" onClick={onClose} title="Fechar">
                            ✕
                        </button>
                    </div>
                </div>

                {/* Corpo rolável com todas as seções detalhadas */}
                <div className="modal-compra-body">
                    {/* SEÇÃO 1: RESUMO FINANCEIRO & BARRA DE VALIDAÇÃO */}
                    <div className="os-section-card os-financeiro-destaque">
                        <div className="os-section-header">
                            <h3>1. Demonstrativo Financeiro e Validação de Quitação</h3>
                            <span className="os-progresso-texto">
                                Progresso de Pagamento: <strong>{progressoQuitacao}% concluído</strong>
                            </span>
                        </div>

                        <div className="os-progress-bar-bg">
                            <div
                                className={`os-progress-bar-fill ${compraQuitada ? 'completa' : ''}`}
                                style={{ width: `${progressoQuitacao}%` }}
                            />
                        </div>

                        <div className="os-metricas-grid">
                            <div className="os-metrica-box">
                                <span>Subtotal Bruto</span>
                                <strong>{formatarMoeda(subtotal)}</strong>
                                <small>Soma dos itens</small>
                            </div>
                            <div className="os-metrica-box desconto">
                                <span>Desconto Aplicado</span>
                                <strong>- {formatarMoeda(desconto)}</strong>
                                <small>{percentualDesconto}% de desconto</small>
                            </div>
                            <div className="os-metrica-box total">
                                <span>Valor Total da Compra</span>
                                <strong>{formatarMoeda(totalVenda)}</strong>
                                <small>Valor final líquido</small>
                            </div>
                            <div className="os-metrica-box entrada">
                                <span>Entrada no Ato</span>
                                <strong>{formatarMoeda(entrada)}</strong>
                                <small>Pago no fechamento</small>
                            </div>
                            <div className="os-metrica-box quitado">
                                <span>Total Já Recebido</span>
                                <strong>{formatarMoeda(totalJaQuitado)}</strong>
                                <small>Entrada + parcelas pagas</small>
                            </div>
                            <div className={`os-metrica-box saldo ${saldoDevedor > 0 ? 'pendente' : 'zerado'}`}>
                                <span>Saldo Devedor</span>
                                <strong>{formatarMoeda(saldoDevedor)}</strong>
                                <small>{saldoDevedor > 0 ? `${parcelasPendentes.length} parcela(s) aberta(s)` : 'Nada consta'}</small>
                            </div>
                        </div>
                    </div>

                    {/* GRID DUPLO: DADOS DO CLIENTE + PRODUTOS E LABORATÓRIO */}
                    <div className="os-two-columns">
                        {/* SEÇÃO 2: DADOS DO CLIENTE */}
                        <div className="os-section-card">
                            <div className="os-section-header">
                                <h3>2. Identificação do Cliente e Ficha</h3>
                                <span className="os-tag-ficha">Ficha Nº {cliente.numero_ficha}</span>
                            </div>

                            <div className="os-info-grid">
                                <div className="os-info-item">
                                    <span>Nome Completo:</span>
                                    <strong>{cliente.nome_completo}</strong>
                                </div>
                                <div className="os-info-item">
                                    <span>CPF:</span>
                                    <strong>{formatarCPF(cliente.cpf)}</strong>
                                </div>
                                <div className="os-info-item">
                                    <span>RG:</span>
                                    <strong>{cliente.rg || 'Não informado'}</strong>
                                </div>
                                <div className="os-info-item">
                                    <span>Data de Nascimento:</span>
                                    <strong>{formatarData(cliente.data_nascimento)}</strong>
                                </div>
                                <div className="os-info-item">
                                    <span>Telefone Principal:</span>
                                    <strong>{formatarTelefone(cliente.telefone1)}</strong>
                                </div>
                                <div className="os-info-item">
                                    <span>Telefone Secundário:</span>
                                    <strong>{formatarTelefone(cliente.telefone2)}</strong>
                                </div>
                                <div className="os-info-item full">
                                    <span>E-mail:</span>
                                    <strong>{cliente.email || 'Não informado'}</strong>
                                </div>
                                <div className="os-info-item">
                                    <span>Nome da Mãe:</span>
                                    <strong>{cliente.nome_mae || '-'}</strong>
                                </div>
                                <div className="os-info-item">
                                    <span>Nome do Pai:</span>
                                    <strong>{cliente.nome_pai || '-'}</strong>
                                </div>
                                <div className="os-info-item full">
                                    <span>Endereço e Referência:</span>
                                    <strong>
                                        {cliente.endereco || '-'}
                                        {cliente.referencia ? ` (Ref: ${cliente.referencia})` : ''}
                                    </strong>
                                </div>
                                <div className="os-info-item">
                                    <span>Classificação Cadastral:</span>
                                    <strong>
                                        {cliente.cn ? 'C.N. (Cliente Novo) ' : ''}
                                        {cliente.ca ? 'C.A. (Cliente Antigo)' : ''}
                                        {!cliente.cn && !cliente.ca ? 'Padrão' : ''}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* SEÇÃO 3: ESPECIFICAÇÃO DOS PRODUTOS, ARMAÇÃO, LENTES E GARANTIA */}
                        <div className="os-section-card">
                            <div className="os-section-header">
                                <h3>3. Produtos Ópticos, Laboratório e Garantia</h3>
                                <span className="os-tag-ficha">Vendedor(a): {venda.vendedor}</span>
                            </div>

                            <table className="os-produtos-table">
                                <thead>
                                    <tr>
                                        <th>Item / Categoria</th>
                                        <th>Referência / Especificação</th>
                                        <th style={{ textAlign: 'right' }}>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Armação</strong></td>
                                        <td>{venda.referencia_armacao || 'Não especificada'}</td>
                                        <td style={{ textAlign: 'right' }}><strong>{formatarMoeda(valorArmacao)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Lentes Oftálmicas</strong></td>
                                        <td>
                                            {venda.referencia_lente || 'Não especificada'}
                                            {receita?.tipo_lente ? ` (${receita.tipo_lente})` : ''}
                                        </td>
                                        <td style={{ textAlign: 'right' }}><strong>{formatarMoeda(valorLentes)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Anti-Reflexo / Tratamento</strong></td>
                                        <td>{receita?.tratamento || 'Tratamento óptico / AR'}</td>
                                        <td style={{ textAlign: 'right' }}><strong>{formatarMoeda(valorAntiReflexo)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="os-info-grid" style={{ marginTop: '12px' }}>
                                <div className="os-info-item">
                                    <span>Laboratório Responsável:</span>
                                    <strong>{venda.laboratorio || 'Laboratório Interno / Padrão'}</strong>
                                </div>
                                <div className="os-info-item">
                                    <span>Certificado de Garantia:</span>
                                    <strong>
                                        Até {dataGarantiaObj.toLocaleDateString('pt-BR')}{' '}
                                        ({garantiaAtiva ? `${diasRestantesGarantia} dias restantes` : 'Expirada'})
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 4: RECEITA ÓPTICA E EXAME TÉCNICO VINCULADO */}
                    <div className="os-section-card">
                        <div className="os-section-header">
                            <h3>4. Receita Óptica e Prescrição Técnica Vinculada</h3>
                            {receita ? (
                                <span className="os-tag-receita">
                                    Receita #{receita.id} • Emitida em {formatarData(receita.data_receita)}
                                </span>
                            ) : (
                                <span className="os-tag-sem-receita">Venda sem receita vinculada</span>
                            )}
                        </div>

                        {!receita ? (
                            <p className="os-empty-text">
                                Nenhuma receita óptica foi vinculada diretamente a este talão de venda.
                            </p>
                        ) : (
                            <>
                                <div className="os-receita-meta-grid">
                                    <div className="os-info-item">
                                        <span>Optometrista / Médico(a):</span>
                                        <strong>{receita.optometrista || 'Não informado'}</strong>
                                    </div>
                                    <div className="os-info-item">
                                        <span>Tipo de Lente Indicada:</span>
                                        <strong>{receita.tipo_lente || '-'}</strong>
                                    </div>
                                    <div className="os-info-item">
                                        <span>Tratamento Recomendado:</span>
                                        <strong>{receita.tratamento || '-'}</strong>
                                    </div>
                                    <div className="os-info-item">
                                        <span>Data de Retorno / Validade:</span>
                                        <strong>{receita.data_retorno ? formatarData(receita.data_retorno) : '12 meses'}</strong>
                                    </div>
                                    <div className="os-info-item">
                                        <span>Ceratometria OD / OE:</span>
                                        <strong>OD: {receita.ceratometria_od || '-'} | OE: {receita.ceratometria_oe || '-'}</strong>
                                    </div>
                                    <div className="os-info-item">
                                        <span>Condição Motora / Lágrima:</span>
                                        <strong>{receita.condicao_motora || '-'} / {receita.lagrima || '-'}</strong>
                                    </div>
                                </div>

                                <table className="os-dioptria-table">
                                    <thead>
                                        <tr>
                                            <th>Olho</th>
                                            <th>Esférico (ESF)</th>
                                            <th>Cilíndrico (CIL)</th>
                                            <th>Eixo (°)</th>
                                            <th>Acuidade Visual (AV)</th>
                                            <th>Ceratometria</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Olho Direito (OD)</strong></td>
                                            <td>{formatarGrau(olhoDireito?.esferico)}</td>
                                            <td>{formatarGrau(olhoDireito?.cilindrico)}</td>
                                            <td>{olhoDireito?.eixo !== null && olhoDireito?.eixo !== undefined ? `${olhoDireito.eixo}°` : '-'}</td>
                                            <td>{olhoDireito?.acuidade_visual ?? '-'}</td>
                                            <td>{receita.ceratometria_od || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Olho Esquerdo (OE)</strong></td>
                                            <td>{formatarGrau(olhoEsquerdo?.esferico)}</td>
                                            <td>{formatarGrau(olhoEsquerdo?.cilindrico)}</td>
                                            <td>{olhoEsquerdo?.eixo !== null && olhoEsquerdo?.eixo !== undefined ? `${olhoEsquerdo.eixo}°` : '-'}</td>
                                            <td>{olhoEsquerdo?.acuidade_visual ?? '-'}</td>
                                            <td>{receita.ceratometria_oe || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {receita.observacao && (
                                    <div className="os-receita-obs">
                                        <strong>Observações Clínicas / Montagem:</strong> {receita.observacao}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* SEÇÃO 5: PLANO DE PARCELAMENTO E VALIDAÇÃO DE PAGAMENTOS */}
                    <div className="os-section-card">
                        <div className="os-section-header">
                            <h3>5. Controle de Parcelas e Validação de Recebimentos ({parcelasOrdenadas.length})</h3>
                            <span className="os-progresso-texto">
                                {parcelasPagas.length} paga(s) • {parcelasPendentes.length} pendente(s)
                            </span>
                        </div>

                        {parcelasOrdenadas.length === 0 ? (
                            <div className="os-pagamento-avista-banner">
                                <span>Compra paga integralmente à vista no ato da venda ({formatarMoeda(totalVenda)}).</span>
                            </div>
                        ) : (
                            <div className="os-parcelas-table-wrapper">
                                <table className="os-parcelas-table">
                                    <thead>
                                        <tr>
                                            <th>Parcela</th>
                                            <th>Vencimento</th>
                                            <th>Valor</th>
                                            <th>Forma de Pagamento</th>
                                            <th>Data da Baixa</th>
                                            <th>Situação</th>
                                            <th style={{ textAlign: 'right' }}>Validação / Comprovante</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parcelasOrdenadas.map(parc => {
                                            const isPago = parc.status === 'Pago';
                                            const isVencida = !isPago && parc.data_vencimento && new Date(parc.data_vencimento) < hoje;
                                            const formaAtual = formasSelecionadas[parc.id] || parc.forma_de_pagamento || 'PIX';

                                            return (
                                                <tr key={parc.id} className={isPago ? 'row-paga' : isVencida ? 'row-vencida' : ''}>
                                                    <td>
                                                        <strong>{parc.numero_parcela}ª / {parcelasOrdenadas.length}</strong>
                                                    </td>
                                                    <td>{formatarData(parc.data_vencimento)}</td>
                                                    <td><strong>{formatarMoeda(parc.valor)}</strong></td>
                                                    <td>
                                                        {isPago ? (
                                                            <span>{parc.forma_de_pagamento || 'PIX'}</span>
                                                        ) : (
                                                            <select
                                                                className="os-select-forma"
                                                                value={formaAtual}
                                                                onChange={e => setFormasSelecionadas(prev => ({
                                                                    ...prev,
                                                                    [parc.id]: e.target.value
                                                                }))}
                                                            >
                                                                {FORMAS_PAGAMENTO.map(f => (
                                                                    <option key={f} value={f}>{f}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {isPago && parc.data_pagamento
                                                            ? formatarData(parc.data_pagamento)
                                                            : '-'}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${isPago ? 'badge-regular' : isVencida ? 'badge-atrasada' : 'badge-garantia'}`}>
                                                            {isPago ? 'Pago' : isVencida ? 'Atrasada' : 'Pendente'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="os-parcela-actions">
                                                            {!isPago ? (
                                                                <button
                                                                    type="button"
                                                                    className="btn-validar-parcela"
                                                                    onClick={() => handleValidarClick(parc)}
                                                                    disabled={loadingParcelaId === parc.id}
                                                                >
                                                                    {loadingParcelaId === parc.id ? 'Validando...' : 'Confirmar Baixa'}
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-recibo-parcela"
                                                                        onClick={() => onGerarPDFReciboParcela(venda, parc, parcelasOrdenadas.length)}
                                                                        title="Imprimir / Salvar PDF do Recibo desta Parcela"
                                                                    >
                                                                        Recibo PDF
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-reabrir-parcela"
                                                                        onClick={() => handleReabrirClick(parc)}
                                                                        disabled={loadingParcelaId === parc.id}
                                                                        title="Estornar / Reabrir parcela"
                                                                    >
                                                                        Estornar
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rodapé do Modal */}
                <div className="modal-compra-footer">
                    <div className="modal-compra-footer-left">
                        <span>Documento autenticado no sistema Kero Ótica • Código: <strong>{codigoValidacao}</strong></span>
                    </div>
                    <div className="modal-compra-footer-right">
                        <button
                            type="button"
                            className="btn-os-pdf"
                            onClick={() => onGerarPDFCompra(venda, receita, parcelasOrdenadas)}
                        >
                            Salvar PDF / Imprimir Ficha Completa
                        </button>
                        <button type="button" className="btn-os-fechar-texto" onClick={onClose}>
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
