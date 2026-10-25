import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Checkbox,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@sysgov/ui';
import {
  Calendar,
  BookOpen,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  School,
  Sparkles,
  MapPin,
  Check,
  Search,
} from 'lucide-react';
import { useEduca } from '../context/EducaContext';
import { LdbComplianceBadge } from '../components/LdbComplianceBadge';
import { apiClient } from '@/core/api/client';

interface TurmaResumo {
  id: string;
  codigo: string;
  nome: string;
  turno: string;
  serie_nome?: string;
  lotacao_maxima: number;
  lotacao_efetiva: number;
}

interface EscolaDetalhada {
  id: string;
  nome: string;
  sigla: string;
  codigo_inep?: string;
  zona?: string;
  situacao_funcionamento?: string;
  dependencia_administrativa?: string;
  regulamentada?: boolean;
}

export const CoreView: React.FC = () => {
  const { escolaAtiva, escolaAtivaId, setEscolaAtivaId, anoLetivoAtivo, anoLetivoObj, escolas, recarregar } = useEduca();

  // Estados de navegação interna
  const [abaInterna, setAbaInterna] = useState<'escolas' | 'turmas'>('escolas');
  const [turmas, setTurmas] = useState<TurmaResumo[]>([]);
  const [carregandoTurmas, setCarregandoTurmas] = useState<boolean>(false);
  const [diasApurados, setDiasApurados] = useState<number>(200);
  const [horasApuradas, setHorasApuradas] = useState<number>(800);
  const [buscaEscola, setBuscaEscola] = useState<string>('');

  // Estados do Modal de Cadastro de Escola
  const [modalNovaEscola, setModalNovaEscola] = useState<boolean>(false);
  const [salvandoEscola, setSalvandoEscola] = useState<boolean>(false);
  const [erroEscola, setErroEscola] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [formEscola, setFormEscola] = useState({
    nome: '',
    sigla: '',
    codigo_inep: '',
    zona: 'urbana',
    situacao_funcionamento: 'em_atividade',
    dependencia_administrativa: 'municipal',
    regulamentada: true,
  });

  // Estados do Modal de Nova Turma
  const [modalNovaTurma, setModalNovaTurma] = useState<boolean>(false);
  const [salvandoTurma, setSalvandoTurma] = useState<boolean>(false);
  const [erroTurma, setErroTurma] = useState<string | null>(null);
  const [formTurma, setFormTurma] = useState({
    nome: '',
    codigo: '',
    turno: 'matutino',
    lotacao_maxima: 30,
  });

  // Carrega turmas da escola ativa
  const carregarTurmas = () => {
    if (!escolaAtiva) return;

    setCarregandoTurmas(true);
    apiClient
      .get('/educa/core/turmas', {
        params: {
          school_id: escolaAtiva.id,
          academic_year_id: anoLetivoObj?.id || anoLetivoAtivo,
        },
      })
      .then((res) => {
        if (res.data?.data) {
          setTurmas(res.data.data);
        } else {
          setTurmas([]);
        }
      })
      .catch(() => {
        setTurmas([]);
      })
      .finally(() => setCarregandoTurmas(false));
  };

  useEffect(() => {
    carregarTurmas();

    // Busca conformidade LDB
    if (anoLetivoObj?.id) {
      apiClient
        .get(`/educa/core/anos-letivos/${anoLetivoObj.id}/conformidade-ldb`)
        .then((res) => {
          if (res.data) {
            setDiasApurados(res.data.total_dias_letivos ?? 200);
            setHorasApuradas(res.data.total_horas_anuais ?? 800);
          }
        })
        .catch(() => {
          setDiasApurados(200);
          setHorasApuradas(800);
        });
    } else {
      setDiasApurados(200);
      setHorasApuradas(800);
    }
  }, [escolaAtiva, anoLetivoAtivo, anoLetivoObj]);

  // Submissão do Cadastro de Escola
  const handleSalvarEscola = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroEscola(null);

    if (!formEscola.nome.trim()) {
      setErroEscola('Informe o nome oficial da escola.');
      return;
    }
    if (!formEscola.sigla.trim()) {
      setErroEscola('Informe a sigla da unidade escolar.');
      return;
    }

    setSalvandoEscola(true);
    try {
      const res = await apiClient.post('/educa/core/escolas', {
        nome: formEscola.nome.trim(),
        sigla: formEscola.sigla.trim().toUpperCase(),
        codigo_inep: formEscola.codigo_inep.trim() || undefined,
        zona: formEscola.zona,
        situacao_funcionamento: formEscola.situacao_funcionamento,
        dependencia_administrativa: formEscola.dependencia_administrativa,
        regulamentada: formEscola.regulamentada,
      });

      const novaEscola = res.data?.data;
      setSucessoMsg(`Escola "${formEscola.nome}" cadastrada com sucesso na rede municipal!`);
      setModalNovaEscola(false);
      setFormEscola({
        nome: '',
        sigla: '',
        codigo_inep: '',
        zona: 'urbana',
        situacao_funcionamento: 'em_atividade',
        dependencia_administrativa: 'municipal',
        regulamentada: true,
      });

      await recarregar();
      if (novaEscola?.id) {
        setEscolaAtivaId(novaEscola.id);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao cadastrar escola. Verifique os dados.';
      setErroEscola(msg);
    } finally {
      setSalvandoEscola(false);
    }
  };

  const escolasFiltradas = escolas.filter((esc) => {
    if (!buscaEscola) return true;
    const term = buscaEscola.toLowerCase();
    return (
      esc.nome.toLowerCase().includes(term) ||
      (esc.sigla && esc.sigla.toLowerCase().includes(term)) ||
      (esc.codigo_inep && esc.codigo_inep.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Mensagem de Sucesso Global */}
      {sucessoMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{sucessoMsg}</span>
          </div>
          <button onClick={() => setSucessoMsg(null)} className="text-emerald-600 font-bold hover:text-emerald-800">
            ×
          </button>
        </div>
      )}

      {/* Diagnóstico LDB e Indicadores do Ano Letivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LdbComplianceBadge diasApurados={diasApurados} horasApuradas={horasApuradas} />
        </div>

        <Card className="bg-white border-gov-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-gov-text-muted flex items-center justify-between">
              <span>Status do Ano Letivo</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-gov-text-primary">
                {anoLetivoAtivo}
              </span>
              <Badge
                variant="outline"
                className={`uppercase text-[11px] font-mono ${
                  anoLetivoObj?.status === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {anoLetivoObj?.status || 'Ativo'}
              </Badge>
            </div>
            <p className="text-xs text-gov-text-muted mt-2">
              Ciclo acadêmico com apuração centralizada de carga horária e dias de trabalho pedagógico.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navegação entre Gestão de Escolas e Turmas da Escola */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gov-border pb-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={abaInterna === 'escolas' ? 'default' : 'outline'}
            onClick={() => setAbaInterna('escolas')}
            className={`text-xs ${abaInterna === 'escolas' ? 'bg-blue-700 text-white' : ''}`}
          >
            <School className="w-3.5 h-3.5 mr-1.5" />
            Escolas da Rede Municipal ({escolas.length})
          </Button>

          <Button
            size="sm"
            variant={abaInterna === 'turmas' ? 'default' : 'outline'}
            onClick={() => setAbaInterna('turmas')}
            className={`text-xs ${abaInterna === 'turmas' ? 'bg-blue-700 text-white' : ''}`}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            Turmas da Unidade Ativa ({turmas.length})
          </Button>
        </div>

        {abaInterna === 'escolas' ? (
          <Button
            size="sm"
            onClick={() => setModalNovaEscola(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white gap-1.5 text-xs shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Nova Escola
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => setModalNovaTurma(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white gap-1.5 text-xs shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Turma
          </Button>
        )}
      </div>

      {/* ABA 1: RELAÇÃO DE ESCOLAS DA REDE MUNICIPAL */}
      {abaInterna === 'escolas' && (
        <Card className="bg-white border-gov-border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gov-border pb-4">
            <div>
              <CardTitle className="text-sm font-semibold text-gov-text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Unidades Escolares da Rede Municipal
              </CardTitle>
              <CardDescription className="text-xs text-gov-text-muted mt-0.5">
                Relação oficial de escolas integradas ao organograma municipal e registradas no MEC/INEP.
              </CardDescription>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
              <Input
                placeholder="Buscar por escola, sigla ou INEP..."
                value={buscaEscola}
                onChange={(e) => setBuscaEscola(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {escolasFiltradas.length === 0 ? (
              <div className="py-12 text-center text-xs text-gov-text-muted">
                <School className="w-8 h-8 text-gov-text-muted mx-auto mb-2 opacity-50" />
                {buscaEscola
                  ? 'Nenhuma escola localizada para o filtro informado.'
                  : 'Nenhuma escola cadastrada no município. Clique em "Cadastrar Nova Escola" acima.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Identificação da Escola</TableHead>
                    <TableHead className="text-xs w-28">Sigla</TableHead>
                    <TableHead className="text-xs w-32">Código INEP</TableHead>
                    <TableHead className="text-xs w-28">Localização</TableHead>
                    <TableHead className="text-xs w-32">Situação</TableHead>
                    <TableHead className="text-xs text-right w-36">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escolasFiltradas.map((esc) => {
                    const isAtiva = esc.id === escolaAtivaId;
                    return (
                      <TableRow key={esc.id} className={isAtiva ? 'bg-blue-50/50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="text-xs font-semibold text-gov-text-primary block">
                                {esc.nome}
                              </span>
                              {isAtiva && (
                                <span className="inline-flex items-center text-[10px] text-blue-700 font-medium">
                                  <Check className="w-3 h-3 mr-0.5" /> Escola em Foco no Sistema
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-gov-text-primary">
                          {esc.sigla || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-gov-text-secondary">
                          {esc.codigo_inep || 'Não informado'}
                        </TableCell>
                        <TableCell className="text-xs capitalize text-gov-text-secondary">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gov-text-muted" />
                            {esc.zona || 'Urbana'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border-emerald-300"
                          >
                            {esc.situacao_funcionamento === 'em_atividade' ? 'Em Atividade' : esc.situacao_funcionamento || 'Ativa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isAtiva ? (
                            <Badge className="bg-blue-700 text-white text-[10px]">
                              Selecionada
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEscolaAtivaId(esc.id)}
                              className="h-7 text-xs text-blue-700 hover:bg-blue-50 border-blue-200"
                            >
                              Selecionar
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
      )}

      {/* ABA 2: RELAÇÃO DE TURMAS DA ESCOLA ATIVA */}
      {abaInterna === 'turmas' && (
        <Card className="bg-white border-gov-border">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gov-border pb-4">
            <div>
              <CardTitle className="text-sm font-semibold text-gov-text-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Turmas Homologadas da Unidade Escolar
              </CardTitle>
              <CardDescription className="text-xs text-gov-text-muted mt-1">
                {escolaAtiva ? escolaAtiva.nome : 'Selecione uma escola'} • Ano Letivo {anoLetivoAtivo}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {carregandoTurmas ? (
              <div className="py-8 text-center text-xs text-gov-text-muted font-mono animate-pulse">
                Carregando turmas e lotações...
              </div>
            ) : turmas.length === 0 ? (
              <div className="py-8 text-center text-xs text-gov-text-muted">
                Nenhuma turma cadastrada para este ano letivo na unidade escolar ativa.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Nome da Turma</TableHead>
                    <TableHead className="text-xs">Turno</TableHead>
                    <TableHead className="text-xs">Lotação (Alunos / Vagas)</TableHead>
                    <TableHead className="text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turmas.map((t) => {
                    const vagasRestantes = Math.max(0, t.lotacao_maxima - t.lotacao_efetiva);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs font-semibold tabular-nums text-gov-text-primary">
                          {t.codigo}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-gov-text-primary">
                          {t.nome}
                        </TableCell>
                        <TableCell className="text-xs capitalize text-gov-text-secondary">
                          {t.turno}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold tabular-nums text-gov-text-primary">
                              {t.lotacao_efetiva} / {t.lotacao_maxima}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-mono px-1.5 py-0 ${
                                vagasRestantes === 0
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : vagasRestantes <= 2
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              }`}
                            >
                              {vagasRestantes === 0 ? 'Lotada' : `${vagasRestantes} vagas`}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-700 hover:text-blue-900">
                            Detalhes
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
      )}

      {/* MODAL: CADASTRAR NOVA ESCOLA NA REDE */}
      <Modal
        open={modalNovaEscola}
        onOpenChange={setModalNovaEscola}
        title="Cadastrar Nova Escola na Rede Municipal"
        description="A escola será cadastrada no organograma municipal e habilitada para gestão de anos letivos, turmas e matrículas."
      >
        <form onSubmit={handleSalvarEscola} className="space-y-4">
          {erroEscola && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erroEscola}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gov-text-primary block mb-1">
              Nome Oficial da Escola *
            </label>
            <Input
              placeholder="Ex: Escola Municipal Professora Maria da Silva"
              value={formEscola.nome}
              onChange={(e) => setFormEscola({ ...formEscola, nome: e.target.value })}
              className="text-xs h-9"
              required
            />
            <span className="text-[11px] text-gov-text-muted mt-0.5 block">
              Nome canônico que figurará em boletins, históricos e declarações oficiais.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gov-text-primary block mb-1">
                Sigla Oficial *
              </label>
              <Input
                placeholder="Ex: EMPMS"
                value={formEscola.sigla}
                onChange={(e) => setFormEscola({ ...formEscola, sigla: e.target.value.toUpperCase() })}
                className="text-xs h-9 uppercase font-mono"
                maxLength={20}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gov-text-primary block mb-1">
                Código INEP (MEC/Censo)
              </label>
              <Input
                placeholder="Ex: 41012345"
                value={formEscola.codigo_inep}
                onChange={(e) => setFormEscola({ ...formEscola, codigo_inep: e.target.value.replace(/\D/g, '') })}
                className="text-xs h-9 font-mono tabular-nums"
                maxLength={8}
              />
              <span className="text-[11px] text-gov-text-muted mt-0.5 block">
                8 dígitos numéricos atribuídos pelo INEP.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gov-text-primary block mb-1">
                Zona de Localização
              </label>
              <select
                value={formEscola.zona}
                onChange={(e) => setFormEscola({ ...formEscola, zona: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="urbana">Zona Urbana</option>
                <option value="rural">Zona Rural</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gov-text-primary block mb-1">
                Situação de Funcionamento
              </label>
              <select
                value={formEscola.situacao_funcionamento}
                onChange={(e) => setFormEscola({ ...formEscola, situacao_funcionamento: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
              >
                <option value="em_atividade">Em Atividade</option>
                <option value="paralisada">Paralisada</option>
                <option value="extinta">Extinta</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gov-text-primary">
              <input
                type="checkbox"
                checked={formEscola.regulamentada}
                onChange={(e) => setFormEscola({ ...formEscola, regulamentada: e.target.checked })}
                className="rounded border-gov-border text-blue-600 focus:ring-0"
              />
              <span>Unidade escolar devidamente regulamentada pelo Conselho Municipal de Educação (CME).</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gov-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalNovaEscola(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvandoEscola}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs gap-1.5"
            >
              {salvandoEscola ? 'Salvando...' : 'Cadastrar Escola'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
