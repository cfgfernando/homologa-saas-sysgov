import React, { useState } from 'react';
import { Button, Badge } from '@sysgov/ui';
import { GraduationCap, Building2, Calendar, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
import { useEduca } from '../context/EducaContext';
import { NovaEscolaModal } from './NovaEscolaModal';

export const EducaHeader: React.FC = () => {
  const {
    escolaAtivaId,
    setEscolaAtivaId,
    escolaAtiva,
    anoLetivoAtivo,
    setAnoLetivoAtivo,
    anoLetivoObj,
    escolas,
    anosLetivos,
    carregando,
    recarregar,
  } = useEduca();

  const [modalNovaEscola, setModalNovaEscola] = useState<boolean>(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  return (
    <>
      {sucessoMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md mb-4 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{sucessoMsg}</span>
          </div>
          <button onClick={() => setSucessoMsg(null)} className="text-emerald-600 font-bold hover:text-emerald-800">
            ×
          </button>
        </div>
      )}

      <header className="bg-white border-b border-gov-border px-6 py-4 mb-6 rounded-lg shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Identificação e Título */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gov-text-primary tracking-tight">
                  SYS-Educa — Gestão Escolar Integrada
                </h1>
                <Badge variant="outline" className="font-mono text-xs text-blue-700 bg-blue-50 border-blue-200">
                  MUNICIPAL
                </Badge>
              </div>
              <p className="text-xs text-gov-text-muted mt-0.5">
                Administração de Ensino, Matrículas, Diário Pedagógico e Conformidade Legal
              </p>
            </div>
          </div>

          {/* Seletores de Contexto Global */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Seletor de Escola */}
            <div className="flex items-center gap-2 bg-gov-page px-3 py-1.5 rounded-md border border-gov-border">
              <Building2 className="w-4 h-4 text-gov-text-muted" />
              <span className="text-xs font-medium text-gov-text-muted">Escola:</span>
              <select
                value={escolaAtivaId || ''}
                onChange={(e) => setEscolaAtivaId(e.target.value || null)}
                className="bg-transparent text-xs font-semibold text-gov-text-primary focus:outline-hidden cursor-pointer max-w-[200px] truncate"
              >
                {escolas.length === 0 ? (
                  <option value="">Nenhuma escola</option>
                ) : (
                  escolas.map((esc) => (
                    <option key={esc.id} value={esc.id}>
                      {esc.sigla || esc.nome}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Botão Cadastrar Nova Escola */}
            <Button
              size="sm"
              onClick={() => setModalNovaEscola(true)}
              className="h-8 px-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs gap-1 shadow-xs"
              title="Cadastrar Nova Escola no SYS-Educa"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Escola</span>
            </Button>

            {/* Seletor de Ano Letivo */}
            <div className="flex items-center gap-2 bg-gov-page px-3 py-1.5 rounded-md border border-gov-border">
              <Calendar className="w-4 h-4 text-gov-text-muted" />
              <span className="text-xs font-medium text-gov-text-muted">Ano:</span>
              <select
                value={anoLetivoAtivo}
                onChange={(e) => setAnoLetivoAtivo(Number(e.target.value))}
                className="bg-transparent text-xs font-mono font-semibold text-gov-text-primary focus:outline-hidden cursor-pointer tabular-nums"
              >
                {anosLetivos.length === 0 ? (
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                ) : (
                  anosLetivos.map((ano) => (
                    <option key={ano.id} value={ano.ano}>
                      {ano.ano}
                    </option>
                  ))
                )}
              </select>
              {anoLetivoObj && (
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-mono px-1.5 py-0 ${
                    anoLetivoObj.status === 'active'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                      : 'text-amber-700 bg-amber-50 border-amber-300'
                  }`}
                >
                  {anoLetivoObj.status}
                </Badge>
              )}
            </div>

            {/* Botão de Atualizar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => recarregar()}
              disabled={carregando}
              className="flex items-center gap-1.5 text-xs text-gov-text-secondary h-8 px-2.5"
              title="Sincronizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Modal Global de Cadastro de Escola */}
      <NovaEscolaModal
        open={modalNovaEscola}
        onOpenChange={setModalNovaEscola}
        onSucesso={(msg) => {
          setSucessoMsg(msg);
          setTimeout(() => setSucessoMsg(null), 5000);
        }}
      />
    </>
  );
};
