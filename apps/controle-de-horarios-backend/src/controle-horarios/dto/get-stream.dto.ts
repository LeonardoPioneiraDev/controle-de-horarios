import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export const toCsvString = (value: unknown): string | undefined => {
  if (value === null || typeof value === 'undefined') return undefined;
  if (Array.isArray(value)) return value.map((v) => String(v)).join(',');
  const s = String(value).trim();
  return s;
};

export class GetStreamDto {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => toCsvString(value))
    data_referencia?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => toCsvString(value))
    codigo_linha?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => toCsvString(value))
    sentido_texto?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => toCsvString(value))
    cod_servico_numero?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => toCsvString(value))
    local_destino_linha?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => toCsvString(value))
    local_origem_viagem?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => toCsvString(value))
    setor_principal_linha?: string;

    @IsOptional()
    @IsString()
    since?: string;

    @IsOptional()
    @IsString()
    token?: string;

    @IsOptional()
    @IsString()
    viewer_email?: string;
}
