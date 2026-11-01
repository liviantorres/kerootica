import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import filtro from '../assets/icons/filtro.svg';
import novoCliente from '../assets/icons/novo_cliente.svg';
import setaEsquerda from '../assets/icons/seta_esquerda.svg';
import setaDireita from '../assets/icons/seta_direita.svg';
import { ModalNovoCliente } from '../components/ModalNovoCliente';
import { ModalDetalheCompra } from '../components/ModalDetalheCompra';
import {
    gerarPDFCompraCompleta,
    gerarPDFReceitaOptica,
    gerarPDFReciboParcela,
    gerarPDFExtratoParcelas
} from '../utils/gerarPdfDocumentos';
import '../pages/styles/Clientes.css';

const initialReceitaForm = {
    optometrista: '',
    tipo_lente: '',
    tratamento: '',
    ceratometria_od: '',
    ceratometria_oe: '',
    condicao_motora: '',
    lagrima: '',
    data_retorno: '',
    observacao: '',
    od_esferico: '',
    od_cilindrico: '',
    od_eixo: '',
    od_acuidade: '',
    oe_esferico: '',
    oe_cilindrico: '',
    oe_eixo: '',
    oe_acuidade: ''
};

export default function Clientes() {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clienteEmEdicao, setClienteEmEdicao] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroSituacao, setFiltroSituacao] = useState('todos');
    const [mostrarFiltrosMenu, setMostrarFiltrosMenu] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [abaAtiva, setAbaAtiva] = useState('visao_geral');
    const [filtroParcelasAba, setFiltroParcelasAba] = useState('todas');

    // Dados vinculados ao cliente selecionado (Receitas, Vendas e Parcelas)
    const [receitasCliente, setReceitasCliente] = useState([]);
    const [vendasCliente, setVendasCliente] = useState([]);
    const [parcelasCliente, setParcelasCliente] = useState([]);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);

    // Modal de Detalhes Completos e Validação da Compra
    const [vendaDetalheSelecionada, setVendaDetalheSelecionada] = useState(null);

    // Estados para Nova/Edição/Exclusão de Receita na aba Receitas
    const [isModalReceitaOpen, setIsModalReceitaOpen] = useState(false);
    const [receitaEmEdicao, setReceitaEmEdicao] = useState(null);
    const [receitaForm, setReceitaForm] = useState(initialReceitaForm);
    const [salvandoReceita, setSalvandoReceita] = useState(false);
    const [erroReceita, setErroReceita] = useState('');
    const [receitaParaExcluir, setReceitaParaExcluir] = useState(null);
    const [excluindoReceita, setExcluindoReceita] = useState(false);

    // Estados para Exclusão de Cliente com confirmação
    const [clienteParaExcluir, setClienteParaExcluir] = useState(null);
    const [excluindoCliente, setExcluindoCliente] = useState(false);

    const filtroDropdownRef = useRef(null);
    const itemsPerPage = 6;

    useEffect(() => {
        carregarClientes();
    }, []);

    // Fecha o dropdown de filtros se clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (filtroDropdownRef.current && !filtroDropdownRef.current.contains(event.target)) {
                setMostrarFiltrosMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const carregarClientes = async (clienteAtualizado = null) => {
        try {
            setLoading(true);
            const response = await api.get('/api/clientes');
            const lista = Array.isArray(response.data) ? response.data : [];
            setClientes(lista);
            if (clienteAtualizado && clienteSelecionado && clienteAtualizado.id === clienteSelecionado.id) {
                const sincronizado = lista.find(c => c.id === clienteAtualizado.id) || clienteAtualizado;
                setClienteSelecionado(sincronizado);
            }
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    // Carrega receitas, vendas e parcelas do cliente selecionado
    const carregarHistoricoDoCliente = async (clienteId) => {
        setLoadingDetalhes(true);
        try {
            // 1. Busca receitas do cliente
            let listaReceitas = [];
            try {
                const resRec = await api.get(`/api/receitas/${clienteId}`);
                listaReceitas = Array.isArray(resRec.data) ? resRec.data : [];
            } catch {
                listaReceitas = [];
            }
            setReceitasCliente(listaReceitas);

            // 2. Busca vendas do cliente
            let listaVendas = [];
            try {
                const resVen = await api.get(`/api/vendas/cliente/${clienteId}`);
                listaVendas = Array.isArray(resVen.data) ? resVen.data : [];
            } catch {
                listaVendas = [];
            }
            setVendasCliente(listaVendas);

            // 3. Busca parcelas de todas as vendas desse cliente
            const todasParcelas = [];
            for (const venda of listaVendas) {
                try {
                    const resParc = await api.get(`/api/parcelas/venda/${venda.id}`);
                    if (Array.isArray(resParc.data)) {
                        resParc.data.forEach(p => {
                            todasParcelas.push({
                                ...p,
                                numero_talao: venda.numero_talao
                            });
                        });
                    }
                } catch {
                    // Venda sem parcelas
                }
            }
            setParcelasCliente(todasParcelas);
        } finally {
            setLoadingDetalhes(false);
        }
    };

    const handleValidarParcela = async (parcela, formaDePagamento = null) => {
        try {
            const payload = {
                status: 'Pago',
                data_pagamento: new Date().toISOString()
            };
            if (formaDePagamento) {
                payload.forma_de_pagamento = formaDePagamento;
            }
            await api.patch(`/api/parcelas/${parcela.id}`, payload);
            if (clienteSelecionado) {
                await Promise.all([
                    carregarHistoricoDoCliente(clienteSelecionado.id),
                    carregarClientes(clienteSelecionado)
                ]);
            }
        } catch (error) {
            console.error('Erro ao validar pagamento da parcela:', error);
        }
    };

    const handleReabrirParcela = async (parcela) => {
        try {
            await api.patch(`/api/parcelas/${parcela.id}`, {
                status: 'Pendente',
                data_pagamento: null
            });
            if (clienteSelecionado) {
                await Promise.all([
                    carregarHistoricoDoCliente(clienteSelecionado.id),
                    carregarClientes(clienteSelecionado)
                ]);
            }
        } catch (error) {
            console.error('Erro ao reabrir parcela:', error);
        }
    };

    const handleQuitarTodasParcelas = async (listaParcelasPendentes) => {
        try {
            const agora = new Date().toISOString();
            for (const parc of listaParcelasPendentes) {
                await api.patch(`/api/parcelas/${parc.id}`, {
                    status: 'Pago',
                    data_pagamento: agora
                });
            }
            if (clienteSelecionado) {
                await Promise.all([
                    carregarHistoricoDoCliente(clienteSelecionado.id),
                    carregarClientes(clienteSelecionado)
                ]);
            }
        } catch (error) {
            console.error('Erro ao quitar todas as parcelas:', error);
        }
    };

    // =========================================================================
    // GESTÃO DE RECEITAS ÓPTICAS NA TELA DO CLIENTE (CRIAR / EDITAR / EXCLUIR)
    // =========================================================================
    const handleAbrirNovaReceita = () => {
        setReceitaEmEdicao(null);
        setReceitaForm(initialReceitaForm);
        setErroReceita('');
        setIsModalReceitaOpen(true);
    };

    const handleAbrirEditarReceita = (rec) => {
        const olhoD = rec.olhos?.find(o => o.olho === 'direito');
        const olhoE = rec.olhos?.find(o => o.olho === 'esquerdo');

        setReceitaEmEdicao(rec);
        setReceitaForm({
            optometrista: rec.optometrista || '',
            tipo_lente: rec.tipo_lente || '',
            tratamento: rec.tratamento || '',
            ceratometria_od: rec.ceratometria_od || '',
            ceratometria_oe: rec.ceratometria_oe || '',
            condicao_motora: rec.condicao_motora || '',
            lagrima: rec.lagrima || '',
            data_retorno: rec.data_retorno ? rec.data_retorno.split('T')[0] : '',
            observacao: rec.observacao || '',
            od_esferico: olhoD?.esferico != null ? String(olhoD.esferico) : '',
            od_cilindrico: olhoD?.cilindrico != null ? String(olhoD.cilindrico) : '',
            od_eixo: olhoD?.eixo != null ? String(olhoD.eixo) : '',
            od_acuidade: olhoD?.acuidade_visual != null ? String(olhoD.acuidade_visual) : '',
            oe_esferico: olhoE?.esferico != null ? String(olhoE.esferico) : '',
            oe_cilindrico: olhoE?.cilindrico != null ? String(olhoE.cilindrico) : '',
            oe_eixo: olhoE?.eixo != null ? String(olhoE.eixo) : '',
            oe_acuidade: olhoE?.acuidade_visual != null ? String(olhoE.acuidade_visual) : ''
        });
        setErroReceita('');
        setIsModalReceitaOpen(true);
    };

    const handleReceitaFormChange = (e) => {
        const { name, value } = e.target;
        setReceitaForm(prev => ({ ...prev, [name]: value }));
        if (erroReceita) setErroReceita('');
    };

    const handleSalvarReceita = async (e) => {
        e.preventDefault();
        if (!clienteSelecionado) return;

        setSalvandoReceita(true);
        setErroReceita('');

        const payload = {
            cliente_id: clienteSelecionado.id,
            optometrista: receitaForm.optometrista.trim() || null,
            tipo_lente: receitaForm.tipo_lente.trim() || null,
            tratamento: receitaForm.tratamento.trim() || null,
            ceratometria_od: receitaForm.ceratometria_od.trim() || null,
            ceratometria_oe: receitaForm.ceratometria_oe.trim() || null,
            condicao_motora: receitaForm.condicao_motora.trim() || null,
            lagrima: receitaForm.lagrima.trim() || null,
            data_retorno: receitaForm.data_retorno || null,
            observacao: receitaForm.observacao.trim() || null,
            olhos: [
                {
                    olho: 'direito',
                    esferico: receitaForm.od_esferico !== '' ? parseFloat(receitaForm.od_esferico) : null,
                    cilindrico: receitaForm.od_cilindrico !== '' ? parseFloat(receitaForm.od_cilindrico) : null,
                    eixo: receitaForm.od_eixo !== '' ? parseFloat(receitaForm.od_eixo) : null,
                    acuidade_visual: receitaForm.od_acuidade !== '' ? parseFloat(receitaForm.od_acuidade) : null
                },
                {
                    olho: 'esquerdo',
                    esferico: receitaForm.oe_esferico !== '' ? parseFloat(receitaForm.oe_esferico) : null,
                    cilindrico: receitaForm.oe_cilindrico !== '' ? parseFloat(receitaForm.oe_cilindrico) : null,
                    eixo: receitaForm.oe_eixo !== '' ? parseFloat(receitaForm.oe_eixo) : null,
                    acuidade_visual: receitaForm.oe_acuidade !== '' ? parseFloat(receitaForm.oe_acuidade) : null
                }
            ]
        };

        try {
            if (receitaEmEdicao?.id) {
                const { cliente_id, ...payloadUpdate } = payload;
                await api.patch(`/api/receitas/${receitaEmEdicao.id}`, payloadUpdate);
            } else {
                await api.post('/api/receitas', payload);
            }
            setIsModalReceitaOpen(false);
            setReceitaEmEdicao(null);
            await carregarHistoricoDoCliente(clienteSelecionado.id);
        } catch (error) {
            const msg = error.response?.data?.erro ||
                        error.response?.data?.detalhes ||
                        'Erro ao salvar a receita óptica.';
            setErroReceita(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSalvandoReceita(false);
        }
    };

    const handleConfirmarExclusaoReceita = async () => {
        if (!receitaParaExcluir || !clienteSelecionado) return;
        setExcluindoReceita(true);
        try {
            await api.delete(`/api/receitas/${receitaParaExcluir.id}`);
            setReceitaParaExcluir(null);
            await carregarHistoricoDoCliente(clienteSelecionado.id);
        } catch (error) {
            alert(error.response?.data?.erro || 'Não foi possível excluir a receita.');
        } finally {
            setExcluindoReceita(false);
        }
    };

    // =========================================================================
    // EXCLUSÃO DE CLIENTE COM CONFIRMAÇÃO
    // =========================================================================
    const handleConfirmarExclusaoCliente = async () => {
        if (!clienteParaExcluir) return;
        setExcluindoCliente(true);
        try {
            await api.delete(`/api/clientes/${clienteParaExcluir.id}`);
            if (clienteSelecionado?.id === clienteParaExcluir.id) {
                setClienteSelecionado(null);
            }
            setClienteParaExcluir(null);
            await carregarClientes();
        } catch (error) {
            alert(error.response?.data?.erro || 'Não foi possível excluir o cliente.');
        } finally {
            setExcluindoCliente(false);
        }
    };

    // Formata o CPF para exibição na tela (000.000.000-00)
    const formatarCPF = (cpf) => {
        if (!cpf) return '-';
        const clean = cpf.toString().replace(/\D/g, '');
        if (clean.length !== 11) return cpf;
        return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
    };

    // Formata o Telefone para exibição na tela ((00) 00000-0000)
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

    // Formata string de data para DD/MM/AAAA
    const formatarData = (dataStr) => {
        if (!dataStr) return '-';
        const clean = dataStr.toString().replace(/\D/g, '');
        if (clean.length === 8) {
            return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
        }
        return dataStr;
    };

    const formatarDataISO = (isoStr) => {
        if (!isoStr) return '-';
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return formatarData(isoStr);
        return d.toLocaleDateString('pt-BR');
    };

    const formatarDataHoraISO = (isoStr) => {
        if (!isoStr) return '-';
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return formatarData(isoStr);
        return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const formatarMoeda = (valor) => {
        const num = Number(valor) || 0;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatarGrau = (val) => {
        if (val === null || val === undefined || val === '') return '-';
        const num = Number(val);
        if (isNaN(num)) return val;
        return (num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2));
    };

    // Extrai e formata Data de Nascimento da coluna própria ou de referencia (retrocompatibilidade)
    const obterDataNascimento = (cliente) => {
        if (!cliente) return '-';
        if (cliente.data_nascimento) return formatarData(cliente.data_nascimento);
        if (cliente.referencia) {
            const match = cliente.referencia.match(/Nasc:\s*([^|]+)/i);
            if (match && match[1].trim()) return formatarData(match[1].trim());
        }
        return '-';
    };

    // Obtém o ano de cadastro do cliente
    const obterAnoCadastro = (cliente) => {
        if (cliente?.data_cadastro) {
            const ano = new Date(cliente.data_cadastro).getFullYear();
            if (!isNaN(ano)) return ano;
        }
        return new Date().getFullYear();
    };

    // Filtragem de clientes por busca e situação
    const clientesFiltrados = clientes.filter(cliente => {
        if (filtroSituacao !== 'todos') {
            const sit = (cliente.situacao || '').toLowerCase();
            if (!sit.includes(filtroSituacao.toLowerCase())) return false;
        }

        if (!searchTerm.trim()) return true;

        const termo = searchTerm.toLowerCase().trim();
        const termoNumerico = searchTerm.replace(/\D/g, '');

        const nome = (cliente.nome_completo || '').toLowerCase();
        const cpf = (cliente.cpf || '').toLowerCase();
        const cpfLimpo = (cliente.cpf || '').replace(/\D/g, '');
        const rg = (cliente.rg || '').toLowerCase();
        const ficha = (cliente.numero_ficha || '').toLowerCase();
        const tel1 = (cliente.telefone1 || '').replace(/\D/g, '');
        const tel2 = (cliente.telefone2 || '').replace(/\D/g, '');
        const email = (cliente.email || '').toLowerCase();
        const endereco = (cliente.endereco || '').toLowerCase();

        return nome.includes(termo) ||
               cpf.includes(termo) ||
               (termoNumerico && cpfLimpo.includes(termoNumerico)) ||
               rg.includes(termo) ||
               ficha.includes(termo) ||
               (termoNumerico && tel1.includes(termoNumerico)) ||
               (termoNumerico && tel2.includes(termoNumerico)) ||
               email.includes(termo) ||
               endereco.includes(termo);
    });

    // Lógica de paginação sobre os clientes filtrados
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClientes = clientesFiltrados.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage) || 1;

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Render badge de situação
    const renderSituacao = (situacao) => {
        if (!situacao) return <span className="badge badge-empty">-</span>;

        let badgeClass = 'badge-regular';
        if (situacao.toLowerCase().includes('atrasada')) badgeClass = 'badge-atrasada';
        else if (situacao.toLowerCase().includes('garantia')) badgeClass = 'badge-garantia';

        return <span className={`badge ${badgeClass}`}>{situacao}</span>;
    };

    const handleAbrirCliente = (cliente) => {
        setClienteSelecionado(cliente);
        setVendaDetalheSelecionada(null);
        setAbaAtiva('visao_geral');
        setFiltroParcelasAba('todas');
        carregarHistoricoDoCliente(cliente.id);
    };

    const handleAbrirNovoModal = () => {
        setClienteEmEdicao(null);
        setIsModalOpen(true);
    };

    const handleAbrirEdicaoModal = (cliente) => {
        setClienteEmEdicao(cliente);
        setIsModalOpen(true);
    };

    // Tela de Cliente Selecionado
    if (clienteSelecionado) {
        const inicialCliente = clienteSelecionado.nome_completo
            ? clienteSelecionado.nome_completo.trim().charAt(0).toUpperCase()
            : 'C';

        const hoje = new Date();

        // Cálculos de Compras, Parcelas e Situação do Cliente
        const totalComprasValor = vendasCliente.reduce((acc, v) => acc + (Number(v.total) || 0), 0);

        const parcelasPagas = parcelasCliente.filter(p => p.status === 'Pago');
        const parcelasPendentes = parcelasCliente.filter(p => p.status !== 'Pago');
        const parcelasAtrasadas = parcelasPendentes.filter(p => {
            if (p.status === 'Vencido') return true;
            if (!p.data_vencimento) return false;
            return new Date(p.data_vencimento) < hoje;
        });

        const somaTotalParcelas = parcelasCliente.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
        const somaParcelasPagas = parcelasPagas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
        const somaParcelasPendentes = parcelasPendentes.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
        const somaParcelasAtrasadas = parcelasAtrasadas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);

        // Filtragem de parcelas na aba Parcelas
        const parcelasExibidas = parcelasCliente.filter(p => {
            const isPago = p.status === 'Pago';
            const isVencida = !isPago && p.data_vencimento && new Date(p.data_vencimento) < hoje;
            if (filtroParcelasAba === 'pagas') return isPago;
            if (filtroParcelasAba === 'pendentes') return !isPago;
            if (filtroParcelasAba === 'atrasadas') return isVencida;
            return true;
        });

        // Situação calculada dinamicamente se houver movimentação
        const situacaoCalculada = parcelasAtrasadas.length > 0
            ? 'Atrasada'
            : vendasCliente.length > 0
                ? 'Regular'
                : clienteSelecionado.situacao || null;

        // Última compra
        const vendasOrdenadas = [...vendasCliente].sort(
            (a, b) => new Date(b.data_venda || 0) - new Date(a.data_venda || 0)
        );
        const ultimaVenda = vendasOrdenadas[0] || null;
        const dataUltimaCompra = ultimaVenda ? formatarDataISO(ultimaVenda.data_venda) : '-';

        // Garantias (1 ano a partir da última venda)
        let dataFimGarantia = null;
        if (ultimaVenda?.data_venda) {
            const dGarantia = new Date(ultimaVenda.data_venda);
            dGarantia.setFullYear(dGarantia.getFullYear() + 1);
            if (dGarantia >= hoje) {
                dataFimGarantia = dGarantia.toLocaleDateString('pt-BR');
            }
        }

        // Auxiliar para obter receita e parcelas de uma venda específica
        const obterReceitaDaVenda = (venda) => {
            if (!venda) return null;
            if (venda.receita_id) {
                return receitasCliente.find(r => r.id === venda.receita_id) || null;
            }
            return null;
        };

        const obterParcelasDaVenda = (vendaId) => {
            return parcelasCliente
                .filter(p => p.venda_id === vendaId)
                .sort((a, b) => a.numero_parcela - b.numero_parcela);
        };

        // Monta a timeline do Histórico do Cliente combinando Vendas, Receitas e Cadastro
        const eventosHistorico = [
            ...vendasCliente.map(v => ({
                id: `venda-${v.id}`,
                vendaObj: v,
                data: new Date(v.data_venda || Date.now()),
                dataFormatada: formatarDataISO(v.data_venda),
                titulo: `Compra realizada - Talão #${v.numero_talao}`,
                extra: `Total: ${formatarMoeda(v.total)} • Vendedor(a): ${v.vendedor || '-'}${v.referencia_armacao ? ` • Armação: ${v.referencia_armacao}` : ''} — Clique para abrir OS`,
                cor: 'azul'
            })),
            ...receitasCliente.map(r => ({
                id: `receita-${r.id}`,
                data: new Date(r.data_receita || Date.now()),
                dataFormatada: formatarDataISO(r.data_receita),
                titulo: `Receita óptica #${r.id} cadastrada`,
                extra: `Optometrista: ${r.optometrista || 'Não informado'}${r.tipo_lente ? ` • Lente: ${r.tipo_lente}` : ''}`,
                cor: 'verde'
            })),
            {
                id: `cadastro-${clienteSelecionado.id}`,
                data: new Date(clienteSelecionado.data_cadastro || Date.now()),
                dataFormatada: formatarDataISO(clienteSelecionado.data_cadastro),
                titulo: 'Cliente cadastrado no sistema',
                extra: `Ficha ${clienteSelecionado.numero_ficha}`,
                cor: 'amarelo'
            }
        ].sort((a, b) => b.data - a.data);

        const vendaAtualModal = vendaDetalheSelecionada
            ? vendasCliente.find(v => v.id === vendaDetalheSelecionada.id) || vendaDetalheSelecionada
            : null;

        return (
            <div className="page-container cliente-detalhe-container">
                <button
                    className="btn-voltar"
                    onClick={() => setClienteSelecionado(null)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Voltar
                </button>

                <div className="cliente-detalhe-header">
                    <div className="page-titles">
                        <h2>{clienteSelecionado.nome_completo}</h2>
                        <p>
                            Ficha {clienteSelecionado.numero_ficha} - Cliente desde {obterAnoCadastro(clienteSelecionado)}.
                        </p>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={() => navigate('/vendas', { state: { cliente: clienteSelecionado } })}
                    >
                        <img src={novoCliente} alt="Nova venda" className="icon" /> Nova venda
                    </button>
                </div>

                <div className="cliente-detalhe-body">
                    {/* Card lateral esquerdo com dados do cliente */}
                    <div className="cliente-perfil-card">
                        <div className="cliente-perfil-topo">
                            <div className="cliente-avatar-circle">
                                {inicialCliente}
                            </div>

                            <h3 className="cliente-perfil-nome">{clienteSelecionado.nome_completo}</h3>

                            <div className="cliente-perfil-situacao">
                                {renderSituacao(situacaoCalculada)}
                            </div>
                        </div>

                        <div className="cliente-perfil-info">
                            <div className="info-item">
                                <span className="info-label">CPF:</span>
                                <span className="info-value">{formatarCPF(clienteSelecionado.cpf)}</span>
                            </div>

                            <div className="info-item">
                                <span className="info-label">Data de Nascimento:</span>
                                <span className="info-value">{obterDataNascimento(clienteSelecionado)}</span>
                            </div>

                            <div className="info-item">
                                <span className="info-label">Telefone:</span>
                                <span className="info-value">{formatarTelefone(clienteSelecionado.telefone1)}</span>
                            </div>

                            <div className="info-item">
                                <span className="info-label">Última compra:</span>
                                <span className="info-value">{dataUltimaCompra}</span>
                            </div>
                        </div>

                        <div className="cliente-perfil-acoes-stack">
                            <button
                                className="btn-editar-cadastro"
                                onClick={() => handleAbrirEdicaoModal(clienteSelecionado)}
                            >
                                Editar cadastro
                            </button>
                            <button
                                type="button"
                                className="btn-excluir-cadastro"
                                onClick={() => setClienteParaExcluir(clienteSelecionado)}
                            >
                                Excluir cliente
                            </button>
                        </div>
                    </div>

                    {/* Área direita com as abas e cards */}
                    <div className="cliente-conteudo-direita">
                        <div className="cliente-tabs">
                            <button
                                className={`cliente-tab ${abaAtiva === 'visao_geral' ? 'active' : ''}`}
                                onClick={() => setAbaAtiva('visao_geral')}
                            >
                                Visão Geral
                            </button>
                            <button
                                className={`cliente-tab ${abaAtiva === 'receitas' ? 'active' : ''}`}
                                onClick={() => setAbaAtiva('receitas')}
                            >
                                Receitas
                            </button>
                            <button
                                className={`cliente-tab ${abaAtiva === 'compras' ? 'active' : ''}`}
                                onClick={() => setAbaAtiva('compras')}
                            >
                                Compras
                            </button>
                            <button
                                className={`cliente-tab ${abaAtiva === 'parcelas' ? 'active' : ''}`}
                                onClick={() => setAbaAtiva('parcelas')}
                            >
                                Parcelas
                            </button>
                        </div>

                        {abaAtiva === 'visao_geral' && (
                            <>
                                <div className="resumo-cards-grid">
                                    <div className="resumo-card" onClick={() => setAbaAtiva('receitas')} style={{ cursor: 'pointer' }}>
                                        <span className="resumo-card-titulo">Receitas</span>
                                        <strong className="resumo-card-numero">{receitasCliente.length}</strong>
                                        <span className="resumo-card-sub">
                                            {receitasCliente.length === 0
                                                ? 'nenhuma cadastrada.'
                                                : `${receitasCliente.length} cadastrada(s).`}
                                        </span>
                                    </div>
                                    <div className="resumo-card" onClick={() => setAbaAtiva('compras')} style={{ cursor: 'pointer' }}>
                                        <span className="resumo-card-titulo">Compras</span>
                                        <strong className="resumo-card-numero">{vendasCliente.length}</strong>
                                        <span className="resumo-card-sub">
                                            {formatarMoeda(totalComprasValor)} no total.
                                        </span>
                                    </div>
                                    <div className="resumo-card" onClick={() => setAbaAtiva('parcelas')} style={{ cursor: 'pointer' }}>
                                        <span className="resumo-card-titulo">Parcelas</span>
                                        <strong className="resumo-card-numero">{parcelasPendentes.length}</strong>
                                        <span className="resumo-card-sub">
                                            {parcelasAtrasadas.length === 0
                                                ? 'nenhuma atrasada.'
                                                : `${parcelasAtrasadas.length} atrasada(s).`}
                                        </span>
                                    </div>
                                    <div className="resumo-card">
                                        <span className="resumo-card-titulo">Garantias</span>
                                        <strong className="resumo-card-numero">{dataFimGarantia ? 1 : 0}</strong>
                                        <span className="resumo-card-sub">
                                            {dataFimGarantia ? `ativa até ${dataFimGarantia}` : 'nenhuma ativa.'}
                                        </span>
                                    </div>
                                </div>

                                <div className="historico-cliente-card">
                                    <h4 className="historico-titulo">Histórico do cliente</h4>
                                    {loadingDetalhes ? (
                                        <p className="aba-vazia-msg">Carregando histórico...</p>
                                    ) : (
                                        <div className="historico-timeline">
                                            {eventosHistorico.map(ev => (
                                                <div
                                                    key={ev.id}
                                                    className={`timeline-item ${ev.vendaObj ? 'clickable-timeline' : ''}`}
                                                    onClick={() => ev.vendaObj && setVendaDetalheSelecionada(ev.vendaObj)}
                                                >
                                                    <div className={`timeline-dot ${ev.cor}`} />
                                                    <span className="timeline-date">{ev.dataFormatada}</span>
                                                    <div className="timeline-info">
                                                        <strong>{ev.titulo}</strong>
                                                        <span>{ev.extra}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {abaAtiva === 'receitas' && (
                            <div className="historico-cliente-card aba-lista-card">
                                <div className="aba-topo-bar">
                                    <div>
                                        <h4 className="historico-titulo">Receitas Ópticas ({receitasCliente.length})</h4>
                                        <span className="aba-sub-hint">Consulte, cadastre, edite o histórico de dioptrias e gere a prescrição em PDF</span>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-card-solid"
                                        onClick={handleAbrirNovaReceita}
                                    >
                                        + Nova Receita
                                    </button>
                                </div>

                                {receitasCliente.length === 0 ? (
                                    <p className="aba-vazia-msg">
                                        Nenhuma receita cadastrada para este cliente. Clique em "+ Nova Receita" para cadastrar.
                                    </p>
                                ) : (
                                    <div className="aba-itens-scroll">
                                        {receitasCliente.map(rec => {
                                            const vendaVinculada = vendasCliente.find(v => v.receita_id === rec.id);
                                            const olhoD = rec.olhos?.find(o => o.olho === 'direito');
                                            const olhoE = rec.olhos?.find(o => o.olho === 'esquerdo');

                                            return (
                                                <div key={rec.id} className="compra-card-rica">
                                                    <div className="compra-rica-top">
                                                        <div className="compra-rica-title-group">
                                                            <span className="compra-talao-pill">RECEITA #{String(rec.id).padStart(3, '0')}</span>
                                                            <strong>Emitida em {formatarDataISO(rec.data_receita)}</strong>
                                                            <span className="compra-codigo-pill">
                                                                Optometrista: {rec.optometrista || 'Não informado'}
                                                            </span>
                                                        </div>
                                                        <div className="compra-rica-badges">
                                                            {rec.data_retorno && (
                                                                <span className="badge badge-garantia">
                                                                    Retorno: {formatarDataISO(rec.data_retorno)}
                                                                </span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="btn-card-outline"
                                                                onClick={() => gerarPDFReceitaOptica(clienteSelecionado, rec)}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                                </svg>
                                                                Salvar PDF
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-card-ghost"
                                                                onClick={() => handleAbrirEditarReceita(rec)}
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-card-danger"
                                                                onClick={() => setReceitaParaExcluir(rec)}
                                                            >
                                                                Excluir
                                                            </button>
                                                            {vendaVinculada && (
                                                                <button
                                                                    type="button"
                                                                    className="btn-card-solid"
                                                                    onClick={() => setVendaDetalheSelecionada(vendaVinculada)}
                                                                >
                                                                    Ver Talão #{vendaVinculada.numero_talao}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="receita-rica-grid">
                                                        <div className="compra-rica-col">
                                                            <span className="col-label">Indicação Óptica</span>
                                                            <p><strong>Tipo de Lente:</strong> {rec.tipo_lente || '-'}</p>
                                                            <p><strong>Tratamento:</strong> {rec.tratamento || '-'}</p>
                                                        </div>
                                                        <div className="compra-rica-col">
                                                            <span className="col-label">Olho Direito (OD)</span>
                                                            <p>
                                                                <strong>ESF:</strong> {formatarGrau(olhoD?.esferico)} |{' '}
                                                                <strong>CIL:</strong> {formatarGrau(olhoD?.cilindrico)} |{' '}
                                                                <strong>Eixo:</strong> {olhoD?.eixo ?? '-'}°
                                                            </p>
                                                            <p>
                                                                <strong>AV:</strong> {olhoD?.acuidade_visual ?? '-'} |{' '}
                                                                <strong>Cerat.:</strong> {rec.ceratometria_od || '-'}
                                                            </p>
                                                        </div>
                                                        <div className="compra-rica-col">
                                                            <span className="col-label">Olho Esquerdo (OE)</span>
                                                            <p>
                                                                <strong>ESF:</strong> {formatarGrau(olhoE?.esferico)} |{' '}
                                                                <strong>CIL:</strong> {formatarGrau(olhoE?.cilindrico)} |{' '}
                                                                <strong>Eixo:</strong> {olhoE?.eixo ?? '-'}°
                                                            </p>
                                                            <p>
                                                                <strong>AV:</strong> {olhoE?.acuidade_visual ?? '-'} |{' '}
                                                                <strong>Cerat.:</strong> {rec.ceratometria_oe || '-'}
                                                            </p>
                                                        </div>
                                                        <div className="compra-rica-col">
                                                            <span className="col-label">Avaliação Complementar</span>
                                                            <p><strong>Condição Motora:</strong> {rec.condicao_motora || '-'}</p>
                                                            <p><strong>Lágrima:</strong> {rec.lagrima || '-'}</p>
                                                        </div>
                                                    </div>

                                                    {rec.observacao && (
                                                        <div className="receita-rica-obs">
                                                            <strong>Observações:</strong> {rec.observacao}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {abaAtiva === 'compras' && (
                            <div className="historico-cliente-card aba-lista-card">
                                <div className="aba-topo-bar">
                                    <div>
                                        <h4 className="historico-titulo">Compras Realizadas ({vendasCliente.length})</h4>
                                        <span className="aba-sub-hint">
                                            Clique em qualquer compra para abrir a Ordem de Serviço completa, validar parcelas e salvar PDF
                                        </span>
                                    </div>
                                </div>

                                {vendasCliente.length === 0 ? (
                                    <p className="aba-vazia-msg">Nenhuma compra registrada para este cliente.</p>
                                ) : (
                                    <div className="aba-itens-scroll">
                                        {vendasOrdenadas.map(venda => {
                                            const receitaVinc = obterReceitaDaVenda(venda);
                                            const parcelasDaVenda = obterParcelasDaVenda(venda.id);
                                            const pagasVenda = parcelasDaVenda.filter(p => p.status === 'Pago');
                                            const pendentesVenda = parcelasDaVenda.filter(p => p.status !== 'Pago');
                                            const atrasadasVenda = pendentesVenda.filter(
                                                p => p.status === 'Vencido' || (p.data_vencimento && new Date(p.data_vencimento) < hoje)
                                            );

                                            const totalVendaNum = Number(venda.total) || 0;
                                            const entradaNum = Number(venda.entrada) || 0;
                                            const subtotalNum = Number(venda.subtotal) || totalVendaNum;
                                            const descontoNum = Number(venda.desconto) || 0;
                                            const somaPagas = pagasVenda.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
                                            const totalQuitado = parcelasDaVenda.length > 0
                                                ? Math.min(totalVendaNum, entradaNum + somaPagas)
                                                : totalVendaNum;
                                            const saldoRestante = Math.max(0, totalVendaNum - totalQuitado);
                                            const pctPago = totalVendaNum > 0
                                                ? Math.min(100, Math.round((totalQuitado / totalVendaNum) * 100))
                                                : 100;
                                            const isQuitada = saldoRestante <= 0.01 || pendentesVenda.length === 0;

                                            // Garantia de 1 ano
                                            const dVenda = venda.data_venda ? new Date(venda.data_venda) : new Date();
                                            const dGarantia = new Date(dVenda);
                                            dGarantia.setFullYear(dGarantia.getFullYear() + 1);
                                            const isGarantiaAtiva = dGarantia >= hoje;
                                            const codigoOS = `KERO-${dVenda.getFullYear()}-T${String(venda.numero_talao).padStart(4, '0')}`;

                                            return (
                                                <div
                                                    key={venda.id}
                                                    className="compra-card-rica clicavel"
                                                    onClick={() => setVendaDetalheSelecionada(venda)}
                                                >
                                                    {/* Cabeçalho do Card da Compra */}
                                                    <div className="compra-rica-top">
                                                        <div className="compra-rica-title-group">
                                                            <span className="compra-talao-pill">
                                                                TALÃO #{String(venda.numero_talao).padStart(4, '0')}
                                                            </span>
                                                            <strong>{formatarDataHoraISO(venda.data_venda)}</strong>
                                                            <span className="compra-codigo-pill">{codigoOS}</span>
                                                        </div>

                                                        <div className="compra-rica-badges">
                                                            <span className={`badge ${isQuitada ? 'badge-regular' : atrasadasVenda.length > 0 ? 'badge-atrasada' : 'badge-garantia'}`}>
                                                                {isQuitada
                                                                    ? 'Quitada'
                                                                    : atrasadasVenda.length > 0
                                                                        ? `${atrasadasVenda.length} em Atraso`
                                                                        : `${pagasVenda.length}/${parcelasDaVenda.length} Pagas`}
                                                            </span>

                                                            <span className={`badge ${isGarantiaAtiva ? 'badge-garantia-azul' : 'badge-empty'}`}>
                                                                {isGarantiaAtiva
                                                                    ? `Garantia até ${dGarantia.toLocaleDateString('pt-BR')}`
                                                                    : 'Garantia Expirada'}
                                                            </span>

                                                            <strong className="compra-valor-total">
                                                                {formatarMoeda(totalVendaNum)}
                                                            </strong>
                                                        </div>
                                                    </div>

                                                    {/* Grid de 4 blocos com muita informação da compra */}
                                                    <div className="compra-rica-grid">
                                                        <div className="compra-rica-col">
                                                            <span className="col-label">Atendimento & Lab</span>
                                                            <p><strong>Vendedor(a):</strong> {venda.vendedor || '-'}</p>
                                                            <p><strong>Laboratório:</strong> {venda.laboratorio || 'Padrão / Interno'}</p>
                                                            <p>
                                                                <strong>Receita:</strong>{' '}
                                                                {receitaVinc ? `#${receitaVinc.id} (${receitaVinc.tipo_lente || 'Óptica'})` : 'Não vinculada'}
                                                            </p>
                                                        </div>

                                                        <div className="compra-rica-col">
                                                            <span className="col-label">Armação & Lentes</span>
                                                            <p>
                                                                <strong>Armação:</strong> {venda.referencia_armacao || '-'} ({formatarMoeda(venda.valor_armacao)})
                                                            </p>
                                                            <p>
                                                                <strong>Lente:</strong> {venda.referencia_lente || '-'} ({formatarMoeda(venda.valor_lentes)})
                                                            </p>
                                                            <p>
                                                                <strong>Anti-Reflexo:</strong> {formatarMoeda(venda.valor_anti_reflexo)}
                                                            </p>
                                                        </div>

                                                        <div className="compra-rica-col">
                                                            <span className="col-label">Valores & Descontos</span>
                                                            <p><strong>Subtotal:</strong> {formatarMoeda(subtotalNum)}</p>
                                                            <p><strong>Desconto:</strong> - {formatarMoeda(descontoNum)}</p>
                                                            <p><strong>Entrada no Ato:</strong> {formatarMoeda(entradaNum)}</p>
                                                        </div>

                                                        <div className="compra-rica-col">
                                                            <span className="col-label">Progresso de Quitação ({pctPago}%)</span>
                                                            <p><strong>Total Recebido:</strong> {formatarMoeda(totalQuitado)}</p>
                                                            <p className={saldoRestante > 0 ? 'texto-pendente' : 'texto-quitado'}>
                                                                <strong>Saldo Restante:</strong> {formatarMoeda(saldoRestante)}
                                                            </p>
                                                            <div className="mini-progress-bg">
                                                                <div
                                                                    className={`mini-progress-fill ${isQuitada ? 'completa' : ''}`}
                                                                    style={{ width: `${pctPago}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Rodapé de Ações Rápidas da Compra */}
                                                    <div className="compra-rica-footer" onClick={e => e.stopPropagation()}>
                                                        <span className="compra-footer-info">
                                                            {parcelasDaVenda.length === 0
                                                                ? 'Pagamento à vista concluído.'
                                                                : `Parcelamento em ${parcelasDaVenda.length}x (${pagasVenda.length} quitada(s), ${pendentesVenda.length} pendente(s)).`}
                                                        </span>

                                                        <div className="compra-footer-buttons">
                                                            {!isQuitada && pendentesVenda.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    className="btn-card-success"
                                                                    onClick={() => handleQuitarTodasParcelas(pendentesVenda)}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                    </svg>
                                                                    Quitar Compra
                                                                </button>
                                                            )}

                                                            <button
                                                                type="button"
                                                                className="btn-card-outline"
                                                                onClick={() => gerarPDFCompraCompleta(
                                                                    clienteSelecionado,
                                                                    venda,
                                                                    receitaVinc,
                                                                    parcelasDaVenda
                                                                )}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                                </svg>
                                                                Salvar PDF
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn-card-solid"
                                                                onClick={() => setVendaDetalheSelecionada(venda)}
                                                            >
                                                                Ordem de Serviço Completa
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {abaAtiva === 'parcelas' && (
                            <div className="historico-cliente-card aba-lista-card">
                                {/* Cabeçalho da Aba Parcelas com Filtros e Exportação PDF */}
                                <div className="aba-topo-bar">
                                    <div>
                                        <h4 className="historico-titulo">Controle de Parcelas ({parcelasCliente.length})</h4>
                                        <span className="aba-sub-hint">
                                            Gerencie vencimentos, confirme baixas de pagamento e emita recibos em PDF
                                        </span>
                                    </div>

                                    <div className="parcelas-toolbar-right">
                                        <div className="parcelas-filter-group">
                                            <button
                                                type="button"
                                                className={`parcela-filter-btn ${filtroParcelasAba === 'todas' ? 'active' : ''}`}
                                                onClick={() => setFiltroParcelasAba('todas')}
                                            >
                                                Todas ({parcelasCliente.length})
                                            </button>
                                            <button
                                                type="button"
                                                className={`parcela-filter-btn ${filtroParcelasAba === 'pendentes' ? 'active' : ''}`}
                                                onClick={() => setFiltroParcelasAba('pendentes')}
                                            >
                                                Pendentes ({parcelasPendentes.length})
                                            </button>
                                            <button
                                                type="button"
                                                className={`parcela-filter-btn ${filtroParcelasAba === 'pagas' ? 'active' : ''}`}
                                                onClick={() => setFiltroParcelasAba('pagas')}
                                            >
                                                Pagas ({parcelasPagas.length})
                                            </button>
                                            {parcelasAtrasadas.length > 0 && (
                                                <button
                                                    type="button"
                                                    className={`parcela-filter-btn atraso ${filtroParcelasAba === 'atrasadas' ? 'active' : ''}`}
                                                    onClick={() => setFiltroParcelasAba('atrasadas')}
                                                >
                                                    Atrasadas ({parcelasAtrasadas.length})
                                                </button>
                                            )}
                                        </div>

                                        {parcelasCliente.length > 0 && (
                                            <button
                                                type="button"
                                                className="btn-card-outline"
                                                onClick={() => gerarPDFExtratoParcelas(clienteSelecionado, parcelasCliente)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                </svg>
                                                Extrato PDF
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Mini Strip Financeira das Parcelas */}
                                {parcelasCliente.length > 0 && (
                                    <div className="parcelas-kpi-strip">
                                        <div className="parcela-kpi-item">
                                            <span>Total Parcelado</span>
                                            <strong>{formatarMoeda(somaTotalParcelas)}</strong>
                                            <small>{parcelasCliente.length} parcela(s) lançada(s)</small>
                                        </div>
                                        <div className="parcela-kpi-item pago">
                                            <span>Total Quitado</span>
                                            <strong>{formatarMoeda(somaParcelasPagas)}</strong>
                                            <small>{parcelasPagas.length} parcela(s) paga(s)</small>
                                        </div>
                                        <div className="parcela-kpi-item pendente">
                                            <span>Saldo em Aberto</span>
                                            <strong>{formatarMoeda(somaParcelasPendentes)}</strong>
                                            <small>{parcelasPendentes.length} pendente(s)</small>
                                        </div>
                                        <div className={`parcela-kpi-item ${parcelasAtrasadas.length > 0 ? 'atrasado' : ''}`}>
                                            <span>Em Atraso</span>
                                            <strong>{formatarMoeda(somaParcelasAtrasadas)}</strong>
                                            <small>
                                                {parcelasAtrasadas.length === 0
                                                    ? 'Nenhuma vencida'
                                                    : `${parcelasAtrasadas.length} parcela(s) vencida(s)`}
                                            </small>
                                        </div>
                                    </div>
                                )}

                                {parcelasExibidas.length === 0 ? (
                                    <p className="aba-vazia-msg">Nenhuma parcela encontrada para este filtro.</p>
                                ) : (
                                    <div className="parcelas-table-wrapper">
                                        <table className="parcelas-modern-table">
                                            <thead>
                                                <tr>
                                                    <th>Parcela</th>
                                                    <th>Talão</th>
                                                    <th>Vencimento</th>
                                                    <th>Forma de Pagto.</th>
                                                    <th>Valor</th>
                                                    <th>Situação</th>
                                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parcelasExibidas.map(parc => {
                                                    const isPago = parc.status === 'Pago';
                                                    const vencida = !isPago && parc.data_vencimento && new Date(parc.data_vencimento) < hoje;
                                                    const vendaRef = vendasCliente.find(v => v.id === parc.venda_id);
                                                    const totalParcVenda = parcelasCliente.filter(p => p.venda_id === parc.venda_id).length || 1;

                                                    return (
                                                        <tr key={parc.id} className={isPago ? 'tr-parcela-paga' : vencida ? 'tr-parcela-vencida' : ''}>
                                                            <td>
                                                                <div className="parcela-num-cell">
                                                                    <span className="parcela-num-badge">
                                                                        {String(parc.numero_parcela).padStart(2, '0')}/{String(totalParcVenda).padStart(2, '0')}
                                                                    </span>
                                                                    <strong>{parc.numero_parcela}ª Parcela</strong>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="talao-link-pill"
                                                                    onClick={() => vendaRef && setVendaDetalheSelecionada(vendaRef)}
                                                                    title="Abrir Ordem de Serviço desta compra"
                                                                >
                                                                    Talão #{String(parc.numero_talao || '-').padStart(4, '0')}
                                                                </button>
                                                            </td>
                                                            <td>
                                                                <div className="parcela-data-cell">
                                                                    <strong>{formatarDataISO(parc.data_vencimento)}</strong>
                                                                    {isPago && parc.data_pagamento && (
                                                                        <small>Pago em {formatarDataISO(parc.data_pagamento)}</small>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="parcela-forma-text">
                                                                    {parc.forma_de_pagamento || 'Não informada'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <strong className="parcela-valor-cell">
                                                                    {formatarMoeda(parc.valor)}
                                                                </strong>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${isPago ? 'badge-regular' : vencida ? 'badge-atrasada' : 'badge-garantia'}`}>
                                                                    {isPago ? 'Pago' : vencida ? 'Atrasada' : 'Pendente'}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                <div className="parcela-table-actions">
                                                                    {!isPago ? (
                                                                        <button
                                                                            type="button"
                                                                            className="btn-card-success"
                                                                            onClick={() => handleValidarParcela(parc)}
                                                                        >
                                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                                            </svg>
                                                                            Confirmar Baixa
                                                                        </button>
                                                                    ) : (
                                                                        <>
                                                                            {vendaRef && (
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn-card-outline"
                                                                                    onClick={() => gerarPDFReciboParcela(
                                                                                        clienteSelecionado,
                                                                                        vendaRef,
                                                                                        parc,
                                                                                        totalParcVenda
                                                                                    )}
                                                                                >
                                                                                    Recibo PDF
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                className="btn-reabrir-inline"
                                                                                onClick={() => handleReabrirParcela(parc)}
                                                                            >
                                                                                Estornar
                                                                            </button>
                                                                        </>
                                                                    )}

                                                                    {vendaRef && (
                                                                        <button
                                                                            type="button"
                                                                            className="btn-card-ghost"
                                                                            onClick={() => setVendaDetalheSelecionada(vendaRef)}
                                                                            title="Ver detalhes da compra"
                                                                        >
                                                                            Ver OS
                                                                        </button>
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
                        )}
                    </div>
                </div>

                {/* Modal de Detalhes Completos da Compra, Validação e Impressão de PDF */}
                <ModalDetalheCompra
                    isOpen={Boolean(vendaAtualModal)}
                    onClose={() => setVendaDetalheSelecionada(null)}
                    venda={vendaAtualModal}
                    cliente={clienteSelecionado}
                    receita={obterReceitaDaVenda(vendaAtualModal)}
                    parcelas={vendaAtualModal ? obterParcelasDaVenda(vendaAtualModal.id) : []}
                    onValidarParcela={handleValidarParcela}
                    onReabrirParcela={handleReabrirParcela}
                    onQuitarTodasParcelas={handleQuitarTodasParcelas}
                    onGerarPDFCompra={(v, r, p) => gerarPDFCompraCompleta(clienteSelecionado, v, r, p)}
                    onGerarPDFReciboParcela={(v, p, totalP) => gerarPDFReciboParcela(clienteSelecionado, v, p, totalP)}
                />

                {/* Modal também disponível na tela de detalhes para Editar Cadastro */}
                <ModalNovoCliente
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setClienteEmEdicao(null); }}
                    onClienteCadastrado={carregarClientes}
                    clienteParaEditar={clienteEmEdicao}
                />

                {/* Modal de Cadastro / Edição de Receita Óptica */}
                {isModalReceitaOpen && (
                    <div className="modal-cliente-overlay" onClick={() => !salvandoReceita && setIsModalReceitaOpen(false)}>
                        <div className="modal-receita-card" onClick={e => e.stopPropagation()}>
                            <div className="modal-receita-header">
                                <div>
                                    <h3>
                                        {receitaEmEdicao
                                            ? `Editar Receita Óptica #${String(receitaEmEdicao.id).padStart(3, '0')}`
                                            : 'Nova Receita Óptica'}
                                    </h3>
                                    <p>Paciente: <strong>{clienteSelecionado.nome_completo}</strong></p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-fechar-modal-rec"
                                    onClick={() => setIsModalReceitaOpen(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            {erroReceita && <div className="receita-erro-msg">{erroReceita}</div>}

                            <form onSubmit={handleSalvarReceita} className="modal-receita-form">
                                <div className="rec-row-4">
                                    <div className="rec-field">
                                        <label>Optometrista</label>
                                        <input
                                            name="optometrista"
                                            type="text"
                                            maxLength={60}
                                            placeholder="Nome do profissional"
                                            value={receitaForm.optometrista}
                                            onChange={handleReceitaFormChange}
                                        />
                                    </div>
                                    <div className="rec-field">
                                        <label>Tipo de Lente</label>
                                        <input
                                            name="tipo_lente"
                                            type="text"
                                            maxLength={25}
                                            placeholder="Ex: Multifocal, Visão Simples"
                                            value={receitaForm.tipo_lente}
                                            onChange={handleReceitaFormChange}
                                        />
                                    </div>
                                    <div className="rec-field">
                                        <label>Tratamento</label>
                                        <input
                                            name="tratamento"
                                            type="text"
                                            maxLength={50}
                                            placeholder="Ex: Antirreflexo, Filtro Azul"
                                            value={receitaForm.tratamento}
                                            onChange={handleReceitaFormChange}
                                        />
                                    </div>
                                    <div className="rec-field">
                                        <label>Data de Retorno</label>
                                        <input
                                            name="data_retorno"
                                            type="date"
                                            value={receitaForm.data_retorno}
                                            onChange={handleReceitaFormChange}
                                        />
                                    </div>
                                </div>

                                <div className="rec-olhos-box">
                                    <div className="rec-olhos-header">
                                        <span>Olho</span>
                                        <span>Esférico</span>
                                        <span>Cilíndrico</span>
                                        <span>Eixo (°)</span>
                                        <span>Acuidade Visual</span>
                                    </div>
                                    <div className="rec-olhos-row">
                                        <span className="rec-olho-tag">OD (Direito)</span>
                                        <input
                                            name="od_esferico"
                                            type="number"
                                            step="0.25"
                                            placeholder="0.00"
                                            value={receitaForm.od_esferico}
                                            onChange={handleReceitaFormChange}
                                        />
                                        <input
                                            name="od_cilindrico"
                                            type="number"
                                            step="0.25"
                                            placeholder="0.00"
                                            value={receitaForm.od_cilindrico}
                                            onChange={handleReceitaFormChange}
                                        />
                                        <input
                                            name="od_eixo"
                                            type="number"
                                            step="1"
                                            placeholder="0"
                                            value={receitaForm.od_eixo}
                                            onChange={handleReceitaFormChange}
                                        />
                                        <input
                                            name="od_acuidade"
                                            type="number"
                                            step="0.1"
                                            placeholder="1.0"
                                            value={receitaForm.od_acuidade}
                                            onChange={handleReceitaFormChange}
                                        />
                                    </div>
                                    <div className="rec-olhos-row">
                                        <span className="rec-olho-tag">OE (Esquerdo)</span>
                                        <input
                                            name="oe_esferico"
                                            type="number"
                                            step="0.25"
                                            placeholder="0.00"
                                            value={receitaForm.oe_esferico}
                                            onChange={handleReceitaFormChange}
                                        />
                                        <input
                                            name="oe_cilindrico"
                                            type="number"
                                            step="0.25"
                                            placeholder="0.00"
                                            value={receitaForm.oe_cilindrico}
                                            onChange={handleReceitaFormChange}
                                        />
                                        <input
                                            name="oe_eixo"
                                            type="number"
                                            step="1"
                                            placeholder="0"
                                            value={receitaForm.oe_eixo}
                                            onChange={handleReceitaFormChange}
                                        />
                                        <input
                                            name="oe_acuidade"
                                            type="number"
                                            step="0.1"
                                            placeholder="1.0"
                                            value={receitaForm.oe_acuidade}
                                            onChange={handleReceitaFormChange}
                                        />
                                    </div>
                                </div>

                                <div className="rec-row-4">
                                    <div className="rec-field">
                                        <label>Ceratometria OD</label>
                                        <input
                                            name="ceratometria_od"
                                            type="text"
                                            maxLength={25}
                                            placeholder="Opcional"
                                            value={receitaForm.ceratometria_od}
                                            onChange={handleReceitaFormChange}
                                        />
                                    </div>
                                    <div className="rec-field">
                                        <label>Ceratometria OE</label>
                                        <input
                                            name="ceratometria_oe"
                                            type="text"
                                            maxLength={25}
                                            placeholder="Opcional"
                                            value={receitaForm.ceratometria_oe}
                                            onChange={handleReceitaFormChange}
                                        />
                                    </div>
                                    <div className="rec-field">
                                        <label>Condição Motora</label>
                                        <input
                                            name="condicao_motora"
                                            type="text"
                                            maxLength={30}
                                            placeholder="Opcional"
                                            value={receitaForm.condicao_motora}
                                            onChange={handleReceitaFormChange}
                                        />
                                    </div>
                                    <div className="rec-field">
                                        <label>Lágrima</label>
                                        <input
                                            name="lagrima"
                                            type="text"
                                            maxLength={20}
                                            placeholder="Opcional"
                                            value={receitaForm.lagrima}
                                            onChange={handleReceitaFormChange}
                                        />
                                    </div>
                                </div>

                                <div className="rec-field">
                                    <label>Observações da Receita</label>
                                    <input
                                        name="observacao"
                                        type="text"
                                        placeholder="Observações adicionais..."
                                        value={receitaForm.observacao}
                                        onChange={handleReceitaFormChange}
                                    />
                                </div>

                                <div className="modal-receita-footer">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setIsModalReceitaOpen(false)}
                                        disabled={salvandoReceita}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={salvandoReceita}
                                    >
                                        {salvandoReceita
                                            ? 'Salvando...'
                                            : receitaEmEdicao
                                                ? 'Salvar Alterações'
                                                : 'Cadastrar Receita'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Confirmação de Exclusão de Receita */}
                {receitaParaExcluir && (
                    <div className="modal-cliente-overlay" onClick={() => !excluindoReceita && setReceitaParaExcluir(null)}>
                        <div className="modal-confirm-danger-card" onClick={e => e.stopPropagation()}>
                            <h3>Excluir Receita #{String(receitaParaExcluir.id).padStart(3, '0')}</h3>
                            <p>
                                Tem certeza que deseja excluir esta receita óptica de{' '}
                                <strong>{clienteSelecionado.nome_completo}</strong>?
                            </p>
                            <div className="modal-confirm-danger-acoes">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setReceitaParaExcluir(null)}
                                    disabled={excluindoReceita}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn-confirm-danger"
                                    onClick={handleConfirmarExclusaoReceita}
                                    disabled={excluindoReceita}
                                >
                                    {excluindoReceita ? 'Excluindo...' : 'Sim, Excluir Receita'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Confirmação de Exclusão de Cliente */}
                {clienteParaExcluir && (
                    <div className="modal-cliente-overlay" onClick={() => !excluindoCliente && setClienteParaExcluir(null)}>
                        <div className="modal-confirm-danger-card" onClick={e => e.stopPropagation()}>
                            <h3>Excluir Cliente</h3>
                            <p>
                                Tem certeza que deseja excluir o cadastro de{' '}
                                <strong>{clienteParaExcluir.nome_completo}</strong> (Ficha {clienteParaExcluir.numero_ficha})?
                            </p>
                            <span className="modal-confirm-danger-aviso">
                                Atenção: As receitas, compras e parcelas vinculadas a este cliente também serão removidas.
                            </span>
                            <div className="modal-confirm-danger-acoes">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setClienteParaExcluir(null)}
                                    disabled={excluindoCliente}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn-confirm-danger"
                                    onClick={handleConfirmarExclusaoCliente}
                                    disabled={excluindoCliente}
                                >
                                    {excluindoCliente ? 'Excluindo...' : 'Sim, Excluir Cliente'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-titles">
                    <h2>Clientes</h2>
                    <p>Cadastre, pesquise e acompanhe todo o histórico</p>
                </div>
            </div>

            <div className="action-bar">
                <input
                    type="text"
                    placeholder="Pesquisar por nome, CPF, talão, telefone..."
                    className="search-input"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />

                <div className="action-buttons">
                    <div className="filter-wrapper" ref={filtroDropdownRef}>
                        <button
                            className={`btn-secondary ${filtroSituacao !== 'todos' ? 'active-filter' : ''}`}
                            onClick={() => setMostrarFiltrosMenu(!mostrarFiltrosMenu)}
                        >
                            <img src={filtro} alt="Filtro" className="icon" />
                            {filtroSituacao === 'todos' ? 'Filtros' : `Filtro: ${filtroSituacao}`}
                        </button>

                        {mostrarFiltrosMenu && (
                            <div className="filtro-dropdown">
                                <button
                                    className={filtroSituacao === 'todos' ? 'selected' : ''}
                                    onClick={() => { setFiltroSituacao('todos'); setMostrarFiltrosMenu(false); setCurrentPage(1); }}
                                >
                                    Todos
                                </button>
                                <button
                                    className={filtroSituacao === 'regular' ? 'selected' : ''}
                                    onClick={() => { setFiltroSituacao('regular'); setMostrarFiltrosMenu(false); setCurrentPage(1); }}
                                >
                                    Regular
                                </button>
                                <button
                                    className={filtroSituacao === 'atrasada' ? 'selected' : ''}
                                    onClick={() => { setFiltroSituacao('atrasada'); setMostrarFiltrosMenu(false); setCurrentPage(1); }}
                                >
                                    Atrasada
                                </button>
                                <button
                                    className={filtroSituacao === 'garantia' ? 'selected' : ''}
                                    onClick={() => { setFiltroSituacao('garantia'); setMostrarFiltrosMenu(false); setCurrentPage(1); }}
                                >
                                    Garantia
                                </button>
                            </div>
                        )}
                    </div>

                    <button className="btn-primary" onClick={handleAbrirNovoModal}>
                        <img src={novoCliente} alt="Novo Cliente" className="icon" /> Novo Cliente
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>CPF</th>
                            <th>Telefone</th>
                            <th>Situação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="empty-state">Carregando clientes...</td>
                            </tr>
                        ) : clientesFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="empty-state">
                                    {searchTerm
                                        ? `Nenhum cliente encontrado para "${searchTerm}".`
                                        : 'Nenhum cliente cadastrado ainda.'}
                                </td>
                            </tr>
                        ) : (
                            currentClientes.map(cliente => (
                                <tr key={cliente.id}>
                                    <td>{cliente.nome_completo}</td>
                                    <td>{formatarCPF(cliente.cpf)}</td>
                                    <td>{formatarTelefone(cliente.telefone1)}</td>
                                    <td>{renderSituacao(cliente.situacao)}</td>
                                    <td className="action-cell">
                                        <div className="clientes-table-actions">
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleAbrirCliente(cliente)}
                                                title="Ver detalhes do cliente"
                                            >
                                                <img src={setaDireita} alt="Ações" className="action-arrow" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="table-footer">
                    <span className="pagination-info">
                        Mostrando {clientesFiltrados.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, clientesFiltrados.length)} de {clientesFiltrados.length}.
                    </span>
                    <div className="pagination-controls">
                        <button
                            className="btn-page"
                            onClick={handlePrevPage}
                            disabled={currentPage === 1 || clientesFiltrados.length === 0}
                        >
                            <img src={setaEsquerda} alt="Anterior" />
                        </button>
                        <button
                            className="btn-page"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || clientesFiltrados.length === 0}
                        >
                            <img src={setaDireita} alt="Próxima" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Cadastro / Edição de Cliente */}
            <ModalNovoCliente
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setClienteEmEdicao(null); }}
                onClienteCadastrado={carregarClientes}
                clienteParaEditar={clienteEmEdicao}
            />
        </div>
    );
}
