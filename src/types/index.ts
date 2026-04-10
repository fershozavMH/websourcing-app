export interface Machine {
  id: string;
  titulo: string;
  precio: number;
  año: number;
  uso?: number;
  uso_bomba?: number;
  uso_motor?: number;
  ubicacion: string;
  categoria_tarea: string;
  imagenes: string[];
  url: string;
  telefono_vendedor: string;
  pagina?: string;
  timestamp?: { seconds: number; nanoseconds: number } | Date;
}

export type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'year_desc';
