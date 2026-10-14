
const SUPABASE_URL =
  "https://rnrzlmtlpoytrcgcwrkl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_xP9nG2Wa7QL9F-PkAvumIg_cis3XAuP";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

window.NIMBU_SUPABASE = supabaseClient;
console.log("NIMBU Supabase client initialized");
