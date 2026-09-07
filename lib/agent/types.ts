export type ClientRow = {
  id: string;
  name: string;
  timezone: string;
  human_name: string | null;
  human_phone: string | null;
  ycloud_phone_number_id: string | null;
  wa_display_number: string | null;
  active: boolean;
};

export type AgentSettingsRow = {
  id: string;
  client_id: string;
  system_prompt: string;
  restrictions: string;
  language: string;
  tone: string | null;
  handoff_threshold_eur: number | null;
  openrouter_model: string;
  version: number;
  active: boolean;
};

export type OfferItemRow = {
  id: string;
  client_id: string;
  name: string;
  price_min: number | null;
  price_max: number | null;
  includes: string | null;
  excludes: string | null;
  cta: string | null;
  active: boolean;
};

export type PersuasionItemRow = {
  id: string;
  client_id: string;
  type: "objection" | "benefit" | "proof" | "rescue" | "close";
  trigger: string;
  response: string;
  proof: string | null;
  intensity: "soft" | "medium" | "firm";
  version: number;
  active: boolean;
};

export type ContactRow = {
  id: string;
  client_id: string;
  wa_phone: string;
  name: string | null;
};

export type ConversationRow = {
  id: string;
  client_id: string;
  contact_id: string;
  status: "open" | "closed" | "handoff";
};

export type RetrievedContext = {
  client: ClientRow;
  settings: AgentSettingsRow;
  persuasion: PersuasionItemRow[];
  offer: OfferItemRow | null;
  recentMessages: Array<{ direction: "in" | "out"; body: string }>;
};

export type AgentRunInput = {
  context: RetrievedContext;
  inboundText: string;
  contactName?: string | null;
};

export type AgentRunResult = {
  replyText: string;
  persuasionItemIds: string[];
  model: string;
};
