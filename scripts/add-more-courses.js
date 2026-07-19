const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ippcprgsdssnbjtpfklt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwcGNwcmdzZHNzbmJqdHBma2x0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDM4NzIxMCwiZXhwIjoyMDk5OTYzMjEwfQ.b2sYaukR1OfXG5BQbihI3jvTfPiHbvyFbY66scTVa8Y'
);

async function addCourses() {
  const { data, error } = await supabase.from('courses').insert([
    {
      title: 'Dementia Care Specialist',
      description: 'Specialized training in caring for patients with dementia and Alzheimer\'s disease. Covers behavioral management and person-centered care.',
      category: 'Specialized Care',
      duration_hours: 10,
      is_published: true,
    },
    {
      title: 'Effective Communication in Healthcare',
      description: 'Develop strong communication skills for interacting with patients, families, and healthcare teams.',
      category: 'Communication',
      duration_hours: 4,
      is_published: true,
    },
  ]).select();

  if (error) console.error('Error:', error);
  else console.log('Added courses:', data);
}

addCourses();
