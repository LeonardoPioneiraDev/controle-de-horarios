import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Subject, Observable, interval, merge } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ChNotification } from '../entities/ch-notification.entity';
import { filter, map, tap } from 'rxjs/operators';
import { ControleHorario } from '../entities/controle-horario.entity';

type StreamEvent = {
  type: 'confirmado' | 'atualizado';
  data: any;
};

import { GetStreamDto } from '../dto/get-stream.dto';

@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);
  private readonly subject = new Subject<StreamEvent>();

  constructor(
    @InjectRepository(ChNotification)
    private readonly notificationsRepo: Repository<ChNotification>,
  ) { }

  getStream(params: GetStreamDto): Observable<MessageEvent> {
    // Normaliza data de referÃªncia: aceita 'YYYY-MM-DD' ou 'DDMMYYYY'
    const rawDate = (params.data_referencia || '').trim();
    const wantedDate = (() => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate;
      if (/^\d{8}$/.test(rawDate)) {
        const dd = rawDate.slice(0, 2);
        const mm = rawDate.slice(2, 4);
        const yyyy = rawDate.slice(4, 8);
        return `${yyyy}-${mm}-${dd}`;
      }
      return '';
    })();
    const normalizeDate = (v: unknown): string => {
      try {
        if (!v) return '';
        if (typeof v === 'string') {
          if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
          const d = new Date(v);
          return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
        }
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        return '';
      } catch {
        return '';
      }
    };
    const parseCsv = (s?: string): string[] => (s || '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
      .map(v => v.toUpperCase());

    const linhas = parseCsv(params.codigo_linha);
    const viewerEmail = String((params as any).viewer_email || '')
      .trim()
      .toLowerCase();
    const normalizeSentido = (s: string): string => {
      const up = (s || '').toUpperCase().trim();
      if (up.startsWith('IDA')) return 'IDA';
      if (up.startsWith('VOLTA')) return 'VOLTA';
      if (up === 'TODOS' || up === 'TODAS') return 'TODOS';
      return up;
    };
    const sentidosRaw = parseCsv(params.sentido_texto);
    const sentidos = sentidosRaw.map(normalizeSentido);
    const expandSubscriberSentidos = (arr: string[]): Set<string> => {
      const out = new Set<string>();
      for (const s of arr) {
        if (!s) continue;
        const n = normalizeSentido(s);
        if (n === 'TODOS') {
          // Representa todos os sentidos: deixe o set vazio para significar sem filtro
          return new Set<string>();
        }
        out.add(n);
        if (n === 'IDA') out.add('VOLTA');
        else if (n === 'VOLTA') out.add('IDA');
      }
      return out;
    };
    const sentidosAceitos = expandSubscriberSentidos(sentidos);
    const servicos = parseCsv(params.cod_servico_numero);
    const wantedDestino = (params.local_destino_linha || '').trim().toUpperCase();
    const wantedOrigem = (params.local_origem_viagem || '').trim().toUpperCase();
    const wantedSetor = (params.setor_principal_linha || '').trim().toUpperCase();
    try {
      this.logger.log(
        `[SSE] Nova conexÃ£o | data=${wantedDate || '(todas)'} | linhas=${
          linhas.join(',') || '(todas)'
        } | sentidos=${sentidos.join(',') || '(todos)'} | serviÃ§os=${
          servicos.join(',') || '(todos)'
        } | origem=${wantedOrigem || '(qualquer)'} | destino=${wantedDestino || '(qualquer)'} | setor=${
          wantedSetor || '(qualquer)'
        } | since=${params.since || '(sem)'} `,
      );
    } catch {}
    const event$ = this.subject.asObservable().pipe(
      filter((evt) => {
        try {
          const d = evt.data as any;
          const dateEv = normalizeDate(d?.data_referencia);
          if (wantedDate && dateEv !== wantedDate) return false;
          if (linhas.length > 0) {
            const linhaEv = String(d?.codigo_linha || '').toUpperCase();
            if (!linhas.includes(linhaEv)) return false;
          }
          if (sentidos.length > 0) {
            const sentEv = normalizeSentido(String(d?.sentido_texto || ''));
            // Se o assinante marcou 'TODOS' tratamos como sem filtro (sentidosAceitos size = 0)
            if (sentidosAceitos.size > 0 && !sentidosAceitos.has(sentEv)) return false;
          }
          if (servicos.length > 0) {
            const srvEv = String(d?.cod_servico_numero || '').toUpperCase();
            if (!servicos.includes(srvEv)) return false;
          }
          if (viewerEmail) {
            const editorEmailEv = String(d?.editado_por_email || '').trim().toLowerCase();
            if (editorEmailEv && editorEmailEv === viewerEmail) return false;
          }
          if (wantedDestino || wantedOrigem) {
            const destinoEv = String(d?.local_destino_linha || '').toUpperCase();
            const origemEv = String(d?.local_origem_viagem || '').toUpperCase();
            // Permite correspondÃªncia cruzada origem/destino para facilitar comunicaÃ§Ã£o entre sentidos opostos
            if (wantedDestino) {
              const matchDestino = destinoEv.includes(wantedDestino) || origemEv.includes(wantedDestino);
              if (!matchDestino) return false;
            }
            if (wantedOrigem) {
              const matchOrigem = origemEv.includes(wantedOrigem) || destinoEv.includes(wantedOrigem);
              if (!matchOrigem) return false;
            }
          }
          if (wantedSetor) {
            const setor = String(d?.setor_principal_linha || '').toUpperCase();
            if (!setor.includes(wantedSetor)) return false;
          }
          return true;
        } catch {
          return false;
        }
      }),
      map((evt) => ({ data: JSON.stringify(evt) } as MessageEvent)),
      tap((msg) => {
        try {
          const payload = JSON.parse(String((msg as any).data));
          const type = (msg as any).type || payload?.type;
          const id = payload?.data?.id ?? payload?.id ?? 'desconhecido';
          this.logger.log(`[SSE] Evento emitido | type=${type} | id=${id}`);
        } catch {}
      }),
    );

    // Keepalive ping a cada 25s para manter conexÃ£o ativa em proxies
    const ping$ = interval(25000).pipe(
      map(() => ({ data: JSON.stringify({ type: 'ping', data: { ts: Date.now() } }) } as MessageEvent))
    );

    // Replay inicial opcional (since)
    const replay$ = new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          const sinceStr = params.since as string | undefined;
          const sinceDate = sinceStr ? new Date(sinceStr) : null;
          const where: any = {};
          if (sinceDate && !isNaN(sinceDate.getTime())) {
            where.created_at = MoreThan(sinceDate);
          }
          if (wantedDate) where.data_referencia = wantedDate;
          this.logger.log(
            `[SSE][Replay] Iniciando | wantedDate=${wantedDate || '(todas)'} | since=${
              sinceDate ? sinceDate.toISOString() : '(sem)'
            }`,
          );
          const rows = await this.notificationsRepo.find({ where, order: { created_at: 'ASC' }, take: 500 });
          this.logger.log(`[SSE][Replay] Registros encontrados: ${rows.length}`);
          for (const r of rows) {
            const d: any = r;
            if (linhas.length && !linhas.includes(String(d.codigo_linha || '').toUpperCase())) continue;
            if (sentidos.length && !sentidos.includes(String(d.sentido_texto || '').toUpperCase())) continue;
            if (servicos.length && !servicos.includes(String(d.cod_servico_numero || '').toUpperCase())) continue;
            if (wantedDestino && !String(d.local_destino_linha || '').toUpperCase().includes(wantedDestino)) continue;
            if (wantedOrigem && !String(d.local_origem_viagem || '').toUpperCase().includes(wantedOrigem)) continue;
            if (wantedSetor && !String(d.setor_principal_linha || '').toUpperCase().includes(wantedSetor)) continue;
            // Suprime eventos do próprio autor no replay
            if (viewerEmail) {
              const author = String((d.editado_por_email || (d.payload && d.payload.editado_por_email) || '')).trim().toLowerCase();
              if (author && author === viewerEmail) continue;
            }
            const eventType = (d?.payload?.change_type as any) || 'confirmado';
            const payload = {
              type: eventType,
              data: {
                id: d.controle_horario_id || null,
                created_at: d.created_at,
                data_referencia: d.data_referencia,
                codigo_linha: d.codigo_linha,
                sentido_texto: d.sentido_texto,
                cod_servico_numero: d.cod_servico_numero,
                setor_principal_linha: d.setor_principal_linha,
                local_origem_viagem: d.local_origem_viagem,
                local_destino_linha: d.local_destino_linha,
                hor_saida: d.hor_saida,
                hor_saida_ajustada: d.hor_saida_ajustada,
                hor_chegada: d.hor_chegada,
                hor_chegada_ajustada: d.hor_chegada_ajustada,
                de_acordo: d.de_acordo,
                de_acordo_em: d.de_acordo_em,
                prefixo_veiculo: d.prefixo_veiculo,
                nome_motorista: d.nome_motorista,
                cracha_motorista: d.cracha_motorista,
                editado_por_email: (d as any).editado_por_email || null,
              },
            };
            subscriber.next({ data: JSON.stringify(payload) } as MessageEvent);
          }
          this.logger.log(`[SSE][Replay] Finalizado.`);
        } catch (e) {
          this.logger.warn(`Falha no replay SSE: ${(e as any)?.message}`);
        } finally {
          subscriber.complete();
        }
      })();
    });

    return merge(ping$, replay$, event$);
  }

  async emitirConfirmacao(rec: ControleHorario, before?: Partial<ControleHorario>) {
    try {
      const wasConfirmed = before?.de_acordo === true;
      const isConfirmed = rec.de_acordo === true;

      // Caso 1: Acabou de ser confirmado (de_acordo false/null -> true)
      const turnedTrue = isConfirmed && !wasConfirmed;

      // Caso 2: JÃ¡ estava confirmado e houve alteraÃ§Ã£o relevante
      const updatedWhileConfirmed = isConfirmed && wasConfirmed && this.hasRelevantChanges(rec, before);

      if (!turnedTrue && !updatedWhileConfirmed) {
        this.logger.log(
          `[SSE] Sem emissÃ£o | id=${rec.id} | wasConfirmed=${wasConfirmed} | isConfirmed=${isConfirmed} | turnedTrue=${turnedTrue} | updatedWhileConfirmed=${updatedWhileConfirmed}`,
        );
        return;
      }

      const type = turnedTrue ? 'confirmado' : 'atualizado';
      this.logger.log(
        `[SSE] Preparando emissÃ£o | id=${rec.id} | type=${type} | linha=${rec.codigo_linha} | sentido=${rec.sentido_texto} | servico=${rec.cod_servico_numero}`,
      );

      const payload = {
        id: rec.id,
        created_at: new Date(),
        data_referencia: rec.data_referencia,
        codigo_linha: rec.codigo_linha,
        sentido_texto: rec.sentido_texto,
        flg_sentido: rec.flg_sentido,
        cod_servico_numero: rec.cod_servico_numero,
        setor_principal_linha: (rec as any).setor_principal_linha,
        local_origem_viagem: rec.local_origem_viagem,
        local_destino_linha: rec.local_destino_linha,
        hor_saida: rec.hor_saida,
        hor_saida_ajustada: rec.hor_saida_ajustada,
        hor_chegada: rec.hor_chegada,
        hor_chegada_ajustada: rec.hor_chegada_ajustada,
        prefixo_veiculo: rec.prefixo_veiculo,
        nome_motorista: rec.nome_motorista,
        cracha_motorista: rec.cracha_motorista,
        de_acordo: rec.de_acordo,
        de_acordo_em: rec.de_acordo_em,
        editado_por_email: (rec as any).editado_por_email || null,
        change_type: type, // Para o frontend saber diferenciar se necessÃ¡rio
      };

      // Persistir notificaÃ§Ã£o para replay
      try {
        const row = this.notificationsRepo.create({
          data_referencia: new Date(payload.data_referencia as any),
          codigo_linha: payload.codigo_linha || null,
          sentido_texto: payload.sentido_texto || null,
          cod_servico_numero: payload.cod_servico_numero || null,
          setor_principal_linha: payload.setor_principal_linha || null,
          local_origem_viagem: payload.local_origem_viagem || null,
          local_destino_linha: payload.local_destino_linha || null,
          hor_saida: payload.hor_saida || null,
          hor_saida_ajustada: payload.hor_saida_ajustada || null,
          hor_chegada: payload.hor_chegada || null,
          hor_chegada_ajustada: payload.hor_chegada_ajustada || null,
          de_acordo: true,
          de_acordo_em: payload.de_acordo_em || null,
          controle_horario_id: payload.id || null,
          cracha_motorista: payload.cracha_motorista || null,
          nome_motorista: payload.nome_motorista || null,
          prefixo_veiculo: payload.prefixo_veiculo || null,
          payload: payload as any,
        });
        const saved = await this.notificationsRepo.save(row);
        this.logger.log(`[SSE] NotificaÃ§Ã£o persistida | rowId=${saved.id} | ctrlId=${payload.id}`);
      } catch (e) {
        this.logger.warn(`Falha ao persistir notificaÃ§Ã£o: ${(e as any)?.message}`);
      }
      this.subject.next({ type: type as any, data: payload });
      this.logger.log(`[SSE] Evento publicado | type=${type} | id=${payload.id}`);
    } catch (e: any) {
      this.logger.warn(`Falha ao emitir confirmaÃ§Ã£o SSE: ${e?.message}`);
    }
  }

  private hasRelevantChanges(rec: ControleHorario, before?: Partial<ControleHorario>): boolean {
    if (!before) return true;
    const keys: (keyof ControleHorario)[] = [
      'prefixo_veiculo',
      'cod_motorista',
      'nome_motorista',
      'hor_saida_ajustada',
      'hor_chegada_ajustada',
      'cod_servico_numero'
    ];
    for (const k of keys) {
      if (rec[k] !== before[k]) return true;
    }
    return false;
  }
}


