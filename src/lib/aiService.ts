
const WEDDING_KNOWLEDGE = [
  `Here's a checklist for 1 week before the wedding:\n• Confirm final guest count with caterer\n• Pick up wedding attire and try on\n• Prepare final payments for vendors\n• Pack for honeymoon\n• Delegate day-of tasks to wedding party\n• Get manicure/pedicure\n• Rehearse vows and speeches`,
  `For your honeymoon packing list:\n• Passport/IDs and travel documents\n• Weather-appropriate clothing\n• Comfortable walking shoes\n• Chargers and adapters\n• Medications and toiletries\n• A nice outfit for a romantic dinner\n• Sunscreen and sunglasses\n• Camera or phone with extra memory`,
  `Wedding speech tips:\n• Keep it under 5 minutes\n• Start with a light, tasteful anecdote\n• Thank both families\n• Mention specific qualities you love about your partner\n• End with a heartfelt toast to your future together\n• Practice out loud at least 3 times`,
  `Vendor tipping guidelines:\n• Caterers: 15-20% of bill (or check contract)\n• Photographers/Videographers: $50-200 each\n• DJ/Band: $50-150\n• Hairstylist/Makeup: 15-25%\n• Wedding planner: $100-500\n• Officiant: $50-100 (or donate to their place of worship)`,
  `For last-minute guest list changes:\n• Contact caterer immediately if count changes by more than 5\n• Inform venue of any seating adjustments\n• Update place cards/escort cards if needed\n• Have a few extra seats and meals reserved\n• Assign someone to handle day-of additions`,
  `Wedding day emergency kit:\n• Fashion tape and safety pins\n• Stain remover pen\n• Pain relievers (ibuprofen)\n• Tissues and blotting papers\n• Phone charger\n• Snacks and water\n• Cash for tips\n• Vendor contact list`,
  `Rehearsal dinner etiquette:\n• Usually hosted by groom's parents (but flexible)\n• Invite wedding party, immediate family, and officiant\n• Out-of-town guests may also be included\n• Keep it more casual than the wedding\n• It's a great time to give wedding party gifts`,
  `To handle wedding stress:\n• Take 10 minutes of quiet time each day\n• Delegate—don't try to do everything yourself\n• Focus on what matters: marrying your partner\n• Get plenty of sleep\n• Limit alcohol the week before\n• Do something non-wedding related together`,
];

const SUGGESTIONS = [
  'What should I pack for the honeymoon?',
  'Help me write a thank you speech',
  'What do I need to do 1 week before the wedding?',
  'How much should I tip vendors?',
  'What should be in a wedding day emergency kit?',
  'Any rehearsal dinner etiquette tips?',
];

export function getAIResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes('pack') || lower.includes('honeymoon')) {
    return WEDDING_KNOWLEDGE[1];
  }
  if (lower.includes('speech') || lower.includes('toast') || lower.includes('vow')) {
    return WEDDING_KNOWLEDGE[2];
  }
  if (lower.includes('week') || lower.includes('before') || lower.includes('last minute')) {
    return WEDDING_KNOWLEDGE[0];
  }
  if (lower.includes('tip') || lower.includes('vendor') || lower.includes('pay')) {
    return WEDDING_KNOWLEDGE[3];
  }
  if (lower.includes('guest') || lower.includes('list') || lower.includes('count')) {
    return WEDDING_KNOWLEDGE[4];
  }
  if (lower.includes('emergency') || lower.includes('kit') || lower.includes('backup')) {
    return WEDDING_KNOWLEDGE[5];
  }
  if (lower.includes('rehearsal') || lower.includes('dinner')) {
    return WEDDING_KNOWLEDGE[6];
  }
  if (lower.includes('stress') || lower.includes('anxious') || lower.includes('nervous')) {
    return WEDDING_KNOWLEDGE[7];
  }
  const randomIndex = Math.floor(Math.random() * WEDDING_KNOWLEDGE.length);
  return WEDDING_KNOWLEDGE[randomIndex];
}

export function getSuggestions(): string[] {
  return SUGGESTIONS;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
