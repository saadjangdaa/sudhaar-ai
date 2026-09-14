/**
 * Fallback rows used when Supabase env vars are absent or a read fails.
 *
 * Stage 0 seeds the same kind of data into Postgres; this exists so the UI is
 * demoable before anyone has wired credentials, and so a dead database during
 * judging degrades to a populated page instead of an empty one.
 */
import type { CommentRow, ReportRow } from "@/lib/types";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const DEMO_REPORTS: ReportRow[] = [
  {
    id: "demo-1",
    created_at: minutesAgo(24),
    media_url:
      "https://kalojauzdwznxlzcjxzt.supabase.co/storage/v1/object/public/report-media/1e4500bd-58e8-447e-b9b0-5eccc6d1aa77.jpg",
    media_type: "photo",
    raw_text: "Huge pothole outside my gate, water collects in it every night.",
    transcript: null,
    issue_type: "pothole",
    summary: "Large water-filled pothole on the service lane causing bike accidents",
    area_tag: "gulshan_e_iqbal",
    latitude: 24.9207,
    longitude: 67.0947,
    accuracy_m: 18,
    authority_slug: "kmc",
    authority_assigned: "Karachi Metropolitan Corporation",
    routing_reason:
      "Pothole complaints in Gulshan-e-Iqbal are handled by Karachi Metropolitan Corporation.",
    complaint_text: "",
    language: "en",
    upvotes: 128,
    email_status: "sent",
    status: "pending",
    ai_overview:
      "The photo shows a deep, water-filled break in the road surface wide enough to catch a motorcycle wheel. This matches the description and looks like a genuine road-maintenance failure.",
    validity_confidence: 0.93,
    rejection_reason: null,
    evidence_quality: "strong",
  },
  {
    id: "demo-2",
    created_at: minutesAgo(95),
    media_url:
      "https://kalojauzdwznxlzcjxzt.supabase.co/storage/v1/object/public/report-media/1e4500bd-58e8-447e-b9b0-5eccc6d1aa77.jpg",
    media_type: "photo",
    raw_text: "Sewage overflowing near the main market for three days.",
    transcript: null,
    issue_type: "sewage",
    summary: "Sewage line overflowing into the market road for three days",
    area_tag: "lyari",
    latitude: 24.8827,
    longitude: 66.9924,
    accuracy_m: 22,
    authority_slug: "kwsb",
    authority_assigned: "Karachi Water & Sewerage Board",
    routing_reason:
      "Sewage complaints in Lyari are handled by Karachi Water & Sewerage Board.",
    complaint_text: "",
    language: "en",
    upvotes: 94,
    email_status: "sent",
    status: "pending",
    ai_overview:
      "Standing wastewater is visible across the roadway with clear discolouration at the drain. Consistent with a blocked or broken sewer line rather than rainwater.",
    validity_confidence: 0.89,
    rejection_reason: null,
    evidence_quality: "strong",
  },
  {
    id: "demo-3",
    created_at: minutesAgo(180),
    media_url:
      "https://kalojauzdwznxlzcjxzt.supabase.co/storage/v1/object/public/report-media/1e4500bd-58e8-447e-b9b0-5eccc6d1aa77.jpg",
    media_type: "photo",
    raw_text: "کچرے کا ڈھیر ہفتے سے نہیں اٹھایا گیا",
    transcript: null,
    issue_type: "garbage",
    summary: "Uncollected garbage pile outside the residential block for a week",
    area_tag: "north_nazimabad",
    latitude: 24.937,
    longitude: 67.0359,
    accuracy_m: 15,
    authority_slug: "sswmb",
    authority_assigned: "Sindh Solid Waste Management Board",
    routing_reason:
      "Garbage complaints in North Nazimabad are handled by Sindh Solid Waste Management Board.",
    complaint_text: "",
    language: "ur",
    upvotes: 71,
    email_status: null,
    status: "pending",
    ai_overview:
      "An accumulation of uncollected refuse is visible at the kerbside. The photo is dark, so the volume is hard to judge, but the complaint itself is plausible.",
    validity_confidence: 0.84,
    rejection_reason: null,
    evidence_quality: "weak",
  },
  {
    id: "demo-4",
    created_at: minutesAgo(260),
    media_url:
      "https://kalojauzdwznxlzcjxzt.supabase.co/storage/v1/object/public/report-media/1e4500bd-58e8-447e-b9b0-5eccc6d1aa77.jpg",
    media_type: "photo",
    raw_text: "Shops have taken over the entire footpath, no space to walk.",
    transcript: null,
    issue_type: "encroachment",
    summary: "Footpath fully encroached by shop extensions forcing pedestrians onto the road",
    area_tag: "saddar",
    latitude: 24.8547,
    longitude: 67.0134,
    accuracy_m: 35,
    authority_slug: "tma",
    authority_assigned: "Town Municipal Administration",
    routing_reason:
      "Encroachment complaints in Saddar are handled by Town Municipal Administration.",
    complaint_text: "",
    language: "en",
    upvotes: 55,
    email_status: null,
    status: "pending",
    ai_overview:
      "Temporary stalls appear to occupy most of the footpath, pushing pedestrians into traffic. The framing makes it hard to confirm how much width is blocked.",
    validity_confidence: 0.78,
    rejection_reason: null,
    evidence_quality: "weak",
  },
  {
    id: "demo-5",
    created_at: minutesAgo(420),
    media_url:
      "https://kalojauzdwznxlzcjxzt.supabase.co/storage/v1/object/public/report-media/1e4500bd-58e8-447e-b9b0-5eccc6d1aa77.jpg",
    media_type: "photo",
    raw_text: "No water supply in our lane since Monday.",
    transcript: null,
    issue_type: "water",
    summary: "No piped water supply to the lane since Monday, tankers being bought privately",
    area_tag: "clifton",
    latitude: 24.8138,
    longitude: 67.03,
    accuracy_m: 20,
    authority_slug: "cbc",
    authority_assigned: "Cantonment Board Clifton",
    routing_reason:
      "Clifton falls under cantonment administration, which handles all municipal services within its limits.",
    complaint_text: "",
    language: "en",
    upvotes: 38,
    email_status: "sent",
    status: "pending",
    ai_overview:
      "The description of a multi-day supply outage across several streets is specific and internally consistent. No photo was attached, which is normal for a no-water complaint.",
    validity_confidence: 0.91,
    rejection_reason: null,
    evidence_quality: "strong",
  },
  {
    id: "demo-6",
    created_at: minutesAgo(600),
    media_url:
      "https://kalojauzdwznxlzcjxzt.supabase.co/storage/v1/object/public/report-media/1e4500bd-58e8-447e-b9b0-5eccc6d1aa77.jpg",
    media_type: "photo",
    raw_text: "Broken road near the flyover, dust everywhere.",
    transcript: null,
    issue_type: "pothole",
    summary: "Broken carriageway near the flyover throwing up dust across the junction",
    area_tag: "korangi",
    latitude: 24.8321,
    longitude: 67.1387,
    accuracy_m: 25,
    authority_slug: "kmc",
    authority_assigned: "Karachi Metropolitan Corporation",
    routing_reason:
      "Pothole complaints in Korangi are handled by Karachi Metropolitan Corporation.",
    complaint_text: "",
    language: "en",
    upvotes: 21,
    email_status: null,
    status: "pending",
    ai_overview:
      "Water is visibly pooling around a broken main. The Urdu description matches what the photo shows.",
    validity_confidence: 0.87,
    rejection_reason: null,
    evidence_quality: "strong",
  },
];

