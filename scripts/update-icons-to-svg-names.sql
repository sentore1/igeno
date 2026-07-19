-- Update Service Type Icons from Emojis to SVG Names
-- Run this if you already have services with emoji icons
-- Run this in Supabase SQL Editor

-- Update existing emoji icons to icon names
UPDATE service_types SET icon = 'medical' WHERE icon = '⚕️';
UPDATE service_types SET icon = 'sparkles' WHERE icon = '🧼';
UPDATE service_types SET icon = 'chat' WHERE icon = '💬';
UPDATE service_types SET icon = 'home' WHERE icon = '🏡';
UPDATE service_types SET icon = 'sun' WHERE icon = '🧹';
UPDATE service_types SET icon = 'truck' WHERE icon = '🚗';
UPDATE service_types SET icon = 'heart' WHERE icon = '❤️';
UPDATE service_types SET icon = 'user-group' WHERE icon = '🤝';
UPDATE service_types SET icon = 'briefcase' WHERE icon = '💼';
UPDATE service_types SET icon = 'star' WHERE icon = '⭐';
UPDATE service_types SET icon = 'lightning' WHERE icon = '⚡';
UPDATE service_types SET icon = 'clock' WHERE icon = '🕐';

-- Set any remaining emoji icons to 'medical' as default
UPDATE service_types 
SET icon = 'medical' 
WHERE icon NOT IN ('medical', 'heart', 'user-group', 'home', 'sparkles', 'chat', 'truck', 'briefcase', 'clock', 'star', 'lightning', 'sun')
AND icon IS NOT NULL;

-- Verify the update
SELECT 
  id,
  name,
  icon,
  'Updated to SVG icon name' as status
FROM service_types
ORDER BY display_order;

-- Success message
SELECT 'Icons updated successfully!' AS message;
