import React, { useEffect, useState } from 'react';
import { Banknote, Undo2 } from 'lucide-react';
import { Button, Input, Modal, Select, StatusChip, Textarea } from '@sysgov/ui';
import { erroApi } from '../../escola/api';
import { formatarCentavos, formatarData, paraCentavos } from '@/lib/formatacao';
import { passeioApi, type ExtratoPagamentos, type FormaPagamento, type Inscricao, type Pagamento } from '../api';
import { FORMAS_PAGAMENTO, OPCOES_FORMA_PAGAMENTO, SITUACAO_FINANCEIRA } from '../formato';

const hoje = (): string => new Date().toLocaleDateString('sv-SE');

interface Props {
  inscricao: Inscricao | null;
  podeRegistrar: boolean;
  onFechar: () => void;
  /** Chamado depois de registrar ou estornar, para atualizar lista e indicadores. */
  onAlterado: () => Promise<void>;
}

/**
 * Pagamentos de uma inscrição: extrato (com estornados), novo pagamento limitado ao saldo e estorno com motivo.
 * Valores sempre em centavos; o servidor recusa pagamento acima do saldo.
 */
export const PagamentosModal: React.FC<Props> = ({ inscricao, podeRegistrar, onFechar, onAlterado }) => {
  const [extrato, setExtrato] = useState<ExtratoPagamentos | null>(null);
  const [valor, setValor] = useState('');
  const [data, setData] = useState(hoje());
  const [forma, setForma] = useState<FormaPagamento>('pix');
  const [observacao, setObservacao] = useState('');
  const [estornar, setEstornar] = useState<Pagamento | null>(null);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async (id: number) => {
    const e = await passeioApi.pagamentos(id);
    setExtrato(e);
    setValor(e.saldo_centavos > 0 ? formatarCentavos(e.saldo_centavos).replace('R$ ', '') : '');
  };

  useEffect(() => {
    setExtrato(null);
    setErro(null);
    setEstornar(null);
    setObservacao('');
    setData(hoje());
    if (inscricao === null) return;
    carregar(inscricao.id).catch((e) => setErro(erroApi(e).mensagem));
  }, [inscricao]);

  const executar = async (acao: () => Promise<unknown>) => {
    if (inscricao === null) return;
    setEnviando(true);
    setErro(null);
    try {
      await acao();
      await carregar(inscricao.id);
      await onAlterado();
    } catch (e) {
      setErro(erroApi(e).mensagem);
    } finally {
      setEnviando(false);
    }
  };

  const registrar = () => {
    const centavos = paraCentavos(valor);
    if (centavos === null || centavos <= 0) {
      setErro('Informe o valor pago em reais (ex.: 45,00).');
      return;
    }
    void executar(async () => {
      await passeioApi.registrarPagamento(inscricao!.id, { valor_centavos: centavos, data_pagamento: data, forma_pagamento: forma, observacao: observacao.trim() || null });
      setObservacao('');
    });
  };

  const confirmarEstorno = () => {
    if (estornar === null || motivo.trim().length < 3) {
      setErro('Informe o motivo do estorno.');
      return;
    }
    void executar(async () => {
      await passeioApi.estornarPagamento(estornar.id, motivo.trim());
      setEstornar(null);
      setMotivo('');
    });
  };

  const situacao = extrato ? SITUACAO_FINANCEIRA[extrato.situacao_financeira] : null;
  const podePagar = podeRegistrar && extrato !== null && extrato.saldo_centavos > 0;

  return (
    <Modal
      open={inscricao !== null}
      onClose={onFechar}
      title={`Pagamentos — ${inscricao?.aluno?.nome ?? ''}`}
      icon={<Banknote className="h-5 w-5" />}
      size="lg"
      footer={<Button variant="outline" onClick={onFechar} disabled={enviando}>Fechar</Button>}
    >
      <div className="space-y-4">
        {extrato && situacao && (
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div><p className="text-muted-foreground">Devido</p><p className="font-mono tabular-nums">{formatarCentavos(extrato.devido_centavos)}</p></div>
            <div><p className="text-muted-foreground">Pago</p><p className="font-mono tabular-nums">{formatarCentavos(extrato.pago_centavos)}</p></div>
            <div><p className="text-muted-foreground">Saldo</p><p className="font-mono tabular-nums">{formatarCentavos(extrato.saldo_centavos)}</p></div>
            <div><p className="text-muted-foreground">Situação</p><StatusChip label={situacao.rotulo} variant={situacao.variante} /></div>
          </div>
        )}

        {extrato && (extrato.pagamentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
        ) : (
          <ul className="divide-y rounded-md border text-sm" aria-label="Pagamentos registrados">
            {extrato.pagamentos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div className={p.estornado_em ? 'text-muted-foreground line-through' : undefined}>
                  <span className="font-mono tabular-nums">{formatarData(p.data_pagamento)}</span>
                  {' · '}{FORMAS_PAGAMENTO[p.forma_pagamento]}{' · '}
                  <span className="font-mono tabular-nums">{formatarCentavos(p.valor_centavos)}</span>
                  {p.observacao && <span className="block text-xs">{p.observacao}</span>}
                </div>
                {p.estornado_em ? (
                  <StatusChip label={`Estornado: ${p.motivo_estorno ?? ''}`} variant="danger" />
                ) : podeRegistrar && (
                  <Button size="sm" variant="outline" leftIcon={<Undo2 className="h-3.5 w-3.5" />} onClick={() => { setEstornar(p); setMotivo(''); setErro(null); }} disabled={enviando}>Estornar</Button>
                )}
              </li>
            ))}
          </ul>
        ))}

        {estornar && (
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm">Estornar o pagamento de <strong className="font-mono tabular-nums">{formatarCentavos(estornar.valor_centavos)}</strong>? Ele continua no extrato, mas sai das somas.</p>
            <Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} aria-label="Motivo do estorno" placeholder="Motivo do estorno" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEstornar(null)} disabled={enviando}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={confirmarEstorno} isLoading={enviando}>Confirmar estorno</Button>
            </div>
          </div>
        )}

        {podePagar && !estornar && (
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Registrar pagamento</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input label="Valor (R$)" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className="font-mono tabular-nums" />
              <Input label="Data" type="date" value={data} max={hoje()} onChange={(e) => setData(e.target.value)} />
              <Select label="Forma" value={forma} onChange={(v) => setForma(v as FormaPagamento)} options={OPCOES_FORMA_PAGAMENTO} />
            </div>
            <Input label="Observação (opcional)" value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength={500} />
            <div className="flex justify-end">
              <Button onClick={registrar} isLoading={enviando} leftIcon={<Banknote className="h-4 w-4" />}>Registrar</Button>
            </div>
          </div>
        )}

        {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
      </div>
    </Modal>
  );
};
