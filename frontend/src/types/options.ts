export interface Responsable {
  id: string;
  name: string;
}

export interface OptionItem {
  option: string;
  responsable: Responsable | null;
}

export interface OptionListResponse {
  success: boolean;
  options: OptionItem[];
  message?: string;
}

export interface Responsable {
  id: string;
  name: string;
}

export interface Option {
  id: string;
  option: string;
  responsable: Responsable | null;
}

export interface OptionsResponse {
  success: boolean;
  options: Option[];
}

export interface OptionResponse {
  success: boolean;
  data: Option;
  message?: string;
}

export interface CreateOptionData {
  nom: string;
}

export interface UpdateOptionData {
  nom: string;
}

export interface DeleteOptionResponse {
  success: boolean;
  message: string;
} 