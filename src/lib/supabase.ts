import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseKey = 'sb_publishable_nURVjIyUMclbdFZmeifBww_BTOgbz0V'

export const supabase = createClient(supabaseUrl, supabaseKey)