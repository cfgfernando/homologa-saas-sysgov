import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  KpiCard,
} from '@sysgov/ui';
import {
  Bus,
  MapPin,
  Plus,
  User,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Truck,
  UserCheck,
  XCircle,
  Navigation,
  Building2,
} from 'lucide-react';
import { useEduca } from '../context/EducaContext';
import { apiClient } from '@/core/api/client';

export interface EmpresaTransporte {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj?: string;
  contract_number?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  is_active: boolean;
  notes?: string;
  legal_person_id?: number;
  responsible_person_id?: number;
  vehicles_count?: number;
  routes_count?: number;
  drivers_count?: number;
}

export interface AuditoriaRegistro60 {
  ano_letivo: number;
  total_alunos_alocados: number;
  total_zona_rural: number;
  total_zona_urbana: number;
  total_atendimento_especial_pcd: number;
  total_veiculos_acessiveis_pcd: number;
  rotas_superlotadas_ctb: number;
  total_empresas_terceirizadas: number;
  inconsistencias: Array<{
    tipo: 'erro' | 'alerta';
    mensagem: string;
    detalhe?: string;
  }>;
}

export interface ParadaTransporte {
  id: string;
  route_id: string;
  ordem: number;
  nome: string;
  referencia?: string;
  latitude?: number;
  longitude?: number;
  horario_estimado?: string;
}

export interface RotaTransporte {
  id: string;
  codigo: string;
  nome: string;
  turno: 'matutino' | 'vespertino' | 'noturno' | 'integral';
  tipo_rota: 'urbana' | 'rural' | 'mista';
  academic_year?: number;
  quilometragem_estimada?: number;
  km_paved?: number;
  km_unpaved?: number;
  horario_saida?: string;
  horario_chegada?: string;
  return_departure_time?: string;
  is_outsourced?: boolean;
  company_id?: string;
  ativo: boolean;
  company?: { id: string; razao_social: string; cnpj?: string };
  stops?: ParadaTransporte[];
  schools?: Array<{ id: string; nome: string }>;
}

export interface VistoriaVeiculo {
  id: string;
  vehicle_id: string;
  numero_laudo: string;
  orgao_emissor: string;
  data_vistoria: string;
  data_validade: string;
  resultado: 'aprovado' | 'reprovado' | 'com_restricoes';
  observacoes?: string;
}

export interface VeiculoTransporte {
  id: string;
  company_id?: string;
  placa: string;
  renavam?: string;
  chassis?: string;
  marca_modelo: string;
  ano_fabricacao: number;
  tipologia: 'onibus' | 'microonibus' | 'van' | 'embarcacao' | 'outros';
  vehicle_type_inep?: number;
  tipo_propriedade: 'proprio' | 'terceirizado';
  capacidade_passageiros: number;
  ocupacao_efetiva: number;
  is_exclusive_school_use?: boolean;
  is_accessible_disability?: boolean;
  status: 'regular' | 'em_manutencao' | 'interditado';
  company?: { id: string; razao_social: string; cnpj?: string };
  latest_inspection?: VistoriaVeiculo;
}

export interface CondutorTransporte {
  id: string;
  pessoa_id: number;
  company_id?: string;
  tipo_funcao: 'motorista' | 'monitor';
  cnh_numero?: string;
  cnh_categoria?: string;
  cnh_validade?: string;
  toxicological_exam_date?: string;
  toxicological_expiration_date?: string;
  curso_transporte_escolar: boolean;
  validade_curso?: string;
  ativo: boolean;
  company?: { id: string; razao_social: string };
  pessoa?: {
    id: number;
    nome: string;
    cpf?: string;
    documento?: string;
  };
}

export interface AlocacaoEstudante {
  id: string;
  route_id: string;
  vehicle_id: string;
  stop_id: string;
  enrollment_id: string;
  aluno_pessoa_id: number;
  uses_rural_transport?: boolean;
  public_transport_jurisdiction?: number;
  special_needs_transport?: boolean;
  special_needs_notes?: string;
  data_inicio: string;
  data_fim?: string;
  status: 'ativa' | 'encerrada';
  route?: { codigo: string; nome: string };
  vehicle?: { placa: string; marca_modelo: string; capacidade_passageiros: number };
  stop?: { nome: string; horario_estimado?: string };
  aluno_pessoa?: { nome: string; cpf?: string };
  enrollment?: {
    aluno_pessoa?: { nome: string };
    numero_matricula?: string;
  };
}

