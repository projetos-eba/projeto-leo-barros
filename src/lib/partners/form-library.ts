export type PartnerFormQuestionDraft = {
  helpText: string;
  options: string[];
  prompt: string;
  required: boolean;
  scaleMax?: number;
  scaleMin?: number;
  settings: Record<string, boolean | null | number | string>;
  type: "text_short" | "text_long" | "single_choice" | "multiple_choice" | "scale" | "number" | "date" | "boolean";
};

export type PartnerFormTemplate = {
  defaultMessage: string | null;
  description: string | null;
  id: string;
  questionCount: number;
  questions: PartnerFormQuestionDraft[];
  responseCount: number;
  sendCount: number;
  status: "active" | "archived" | "draft";
  title: string;
  updatedAt: string;
  version: number;
};
