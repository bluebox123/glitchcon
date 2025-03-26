const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are missing. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Read and execute the views table migration
    const viewsTableMigration = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create_views_table.sql'),
      'utf8'
    );
    
    // Run the SQL migration
    const { error } = await supabase.rpc('pg_query', { query: viewsTableMigration });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Views table migration completed successfully');
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    process.exit(1);
  }
}

runMigrations()
  .then(() => {
    console.log('All migrations completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 