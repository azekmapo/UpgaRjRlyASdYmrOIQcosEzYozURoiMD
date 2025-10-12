import { optionService } from "@/services/api";
import type { OptionListResponse } from "@/types/options";


export const fetchOptions = async (): Promise<OptionListResponse> => {
  try {
    const response = await optionService.getOptions();
    return response;
  } catch (error) {
    console.log(error);
    throw new Error('Erreur lors de la récupération des options', );
  }
};