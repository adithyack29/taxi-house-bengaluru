
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
  const { data, error } = await supabase.from('bookings').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  if (data && data[0]) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('No data found in bookings table.');
  }
}

checkColumns();
