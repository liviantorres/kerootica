import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './styles/ModalNovoCliente.css';

const initialState = {
    nome_completo: '',
    rg: '',
    cpf: '',
    data_nascimento: '',
    telefone1: '',
    telefone2: '',
    email: '',
    numero_ficha: '',
    nome_mae: '',
    nome_pai: '',
    endereco: '',
    referencia: '',
    cn: false,
    ca: false
};

export function ModalNovoCliente({ isOpen, onClose, onClienteCadastrado, clienteParaEditar = null }) {
    const [formData, setFormData] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    // Máscara para CPF (000.000.000-00)
    const formatCPF = (val) => {
        if (!val) return '';
        const clean = val.toString().replace(/\D/g, '').slice(0, 11);
        if (clean.length <= 3) return clean;
        if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
        if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
        return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
    };

    // Máscara para Telefone ((00) 00000-0000)
    const formatTelefone = (val) => {
        if (!val) return '';
        const clean = val.toString().replace(/\D/g, '').slice(0, 11);
        if (clean.length <= 2) return clean ? `(${clean}` : '';
        if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
        if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
        return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
    };

    // Máscara para Data de Nascimento (DD/MM/AAAA)
    const formatDataNascimento = (val) => {
        if (!val) return '';
        const clean = val.toString().replace(/\D/g, '').slice(0, 8);
        if (clean.length <= 2) return clean;
        if (clean.length <= 4) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
        return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
    };

    // Remove sufixos antigos que antes eram concatenados na referência
    const limparReferenciaLegada = (ref) => {
        if (!ref) return '';
        return ref
            .split('|')
            .map(part => part.trim())
            .filter(part => !/^(RG:|Nasc:|C\.N\.:|C\.A\.:)/i.test(part))
            .join(' | ');
    };

    // Sempre que o modal for aberto, popula com os dados de edição ou reseta para um estado limpo
    useEffect(() => {
        if (isOpen) {
            if (clienteParaEditar) {
                setFormData({
                    nome_completo: clienteParaEditar.nome_completo || '',
                    rg: clienteParaEditar.rg || '',
                    cpf: formatCPF(clienteParaEditar.cpf || ''),
                    data_nascimento: formatDataNascimento(clienteParaEditar.data_nascimento || ''),
                    telefone1: formatTelefone(clienteParaEditar.telefone1 || ''),
                    telefone2: formatTelefone(clienteParaEditar.telefone2 || ''),
                    email: clienteParaEditar.email || '',
                    numero_ficha: clienteParaEditar.numero_ficha || '',
                    nome_mae: clienteParaEditar.nome_mae || '',
                    nome_pai: clienteParaEditar.nome_pai || '',
                    endereco: clienteParaEditar.endereco || '',
                    referencia: limparReferenciaLegada(clienteParaEditar.referencia),
                    cn: Boolean(clienteParaEditar.cn),
                    ca: Boolean(clienteParaEditar.ca)
                });
            } else {
                setFormData(initialState);
            }
            setErro('');
        }
    }, [isOpen, clienteParaEditar]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (erro) setErro('');
    };

    const handleCPFChange = (e) => {
        const formatted = formatCPF(e.target.value);
        setFormData(prev => ({ ...prev, cpf: formatted }));
        if (erro) setErro('');
    };

    const handleTelefone1Change = (e) => {
        const formatted = formatTelefone(e.target.value);
        setFormData(prev => ({ ...prev, telefone1: formatted }));
        if (erro) setErro('');
    };

    const handleTelefone2Change = (e) => {
        const formatted = formatTelefone(e.target.value);
        setFormData(prev => ({ ...prev, telefone2: formatted }));
        if (erro) setErro('');
    };

    const handleDataNascChange = (e) => {
        const formatted = formatDataNascimento(e.target.value);
        setFormData(prev => ({ ...prev, data_nascimento: formatted }));
        if (erro) setErro('');
    };

    const handleClose = () => {
        setFormData(initialState);
        setErro('');
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');

        const cpfClean = formData.cpf.replace(/\D/g, '');
        if (cpfClean.length !== 11) {
            setErro('O CPF deve conter exatamente 11 dígitos.');
            setLoading(false);
            return;
        }

        if (!formData.nome_completo.trim()) {
            setErro('Por favor, informe o nome completo do cliente.');
            setLoading(false);
            return;
        }

        // Se número da ficha não foi informado, gera automaticamente um código sequencial/timestamp
        const numFicha = formData.numero_ficha.trim() 
            ? formData.numero_ficha.trim() 
            : `F-${Date.now().toString().slice(-6)}`;

        // Constrói payload 100% sincronizado com as colunas do backend
        const payload = {
            nome_completo: formData.nome_completo.trim(),
            cpf: cpfClean,
            rg: formData.rg.trim() || null,
            data_nascimento: formData.data_nascimento.trim() || null,
            numero_ficha: numFicha,
            telefone1: formData.telefone1.trim() || null,
            telefone2: formData.telefone2.trim() || null,
            email: formData.email.trim() || null,
            nome_mae: formData.nome_mae.trim() || null,
            nome_pai: formData.nome_pai.trim() || null,
            endereco: formData.endereco.trim() || null,
            referencia: formData.referencia.trim() || null,
            cn: Boolean(formData.cn),
            ca: Boolean(formData.ca)
        };

        try {
            let response;
            if (clienteParaEditar?.id) {
                response = await api.patch(`/api/clientes/${clienteParaEditar.id}`, payload);
            } else {
                response = await api.post('/api/clientes', payload);
            }
            setFormData(initialState);
            if (onClienteCadastrado) {
                onClienteCadastrado(response.data);
            }
            onClose();
        } catch (error) {
            const msg = error.response?.data?.erro || 
                        error.response?.data?.detalhes || 
                        'Erro ao salvar cliente. Verifique os dados.';
            setErro(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title-wrapper">
                        <h2>{clienteParaEditar ? 'Editar cadastro do cliente' : 'Cadastrar novo cliente'}</h2>
                        <div className="modal-title-line" />
                    </div>
                    <button className="modal-close-btn" onClick={handleClose} type="button" aria-label="Fechar">
                        ✕
                    </button>
                </div>

                {erro && <div className="modal-error-alert">{erro}</div>}

                {/* Form com todos os campos sincronizados entre Frontend e Backend */}
                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Linha 1: Nome completo, CPF, RG e Data de nascimento */}
                    <div className="form-row-line1">
                        <div className="form-group col-nome">
                            <label htmlFor="nome_completo">Nome completo:</label>
                            <input
                                id="nome_completo"
                                name="nome_completo"
                                type="text"
                                placeholder="Digite o nome completo do cliente."
                                value={formData.nome_completo}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group col-cpf">
                            <label htmlFor="cpf">CPF:</label>
                            <input
                                id="cpf"
                                name="cpf"
                                type="text"
                                placeholder="000.000.000-00"
                                value={formData.cpf}
                                onChange={handleCPFChange}
                                maxLength={14}
                                required
                            />
                        </div>

                        <div className="form-group col-rg">
                            <label htmlFor="rg">RG:</label>
                            <input
                                id="rg"
                                name="rg"
                                type="text"
                                placeholder="Digite o número do RG"
                                value={formData.rg}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group col-nasc">
                            <label htmlFor="data_nascimento">Data de nascimento:</label>
                            <input
                                id="data_nascimento"
                                name="data_nascimento"
                                type="text"
                                placeholder="DD/MM/AAAA"
                                value={formData.data_nascimento}
                                onChange={handleDataNascChange}
                                maxLength={10}
                            />
                        </div>
                    </div>

                    {/* Linha 2: Telefone 1, Telefone 2, E-mail e Nº da Ficha */}
                    <div className="form-row-line2">
                        <div className="form-group col-telefone">
                            <label htmlFor="telefone1">Telefone 1:</label>
                            <input
                                id="telefone1"
                                name="telefone1"
                                type="text"
                                placeholder="(00) 00000-0000"
                                value={formData.telefone1}
                                onChange={handleTelefone1Change}
                                maxLength={15}
                            />
                        </div>

                        <div className="form-group col-telefone2">
                            <label htmlFor="telefone2">Telefone 2 (opcional):</label>
                            <input
                                id="telefone2"
                                name="telefone2"
                                type="text"
                                placeholder="(00) 00000-0000"
                                value={formData.telefone2}
                                onChange={handleTelefone2Change}
                                maxLength={15}
                            />
                        </div>

                        <div className="form-group col-email">
                            <label htmlFor="email">E-mail (opcional):</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="cliente@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group col-ficha">
                            <label htmlFor="numero_ficha">Nº da Ficha (opcional):</label>
                            <input
                                id="numero_ficha"
                                name="numero_ficha"
                                type="text"
                                placeholder="Ex: 001 (auto se vazio)"
                                value={formData.numero_ficha}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Linha 3: Nome da mãe e Nome do pai */}
                    <div className="form-row-line3">
                        <div className="form-group">
                            <label htmlFor="nome_mae">Nome da mãe:</label>
                            <input
                                id="nome_mae"
                                name="nome_mae"
                                type="text"
                                placeholder="Digite o nome da mãe do cliente."
                                value={formData.nome_mae}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="nome_pai">Nome do pai:</label>
                            <input
                                id="nome_pai"
                                name="nome_pai"
                                type="text"
                                placeholder="Digite o nome do pai do cliente."
                                value={formData.nome_pai}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Linha 4: Endereço e Referência */}
                    <div className="form-row-line4">
                        <div className="form-group col-endereco">
                            <label htmlFor="endereco">Endereço:</label>
                            <input
                                id="endereco"
                                name="endereco"
                                type="text"
                                placeholder="Digite o endereço completo do cliente."
                                value={formData.endereco}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group col-referencia">
                            <label htmlFor="referencia">Referência:</label>
                            <input
                                id="referencia"
                                name="referencia"
                                type="text"
                                placeholder="Digite uma referência relacionada ao cliente."
                                value={formData.referencia}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Footer: C. N., C. A. e Botão Salvar Dados */}
                    <div className="modal-footer-row">
                        <div className="checkboxes-group">
                            <label className="custom-checkbox-label">
                                <span>C. N.:</span>
                                <input
                                    type="checkbox"
                                    name="cn"
                                    checked={formData.cn}
                                    onChange={handleChange}
                                    className="custom-square-checkbox"
                                />
                            </label>

                            <label className="custom-checkbox-label">
                                <span>C. A.:</span>
                                <input
                                    type="checkbox"
                                    name="ca"
                                    checked={formData.ca}
                                    onChange={handleChange}
                                    className="custom-square-checkbox"
                                />
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            className="btn-salvar-dados"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar Dados'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
