import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Auto-close completed jobs after 48 hours
 * This function runs on a schedule (every hour) and automatically closes
 * all completed requests that are older than 48 hours
 */
Deno.serve(async (req) => {
  try {
    console.log('Starting auto-close job...');

    // Call the PostgreSQL function to auto-close jobs
    const { data, error } = await supabase.rpc('auto_close_completed_jobs');

    if (error) {
      console.error('Error calling auto_close_completed_jobs:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Auto-close job completed:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auto-close job completed',
        closed_count: data?.[0]?.closed_count || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Auto-close job error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
