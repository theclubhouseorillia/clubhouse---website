// Shared by the footer sign-up box (what visitors see) and the server action
// (what gets saved), so the stored consent record always matches the wording.

/** The checkbox wording people agree to when they join the email list (CASL express consent). */
export function newsletterConsentText(businessName: string): string {
  const name = businessName.trim() || "us";
  return `Yes, send me emails from ${name} about events, leagues, specials and offers. I can unsubscribe at any time.`;
}
