
import { format as formatTz, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';

const SAO_PAULO_TZ = 'America/Sao_Paulo';

/**
 * Retorna a data e hora atual no fuso horário de São Paulo.
 * @returns {Date} Objeto Date representando o horário de São Paulo.
 */
export function nowInSaoPaulo(): Date {
  const nowUtc = new Date();
  return toZonedTime(nowUtc, SAO_PAULO_TZ);
}

/**
 * Formata uma data no fuso horário de São Paulo.
 * @param {Date | string | number} date - A data a ser formatada.
 * @param {string} formatString - O formato desejado (ex: 'yyyy-MM-dd HH:mm:ss').
 * @returns {string} A data formatada como string.
 */
export function formatInSaoPaulo(date: Date | string | number, formatString: string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  const zonedDate = toZonedTime(dateObj, SAO_PAULO_TZ);
  return formatTz(zonedDate, formatString, { timeZone: SAO_PAULO_TZ });
}

/**
 * Converte uma string de data ou um objeto Date para o fuso horário de São Paulo.
 * @param {Date | string} date - A data a ser convertida.
 * @returns {Date} Objeto Date ajustado para o fuso horário de São Paulo.
 */
export function toSaoPaulo(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return toZonedTime(dateObj, SAO_PAULO_TZ);
}

/**
 * Formata uma data para o formato usado nas queries do Oracle (YYYY-MM-DD).
 * Esta função não aplica conversão de fuso horário, apenas formatação.
 * @param {Date | string} date - A data a ser formatada.
 * @returns {string} A data formatada como 'yyyy-MM-dd'.
 */
export function formatDateForOracle(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Adiciona um dia para corrigir a diferença de fuso horário que pode ocorrer na conversão para string
    const correctedDate = new Date(dateObj.valueOf() + dateObj.getTimezoneOffset() * 60 * 1000);
    return format(correctedDate, 'yyyy-MM-dd');
}
