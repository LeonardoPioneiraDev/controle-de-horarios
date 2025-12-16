import { Controller, Query, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificacoesService } from '../services/notificacoes.service';
import { GetStreamDto, toCsvString } from '../dto/get-stream.dto';

@ApiTags('Controle de Horários - Stream')
@ApiBearerAuth()
@Controller('controle-horarios-events')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) { }

  @Sse('stream')
  @ApiOperation({ summary: 'Stream SSE de confirmações/atualizações de horários' })
  @ApiQuery({ name: 'data_referencia', required: false, description: 'YYYY-MM-DD ou DDMMYYYY' })
  @ApiQuery({ name: 'codigo_linha', required: false, description: 'Código da linha (ou CSV)' })
  @ApiQuery({ name: 'sentido_texto', required: false, description: 'IDA|VOLTA|CIRCULAR (ou CSV)' })
  @ApiQuery({ name: 'cod_servico_numero', required: false, description: 'Serviço (ou CSV)' })
  @ApiQuery({ name: 'since', required: false, description: 'ISO datetime para replay inicial' })
  stream(@Query() raw: any): Observable<MessageEvent> {
    const query: GetStreamDto = {
      data_referencia: toCsvString(raw?.data_referencia),
      codigo_linha: toCsvString(raw?.codigo_linha),
      sentido_texto: toCsvString(raw?.sentido_texto),
      cod_servico_numero: toCsvString(raw?.cod_servico_numero),
      local_destino_linha: toCsvString(raw?.local_destino_linha),
      local_origem_viagem: toCsvString(raw?.local_origem_viagem),
      setor_principal_linha: toCsvString(raw?.setor_principal_linha),
      since: typeof raw?.since === 'string' ? raw.since : toCsvString(raw?.since),
      token: typeof raw?.token === 'string' ? raw.token : toCsvString(raw?.token),
    };
    return this.notificacoesService.getStream(query);
  }
}