export const TransporteView: React.FC = () => {
  const { escolaAtiva } = useEduca();

  // Estados principais
  const [tabAtiva, setTabAtiva] = useState<'rotas' | 'veiculos' | 'condutores' | 'alocacoes' | 'empresas'>('rotas');
  const [carregando, setCarregando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  // Dados das listas
  const [rotas, setRotas] = useState<RotaTransporte[]>([]);
  const [veiculos, setVeiculos] = useState<VeiculoTransporte[]>([]);
  const [condutores, setCondutores] = useState<CondutorTransporte[]>([]);
  const [alocacoes, setAlocacoes] = useState<AlocacaoEstudante[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaTransporte[]>([]);
  const [matriculasDisponiveis, setMatriculasDisponiveis] = useState<any[]>([]);

  // Modais
  const [modalNovaRota, setModalNovaRota] = useState(false);
  const [modalNovaParada, setModalNovaParada] = useState(false);
  const [modalNovoVeiculo, setModalNovoVeiculo] = useState(false);
  const [modalNovaVistoria, setModalNovaVistoria] = useState(false);
  const [modalNovoCondutor, setModalNovoCondutor] = useState(false);
  const [modalNovaAlocacao, setModalNovaAlocacao] = useState(false);
  const [modalNovaEmpresa, setModalNovaEmpresa] = useState(false);
  const [modalAuditoriaCenso, setModalAuditoriaCenso] = useState(false);
  const [auditoriaCenso, setAuditoriaCenso] = useState<AuditoriaRegistro60 | null>(null);
  const [carregandoAuditoria, setCarregandoAuditoria] = useState(false);

  // Seleções para sub-modais
  const [rotaSelecionada, setRotaSelecionada] = useState<RotaTransporte | null>(null);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<VeiculoTransporte | null>(null);

  // Formulário Nova Rota
  const [formRota, setFormRota] = useState({
    codigo: '',
    nome: '',
    turno: 'matutino',
    tipo_rota: 'rural',
    academic_year: new Date().getFullYear(),
    quilometragem_estimada: '',
    km_paved: '',
    km_unpaved: '',
    horario_saida: '06:30',
    horario_chegada: '07:20',
    return_departure_time: '12:30',
    is_outsourced: false,
    company_id: '',
  });

  // Formulário Nova Parada
  const [formParada, setFormParada] = useState({
    ordem: 1,
    nome: '',
    referencia: '',
    horario_estimado: '06:45',
  });

  // Formulário Novo Veículo
  const [formVeiculo, setFormVeiculo] = useState({
    placa: '',
    renavam: '',
    chassis: '',
    marca_modelo: '',
    ano_fabricacao: new Date().getFullYear(),
    tipologia: 'microonibus',
    vehicle_type_inep: 2,
    tipo_propriedade: 'proprio',
    company_id: '',
    capacidade_passageiros: 22,
    is_exclusive_school_use: true,
    is_accessible_disability: false,
  });

  // Formulário Nova Vistoria
  const [formVistoria, setFormVistoria] = useState({
    numero_laudo: '',
    orgao_emissor: 'DETRAN',
    data_vistoria: new Date().toISOString().split('T')[0],
    data_validade: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    resultado: 'aprovado',
    observacoes: '',
  });

  // Formulário Novo Condutor
  const [formCondutor, setFormCondutor] = useState({
    pessoa_id: '',
    tipo_funcao: 'motorista',
    company_id: '',
    cnh_numero: '',
    cnh_categoria: 'D',
    cnh_validade: '',
    toxicological_exam_date: '',
    toxicological_expiration_date: '',
    curso_transporte_escolar: true,
    validade_curso: '',
  });

  // Formulário Nova Alocação (Registro 60 Censo / PNATE)
  const [formAlocacao, setFormAlocacao] = useState({
    enrollment_id: '',
    route_id: '',
    vehicle_id: '',
    stop_id: '',
    uses_rural_transport: true,
    public_transport_jurisdiction: 2, // 1: Estadual, 2: Municipal, 3: Compartilhado
    special_needs_transport: false,
    special_needs_notes: '',
    data_inicio: new Date().toISOString().split('T')[0],
  });

  // Formulário Nova Empresa Terceirizada
  const [formEmpresa, setFormEmpresa] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    contract_number: '',
    contract_start_date: '',
    contract_end_date: '',
    is_active: true,
    notes: '',
  });

  // Carregar dados da API
  const carregarDados = async () => {
    setCarregando(true);
    setErroMsg(null);
    try {
      const [resRotas, resVeiculos, resCondutores, resAlocacoes, resEmpresas] = await Promise.all([
        apiClient.get('/educa/transporte/rotas'),
        apiClient.get('/educa/transporte/veiculos'),
        apiClient.get('/educa/transporte/condutores'),
        apiClient.get('/educa/transporte/alocacoes'),
        apiClient.get('/educa/transporte/empresas'),
      ]);

      setRotas(resRotas.data?.data || []);
      setVeiculos(resVeiculos.data?.data || []);
      setCondutores(resCondutores.data?.data || []);
      setAlocacoes(resAlocacoes.data?.data || []);
      setEmpresas(resEmpresas.data?.data || []);

      // Buscar matrículas para o modal de alocação
      try {
        const resMat = await apiClient.get('/educa/secretaria/matriculas');
        setMatriculasDisponiveis(resMat.data?.data || []);
      } catch {
        // Silencioso se não houver permissão de matrícula
      }
    } catch (err: any) {
      setErroMsg(err?.response?.data?.message || 'Erro ao carregar dados de transporte escolar.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Handlers de criação
  const handleCriarRota = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/educa/transporte/rotas', {
        ...formRota,
        academic_year: Number(formRota.academic_year),
        quilometragem_estimada: formRota.quilometragem_estimada ? Number(formRota.quilometragem_estimada) : null,
        km_paved: formRota.km_paved ? Number(formRota.km_paved) : null,
        km_unpaved: formRota.km_unpaved ? Number(formRota.km_unpaved) : null,
        company_id: formRota.company_id || null,
        is_outsourced: Boolean(formRota.is_outsourced),
      });
      setSucessoMsg('Rota de transporte cadastrada com sucesso!');
      setModalNovaRota(false);
      setFormRota({
        codigo: '',
        nome: '',
        turno: 'matutino',
        tipo_rota: 'rural',
        academic_year: new Date().getFullYear(),
        quilometragem_estimada: '',
        km_paved: '',
        km_unpaved: '',
        horario_saida: '06:30',
        horario_chegada: '07:20',
        return_departure_time: '12:30',
        is_outsourced: false,
        company_id: '',
      });
      carregarDados();
    } catch (err: any) {
      setErroMsg(err?.response?.data?.message || 'Falha ao cadastrar rota de transporte.');
    }
  };

  const handleAdicionarParada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rotaSelecionada) return;
    try {
      await apiClient.post(`/educa/transporte/rotas/${rotaSelecionada.id}/paradas`, formParada);
      setSucessoMsg(`Ponto de parada adicionado à rota ${rotaSelecionada.codigo}!`);
      setModalNovaParada(false);
      setFormParada({ ordem: 1, nome: '', referencia: '', horario_estimado: '06:45' });
      carregarDados();
    } catch (err: any) {
      setErroMsg(err?.response?.data?.message || 'Falha ao adicionar parada à rota.');
    }
  };

  const handleCriarVeiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/educa/transporte/veiculos', {
        ...formVeiculo,
        ano_fabricacao: Number(formVeiculo.ano_fabricacao),
        capacidade_passageiros: Number(formVeiculo.capacidade_passageiros),
        vehicle_type_inep: Number(formVeiculo.vehicle_type_inep),
        company_id: formVeiculo.company_id || null,
        is_exclusive_school_use: Boolean(formVeiculo.is_exclusive_school_use),
        is_accessible_disability: Boolean(formVeiculo.is_accessible_disability),
      });
      setSucessoMsg('Veículo cadastrado na frota escolar com sucesso!');
      setModalNovoVeiculo(false);
      setFormVeiculo({
        placa: '',
        renavam: '',
        chassis: '',
        marca_modelo: '',
        ano_fabricacao: new Date().getFullYear(),
        tipologia: 'microonibus',
        vehicle_type_inep: 2,
        tipo_propriedade: 'proprio',
        company_id: '',
        capacidade_passageiros: 22,
        is_exclusive_school_use: true,
        is_accessible_disability: false,
      });
      carregarDados();
    } catch (err: any) {
      setErroMsg(err?.response?.data?.message || 'Falha ao cadastrar veículo na frota.');
    }
  };

  const handleRegistrarVistoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!veiculoSelecionado) return;
    try {
      await apiClient.post(`/educa/transporte/veiculos/${veiculoSelecionado.id}/vistorias`, formVistoria);
      setSucessoMsg(`Vistoria do DETRAN registrada para o veículo ${veiculoSelecionado.placa}!`);
      setModalNovaVistoria(false);
      setFormVistoria({
        numero_laudo: '',
        orgao_emissor: 'DETRAN',
        data_vistoria: new Date().toISOString().split('T')[0],
        data_validade: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        resultado: 'aprovado',
        observacoes: '',
      });
      carregarDados();
    } catch (err: any) {
      setErroMsg(err?.response?.data?.message || 'Falha ao registrar vistoria do veículo.');
    }
  };

  const handleCriarCondutor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/educa/transporte/condutores', {
        ...formCondutor,
        pessoa_id: Number(formCondutor.pessoa_id),
        company_id: formCondutor.company_id || null,
      });
      setSucessoMsg('Condutor credenciado com sucesso no transporte escolar!');
      setModalNovoCondutor(false);
      setFormCondutor({
        pessoa_id: '',
        tipo_funcao: 'motorista',
        company_id: '',
        cnh_numero: '',
        cnh_categoria: 'D',
        cnh_validade: '',
        toxicological_exam_date: '',
        toxicological_expiration_date: '',
        curso_transporte_escolar: true,
        validade_curso: '',
      });
      carregarDados();
    } catch (err: any) {
      setErroMsg(err?.response?.data?.message || 'Falha ao credenciar condutor.');
    }
  };

  const handleAlocarEstudante = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/educa/transporte/alocacoes', {
        ...formAlocacao,
        public_transport_jurisdiction: Number(formAlocacao.public_transport_jurisdiction),
        uses_rural_transport: Boolean(formAlocacao.uses_rural_transport),
        special_needs_transport: Boolean(formAlocacao.special_needs_transport),
      });
      setSucessoMsg('Estudante vinculado à rota e veículo de transporte!');
      setModalNovaAlocacao(false);
      setFormAlocacao({
        enrollment_id: '',
        route_id: '',
        vehicle_id: '',
        stop_id: '',
        uses_rural_transport: true,
        public_transport_jurisdiction: 2,
        special_needs_transport: false,
        special_needs_notes: '',
        data_inicio: new Date().toISOString().split('T')[0],
      });
      carregarDados();
    } catch (err: any) {
      setErroMsg(err?.response?.data?.message || 'Falha ao alocar estudante no transporte.');
    }
  };

  const handleCriarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/educa/transporte/empresas', formEmpresa);
      setSucessoMsg('Empresa prestadora de transporte cadastrada com sucesso!');
      setModalNovaEmpresa(false);
      setFormEmpresa({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        contract_number: '',
        contract_start_date: '',
        contract_end_date: '',
        is_active: true,
        notes: '',
      });
      carregarDados();
    } catch (err: any) {
      setErroMsg(err?.response?.data?.message || 'Falha ao cadastrar empresa de transporte.');
    }
  };

  const abrirAuditoriaCenso = async () => {
    setCarregandoAuditoria(true);
    setModalAuditoriaCenso(true);
    try {
      const res = await apiClient.get('/educa/transporte/censo/registro60');
      setAuditoriaCenso(res.data?.data || null);
    } catch (err: any) {
      setErroMsg(err?.response?.data?.message || 'Erro ao carregar auditoria do Registro 60 do Censo Escolar.');
    } finally {
      setCarregandoAuditoria(false);
    }
  };

  const handleEncerrarAlocacao = async (alocacaoId: string) => {
    try {
      await apiClient.post(`/educa/transporte/alocacoes/${alocacaoId}/encerrar`);
      setSucessoMsg('Alocação de transporte encerrada e vaga liberada no veículo.');
      carregarDados();
    } catch (err: any) {
      setErroMsg(err?.response?.data?.message || 'Falha ao encerrar alocação de transporte.');
    }
  };

  // Métricas calculadas
  const kpis = useMemo(() => {
    const totalRotasAtivas = rotas.filter((r) => r.ativo).length;
    const totalFrota = veiculos.length;
    const veiculosRegulares = veiculos.filter((v) => v.status === 'regular').length;
    const motoristasHabilitados = condutores.filter((c) => c.ativo && c.tipo_funcao === 'motorista').length;
    const totalAlunosAtendidos = alocacoes.filter((a) => a.status === 'ativa').length;
    const totalEmpresas = empresas.filter((emp) => emp.is_active).length;

    return {
      rotasAtivas: totalRotasAtivas,
      frotaRegular: `${veiculosRegulares}/${totalFrota}`,
      motoristas: motoristasHabilitados,
      alunos: totalAlunosAtendidos,
      empresas: totalEmpresas,
    };
  }, [rotas, veiculos, condutores, alocacoes, empresas]);

  // Filtros aplicados
  const rotasFiltradas = useMemo(() => {
    return rotas.filter((r) => {
      const matchBusca =
        busca === '' ||
        r.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        r.nome.toLowerCase().includes(busca.toLowerCase());
      const matchTurno = filtroTurno === 'todos' || r.turno === filtroTurno;
      const matchTipo = filtroTipo === 'todos' || r.tipo_rota === filtroTipo;
      return matchBusca && matchTurno && matchTipo;
    });
  }, [rotas, busca, filtroTurno, filtroTipo]);

  return (
    <div className="space-y-6">
      {/* Mensagens de Sucesso e Erro */}
      {sucessoMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
          <button onClick={() => setSucessoMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {erroMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{erroMsg}</span>
          </div>
          <button onClick={() => setErroMsg(null)} className="text-rose-700 hover:text-rose-900 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Cabeçalho do Módulo de Transporte */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg border border-gov-border">
        <div>
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-bold text-gov-text-primary">Transporte Escolar Municipal</h2>
            <Badge variant="outline" className="text-xs font-mono text-blue-700 border-blue-300 bg-blue-50">
              PNATE / FNDE
            </Badge>
          </div>
          <p className="text-xs text-gov-text-muted mt-1">
            Gestão de rotas rurais e urbanas, frotas, laudos do DETRAN, motoristas credenciados e alocação de estudantes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={abrirAuditoriaCenso}
            disabled={carregandoAuditoria}
            className="text-xs gap-1.5 h-8 border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50"
          >
            <ShieldCheck className={`w-3.5 h-3.5 text-blue-700 ${carregandoAuditoria ? 'animate-spin' : ''}`} />
            Auditoria Censo (Reg. 60)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={carregarDados}
            disabled={carregando}
            className="text-xs gap-1.5 h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>

          {tabAtiva === 'rotas' && (
            <Button
              size="sm"
              onClick={() => setModalNovaRota(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs gap-1.5 h-8 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Rota
            </Button>
          )}

          {tabAtiva === 'veiculos' && (
            <Button
              size="sm"
              onClick={() => setModalNovoVeiculo(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs gap-1.5 h-8 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Veículo
            </Button>
          )}

          {tabAtiva === 'condutores' && (
            <Button
              size="sm"
              onClick={() => setModalNovoCondutor(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs gap-1.5 h-8 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Credenciar Condutor
            </Button>
          )}

          {tabAtiva === 'alocacoes' && (
            <Button
              size="sm"
              onClick={() => setModalNovaAlocacao(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs gap-1.5 h-8 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Vincular Estudante
            </Button>
          )}

          {tabAtiva === 'empresas' && (
            <Button
              size="sm"
              onClick={() => setModalNovaEmpresa(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white text-xs gap-1.5 h-8 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Empresa
            </Button>
          )}
        </div>
      </div>

      {/* Painel de Indicadores (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          title="Rotas Ativas"
          value={kpis.rotasAtivas.toString()}
          subtitle="Itinerários em operação"
        />
        <KpiCard
          title="Frota Regular"
          value={kpis.frotaRegular}
          subtitle="Com vistoria DETRAN"
        />
        <KpiCard
          title="Motoristas"
          value={kpis.motoristas.toString()}
          subtitle="CNH D/E + Curso"
        />
        <KpiCard
          title="Alunos Atendidos"
          value={kpis.alunos.toString()}
          subtitle="Passageiros vinculados"
        />
        <KpiCard
          title="Empresas Terceirizadas"
          value={kpis.empresas.toString()}
          subtitle="Contratos vigentes"
        />
      </div>

      {/* Abas do Submódulo Transporte */}
      <Tabs value={tabAtiva} onValueChange={(val: any) => setTabAtiva(val)} className="w-full">
        <TabsList className="bg-gov-page p-1 border border-gov-border rounded-lg flex flex-wrap gap-1">
          <TabsTrigger value="rotas" className="text-xs gap-1.5 px-3 py-1.5">
            <Navigation className="w-3.5 h-3.5" />
            Rotas & Itinerários
            <span className="ml-1 text-[10px] font-mono tabular-nums px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full">
              {rotas.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="veiculos" className="text-xs gap-1.5 px-3 py-1.5">
            <Truck className="w-3.5 h-3.5" />
            Frota & Veículos
            <span className="ml-1 text-[10px] font-mono tabular-nums px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
              {veiculos.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="condutores" className="text-xs gap-1.5 px-3 py-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            Motoristas & Monitores
            <span className="ml-1 text-[10px] font-mono tabular-nums px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded-full">
              {condutores.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="alocacoes" className="text-xs gap-1.5 px-3 py-1.5">
            <User className="w-3.5 h-3.5" />
            Alunos Vinculados (PNATE)
            <span className="ml-1 text-[10px] font-mono tabular-nums px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full">
              {alocacoes.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="empresas" className="text-xs gap-1.5 px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Empresas & Contratos
            <span className="ml-1 text-[10px] font-mono tabular-nums px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full">
              {empresas.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA: ROTAS & ITINERÁRIOS */}
        <TabsContent value="rotas" className="mt-4 space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-gov-border">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
              <Input
                placeholder="Buscar por código ou nome da rota..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
            <div className="w-40">
              <select
                value={filtroTurno}
                onChange={(e) => setFiltroTurno(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="todos">Todos os Turnos</option>
                <option value="matutino">Matutino</option>
                <option value="vespertino">Vespertino</option>
                <option value="noturno">Noturno</option>
                <option value="integral">Integral</option>
              </select>
            </div>
            <div className="w-40">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="todos">Todas as Regiões</option>
                <option value="rural">Zona Rural</option>
                <option value="urbana">Zona Urbana</option>
                <option value="mista">Mista</option>
              </select>
            </div>
          </div>

          {/* Tabela de Rotas */}
          <Card className="border border-gov-border">
            <CardHeader className="py-3 px-4 border-b border-gov-border bg-gov-page">
              <CardTitle className="text-sm font-semibold text-gov-text-primary">
                Linhas e Trajetos Registrados
              </CardTitle>
              <CardDescription className="text-xs text-gov-text-muted">
                Rotas com pontos de embarque e escolas atendidas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {rotasFiltradas.length === 0 ? (
                <div className="p-8 text-center text-xs text-gov-text-muted">
                  Nenhuma rota de transporte escolar encontrada para os filtros selecionados.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Código</TableHead>
                      <TableHead>Nome da Rota</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead>Tipo / Região</TableHead>
                      <TableHead>Extensão</TableHead>
                      <TableHead>Horários</TableHead>
                      <TableHead>Paradas</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rotasFiltradas.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono font-bold text-xs text-blue-900 tabular-nums">
                          {r.codigo}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-gov-text-primary">{r.nome}</div>
                          {r.schools && r.schools.length > 0 && (
                            <div className="text-[11px] text-gov-text-muted flex items-center gap-1 mt-0.5">
                              <span className="text-blue-700 font-medium">Escolas atendidas:</span>
                              {r.schools.map((s) => s.nome).join(', ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-mono px-2 py-0.5 ${
                              r.turno === 'matutino'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : r.turno === 'vespertino'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-purple-50 text-purple-800 border-purple-300'
                            }`}
                          >
                            {r.turno}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-mono px-2 py-0.5 ${
                              r.tipo_rota === 'rural'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-slate-50 text-slate-800 border-slate-300'
                            }`}
                          >
                            {r.tipo_rota}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-gov-text-secondary">
                          {r.quilometragem_estimada ? `${r.quilometragem_estimada} km` : '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-gov-text-muted">
                          {r.horario_saida || '--:--'} → {r.horario_chegada || '--:--'}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {r.stops?.length || 0} pontos
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRotaSelecionada(r);
                              setFormParada({
                                ordem: (r.stops?.length || 0) + 1,
                                nome: '',
                                referencia: '',
                                horario_estimado: '07:00',
                              });
                              setModalNovaParada(true);
                            }}
                            className="h-7 text-xs px-2 text-blue-700 hover:text-blue-800"
                            title="Adicionar ponto de embarque/desembarque"
                          >
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            + Ponto
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. ABA: FROTA & VEÍCULOS */}
        <TabsContent value="veiculos" className="mt-4 space-y-4">
          <Card className="border border-gov-border">
            <CardHeader className="py-3 px-4 border-b border-gov-border bg-gov-page">
              <CardTitle className="text-sm font-semibold text-gov-text-primary">
                Frota de Transporte Escolar
              </CardTitle>
              <CardDescription className="text-xs text-gov-text-muted">
                Veículos próprios e terceirizados com controle de capacidade e laudos semestrais do DETRAN
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {veiculos.length === 0 ? (
                <div className="p-8 text-center text-xs text-gov-text-muted">
                  Nenhum veículo cadastrado na frota escolar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Placa</TableHead>
                      <TableHead>Veículo / Modelo</TableHead>
                      <TableHead>Tipologia</TableHead>
                      <TableHead>Propriedade</TableHead>
                      <TableHead>Capacidade / Ocupação</TableHead>
                      <TableHead>Vistoria DETRAN</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {veiculos.map((v) => {
                      const ocupacaoPct = Math.round((v.ocupacao_efetiva / (v.capacidade_passageiros || 1)) * 100);
                      const vistoria = v.latest_inspection;
                      const vistoriaValida =
                        vistoria &&
                        vistoria.resultado === 'aprovado' &&
                        new Date(vistoria.data_validade) >= new Date();

                      return (
                        <TableRow key={v.id}>
                          <TableCell className="font-mono font-bold text-xs text-blue-900 tabular-nums uppercase">
                            {v.placa}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-xs text-gov-text-primary">{v.marca_modelo}</div>
                            <div className="text-[11px] font-mono text-gov-text-muted tabular-nums">
                              Ano: {v.ano_fabricacao} {v.renavam && `| RENAVAM: ${v.renavam}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono px-2 py-0.5">
                              {v.tipologia}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-[11px] font-medium ${
                                v.tipo_propriedade === 'proprio' ? 'text-blue-700' : 'text-purple-700'
                              }`}
                            >
                              {v.tipo_propriedade === 'proprio' ? 'Própria' : 'Terceirizada'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs tabular-nums text-gov-text-primary">
                                <strong>{v.ocupacao_efetiva}</strong> / {v.capacidade_passageiros} lug.
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    ocupacaoPct > 90 ? 'bg-rose-500' : ocupacaoPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(ocupacaoPct, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {vistoria ? (
                              <div>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] uppercase font-mono px-2 py-0.5 ${
                                    vistoriaValida
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-rose-50 text-rose-800 border-rose-300'
                                  }`}
                                >
                                  {vistoriaValida ? 'Regular' : 'Vencida / Irregular'}
                                </Badge>
                                <div className="text-[10px] font-mono text-gov-text-muted tabular-nums mt-0.5">
                                  Val: {vistoria.data_validade}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-mono text-rose-700 bg-rose-50 border-rose-200">
                                Sem Vistoria
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-mono px-2 py-0.5 ${
                                v.status === 'regular'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              {v.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setVeiculoSelecionado(v);
                                setModalNovaVistoria(true);
                              }}
                              className="h-7 text-xs px-2 text-indigo-700 hover:text-indigo-800"
                              title="Registrar laudo de vistoria semestral do DETRAN"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                              Vistoria
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. ABA: MOTORISTAS & MONITORES */}
        <TabsContent value="condutores" className="mt-4 space-y-4">
          <Card className="border border-gov-border">
            <CardHeader className="py-3 px-4 border-b border-gov-border bg-gov-page">
              <CardTitle className="text-sm font-semibold text-gov-text-primary">
                Condutores e Monitores Credenciados
              </CardTitle>
              <CardDescription className="text-xs text-gov-text-muted">
                Cumprimento do Código de Trânsito Brasileiro (Art. 138: CNH D/E e curso especializado de escolares)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {condutores.length === 0 ? (
                <div className="p-8 text-center text-xs text-gov-text-muted">
                  Nenhum condutor ou monitor credenciado.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>CNH / Categoria</TableHead>
                      <TableHead>Validade CNH</TableHead>
                      <TableHead>Curso Transporte Escolar</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {condutores.map((c) => {
                      const cnhVencida = c.cnh_validade && new Date(c.cnh_validade) < new Date();

                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="font-semibold text-xs text-gov-text-primary">
                              {c.pessoa?.nome || `Pessoa ID #${c.pessoa_id}`}
                            </div>
                            {c.pessoa?.documento && (
                              <div className="text-[11px] font-mono text-gov-text-muted tabular-nums">
                                CPF: {c.pessoa.documento}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-mono px-2 py-0.5 ${
                                c.tipo_funcao === 'motorista'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-purple-50 text-purple-800 border-purple-300'
                              }`}
                            >
                              {c.tipo_funcao}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {c.cnh_numero ? (
                              <div className="font-mono text-xs tabular-nums text-gov-text-primary">
                                {c.cnh_numero} <strong className="text-blue-800 font-bold ml-1">[{c.cnh_categoria || 'D'}]</strong>
                              </div>
                            ) : (
                              <span className="text-xs text-gov-text-muted">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.cnh_validade ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs tabular-nums text-gov-text-secondary">
                                  {c.cnh_validade}
                                </span>
                                {cnhVencida && (
                                  <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-700 border-rose-300 font-mono">
                                    VENCIDA
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gov-text-muted">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.curso_transporte_escolar ? (
                              <div className="flex items-center gap-1 text-emerald-700 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aprovado</span>
                                {c.validade_curso && (
                                  <span className="font-mono text-[10px] text-gov-text-muted ml-1 tabular-nums">
                                    (Val: {c.validade_curso})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-rose-700 text-xs">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Pendente</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-mono px-2 py-0.5 ${
                                c.ativo
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-50 text-slate-800 border-slate-300'
                              }`}
                            >
                              {c.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. ABA: ALUNOS VINCULADOS (PNATE) */}
        <TabsContent value="alocacoes" className="mt-4 space-y-4">
          <Card className="border border-gov-border">
            <CardHeader className="py-3 px-4 border-b border-gov-border bg-gov-page">
              <CardTitle className="text-sm font-semibold text-gov-text-primary">
                Estudantes Vinculados ao Transporte Público
              </CardTitle>
              <CardDescription className="text-xs text-gov-text-muted">
                Registro oficial dos beneficiários para comprovação e repasse de verbas federais do PNATE / FNDE
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {alocacoes.length === 0 ? (
                <div className="p-8 text-center text-xs text-gov-text-muted">
                  Nenhum estudante alocado no transporte escolar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudante</TableHead>
                      <TableHead>Rota Alocada</TableHead>
                      <TableHead>Ponto de Embarque</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alocacoes.map((a) => {
                      const nomeAluno =
                        a.aluno_pessoa?.nome ||
                        a.enrollment?.aluno_pessoa?.nome ||
                        `Estudante #${a.aluno_pessoa_id}`;

                      return (
                        <TableRow key={a.id}>
                          <TableCell>
                            <div className="font-semibold text-xs text-gov-text-primary">{nomeAluno}</div>
                            {a.enrollment?.numero_matricula && (
                              <div className="text-[11px] font-mono text-gov-text-muted tabular-nums">
                                Mat: {a.enrollment.numero_matricula}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-mono font-bold text-xs text-blue-900 tabular-nums">
                              {a.route?.codigo || 'ROTA'}
                            </div>
                            <div className="text-[11px] text-gov-text-muted">{a.route?.nome}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-xs text-gov-text-primary">
                              {a.stop?.nome || 'Ponto Principal'}
                            </div>
                            {a.stop?.horario_estimado && (
                              <div className="text-[11px] font-mono text-gov-text-muted tabular-nums flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {a.stop.horario_estimado}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs tabular-nums text-gov-text-primary uppercase font-bold">
                              {a.vehicle?.placa || 'VEÍCULO'}
                            </div>
                            <div className="text-[11px] text-gov-text-muted">{a.vehicle?.marca_modelo}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs tabular-nums text-gov-text-secondary">
                            {a.data_inicio}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-mono px-2 py-0.5 ${
                                a.status === 'ativa'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-50 text-slate-800 border-slate-300'
                              }`}
                            >
                              {a.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {a.status === 'ativa' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEncerrarAlocacao(a.id)}
                                className="h-7 text-xs px-2 text-rose-700 hover:text-rose-800 hover:bg-rose-50"
                                title="Encerrar vínculo e liberar vaga no veículo"
                              >
                                Encerrar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. ABA: EMPRESAS & CONTRATOS TERCEIRIZADOS */}
        <TabsContent value="empresas" className="mt-4 space-y-4">
          <Card className="border border-gov-border">
            <CardHeader className="py-3 px-4 border-b border-gov-border bg-gov-page flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-gov-text-primary">
                  Empresas e Frotistas Terceirizados
                </CardTitle>
                <CardDescription className="text-xs text-gov-text-muted">
                  Contratos de prestação de serviço de transporte escolar via processo licitatório
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setModalNovaEmpresa(true)}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs gap-1.5 h-8 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Empresa
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {empresas.length === 0 ? (
                <div className="p-8 text-center text-xs text-gov-text-muted">
                  Nenhuma empresa terceirizada cadastrada. Clique em "Nova Empresa" para credenciar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa / Razão Social</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Contrato Administrativo</TableHead>
                      <TableHead>Vigência</TableHead>
                      <TableHead>Veículos</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empresas.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <div className="font-semibold text-xs text-gov-text-primary">
                            {emp.razao_social}
                          </div>
                          {emp.nome_fantasia && (
                            <div className="text-[11px] text-gov-text-muted">
                              {emp.nome_fantasia}
                            </div>
                          )}
                          {emp.notes && (
                            <div className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate">
                              {emp.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-gov-text-primary">
                          {emp.cnpj || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs tabular-nums text-purple-900 font-bold">
                            {emp.contract_number || 'Sem Contrato'}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-gov-text-secondary">
                          {emp.contract_start_date && emp.contract_end_date ? (
                            <span>
                              {emp.contract_start_date} até {emp.contract_end_date}
                            </span>
                          ) : (
                            'Indeterminado'
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs tabular-nums px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-md">
                            {emp.vehicles_count ?? 0} veículo(s)
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-mono px-2 py-0.5 ${
                              emp.is_active
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            {emp.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: NOVA ROTA */}
      <Modal open={modalNovaRota} onOpenChange={setModalNovaRota} title="Cadastrar Nova Rota de Transporte">
        <form onSubmit={handleCriarRota} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Código da Rota *</label>
              <Input
                required
                placeholder="Ex: ROTA-RURAL-03"
                value={formRota.codigo}
                onChange={(e) => setFormRota({ ...formRota, codigo: e.target.value.toUpperCase() })}
                className="text-xs font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Ano Letivo *</label>
              <Input
                type="number"
                required
                value={formRota.academic_year}
                onChange={(e) => setFormRota({ ...formRota, academic_year: Number(e.target.value) })}
                className="text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Turno de Operação *</label>
              <select
                value={formRota.turno}
                onChange={(e) => setFormRota({ ...formRota, turno: e.target.value as any })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="matutino">Matutino</option>
                <option value="vespertino">Vespertino</option>
                <option value="noturno">Noturno</option>
                <option value="integral">Integral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gov-text-primary">Nome / Descrição da Rota *</label>
            <Input
              required
              placeholder="Ex: Linha Fazenda Boa Esperança → Polo Municipal"
              value={formRota.nome}
              onChange={(e) => setFormRota({ ...formRota, nome: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Tipo de Região *</label>
              <select
                value={formRota.tipo_rota}
                onChange={(e) => setFormRota({ ...formRota, tipo_rota: e.target.value as any })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="rural">Zona Rural (PNATE)</option>
                <option value="urbana">Zona Urbana</option>
                <option value="mista">Mista</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Extensão Total (km)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: 35.5"
                value={formRota.quilometragem_estimada}
                onChange={(e) => setFormRota({ ...formRota, quilometragem_estimada: e.target.value })}
                className="text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Horário Saída / Retorno</label>
              <div className="grid grid-cols-2 gap-1">
                <Input
                  type="time"
                  value={formRota.horario_saida}
                  onChange={(e) => setFormRota({ ...formRota, horario_saida: e.target.value })}
                  className="text-xs font-mono"
                  title="Horário de Ida"
                />
                <Input
                  type="time"
                  value={formRota.return_departure_time}
                  onChange={(e) => setFormRota({ ...formRota, return_departure_time: e.target.value })}
                  className="text-xs font-mono"
                  title="Horário de Volta"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gov-page rounded-md border border-gov-border">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Km Asfalto / Pavimentado</label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: 15.0"
                value={formRota.km_paved}
                onChange={(e) => setFormRota({ ...formRota, km_paved: e.target.value })}
                className="text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Km Terra / Vicinal (PNATE)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: 20.5"
                value={formRota.km_unpaved}
                onChange={(e) => setFormRota({ ...formRota, km_unpaved: e.target.value })}
                className="text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_outsourced"
                checked={formRota.is_outsourced}
                onChange={(e) => setFormRota({ ...formRota, is_outsourced: e.target.checked })}
                className="h-4 w-4 rounded border-gov-border text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_outsourced" className="text-xs font-medium text-gov-text-primary">
                Operada por Empresa Terceirizada
              </label>
            </div>
            {formRota.is_outsourced && (
              <div>
                <select
                  value={formRota.company_id}
                  onChange={(e) => setFormRota({ ...formRota, company_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
                >
                  <option value="">Selecione a empresa prestadora...</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.razao_social} ({emp.contract_number || 'Sem Contrato'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gov-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalNovaRota(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-blue-700 hover:bg-blue-800 text-white">
              Salvar Rota
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADICIONAR PARADA NA ROTA */}
      <Modal
        open={modalNovaParada}
        onOpenChange={setModalNovaParada}
        title={`Adicionar Ponto de Parada - ${rotaSelecionada?.codigo || ''}`}
      >
        <form onSubmit={handleAdicionarParada} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Ordem na Linha *</label>
              <Input
                type="number"
                min="1"
                required
                value={formParada.ordem}
                onChange={(e) => setFormParada({ ...formParada, ordem: Number(e.target.value) })}
                className="text-xs font-mono tabular-nums"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gov-text-primary">Horário Estimado</label>
              <Input
                type="time"
                value={formParada.horario_estimado}
                onChange={(e) => setFormParada({ ...formParada, horario_estimado: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gov-text-primary">Nome do Ponto de Embarque *</label>
            <Input
              required
              placeholder="Ex: Trevo da Igreja São Pedro"
              value={formParada.nome}
              onChange={(e) => setFormParada({ ...formParada, nome: e.target.value })}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gov-text-primary">Ponto de Referência / Endereço</label>
            <Input
              placeholder="Ex: KM 14 da Estrada Vicinal, próximo ao armazém"
              value={formParada.referencia}
              onChange={(e) => setFormParada({ ...formParada, referencia: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gov-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalNovaParada(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-blue-700 hover:bg-blue-800 text-white">
              Salvar Ponto
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NOVO VEÍCULO */}
      <Modal open={modalNovoVeiculo} onOpenChange={setModalNovoVeiculo} title="Cadastrar Veículo na Frota Escolar">
        <form onSubmit={handleCriarVeiculo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Placa do Veículo *</label>
              <Input
                required
                maxLength={8}
                placeholder="Ex: BRA2E19"
                value={formVeiculo.placa}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, placa: e.target.value.toUpperCase() })}
                className="text-xs font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Código RENAVAM</label>
              <Input
                placeholder="Ex: 00987654321"
                value={formVeiculo.renavam}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, renavam: e.target.value })}
                className="text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Chassi</label>
              <Input
                placeholder="Ex: 9BM384077PB000123"
                value={formVeiculo.chassis}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, chassis: e.target.value.toUpperCase() })}
                className="text-xs font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gov-text-primary">Marca / Modelo *</label>
            <Input
              required
              placeholder="Ex: Mercedes-Benz / Marcopolo Volare V8 Escolar"
              value={formVeiculo.marca_modelo}
              onChange={(e) => setFormVeiculo({ ...formVeiculo, marca_modelo: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Tipologia *</label>
              <select
                value={formVeiculo.tipologia}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, tipologia: e.target.value as any })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="microonibus">Micro-ônibus</option>
                <option value="onibus">Ônibus</option>
                <option value="van">Van / Kombi</option>
                <option value="embarcacao">Embarcação / Barco</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Tipo Censo INEP *</label>
              <select
                value={formVeiculo.vehicle_type_inep}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, vehicle_type_inep: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value={1}>1 - Van</option>
                <option value={2}>2 - Micro-ônibus</option>
                <option value={3}>3 - Ônibus</option>
                <option value={4}>4 - Bicicleta</option>
                <option value={5}>5 - Tração Animal</option>
                <option value={6}>6 - Barco até 5</option>
                <option value={7}>7 - Barco 5 a 15</option>
                <option value={8}>8 - Barco 15 a 35</option>
                <option value={9}>9 - Barco mais de 35</option>
                <option value={10}>10 - Trem / Metrô</option>
                <option value={11}>11 - Outros</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Propriedade *</label>
              <select
                value={formVeiculo.tipo_propriedade}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, tipo_propriedade: e.target.value as any })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="proprio">Frota Própria Municipal</option>
                <option value="terceirizado">Terceirizado / Contrato</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Capacidade *</label>
              <Input
                type="number"
                min="1"
                required
                value={formVeiculo.capacidade_passageiros}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, capacidade_passageiros: Number(e.target.value) })}
                className="text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          {formVeiculo.tipo_propriedade === 'terceirizado' && (
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Empresa Terceirizada Prestadora *</label>
              <select
                value={formVeiculo.company_id}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, company_id: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="">Selecione a empresa frotista...</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.razao_social} - CNPJ {emp.cnpj || '—'} ({emp.contract_number || 'Sem contrato'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gov-page rounded-md border border-gov-border">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_exclusive_school_use"
                checked={formVeiculo.is_exclusive_school_use}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, is_exclusive_school_use: e.target.checked })}
                className="h-4 w-4 rounded border-gov-border text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_exclusive_school_use" className="text-xs font-medium text-gov-text-primary">
                Uso Exclusivo em Transporte Escolar (CTB)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_accessible_disability"
                checked={formVeiculo.is_accessible_disability}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, is_accessible_disability: e.target.checked })}
                className="h-4 w-4 rounded border-gov-border text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="is_accessible_disability" className="text-xs font-medium text-gov-text-primary">
                Acessível a Estudantes com Deficiência (PCD)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gov-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalNovoVeiculo(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-blue-700 hover:bg-blue-800 text-white">
              Cadastrar Veículo
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NOVA VISTORIA DETRAN */}
      <Modal
        open={modalNovaVistoria}
        onOpenChange={setModalNovaVistoria}
        title={`Registrar Vistoria DETRAN - Veículo ${veiculoSelecionado?.placa || ''}`}
      >
        <form onSubmit={handleRegistrarVistoria} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Número do Laudo / Termo *</label>
              <Input
                required
                placeholder="Ex: DETRAN-2026-VIST-099"
                value={formVistoria.numero_laudo}
                onChange={(e) => setFormVistoria({ ...formVistoria, numero_laudo: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Órgão Emissor</label>
              <Input
                value={formVistoria.orgao_emissor}
                onChange={(e) => setFormVistoria({ ...formVistoria, orgao_emissor: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Data da Vistoria *</label>
              <Input
                type="date"
                required
                value={formVistoria.data_vistoria}
                onChange={(e) => setFormVistoria({ ...formVistoria, data_vistoria: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Validade Semestral *</label>
              <Input
                type="date"
                required
                value={formVistoria.data_validade}
                onChange={(e) => setFormVistoria({ ...formVistoria, data_validade: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Resultado *</label>
              <select
                value={formVistoria.resultado}
                onChange={(e) => setFormVistoria({ ...formVistoria, resultado: e.target.value as any })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="aprovado">Aprovado</option>
                <option value="com_restricoes">Com Restrições</option>
                <option value="reprovado">Reprovado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gov-text-primary">Observações Técnicas</label>
            <Input
              placeholder="Ex: Tacógrafo selado, cintos de segurança em todos os assentos e extintor regular."
              value={formVistoria.observacoes}
              onChange={(e) => setFormVistoria({ ...formVistoria, observacoes: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gov-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalNovaVistoria(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-indigo-700 hover:bg-indigo-800 text-white">
              Salvar Laudo
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NOVO CONDUTOR */}
      <Modal open={modalNovoCondutor} onOpenChange={setModalNovoCondutor} title="Credenciar Motorista ou Monitor">
        <form onSubmit={handleCriarCondutor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">ID da Pessoa no MDM *</label>
              <Input
                type="number"
                required
                placeholder="Ex: 1"
                value={formCondutor.pessoa_id}
                onChange={(e) => setFormCondutor({ ...formCondutor, pessoa_id: e.target.value })}
                className="text-xs font-mono tabular-nums"
              />
              <span className="text-[10px] text-gov-text-muted">Cadastro Único de Pessoas do Município</span>
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Função no Transporte *</label>
              <select
                value={formCondutor.tipo_funcao}
                onChange={(e) => setFormCondutor({ ...formCondutor, tipo_funcao: e.target.value as any })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="motorista">Motorista Escolar</option>
                <option value="monitor">Monitor de Ônibus / Van</option>
              </select>
            </div>
          </div>

          {formCondutor.tipo_funcao === 'motorista' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gov-page rounded-md border border-gov-border">
              <div>
                <label className="text-xs font-medium text-gov-text-primary">Número da CNH *</label>
                <Input
                  required
                  placeholder="Ex: 12345678900"
                  value={formCondutor.cnh_numero}
                  onChange={(e) => setFormCondutor({ ...formCondutor, cnh_numero: e.target.value })}
                  className="text-xs font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gov-text-primary">Categoria CTB (D ou E) *</label>
                <select
                  value={formCondutor.cnh_categoria}
                  onChange={(e) => setFormCondutor({ ...formCondutor, cnh_categoria: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs font-mono font-bold text-gov-text-primary focus:outline-hidden"
                >
                  <option value="D">Categoria D</option>
                  <option value="E">Categoria E</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gov-text-primary">Validade da CNH *</label>
                <Input
                  type="date"
                  required
                  value={formCondutor.cnh_validade}
                  onChange={(e) => setFormCondutor({ ...formCondutor, cnh_validade: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Curso Especializado de Transporte Escolar</label>
              <select
                value={formCondutor.curso_transporte_escolar ? 'sim' : 'nao'}
                onChange={(e) => setFormCondutor({ ...formCondutor, curso_transporte_escolar: e.target.value === 'sim' })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="sim">Sim (Conforme Resolução CONTRAN)</option>
                <option value="nao">Não / Pendente</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Validade do Curso</label>
              <Input
                type="date"
                value={formCondutor.validade_curso}
                onChange={(e) => setFormCondutor({ ...formCondutor, validade_curso: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gov-page rounded-md border border-gov-border">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Data Exame Toxicológico (CTB Art. 148-A)</label>
              <Input
                type="date"
                value={formCondutor.toxicological_exam_date}
                onChange={(e) => setFormCondutor({ ...formCondutor, toxicological_exam_date: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Validade do Exame Toxicológico</label>
              <Input
                type="date"
                value={formCondutor.toxicological_expiration_date}
                onChange={(e) => setFormCondutor({ ...formCondutor, toxicological_expiration_date: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gov-text-primary">Empresa Terceirizada (Opcional)</label>
            <select
              value={formCondutor.company_id}
              onChange={(e) => setFormCondutor({ ...formCondutor, company_id: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
            >
              <option value="">Vínculo Direto / Servidor Público Municipal</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.razao_social} ({emp.contract_number || 'Sem contrato'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gov-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalNovoCondutor(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-blue-700 hover:bg-blue-800 text-white">
              Credenciar
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NOVA ALOCAÇÃO DE ESTUDANTE (CENSO REGISTRO 60 / PNATE) */}
      <Modal open={modalNovaAlocacao} onOpenChange={setModalNovaAlocacao} title="Vincular Estudante ao Transporte Escolar (Censo Registro 60)">
        <form onSubmit={handleAlocarEstudante} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gov-text-primary">Estudante Matriculado *</label>
            <select
              required
              value={formAlocacao.enrollment_id}
              onChange={(e) => setFormAlocacao({ ...formAlocacao, enrollment_id: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
            >
              <option value="">Selecione o estudante...</option>
              {matriculasDisponiveis.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.aluno_pessoa?.nome || `Aluno #${m.student_id}`} - Mat: {m.numero_matricula || m.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Rota de Transporte *</label>
              <select
                required
                value={formAlocacao.route_id}
                onChange={(e) => setFormAlocacao({ ...formAlocacao, route_id: e.target.value, stop_id: '' })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="">Selecione a rota...</option>
                {rotas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.codigo} - {r.nome} ({r.turno})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gov-text-primary">Veículo Designado *</label>
              <select
                required
                value={formAlocacao.vehicle_id}
                onChange={(e) => setFormAlocacao({ ...formAlocacao, vehicle_id: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="">Selecione o veículo...</option>
                {veiculos.map((v) => {
                  const vagasRestantes = v.capacidade_passageiros - v.ocupacao_efetiva;
                  return (
                    <option key={v.id} value={v.id} disabled={vagasRestantes <= 0 || v.status !== 'regular'}>
                      {v.placa} - {v.marca_modelo} ({vagasRestantes} vagas livres) {v.status !== 'regular' ? '[BLOQUEADO]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Ponto de Embarque *</label>
              <select
                required
                value={formAlocacao.stop_id}
                onChange={(e) => setFormAlocacao({ ...formAlocacao, stop_id: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="">Selecione o ponto...</option>
                {rotas
                  .find((r) => r.id === formAlocacao.route_id)
                  ?.stops?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.ordem}º - {s.nome} {s.horario_estimado ? `(${s.horario_estimado})` : ''}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gov-text-primary">Poder Público Responsável *</label>
              <select
                value={formAlocacao.public_transport_jurisdiction}
                onChange={(e) => setFormAlocacao({ ...formAlocacao, public_transport_jurisdiction: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value={1}>1 - Estadual</option>
                <option value={2}>2 - Municipal</option>
                <option value={3}>3 - Compartilhado (Regime Colaboração)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gov-text-primary">Data de Início *</label>
              <Input
                type="date"
                required
                value={formAlocacao.data_inicio}
                onChange={(e) => setFormAlocacao({ ...formAlocacao, data_inicio: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gov-page rounded-md border border-gov-border">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="uses_rural_transport"
                checked={formAlocacao.uses_rural_transport}
                onChange={(e) => setFormAlocacao({ ...formAlocacao, uses_rural_transport: e.target.checked })}
                className="h-4 w-4 rounded border-gov-border text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="uses_rural_transport" className="text-xs font-medium text-gov-text-primary">
                Reside em Zona Rural (Aporte PNATE/FNDE)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="special_needs_transport"
                checked={formAlocacao.special_needs_transport}
                onChange={(e) => setFormAlocacao({ ...formAlocacao, special_needs_transport: e.target.checked })}
                className="h-4 w-4 rounded border-gov-border text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="special_needs_transport" className="text-xs font-medium text-gov-text-primary">
                Atendimento Especial / Deficiência (PCD)
              </label>
            </div>
          </div>

          {formAlocacao.special_needs_transport && (
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Cuidados Especiais / Observações de Acessibilidade</label>
              <Input
                placeholder="Ex: Usuário de cadeira de rodas; necessita de elevador no veículo e monitor dedicado"
                value={formAlocacao.special_needs_notes}
                onChange={(e) => setFormAlocacao({ ...formAlocacao, special_needs_notes: e.target.value })}
                className="text-xs"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gov-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalNovaAlocacao(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-blue-700 hover:bg-blue-800 text-white">
              Vincular Estudante
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NOVA EMPRESA TERCEIRIZADA */}
      <Modal open={modalNovaEmpresa} onOpenChange={setModalNovaEmpresa} title="Credenciar Empresa / Frotista Terceirizado">
        <form onSubmit={handleCriarEmpresa} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Razão Social *</label>
              <Input
                required
                placeholder="Ex: Expresso Escolar Vale Dourado Ltda."
                value={formEmpresa.razao_social}
                onChange={(e) => setFormEmpresa({ ...formEmpresa, razao_social: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Nome Fantasia</label>
              <Input
                placeholder="Ex: Vale Dourado Transportes"
                value={formEmpresa.nome_fantasia}
                onChange={(e) => setFormEmpresa({ ...formEmpresa, nome_fantasia: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">CNPJ</label>
              <Input
                placeholder="Ex: 12.345.678/0001-90"
                value={formEmpresa.cnpj}
                onChange={(e) => setFormEmpresa({ ...formEmpresa, cnpj: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Número do Contrato Administrativo</label>
              <Input
                placeholder="Ex: CONTRATO-LIC-2026/088"
                value={formEmpresa.contract_number}
                onChange={(e) => setFormEmpresa({ ...formEmpresa, contract_number: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Início da Vigência</label>
              <Input
                type="date"
                value={formEmpresa.contract_start_date}
                onChange={(e) => setFormEmpresa({ ...formEmpresa, contract_start_date: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gov-text-primary">Fim da Vigência</label>
              <Input
                type="date"
                value={formEmpresa.contract_end_date}
                onChange={(e) => setFormEmpresa({ ...formEmpresa, contract_end_date: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gov-text-primary">Observações / Responsável Legal</label>
            <Input
              placeholder="Ex: Responsável técnico, telefone e e-mail de contato para plantão da frota"
              value={formEmpresa.notes}
              onChange={(e) => setFormEmpresa({ ...formEmpresa, notes: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gov-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalNovaEmpresa(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-purple-700 hover:bg-purple-800 text-white">
              Salvar Empresa
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: AUDITORIA REGISTRO 60 DO CENSO ESCOLAR / PNATE */}
      <Modal open={modalAuditoriaCenso} onOpenChange={setModalAuditoriaCenso} title="Auditoria Registro 60 (Censo Escolar / PNATE)">
        <div className="space-y-4">
          <p className="text-xs text-gov-text-muted">
            Indicadores canônicos do Censo Escolar (MEC/INEP) e conformidade de assentos conforme Art. 136 do CTB.
          </p>

          {carregandoAuditoria ? (
            <div className="p-8 text-center text-xs text-gov-text-muted">
              Auditando itinerários, laudos e alocações de alunos...
            </div>
          ) : auditoriaCenso ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-[10px] uppercase font-semibold text-amber-800">Alunos Zona Rural (PNATE)</div>
                  <div className="text-xl font-mono font-bold text-amber-950 tabular-nums">
                    {auditoriaCenso.total_zona_rural}
                  </div>
                  <div className="text-[10px] text-amber-700">Fator de rateio FNDE</div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-[10px] uppercase font-semibold text-blue-800">Alunos Zona Urbana</div>
                  <div className="text-xl font-mono font-bold text-blue-950 tabular-nums">
                    {auditoriaCenso.total_zona_urbana}
                  </div>
                  <div className="text-[10px] text-blue-700">Atendimento regular</div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-[10px] uppercase font-semibold text-emerald-800">Acessibilidade PCD</div>
                  <div className="text-xl font-mono font-bold text-emerald-950 tabular-nums">
                    {auditoriaCenso.total_atendimento_especial_pcd}
                  </div>
                  <div className="text-[10px] text-emerald-700">
                    {auditoriaCenso.total_veiculos_acessiveis_pcd} veículo(s) adaptados
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Rotas em Risco de Superlotação (CTB)</div>
                  <div className="text-[11px] text-slate-600">
                    Controle de capacidade de assentos e integridade física de alunos
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`font-mono text-xs tabular-nums px-2 py-1 ${
                    auditoriaCenso.rotas_superlotadas_ctb > 0
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {auditoriaCenso.rotas_superlotadas_ctb === 0 ? 'Nenhuma Infração' : `${auditoriaCenso.rotas_superlotadas_ctb} Rota(s) Irregular(es)`}
                </Badge>
              </div>

              {auditoriaCenso.inconsistencias.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gov-text-primary">Alertas e Inconsistências Detectadas:</div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {auditoriaCenso.inconsistencias.map((inc, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-md text-xs border flex items-start gap-2 ${
                          inc.tipo === 'erro'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">{inc.mensagem}</div>
                          {inc.detalhe && <div className="text-[11px] opacity-90 mt-0.5">{inc.detalhe}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-gov-border">
                <Button size="sm" onClick={() => setModalAuditoriaCenso(false)} className="bg-blue-700 hover:bg-blue-800 text-white">
                  Fechar Auditoria
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-rose-600">
              Não foi possível gerar a auditoria do Registro 60.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
