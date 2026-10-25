import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  PessoaPicker,
  Input,
} from '@sysgov/ui';
import { UserCheck, UserPlus, ArrowRightLeft, FileText, CheckCircle2, AlertTriangle, AlertCircle, Printer, FileDown } from 'lucide-react';
import { useEduca } from '../context/EducaContext';
import { apiClient } from '@/core/api/client';
import { visualizarDocumentoPdf } from '../utils/documentos';

interface MatriculaItem {
  id: string;
  codigo_matricula: string;
  aluno_nome: string;
  aluno_cpf?: string;
  turma_nome?: string;
  turma_atual?: {
    turma_id: string;
    turma_nome: string;
  };
  aluno?: {
    documento?: string;
    cpf?: string;
  };
  status: string;
  data_matricula: string;
}

interface TurmaOpcao {
  id: string;
  nome: string;
  codigo: string;
  turno: string;
}

export const SecretariaView: React.FC = () => {
  const { escolaAtiva, anoLetivoAtivo, anoLetivoObj } = useEduca();
  const [matriculas, setMatriculas] = useState<MatriculaItem[]>([]);
  const [turmas, setTurmas] = useState<TurmaOpcao[]>([]);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [modalAberta, setModalAberta] = useState<boolean>(false);

  // Form State para Nova Matrícula
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string | number | null>(null);
  const [responsavelSelecionadoId, setResponsavelSelecionadoId] = useState<string | number | null>(null);
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<string>('');
  const [salvando, setSalvando] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erroMatricula, setErroMatricula] = useState<string | null>(null);

  const carregarMatriculas = () => {
    if (!escolaAtiva) return;
    setCarregando(true);
    apiClient
      .get('/educa/secretaria/matriculas', {
        params: {
          school_id: escolaAtiva.id,
          academic_year_id: anoLetivoObj?.id,
          ano: anoLetivoAtivo,
        },
      })
      .then((res) => {
        if (res.data?.data) {
          setMatriculas(res.data.data);
        }
      })
      .catch(() => {
        setMatriculas([]);
      })
      .finally(() => setCarregando(false));
  };

  const carregarTurmas = () => {
    if (!escolaAtiva) return;
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
        }
      })
      .catch(() => {
        setTurmas([]);
      });
  };

  useEffect(() => {
    carregarMatriculas();
    carregarTurmas();
  }, [escolaAtiva, anoLetivoAtivo, anoLetivoObj]);

  const handleSalvarMatricula = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMatricula(null);
    if (!alunoSelecionadoId || !escolaAtiva) {
      setErroMatricula('Selecione o estudante no cadastro de pessoas.');
      return;
    }

    setSalvando(true);
    try {
      await apiClient.post('/educa/secretaria/matriculas', {
        aluno_pessoa_id: alunoSelecionadoId,
        responsavel_pessoa_id: responsavelSelecionadoId,
        school_id: escolaAtiva.id,
        turma_id: turmaSelecionadaId || undefined,
        academic_year_id: anoLetivoObj?.id,
        ano: anoLetivoAtivo,
        data_matricula: new Date().toISOString().split('T')[0],
      });

      setMensagemSucesso('Matrícula homologada com sucesso e número oficial gerado!');
      setModalAberta(false);
      setAlunoSelecionadoId(null);
      setResponsavelSelecionadoId(null);
      setTurmaSelecionadaId('');
      carregarMatriculas();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao homologar matrícula. Verifique os dados.';
      setErroMatricula(msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      {mensagemSucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{mensagemSucesso}</span>
          </div>
          <button onClick={() => setMensagemSucesso(null)} className="text-emerald-600 font-bold hover:text-emerald-800">
            ×
          </button>
        </div>
      )}

      {/* Cabeçalho da Secretaria */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg border border-gov-border">
        <div>
          <h2 className="text-sm font-semibold text-gov-text-primary flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            Matrículas e Livro de Registro Escolar
          </h2>
          <p className="text-xs text-gov-text-muted mt-1">
            Gestão integrada ao Cadastro Único de Cidadãos (MDM Pessoas) e Registro Civil do MEC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setErroMatricula(null);
              setModalAberta(true);
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white gap-1.5 text-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Efetuar Matrícula
          </Button>
        </div>
      </div>

      {/* Listagem Oficial de Matrículas */}
      <Card className="bg-white border-gov-border">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gov-border pb-3">
          <CardTitle className="text-sm font-semibold text-gov-text-primary">
            Estudantes Matriculados — {escolaAtiva ? escolaAtiva.nome : 'Rede Municipal'} (Ano {anoLetivoAtivo})
          </CardTitle>
          <span className="text-xs font-mono tabular-nums text-gov-text-muted">
            Total: {matriculas.length} estudantes
          </span>
        </CardHeader>

        <CardContent className="pt-4">
          {carregando ? (
            <div className="py-8 text-center text-xs text-gov-text-muted font-mono animate-pulse">
              Carregando livro de matrículas...
            </div>
          ) : matriculas.length === 0 ? (
            <div className="py-8 text-center text-xs text-gov-text-muted">
              Nenhuma matrícula registrada para esta escola no ano letivo selecionado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Matrícula (Código)</TableHead>
                  <TableHead className="text-xs">Estudante (Pessoa MDM)</TableHead>
                  <TableHead className="text-xs">CPF</TableHead>
                  <TableHead className="text-xs">Turma</TableHead>
                  <TableHead className="text-xs">Data Matrícula</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Ações Oficiais</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriculas.map((m) => {
                  const turmaExibida = m.turma_atual?.turma_nome || m.turma_nome;
                  const cpfExibido = m.aluno?.documento || m.aluno?.cpf || m.aluno_cpf;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs font-semibold tabular-nums text-gov-text-primary">
                        {m.codigo_matricula}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-gov-text-primary">
                        {m.aluno_nome}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gov-text-muted tabular-nums">
                        {cpfExibido || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-gov-text-secondary">
                        {turmaExibida ? (
                          <span className="font-medium text-gov-text-primary">{turmaExibida}</span>
                        ) : (
                          <span className="text-amber-600 font-medium">Não enturmado</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gov-text-muted tabular-nums">
                        {m.data_matricula}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-mono px-1.5 py-0 ${
                            m.status === 'ativa'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-gray-50 text-gray-700 border-gray-300'
                          }`}
                        >
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1"
                            onClick={() => visualizarDocumentoPdf(`/educa/documentos/matriculas/${m.id}/boletim-pdf`)}
                            title="Visualizar Boletim Escolar"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Boletim
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                            onClick={() => visualizarDocumentoPdf(`/educa/documentos/matriculas/${m.id}/declaracao-matricula-pdf`)}
                            title="Emitir Declaração de Matrícula com QR Code"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Declaração
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-purple-700 hover:text-purple-900 flex items-center gap-1"
                            onClick={() => visualizarDocumentoPdf(`/educa/documentos/matriculas/${m.id}/ficha-individual-pdf`)}
                            title="Emitir Ficha Individual do Estudante"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                            Ficha
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Nova Matrícula com PessoaPicker e Turma */}
      <Modal
        open={modalAberta}
        onOpenChange={setModalAberta}
        title="Homologação de Nova Matrícula Escolar"
        description="Vincule o estudante e responsável legal cadastrados na base canônica de Pessoas do Município."
      >
        <form onSubmit={handleSalvarMatricula} className="space-y-4 pt-2">
          {erroMatricula && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erroMatricula}</span>
            </div>
          )}

          {/* Aluno - PessoaPicker */}
          <div>
            <label className="block text-xs font-semibold text-gov-text-primary mb-1">
              Estudante (Cadastro Único de Pessoas) *
            </label>
            <PessoaPicker
              value={alunoSelecionadoId ? Number(alunoSelecionadoId) : null}
              onChange={(pessoaId) => setAlunoSelecionadoId(pessoaId)}
              placeholder="Buscar estudante pelo nome ou CPF..."
            />
            <span className="text-[11px] text-gov-text-muted mt-0.5 block">
              Consumo canônico do MDM Pessoas sem duplicação de dados.
            </span>
          </div>

          {/* Responsável Legal - PessoaPicker */}
          <div>
            <label className="block text-xs font-semibold text-gov-text-primary mb-1">
              Responsável Legal / Pedagógico (Opcional)
            </label>
            <PessoaPicker
              value={responsavelSelecionadoId ? Number(responsavelSelecionadoId) : null}
              onChange={(pessoaId) => setResponsavelSelecionadoId(pessoaId)}
              placeholder="Buscar responsável pelo nome ou CPF..."
            />
          </div>

          {/* Seleção de Turma para Enturmação Imediata */}
          <div>
            <label className="block text-xs font-semibold text-gov-text-primary mb-1">
              Turma para Enturmação Imediata
            </label>
            <select
              value={turmaSelecionadaId}
              onChange={(e) => setTurmaSelecionadaId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-gov-border bg-white text-xs text-gov-text-primary focus:outline-hidden"
            >
              <option value="">Apenas matricular (enturmar posteriormente)</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.codigo}) — Turno: {t.turno}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gov-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalAberta(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando || !alunoSelecionadoId}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs"
            >
              {salvando ? 'Processando Matrícula...' : 'Confirmar e Homologar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