/**
 * Roman Urdu sample threads, mirroring supabase/migrations/004_comments.sql.
 *
 * Kept in sync by hand so the feed still shows citizens talking to each other
 * when Supabase is unreachable — the interaction is the part of the demo most
 * worth protecting against a dead database.
 */
export const DEMO_COMMENTS: CommentRow[] = [
  {
    id: "dc-1",
    report_id: "demo-1",
    author_name: "Imran Ahmed",
    body: "Yehi gaddha pichle mahine meri bike ka tyre phaar chuka hai. Raat ko to bilkul nazar nahi aata.",
    created_at: minutesAgo(2870),
  },
  {
    id: "dc-2",
    report_id: "demo-1",
    author_name: "Saima Rizvi",
    body: "Barish ke baad paani bhar jata hai aur gehrai ka andaza hi nahi hota. Koi nishaan tak nahi lagaya gaya.",
    created_at: minutesAgo(1640),
  },
  {
    id: "dc-3",
    report_id: "demo-1",
    author_name: "Bilal Shaikh",
    body: "Rickshaw wale bhi yahan se bach kar nikalte hain, isi wajah se saamne wali lane mein jam lag jata hai.",
    created_at: minutesAgo(720),
  },
  {
    id: "dc-4",
    report_id: "demo-2",
    author_name: "Farhan Qureshi",
    body: "Teen din nahi, poora hafta ho gaya hai. Badbu ki wajah se khidki kholna muhaal hai.",
    created_at: minutesAgo(3300),
  },
  {
    id: "dc-5",
    report_id: "demo-2",
    author_name: "Nusrat Bano",
    body: "Bachay isi gande paani se guzar kar school jate hain. Do gharon mein pait ki bimari phail chuki hai.",
    created_at: minutesAgo(2100),
  },
  {
    id: "dc-6",
    report_id: "demo-2",
    author_name: "Abdul Rehman",
    body: "Hum ne teen baar shikayat darj karai, har baar kaha gaya amla aa raha hai. Aaj tak koi nahi aaya.",
    created_at: minutesAgo(900),
  },
  {
    id: "dc-7",
    report_id: "demo-3",
    author_name: "Huma Saleem",
    body: "Do hafte nahi, mahina hone ko hai. Aawara kuttay raat ko saara kachra gali mein phaila dete hain.",
    created_at: minutesAgo(4100),
  },
  {
    id: "dc-8",
    report_id: "demo-3",
    author_name: "Tariq Mahmood",
    body: "Garmi mein badbu naqabil-e-bardasht ho jati hai aur machhar boht barh gaye hain.",
    created_at: minutesAgo(2600),
  },
  {
    id: "dc-9",
    report_id: "demo-4",
    author_name: "Zubaida Khatoon",
    body: "Tanker wale teen hazaar ka tanker aath hazaar mein de rahe hain. Yeh khuli loot hai.",
    created_at: minutesAgo(3900),
  },
  {
    id: "dc-10",
    report_id: "demo-4",
    author_name: "Kashif Anwar",
    body: "Peer se aik qatra nahi aaya. Peene ka paani bottlon mein khareedna par raha hai.",
    created_at: minutesAgo(1800),
  },
  {
    id: "dc-11",
    report_id: "demo-4",
    author_name: "Nadeem Iqbal",
    body: "Saath wali gali mein supply chal rahi hai, to masla line ka nahi lagta. Valve check karaya jaye.",
    created_at: minutesAgo(640),
  },
  {
    id: "dc-12",
    report_id: "demo-5",
    author_name: "Rehana Parveen",
    body: "Footpath par thelay lag jane se paidal chalna namumkin hai. Buzurg aur khawateen sarak par chalne par majboor hain.",
    created_at: minutesAgo(5200),
  },
  {
    id: "dc-13",
    report_id: "demo-5",
    author_name: "Asad Jamal",
    body: "Pichle saal bhi hataye gaye thay, do din baad sab wapas aa gaye. Mustaqil hal chahiye.",
    created_at: minutesAgo(2400),
  },
  {
    id: "dc-14",
    report_id: "demo-6",
    author_name: "Shahzeb Ali",
    body: "Raat ko wahan roshni bhi nahi. Khuda na khwasta koi bacha gir gaya to zimmedar kaun hoga?",
    created_at: minutesAgo(2900),
  },
  {
    id: "dc-15",
    report_id: "demo-6",
    author_name: "Maryam Farooqi",
    body: "Main ne filhal eenten rakh kar nishaan bana diya hai take log bach kar niklein, magar yeh hal nahi.",
    created_at: minutesAgo(1500),
  },
];
