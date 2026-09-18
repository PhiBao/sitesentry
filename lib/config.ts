// Central configuration: NVIDIA open models on Nebius Token Factory.
// Docs: https://docs.tokenfactory.nebius.com — OpenAI-compatible base URL.
export const TOKEN_FACTORY_BASE_URL =
  process.env.TOKEN_FACTORY_BASE_URL?.replace(/\/$/, "") ||
  "https://api.tokenfactory.nebius.com/v1";

// NVIDIA open models used by SiteSentry (Physical AI track).
// Fast path = cheap/low-latency triage. Reasoner = deep scene + report planning.
// IDs follow Token Factory catalog conventions; overridable via env for
// forward-compat as NVIDIA publishes new revisions (e.g. Cosmos3, GR00T N1.7).
export const MODELS = {
  // Vision-language scene understanding (Physical AI brain).
  vlm: process.env.MODEL_VLM || "nvidia/nemotron-3-super-120b-a12b",
  // Fast triage + live callouts.
  fast: process.env.MODEL_FAST || "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  // Deep reasoning + report writing.
  reasoner: process.env.MODEL_REASONER || "nvidia/Nemotron-3-Ultra-550b-a55b",
} as const;

export const hasTokenFactoryKey = () => Boolean(process.env.NEBIUS_API_KEY);
export const hasTavilyKey = () => Boolean(process.env.TAVILY_API_KEY);

export const SITE_PROFILES = [
  {
    id: "warehouse",
    label: "Warehouse",
    prompt:
      "warehouse aisle, pallet racking, forklift, pedestrian walkway, fire extinguisher, blocked egress",
  },
  {
    id: "retail",
    label: "Retail stockroom",
    prompt:
      "retail stockroom, boxes stacked, ladder, exit sign, extinguisher, trip hazards, overloaded shelves",
  },
  {
    id: "workshop",
    label: "Auto / workshop",
    prompt:
      "auto workshop, lift, oil spill, extension cords, PPE, gas cylinder storage, cluttered bench",
  },
] as const;

export type SiteProfileId = (typeof SITE_PROFILES)[number]["id"];
