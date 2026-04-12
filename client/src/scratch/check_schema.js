import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function getCarSchema() {
  const { data, error } = await supabase.from('cars').select('*').limit(1)
  if (error) {
    console.error(error)
    return
  }
  console.log('Columns:', Object.keys(data[0] || {}))
  console.log('Sample Car:', data[0])
}

getCarSchema()
