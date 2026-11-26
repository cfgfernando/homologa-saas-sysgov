import React, { useEffect, useState } from 'react';
import { Vote } from 'lucide-react';
import { Button, Input, Modal, Select } from '@sysgov/ui';
import { erroApi } from '../../escola/api';
import { CARGOS_MUNICIPAIS, campanhaApi, type Campanha, type DadosCampanha } from '../api';
import { useFormValidationModal } from '@/lib/useFormValidationModal';

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const CARGOS = ['Presidente', 'Governador', 'Senador', 'Deputado Federal', 'Deputado Estadual', 'Prefeito', 'Vereador'];

const VAZIO: DadosCampanha = { nome: '', ano: new Date().getFullYear(), cargo: 'Deputado Estadual', uf: 'PR', codigo_ibge: null, meta_votos_global: 0, status: 'ativa' };

/** Cadastro e edição dos dados da campanha (nome, eleição, cargo, UF de atuação, meta global, status). */
export const CampanhaFormModal: React.FC<{ campanha: Campanha | 'nova' | null; onFechar: () => void; onSalva: (c: Campanha, nova: boolean) => Promise<void> | void }> = ({ campanha, onFechar, onSalva }) => {
  const [form, setForm] = useState<DadosCampanha>(VAZIO);
  const [atual, setAtual] = useState<Campanha | 'nova' | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const { modal: modalValidacao, validar, tratarErro } = useFormValidationModal();
  const [salvando, setSalvando] = useState(false);
  if (campanha !== atual) {
    setAtual(campanha);
    setForm(campanha && campanha !== 'nova' ? { nome: campanha.nome, ano: campanha.ano, cargo: campanha.cargo, uf: campanha.uf, codigo_ibge: campanha.codigo_ibge ?? null, meta_votos_global: campanha.meta_votos_global, status: campanha.status } : VAZIO);
    setErro(null);
  }
  const nova = campanha === 'nova';
  const municipal = CARGOS_MUNICIPAIS.includes(form.cargo);

  // Municípios da UF para Prefeito/Vereador (UF ainda não importada: o servidor começa a importação e a lista vem vazia).
  const [municipios, setMunicipios] = useState<{ codigo_ibge: number; nome: string }[] | null>(null);
  useEffect(() => {
    if (!municipal || campanha === null) return;
    let cancelado = false;
    setMunicipios(null);
    campanhaApi.municipiosDaUf(form.uf).then((m) => !cancelado && setMunicipios(m)).catch(() => !cancelado && setMunicipios([]));
    return () => { cancelado = true; };
  }, [municipal, form.uf, campanha]);

  const salvar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validar([['Nome da campanha', form.nome], ['Ano da eleição', form.ano], ...(municipal ? [['Município', form.codigo_ibge]] as [string, unknown][] : [])])) return;
    setSalvando(true);
    setErro(null);
    try {
      const salva = nova ? await campanhaApi.criarCampanha(form) : await campanhaApi.atualizarCampanha((campanha as Campanha).id, form);
      await onSalva(salva, nova);
    } catch (e) {
      if (!tratarErro(e)) setErro(erroApi(e).mensagem);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      open={campanha !== null}
      onClose={onFechar}
      title={nova ? 'Nova campanha' : 'Dados da campanha'}
      icon={<Vote className="h-5 w-5" />}
      size="lg"
      footer={<><Button variant="outline" onClick={onFechar} disabled={salvando}>Cancelar</Button><Button type="submit" form="form-campanha" isLoading={salvando}>Salvar</Button></>}
    >
      {modalValidacao}
      <form noValidate id="form-campanha" onSubmit={salvar} className="space-y-3">
        <Input label="Nome da campanha *" placeholder="Ex.: Deputado Estadual 2026" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={200} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Ano da eleição *" type="number" min={2000} max={2100} value={form.ano} onChange={(e) => setForm((f) => ({ ...f, ano: Number(e.target.value) }))} className="font-mono tabular-nums" />
          <Select label="Cargo" value={form.cargo} onChange={(v) => setForm((f) => ({ ...f, cargo: v }))} options={CARGOS.map((c) => ({ value: c, label: c }))} />
          <Select label="UF de atuação" value={form.uf} onChange={(v) => setForm((f) => ({ ...f, uf: v, codigo_ibge: null }))} options={UFS.map((u) => ({ value: u, label: u }))} />
        </div>
        {municipal && (
          <div className="space-y-1">
            <Select
              label="Município *"
              value={form.codigo_ibge ?? null}
              onChange={(v) => setForm((f) => ({ ...f, codigo_ibge: Number(v) }))}
              options={(municipios ?? []).map((m) => ({ value: m.codigo_ibge, label: m.nome }))}
              loading={municipios === null}
              placeholder="Escolha o município"
              searchable
              searchPlaceholder="Digite o nome do município"
              emptyText={`Os municípios de ${form.uf} estão sendo importados do IBGE. Tente de novo em alguns minutos.`}
            />
            <p className="text-xs text-muted-foreground">Campanha de {form.cargo.toLowerCase()}: o mapa mostra só este município, dividido por bairros.</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Meta global de votos" type="number" min={0} value={form.meta_votos_global ?? 0} onChange={(e) => setForm((f) => ({ ...f, meta_votos_global: Number(e.target.value) }))} className="font-mono tabular-nums" />
          {!nova && <Select label="Status" value={form.status ?? 'ativa'} onChange={(v) => setForm((f) => ({ ...f, status: v as DadosCampanha['status'] }))} options={[{ value: 'ativa', label: 'Ativa' }, { value: 'encerrada', label: 'Encerrada (só consulta)' }]} />}
        </div>
        {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
      </form>
    </Modal>
  );
};
