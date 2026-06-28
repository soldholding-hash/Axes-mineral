import { createClient } from '@supabase/supabase-js'
const URL = "https://vgbbzlbyffsybzwmhdeq.supabase.co"
const KEY = "sb_publishable__oosiaQ9SLCkHO_34fM7Ig_z3bOUKXs"
export const supabase = createClient(URL, KEY)
