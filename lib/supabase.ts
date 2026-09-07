import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jxdfqqrwrvqtwyamewvi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DX82Ud-fZd0ObTM2DQZgEA_biGCLdFQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
