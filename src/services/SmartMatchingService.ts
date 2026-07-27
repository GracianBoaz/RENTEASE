import { supabase } from '../utils/supabase';
import { askGemini } from '../utils/gemini';

export async function runSmartMatching(itemId: string): Promise<void> {
  try {
    // Get newly listed item details
    const { data: item, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error || !item) return;

    // Get potential renters (exclude owners)
    const { data: potentialUsers } = await supabase
      .from('profiles')
      .select('id, location_lat, location_lng, location_name')
      .neq('id', item.owner_id)
      .limit(100);

    if (!potentialUsers || potentialUsers.length === 0) return;

    // Get recent booking history to understand preferences
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('renter_id, item_id, items(category_id)')
      .eq('status', 'completed')
      .limit(200);

    const prompt = `
You are a smart matching AI for RentEase rental marketplace.

NEW ITEM JUST LISTED:
- ID: ${item.id}
- Title: ${item.title}
- Category ID: ${item.category_id}
- Price: ₹${item.price_per_day}/day
- Location: ${item.location_city || 'Unknown'} 
  (lat: ${item.location_lat}, lng: ${item.location_lng})
- Description: ${item.description?.slice(0, 100)}

POTENTIAL USERS TO MATCH (${potentialUsers.length} total):
${JSON.stringify(potentialUsers.slice(0, 30))}

RECENT BOOKING PATTERNS:
${JSON.stringify(recentBookings?.slice(0, 20))}

MATCHING CRITERIA (in order of importance):
1. Geographic proximity (same city = highest priority)
2. Category match (users who rented similar items before)
3. Price range (users who can afford this price range)

Find top 5 users most likely to rent this item.
Only include users who are genuinely likely to be interested.

Return ONLY valid JSON (no markdown, no backticks):
{
  "matches": [
    {
      "userId": "uuid-here",
      "matchScore": 85,
      "reason": "Same city, rented tools before"
    }
  ]
}

If no good matches found, return: {"matches": []}`;

    const response = await askGemini(prompt);
    if (!response) return;

    const cleanResponse = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const result = JSON.parse(cleanResponse);

    if (!result.matches || result.matches.length === 0) return;

    // Send personalized notification to each matched user
    const notifications = result.matches
      .filter((match: any) => match.userId && match.matchScore > 50)
      .map((match: any) => ({
        user_id: match.userId,
        title: '🎯 New item matches your interests!',
        body: `${item.title} is now available near you • ₹${item.price_per_day}/day`,
        type: 'recommendation',
        related_id: itemId,
        is_read: false,
      }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

  } catch (error) {
    console.error('Smart matching error:', error);
  }
}
