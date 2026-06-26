// ══════════════════════════════════════════════════════════════════
//  ACTION FLEET — CRITICAL-DEFECT ALERTS  (alerts-config.js)
//  include BEFORE the page scripts (and after the EmailJS SDK)
// ══════════════════════════════════════════════════════════════════
//
//  WHAT THIS DOES
//  When a field guy logs a CRITICAL defect (brakes, steering, bad tire,
//  loose securement, etc.), the app emails you instantly so you know a
//  rig is down before it rolls. The "to" address is set in Manager →
//  Settings (stored in the database, so you can change it anytime).
//
//  ONE-TIME SETUP (free, ~5 minutes) — do this once:
//  1. Make a free account at  https://www.emailjs.com
//  2. Add an Email Service (e.g. connect your Gmail) → copy its SERVICE ID.
//  3. Create an Email Template. In the template body, use these variables:
//        Driver:   {{driver}}
//        Crew:     {{crew}}
//        Truck:    {{truck}}
//        When:     {{when}}
//        Problem:  {{items}}
//        Notes:    {{notes}}
//     Set the template "To Email" field to:  {{to_email}}
//     Copy the TEMPLATE ID.
//  4. Account → General → copy your PUBLIC KEY.
//  5. Paste all three below and re-upload this file.
//
//  Leave the PASTE_ values as-is to keep alerts OFF (no errors, just no email).
// ══════════════════════════════════════════════════════════════════

const EMAILJS = {
    publicKey:  "AyKhM_nNoz_2aVQHp",
    serviceId:  "service_aveedsm",
    templateId: "template_i4lw08d"
};

function alertsConfigured() {
    return EMAILJS.publicKey && !EMAILJS.publicKey.includes('PASTE_')
        && EMAILJS.serviceId && !EMAILJS.serviceId.includes('PASTE_')
        && EMAILJS.templateId && !EMAILJS.templateId.includes('PASTE_');
}

// init the SDK if present + configured
if (typeof emailjs !== 'undefined' && alertsConfigured()) {
    try { emailjs.init({ publicKey: EMAILJS.publicKey }); } catch (e) { /* ignore */ }
}
