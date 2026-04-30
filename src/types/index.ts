// Opciones de ordenamiento para tu catálogo
export type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'year_desc';

// El contrato oficial de lo que es una "Máquina" en toda tu aplicación
export interface Machine {
  id: string;
  titulo: string;
  categoria_tarea: string;
  origen_tarea: string;
  pagina: string;
  url: string;
  imagenes: string[];
  precio: number;
  año: number;
  
  // --- VARIABLES DE DESGASTE ---
  uso?: number;         // Opcional: Compatibilidad con equipo viejo/amarillo
  uso_millas?: number;  // NUEVO: Distancia en camiones
  uso_horas?: number;   // NUEVO: Desgaste de motor en camiones/maquinaria
  
  ubicacion: string;
  telefono_vendedor: string;
  
  // Propiedades opcionales (las traen las Bombas de Concreto)
  uso_bomba?: number;
  uso_motor?: number;
  tipo_pluma?: string;

  // --- NUEVOS CAMPOS TÉCNICOS (Opcionales con "?" porque FB no los tiene) ---
  motor?: string;
  transmision?: string;
  capacidad?: string;
  marca_pluma?: string;
  marca_camion?: string;
  modelo?: string;
  traccion_camion?: string;
  ejes_traseros?: string;
  
  // Otros campos que podrías usar en el futuro
  es_subasta?: boolean;
  timestamp?: any; 

  tiene_cabina?: boolean;
  tiene_martillo?: boolean;
  tiene_extension?: boolean;
  es_4x4?: boolean;
  tiene_almeja?: boolean;
  tiene_ripper?: boolean;
}