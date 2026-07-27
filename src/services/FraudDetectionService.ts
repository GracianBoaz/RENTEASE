import { supabase } from '../utils/supabase';
import { askGemini } from '../utils/gemini';

export interface FraudResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  reason: string;
  recommendation: 'APPROVE' | 'VERIFY' | 'REJECT';
}

export async function runFraudDetection(
  bookingId: string
): Promise<FraudResult | null> {
  try {
    // Fetch booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_renter_id_fkey (
          id,
          full_name,
          created_at,
          rating
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) return null;

    // Fetch renter's booking history
    const { data: renterHistory } = await supabase
      .from('bookings')
      .select('id, status, created_at')
      .eq('renter_id', booking.renter_id);

    // Fetch item details
    const { data: item } = await supabase
      .from('items')
      .select('title, price_per_day, category_id')
      .eq('id', booking.item_id)
      .single();

    const totalDays = Math.ceil(
      (new Date(booking.end_date).getTime() -
        new Date(booking.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const totalValue = (item?.price_per_day || 0) * totalDays;

    const prompt = `
You are a fraud detection AI for RentEase rental marketplace.

Analyze this booking for fraud risk:

BOOKING DETAILS:
- Item: ${item?.title} (Category ID: ${item?.category_id})
- Price per day: ₹${item?.price_per_day}
- Duration: ${totalDays} days
- Total value: ₹${totalValue}
- Start date: ${booking.start_date}

RENTER PROFILE:
- Account created: ${booking.profiles?.created_at}
- Rating: ${booking.profiles?.rating || 'No rating yet'}
- Total past bookings: ${renterHistory?.length || 0}
- Completed bookings: ${renterHistory?.filter((b: any) => b.status === 'completed').length || 0}
- Cancelled bookings: ${renterHistory?.filter((b: any) => b.status === 'cancelled').length || 0}

FRAUD SIGNALS TO CHECK:
1. New account (less than 7 days old) booking high-value item
2. Zero completed bookings history
3. Multiple bookings in very short time
4. High value rental (more than ₹5000 total)
5. No rating yet with expensive item

Based on these signals, assess risk level.

Return ONLY valid JSON (no markdown, no backticks):
{
  "riskLevel": "LOW",
  "riskScore": 15,
  "reason": "Established renter with good history",
  "recommendation": "APPROVE"
}

Risk levels: LOW (0-30), MEDIUM (31-60), HIGH (61-85), CRITICAL (86-100)
Recommendations: APPROVE for LOW, VERIFY for MEDIUM/HIGH, REJECT for CRITICAL`;

    const response = await askGemini(prompt);
    if (!response) return null;

    // Clean response (remove any markdown)
    const cleanResponse = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const result: FraudResult = JSON.parse(cleanResponse);

    // Save fraud assessment to booking
    await supabase
      .from('bookings')
      .update({
        fraud_score: result.riskScore,
        fraud_flag: result.riskLevel === 'HIGH' ||
                    result.riskLevel === 'CRITICAL',
        fraud_reason: result.reason,
      })
      .eq('id', bookingId);

    // Alert owner if HIGH or CRITICAL risk
    if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
      await supabase.from('notifications').insert({
        user_id: booking.owner_id,
        title: '⚠️ Suspicious Booking Alert',
        body: `Please verify this booking request before confirming. Reason: ${result.reason}`,
        type: 'warning',
        related_id: bookingId,
        is_read: false,
      });
    }

    return result;
  } catch (error) {
    console.error('Fraud detection error:', error);
    return null;
  }
}
