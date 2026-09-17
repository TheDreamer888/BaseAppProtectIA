export async function runUnauthenticatedGuard(
  hasSession: boolean,
  termsAccepted: boolean,
  privacyAccepted: boolean,
  recordConsent: (termsAccepted: boolean, privacyAccepted: boolean) => Promise<void>,
  action: () => Promise<void>,
): Promise<void> {
  if (!hasSession) {
    await recordConsent(termsAccepted, privacyAccepted);
  }
  await action();
}
