// Emails sent when someone buys a membership or a 10-hour pack online.
// Plain functions (no server-only imports) so they're easy to preview.

export interface EmailBusiness {
  name: string;
  phoneDisplay: string | null;
  tel: string | null;
  siteUrl: string;
  bookingUrl: string;
  portalUrl: string | null;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

const C = {
  bg: "#f3eee3",
  card: "#ffffff",
  ink: "#141a16",
  muted: "#5d625d",
  forest: "#143628",
  green: "#4fbf73",
  line: "#e3ddd0",
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function firstName(name: string | null | undefined): string {
  const first = (name ?? "").trim().split(/\s+/)[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "there";
}

/** "2026-11-30" -> "November 30, 2026" */
export function longDate(iso: string | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** Which days a plan covers, in words. */
export function planDays(plan: string | null | undefined): string | null {
  const p = (plan ?? "").toLowerCase();
  if (p.includes("weekend") || p.includes("7-day") || p.includes("7 day")) return "any day of the week";
  if (p.includes("weekday")) return "Monday to Friday";
  return null;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 6px"><tr><td style="background:${C.green};border-radius:4px"><a href="${esc(href)}" style="display:inline-block;padding:13px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:${C.forest};text-decoration:none">${esc(label)}</a></td></tr></table>`;
}

function step(n: number, title: string, bodyHtml: string): string {
  return `<tr><td style="padding:0 0 18px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td valign="top" width="34" style="padding-top:1px"><div style="width:26px;height:26px;border-radius:13px;background:${C.forest};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;line-height:26px;text-align:center">${n}</div></td>
<td valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${C.ink}"><strong>${esc(title)}</strong><br>${bodyHtml}</td>
</tr></table></td></tr>`;
}

function layout(b: EmailBusiness, preheader: string, heading: string, inner: string, forOwner = false): string {
  const contact = forOwner
    ? "Sent automatically by your website when Stripe reports a purchase or change."
    : b.phoneDisplay && b.tel
    ? `Questions? Call us at <a href="${esc(b.tel)}" style="color:${C.forest}">${esc(b.phoneDisplay)}</a> or reply to this email.`
    : "Questions? Just reply to this email.";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<span style="display:none!important;opacity:0;color:transparent;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${C.bg}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;background:${C.card};border:1px solid ${C.line};border-radius:6px;overflow:hidden">
<tr><td style="background:${C.forest};padding:22px 28px;font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:0.04em;color:#f3eee3">${esc(b.name)}</td></tr>
<tr><td style="padding:28px 28px 8px">
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:normal;color:${C.ink}">${esc(heading)}</h1>
${inner}
</td></tr>
<tr><td style="padding:8px 28px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${C.muted};border-top:1px solid ${C.line}">
<p style="margin:16px 0 0">${contact}</p>
<p style="margin:6px 0 0"><a href="${esc(b.siteUrl)}" style="color:${C.muted}">${esc(b.siteUrl.replace(/^https?:\/\//, ""))}</a></p>
</td></tr></table>
</td></tr></table></body></html>`;
}

function para(html: string): string {
  return `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.ink}">${html}</p>`;
}

function textFooter(b: EmailBusiness): string {
  return [
    b.phoneDisplay ? `Questions? Call us at ${b.phoneDisplay} or reply to this email.` : "Questions? Just reply to this email.",
    b.siteUrl,
  ].join("\n");
}

/** Sent right after checkout: create a YourGolfBooking account. */
export function welcomeEmail(input: {
  business: EmailBusiness;
  kind: "membership" | "pack";
  name: string | null;
  email: string;
  plan: string | null;
  golferName: string | null;
  signupUrl: string;
}): BuiltEmail {
  const { business: b, kind, email, signupUrl } = input;
  const hi = firstName(input.name);
  const plan = input.plan || (kind === "pack" ? "10-Hour Open Bay Pack" : "membership");
  const days = planDays(plan);
  const golfer = input.golferName?.trim() || null;

  const subject =
    kind === "pack"
      ? `Your ${plan}: set up your booking account`
      : `Welcome to The Clubhouse! Set up your booking account`;
  const heading = kind === "pack" ? "Thanks for your purchase!" : "Welcome to the club!";

  const forGolfer = golfer
    ? para(`This ${kind === "pack" ? "pack" : "membership"} is for <strong>${esc(golfer)}</strong>. Please forward this email to them so they can set up their account.`)
    : "";

  const step1 = step(
    1,
    "Create your free booking account",
    `We take bay bookings through YourGolfBooking. Tap the button below and sign up using <strong>${esc(email)}</strong> so we can match you to your ${kind === "pack" ? "hours" : "membership"}. Using a different email? Just reply and tell us which one.${button(signupUrl, "Create my booking account")}`,
  );
  const step2 =
    kind === "pack"
      ? step(2, "We'll set up your hours", "Once your account is ready, our team will add your 10 Open Bay hours and let you know.")
      : step(2, "Watch for your member code", "Tomorrow we'll email you your member code. You'll enter it at checkout whenever you book an Open Bay.");
  const step3 =
    kind === "pack"
      ? step(3, "Book and play", "Open Bays fit up to 8 players. Reservations are subject to availability.")
      : step(
          3,
          "Book and play",
          `Your membership includes unlimited Open Bay play${days ? ` ${esc(days)}` : ""}, up to 2 hours a day, for one golfer. Reservations are subject to availability.`,
        );

  const portal =
    kind === "membership" && b.portalUrl
      ? para(`Need to update your card or cancel later? <a href="${esc(b.portalUrl)}" style="color:${C.forest}">Manage your membership</a>.`)
      : "";

  const inner =
    para(`Hi ${esc(hi)},`) +
    para(`Thanks for buying the <strong>${esc(plan)}</strong>! Here's how to get started:`) +
    forGolfer +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 4px">${step1}${step2}${step3}</table>` +
    portal;

  const text = [
    `Hi ${hi},`,
    "",
    `Thanks for buying the ${plan}! Here's how to get started:`,
    "",
    golfer ? `This ${kind === "pack" ? "pack" : "membership"} is for ${golfer}. Please forward this email to them.` : "",
    "",
    `1. Create your free booking account`,
    `   We take bay bookings through YourGolfBooking. Sign up using ${email} so we can match you to your ${kind === "pack" ? "hours" : "membership"} (using a different email? Just reply and tell us which one):`,
    `   ${signupUrl}`,
    "",
    kind === "pack"
      ? "2. We'll set up your hours\n   Once your account is ready, our team will add your 10 Open Bay hours and let you know."
      : "2. Watch for your member code\n   Tomorrow we'll email you your member code. You'll enter it at checkout whenever you book an Open Bay.",
    "",
    kind === "pack"
      ? "3. Book and play\n   Open Bays fit up to 8 players. Reservations are subject to availability."
      : `3. Book and play\n   Your membership includes unlimited Open Bay play${days ? ` ${days}` : ""}, up to 2 hours a day, for one golfer. Reservations are subject to availability.`,
    "",
    kind === "membership" && b.portalUrl ? `Need to update your card or cancel later? ${b.portalUrl}` : "",
    "",
    textFooter(b),
  ]
    .filter((l, i, a) => !(l === "" && (i === 0 || a[i - 1] === "")))
    .join("\n");

  return { subject, html: layout(b, "Create your free booking account to start booking.", heading, inner), text };
}

/** The member discount code, sent a day after joining and whenever the code changes. */
export function codeEmail(input: {
  business: EmailBusiness;
  name: string | null;
  plan: string | null;
  code: string;
  validUntil: string | null;
  bookingUrl: string;
}): BuiltEmail {
  const { business: b, code, bookingUrl } = input;
  const hi = firstName(input.name);
  const days = planDays(input.plan);
  const until = longDate(input.validUntil);

  const subject = until ? `Your Clubhouse member code (valid until ${until})` : "Your Clubhouse member code";
  const codeBox = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:4px 0 18px"><tr><td align="center" style="background:${C.bg};border:2px dashed ${C.green};border-radius:6px;padding:18px 12px">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${C.muted}">Your member code</div>
<div style="font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:bold;letter-spacing:0.08em;color:${C.forest};margin-top:6px">${esc(code)}</div>
${until ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.muted};margin-top:6px">Valid until ${esc(until)}</div>` : ""}
</td></tr></table>`;

  const steps =
    step(1, "Sign in on our booking page", `Use the account you created with YourGolfBooking.${button(bookingUrl, "Book an Open Bay")}`) +
    step(2, "Pick your Open Bay time", `Book${days ? ` ${esc(days)}` : ""}, up to 2 hours a day.`) +
    step(3, "Enter your code at checkout", "Your member discount is applied to the booking.");

  const inner =
    para(`Hi ${esc(hi)},`) +
    para("Here's your member code for booking Open Bays at The Clubhouse:") +
    codeBox +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${steps}</table>` +
    para("We'll email you a new code each month while your membership is active. Please keep it to yourself; it's for members only.");

  const text = [
    `Hi ${hi},`,
    "",
    "Here's your member code for booking Open Bays at The Clubhouse:",
    "",
    `    ${code}`,
    until ? `    Valid until ${until}` : "",
    "",
    `1. Sign in on our booking page: ${bookingUrl}`,
    `2. Pick your Open Bay time${days ? ` (${days})` : ""}, up to 2 hours a day.`,
    "3. Enter your code at checkout.",
    "",
    "We'll email you a new code each month while your membership is active. Please keep it to yourself; it's for members only.",
    "",
    textFooter(b),
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n");

  return { subject, html: layout(b, `Your member code${until ? `, valid until ${until}` : ""}.`, "Your member code", inner), text };
}

function ownerTable(rows: [string, string | null | undefined][]): string {
  return `<table role="presentation" cellpadding="8" cellspacing="0" style="border-collapse:collapse;margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px">${rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="vertical-align:top;font-weight:bold;border-bottom:1px solid ${C.line};color:${C.ink}">${esc(k)}</td><td style="border-bottom:1px solid ${C.line};color:${C.ink}">${esc(v as string)}</td></tr>`,
    )
    .join("")}</table>`;
}

/** Tells the owner about a new online purchase, with a short to-do list. */
export function ownerNewPurchaseEmail(input: {
  business: EmailBusiness;
  kind: "membership" | "pack";
  name: string | null;
  email: string;
  phone: string | null;
  golferName: string | null;
  plan: string | null;
  code: string | null;
  validUntil: string | null;
  stripeUrl: string | null;
}): BuiltEmail {
  const { business: b, kind } = input;
  const who = input.name || input.email;
  const plan = input.plan || (kind === "pack" ? "10-Hour Open Bay Pack" : "Membership");
  const subject = kind === "pack" ? `New 10-hour pack: ${who}` : `New ${plan}: ${who}`;
  const until = longDate(input.validUntil);

  const todo =
    kind === "pack"
      ? [
          `They've been emailed a link to create their YourGolfBooking account with ${input.email}.`,
          "Once they've signed up, add their 10 Open Bay hours in YGB.",
          "Then tick “Set up in YGB” for them in Admin → Members.",
        ]
      : [
          `They've been emailed a link to create their YourGolfBooking account with ${input.email}.`,
          input.code
            ? `Their member code (${input.code}${until ? `, valid until ${until}` : ""}) goes out automatically tomorrow.`
            : "No member code is set yet. Add one in Admin → Member discount code and they'll get it automatically.",
          "Once they're set up in YGB, tick “Set up in YGB” for them in Admin → Members.",
        ];

  const rows: [string, string | null][] = [
    ["Plan", plan],
    ["Name", input.name],
    ["Email", input.email],
    ["Phone", input.phone],
    ["Golfer (if different)", input.golferName],
  ];

  const inner =
    ownerTable(rows) +
    `<ol style="margin:0 0 18px;padding-left:20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.ink}">${todo
      .map((t) => `<li style="margin-bottom:6px">${esc(t)}</li>`)
      .join("")}</ol>` +
    (input.stripeUrl ? para(`<a href="${esc(input.stripeUrl)}" style="color:${C.forest}">View this customer in Stripe</a>`) : "");

  const text = [
    subject,
    "",
    ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    "",
    ...todo.map((t, i) => `${i + 1}. ${t}`),
    input.stripeUrl ? `\nStripe: ${input.stripeUrl}` : "",
  ].join("\n");

  return { subject, html: layout(b, subject, kind === "pack" ? "New 10-hour pack sale" : "New membership", inner, true), text };
}

/** Tells the owner when a membership is cancelled, ends, or a payment fails. */
export function ownerStatusEmail(input: {
  business: EmailBusiness;
  status: "ending" | "canceled" | "past_due";
  name: string | null;
  email: string | null;
  phone: string | null;
  plan: string | null;
  renewsOn: string | null;
}): BuiltEmail {
  const { business: b, status } = input;
  const who = input.name || input.email || "A member";
  const plan = input.plan || "membership";
  const date = longDate(input.renewsOn);
  const copy = {
    ending: {
      subject: `Membership cancelled: ${who}`,
      heading: "A member cancelled",
      body: `${who} cancelled their ${plan}. It stays active${date ? ` until ${date}` : " until the end of the month they've paid for"}, and they won't get new member codes after that.`,
    },
    canceled: {
      subject: `Membership ended: ${who}`,
      heading: "A membership has ended",
      body: `${who}'s ${plan} has ended. They won't get new member codes. Remove any member access in YGB if you added some.`,
    },
    past_due: {
      subject: `Payment failed: ${who}`,
      heading: "A membership payment failed",
      body: `Stripe couldn't charge ${who}'s card for their ${plan}. Stripe will retry automatically and email them to update their card. They won't get new member codes until it's paid.`,
    },
  }[status];

  const rows: [string, string | null][] = [
    ["Plan", plan],
    ["Name", input.name],
    ["Email", input.email],
    ["Phone", input.phone],
  ];
  const inner = para(esc(copy.body)) + ownerTable(rows);
  const text = [copy.body, "", ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)].join("\n");
  return { subject: copy.subject, html: layout(b, copy.subject, copy.heading, inner, true), text };
}
