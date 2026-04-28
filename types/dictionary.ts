export interface Word {
  id: number;
  old_turkish_word: string;
  old_turkish_origin: string;
  new_turkish_word: string;
  new_turkish_origin: string;
  definition: string;
  old_equivalents: string[];
  new_equivalents: string[];
  difficulty_level: number;
  word_unit: number | null;
  word_stage: number | null;
  isSaved?: boolean;
}

export interface Unit {
  unit_number: number;
  unit_name: string;
}

export interface Stage {
  unit_number: number;
  stage_number: number;
  stage_name: string;
}

export type OriginType =
  | "Turkish"
  | "Arabic"
  | "Persian"
  | "French"
  | "English"
  | "Latin"
  | "Italian"
  | "Greek"
  | "All";

export type DifficultyType = 0 | 1 | 2 | 3 | 4 | 5; // 0: All

export interface Filters {
  origin: OriginType;
  difficulty: DifficultyType;
  unit: number | null;
  stage: number | null;
  onlySaved: boolean;
}

// Sıralama için tipler
export type SortField =
  | "id"
  | "old_turkish_word"
  | "new_turkish_word"
  | "difficulty_level";
export type SortDirection = "asc" | "desc";

// JSON veri tipi
export interface WordData {
  words: Word[];
  units: Unit[];
  stages: Stage[];
}
