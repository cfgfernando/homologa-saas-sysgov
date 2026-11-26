import * as React from 'react';
import { Loader2, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select-primitive';

export interface SelectOption {
  value: string | number;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  value: string | number | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  className?: string;
  emptyText?: string;
  /** Mostra um campo de busca no topo da lista (ignora acentos e maiúsculas) — para listas longas. */
  searchable?: boolean;
  searchPlaceholder?: string;
}

const normalizar = (t: string): string => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Select "flat" (value/onChange/options[]) usado no painel do cliente.
 * Por baixo, usa o Select real do shadcn/ui (Radix — teclado/typeahead/ARIA
 * nativos) em vez do dropdown hand-rolled anterior (que já cuidava disso na
 * mão: mousedown fora, Esc, aria-expanded...).
 */
export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled,
  loading,
  label,
  className,
  emptyText = 'Nenhuma opção',
  searchable = false,
  searchPlaceholder = 'Digite para buscar...',
}) => {
  const selected = options.find((o) => String(o.value) === String(value));
  const [busca, setBusca] = React.useState('');
  const campoBusca = React.useRef<HTMLInputElement | null>(null);
  const termo = normalizar(busca.trim());
  const visiveis = searchable && termo ? options.filter((o) => normalizar(`${o.label} ${o.hint ?? ''}`).includes(termo)) : options;

  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground/70">
          {label}
        </label>
      )}
      <SelectPrimitive
        value={value !== null && value !== undefined ? String(value) : undefined}
        onValueChange={onChange}
        disabled={disabled || loading}
        onOpenChange={(aberto) => {
          if (!searchable) return;
          if (aberto) setTimeout(() => campoBusca.current?.focus(), 0);
          else setBusca('');
        }}
      >
        <SelectTrigger className="w-full">
          {loading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </span>
          ) : (
            <SelectValue placeholder={placeholder}>
              {selected && (
                <span className="flex items-center gap-2">
                  {selected.icon && <span className="shrink-0 text-primary">{selected.icon}</span>}
                  <span className="font-medium">{selected.label}</span>
                </span>
              )}
            </SelectValue>
          )}
        </SelectTrigger>
        <SelectContent>
          {searchable && options.length > 0 && (
            <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-1 border-b border-border bg-popover p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  ref={campoBusca}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  // O Radix usa as teclas para navegar/typeahead: aqui elas são do campo (exceto Esc e setas).
                  onKeyDown={(e) => { if (!['Escape', 'ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) e.stopPropagation(); }}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="h-8 w-full rounded-md border border-input bg-background pl-7 pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </div>
            </div>
          )}
          {visiveis.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-muted-foreground">{options.length === 0 ? emptyText : 'Nada encontrado'}</div>
          ) : (
            visiveis.map((opt) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                <span className="flex min-w-0 items-center gap-2">
                  {opt.icon && <span className="shrink-0 text-primary">{opt.icon}</span>}
                  <span className="truncate font-medium">{opt.label}</span>
                  {opt.hint && <span className="ml-1 truncate text-xs text-muted-foreground">{opt.hint}</span>}
                </span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </SelectPrimitive>
    </div>
  );
};

Select.displayName = 'Select';

export default Select;
