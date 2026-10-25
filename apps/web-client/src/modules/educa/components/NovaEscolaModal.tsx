import React, { useState } from 'react';
import { Modal, Input, Button, Badge } from '@sysgov/ui';
import { AlertCircle, Building2, CheckCircle2 } from 'lucide-react';
import { useEduca } from '../context/EducaContext';
import { apiClient } from '@/core/api/client';

interface NovaEscolaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSucesso?: (msg: string) => void;
}

export const NovaEscolaModal: React.FC<NovaEscolaModalProps> = ({
  open,
  onOpenChange,
  onSucesso,
}) => {
  const { recarregar, setEscolaAtivaId } = useEduca();

  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: '',
    sigla: '',
    codigo_inep: '',
    zona: 'urbana',
    situacao_funcionamento: 'em_atividade',
    dependencia_administrativa: 'municipal',
    regulamentada: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!form.nome.trim()) {
      setErro('Informe o nome oficial da escola.');
      return;
    }
    if (!form.sigla.trim()) {
      setErro('Informe a sigla da unidade escolar.');
      return;
    }

    setSalvando(true);
    try {
      const res = await apiClient.post('/educa/core/escolas', {
        nome: form.nome.trim(),
        sigla: form.sigla.trim().toUpperCase(),
        codigo_inep: form.codigo_inep.trim() || undefined,
        zona: form.zona,
        situacao_funcionamento: form.situacao_funcionamento,
        dependencia_administrativa: form.dependencia_administrativa,
        regulamentada: form.regulamentada,
      });

      const novaEscola = res.data?.data;
      const msg = `Escola "${form.nome}" cadastrada com sucesso no SYS-Educa!`;

      // Limpa formulário
      setForm({
        nome: '',
        sigla: '',
        codigo_inep: '',
        zona: 'urbana',
        situacao_funcionamento: 'em_atividade',
        dependencia_administrativa: 'municipal',
        regulamentada: true,
      });

      onOpenChange(false);
      await recarregar();

      if (novaEscola?.id) {
        setEscolaAtivaId(novaEscola.id);
      }

      if (onSucesso) {
        onSucesso(msg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao cadastrar a escola. Verifique os dados.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Cadastrar Nova Escola no SYS-Educa"
      description="Cadastre uma nova escola diretamente na rede municipal de ensino com integração automática ao organograma."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {erro && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-md text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gov-text-primary block mb-1">
            Nome Oficial da Escola *
          </label>
          <Input
            placeholder="Ex: Escola Municipal Professora Maria da Silva"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="text-xs h-9"
            required
            autoFocus
          />
          <span className="text-[11px] text-gov-text-muted mt-0.5 block">
            Nome que constará nos boletins, históricos e declarações oficiais.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gov-text-primary block mb-1">
              Sigla Oficial *
            </label>
            <Input
              placeholder="Ex: EMPMS"
              value={form.sigla}
              onChange={(e) => setForm({ ...form, sigla: e.target.value.toUpperCase() })}
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
              value={form.codigo_inep}
              onChange={(e) => setForm({ ...form, codigo_inep: e.target.value.replace(/\D/g, '') })}
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
              value={form.zona}
              onChange={(e) => setForm({ ...form, zona: e.target.value })}
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
              value={form.situacao_funcionamento}
              onChange={(e) => setForm({ ...form, situacao_funcionamento: e.target.value })}
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
              checked={form.regulamentada}
              onChange={(e) => setForm({ ...form, regulamentada: e.target.checked })}
              className="rounded border-gov-border text-blue-600 focus:ring-0"
            />
            <span>Unidade escolar regulamentada pelo Conselho Municipal de Educação (CME).</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gov-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={salvando}
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs gap-1.5"
          >
            {salvando ? 'Salvando...' : 'Cadastrar Escola'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
