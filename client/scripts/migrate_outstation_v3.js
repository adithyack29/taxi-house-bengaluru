import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dcwgtikagxamhahmfbmm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjd2d0aWthZ3hhbWhhaG1mYm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTMwNjgsImV4cCI6MjA5MDc4OTA2OH0.-FiLHmFKWyP3RRsLoAMe8oYd4S7T9eOwBlfeX4Bosco';
const supabase = createClient(supabaseUrl, supabaseKey);

const pricingMap = [
  { name: 'Swift Dzire', oneWay: 15, roundTrip: 11, bata: 300 },
  { name: 'Toyota Etios', oneWay: 15, roundTrip: 11, bata: 300 },
  { name: 'Maruti Ertiga', oneWay: 18, roundTrip: 16, bata: 400 },
  { name: 'Kia Carens', oneWay: 18, roundTrip: 16, bata: 400 },
  { name: 'Innova', oneWay: 19, roundTrip: 16, bata: 400 },
  { name: 'Innova Crysta', isAc: false, oneWay: 24, roundTrip: 18, bata: 500 },
  { name: 'Innova Crysta', isAc: true, oneWay: 26, roundTrip: 19, bata: 500 },
  { name: 'Tempo Traveller', isAc: false, oneWay: 0, roundTrip: 19.75, bata: 500 },
  { name: 'Tempo Traveller', isAc: true, oneWay: 0, roundTrip: 21.75, bata: 500 }
];

async function migrate() {
  console.log('Starting Final Outstation Pricing Migration (v3)...');
  const { data: cars, error } = await supabase.from('cars').select('*');
  if (error) {
    console.error('Error fetching cars:', error);
    return;
  }

  for (const car of cars) {
    const config = pricingMap.find(p => {
      if (p.name === car.name) {
        if (p.isAc !== undefined) {
          return p.isAc === car.is_ac;
        }
        return true;
      }
      return false;
    });

    if (config) {
      console.log(`Updating ${car.name} (${car.is_ac ? 'AC' : 'Non-AC'})...`);
      const { error: updateError } = await supabase
        .from('cars')
        .update({
          price_per_km_one_way: config.oneWay,
          price_per_km: config.roundTrip,
          driver_bata: config.bata,
          min_km: 300
        })
        .eq('id', car.id);
      
      if (updateError) {
        console.error(`Error updating car ${car.id}:`, updateError);
      } else {
        console.log(`Updated ${car.name}: OW ₹${config.oneWay}, RT ₹${config.roundTrip}, Bata ₹${config.bata}`);
      }
    } else {
      console.warn(`No pricing config found for ${car.name}`);
    }
  }
  console.log('Migration Complete.');
}

migrate();
