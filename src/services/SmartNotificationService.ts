import { supabase } from '../utils/supabase';
import { askGemini } from '../utils/gemini';

interface NotificationPayload {
  title: string;
  body: string;
  type: string;
  relatedId?: string;
}

export async function sendPersonalizedNotification(
  userId: string,
  notification: NotificationPayload
): Promise<void> {
  try {
    // Get user profile and preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, location_name, notification_preferences')
      .eq('id', userId)
      .single();

    if (!profile) return;

    const firstName = profile.full_name?.split(' ')[0] || 'there';
    const preferences = profile.notification_preferences || {};

    const prompt = `
You are a notification personalizer for RentEase rental app.

USER CONTEXT:
- First name: ${firstName}
- Location: ${profile.location_name || 'Unknown'}
- Notification preferences: ${JSON.stringify(preferences)}

ORIGINAL NOTIFICATION:
- Type: ${notification.type}
- Title: ${notification.title}
- Body: ${notification.body}

TASK:
Rewrite this notification to feel personal and relevant.
Use the user's first name naturally.
Make it sound friendly and local (Indian context).
Keep it SHORT (title max 50 chars, body max 100 chars).
Use 1 relevant emoji in title.

Return ONLY valid JSON (no markdown, no backticks):
{
  "shouldSend": true,
  "personalizedTitle": "New item near you, ${firstName}! 🎯",
  "personalizedBody": "A camera just listed in ${profile.location_name || 'your area'} for ₹500/day"
}

Set shouldSend to false ONLY if this notification type is 
explicitly disabled in user preferences.`;

    const response = await askGemini(prompt);
    if (!response) {
      // Fallback: send original notification without personalization
      await supabase.from('notifications').insert({
        user_id: userId,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        related_id: notification.relatedId,
        is_read: false,
      });
      return;
    }

    const cleanResponse = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const result = JSON.parse(cleanResponse);

    if (!result.shouldSend) return;

    await supabase.from('notifications').insert({
      user_id: userId,
      title: result.personalizedTitle || notification.title,
      body: result.personalizedBody || notification.body,
      type: notification.type,
      related_id: notification.relatedId,
      is_read: false,
    });

  } catch (error) {
    console.error('Smart notification error:', error);
    // Fallback: send original
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        related_id: notification.relatedId,
        is_read: false,
      });
    } catch (fallbackError) {
      console.error('Fallback notification error:', fallbackError);
    }
  }
}
