import { apiClient } from '@/core/api/client';

/**
 * Baixa um documento oficial escolar em PDF de forma autenticada.
 */
export async function baixarDocumentoPdf(endpoint: string, nomeArquivo: string): Promise<void> {
  const response = await apiClient.get(endpoint, { responseType: 'blob' });
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

/**
 * Abre o PDF oficial escolar em uma nova aba do navegador para visualização/impressão imediata.
 */
export async function visualizarDocumentoPdf(endpoint: string): Promise<void> {
  const response = await apiClient.get(endpoint, { responseType: 'blob' });
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}
