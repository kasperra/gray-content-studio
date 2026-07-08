/* Gray Content Studio — service pricing
   Source: "Pricing strategy.xlsx" (Estimator sheet).
   Unit prices editable in the admin panel (overrides persist in browser storage). */

const PRICING_CATEGORIES = [
  {
    id: "preprod",
    name: "Pre-Production & Strategy",
    services: [
      { id: "consult", name: "Pre-Production Consultation", unit: "Project", price: 150 },
      { id: "creative", name: "Creative Strategy Session", unit: "Project", price: 250 },
      { id: "branddisc", name: "Brand Discovery Meeting", unit: "Project", price: 200 },
      { id: "mktstrat", name: "Marketing Strategy Development", unit: "Project", price: 350 },
      { id: "calendar", name: "Content Calendar Planning", unit: "Month", price: 300 },
      { id: "campaign", name: "Campaign Planning", unit: "Campaign", price: 500 },
      { id: "script", name: "Script Writing", unit: "Script", price: 150 },
      { id: "advscript", name: "Advanced Script Writing", unit: "Script", price: 350 },
      { id: "storyboard", name: "Storyboarding", unit: "Video", price: 200 },
      { id: "shotlist", name: "Shot List Creation", unit: "Video", price: 100 },
      { id: "prodsched", name: "Production Schedule", unit: "Project", price: 100 },
      { id: "location", name: "Location Scouting", unit: "Location", price: 150 },
      { id: "talent", name: "Talent Coordination", unit: "Person", price: 75 },
      { id: "casting", name: "Casting Assistance", unit: "Project", price: 300 },
      { id: "permit", name: "Permit Coordination", unit: "Permit", price: 150 },
      { id: "equipplan", name: "Equipment Planning", unit: "Project", price: 75 },
    ],
  },
  {
    id: "production",
    name: "Production",
    services: [
      { id: "videohalf", name: "Videographer (Half Day)", unit: "4 Hours", price: 500 },
      { id: "videofull", name: "Videographer (Full Day)", unit: "8 Hours", price: 900 },
      { id: "secondcam", name: "Second Camera Operator", unit: "Day", price: 500 },
      { id: "photoaddon", name: "Photographer Add-on", unit: "Day", price: 600 },
      { id: "drone", name: "Drone Footage", unit: "Project", price: 300 },
      { id: "fpv", name: "FPV Drone", unit: "Project", price: 500 },
      { id: "gimbal", name: "Gimbal Operation", unit: "Shoot", price: 100 },
      { id: "audio", name: "Professional Audio Recording", unit: "Shoot", price: 150 },
      { id: "lighting", name: "Lighting Package", unit: "Shoot", price: 200 },
      { id: "teleprompter", name: "Teleprompter", unit: "Shoot", price: 125 },
      { id: "interview", name: "Interview Setup", unit: "Interview", price: 150 },
      { id: "livestream", name: "Livestream Setup", unit: "Event", price: 500 },
      { id: "eventcov", name: "Event Coverage", unit: "Hour", price: 175 },
      { id: "prodfilm", name: "Product Filming", unit: "Product", price: 100 },
      { id: "lifestyle", name: "Lifestyle Shoot", unit: "Hour", price: 175 },
    ],
  },
  {
    id: "post",
    name: "Post-Production",
    services: [
      { id: "basicedit", name: "Basic Video Editing", unit: "Hour", price: 75 },
      { id: "advedit", name: "Advanced Video Editing", unit: "Hour", price: 125 },
      { id: "motion", name: "Motion Graphics", unit: "Hour", price: 125 },
      { id: "titles", name: "Animated Titles", unit: "Video", price: 75 },
      { id: "colorcorrect", name: "Color Correction", unit: "Video", price: 100 },
      { id: "colorgrade", name: "Color Grading", unit: "Video", price: 150 },
      { id: "audioclean", name: "Audio Cleanup", unit: "Video", price: 75 },
      { id: "sounddesign", name: "Sound Design", unit: "Video", price: 100 },
      { id: "music", name: "Licensed Music Selection", unit: "Video", price: 50 },
      { id: "captions", name: "Captioning", unit: "Video", price: 50 },
      { id: "subtitles", name: "Subtitles (Multiple Languages)", unit: "Language", price: 40 },
      { id: "thumbnail", name: "Thumbnail Design", unit: "Thumbnail", price: 50 },
      { id: "ytopt", name: "YouTube Optimization", unit: "Video", price: 75 },
      { id: "shortform", name: "Short Form Version", unit: "Video", price: 50 },
      { id: "reeledit", name: "Reel/TikTok Edit", unit: "Video", price: 75 },
      { id: "vertical", name: "Vertical Conversion", unit: "Video", price: 35 },
      { id: "export4k", name: "4K Export", unit: "Video", price: 20 },
      { id: "revision", name: "Additional Revision Round", unit: "Round", price: 75 },
    ],
  },
  {
    id: "social",
    name: "Social Media Management",
    services: [
      { id: "socialstrat", name: "Social Media Strategy", unit: "Month", price: 600 },
      { id: "platsetup", name: "Platform Setup", unit: "Platform", price: 150 },
      { id: "acctopt", name: "Account Optimization", unit: "Platform", price: 100 },
      { id: "upload", name: "Content Upload", unit: "Post", price: 20 },
      { id: "scheduling", name: "Scheduling", unit: "Post", price: 10 },
      { id: "community", name: "Community Management", unit: "Hour", price: 50 },
      { id: "moderation", name: "Comment Moderation", unit: "Hour", price: 40 },
      { id: "analytics", name: "Analytics Report", unit: "Monthly", price: 200 },
      { id: "hashtag", name: "Hashtag Research", unit: "Campaign", price: 75 },
      { id: "seo", name: "SEO Research", unit: "Campaign", price: 100 },
    ],
  },
  {
    id: "content",
    name: "Content Packages",
    services: [
      { id: "igreel", name: "Instagram Reel", unit: "Reel", price: 175 },
      { id: "tiktok", name: "TikTok Video", unit: "Video", price: 175 },
      { id: "ytshort", name: "YouTube Short", unit: "Short", price: 175 },
      { id: "fbreel", name: "Facebook Reel", unit: "Reel", price: 175 },
      { id: "linkedin", name: "LinkedIn Video", unit: "Video", price: 200 },
      { id: "ytlong", name: "YouTube Long Form (Edited)", unit: "Video", price: 600 },
      { id: "podcast", name: "Podcast Video Edit", unit: "Episode", price: 350 },
      { id: "testimonial", name: "Testimonial Video", unit: "Video", price: 250 },
      { id: "demo", name: "Product Demo Video", unit: "Video", price: 300 },
      { id: "commercial", name: "Commercial (30-60 sec)", unit: "Commercial", price: 1500 },
      { id: "brandstory", name: "Brand Story Video", unit: "Video", price: 2000 },
    ],
  },
  {
    id: "photo",
    name: "Photography",
    services: [
      { id: "headshots", name: "Headshots", unit: "Person", price: 100 },
      { id: "prodphoto", name: "Product Photography", unit: "Product", price: 40 },
      { id: "realestate", name: "Real Estate Photography", unit: "Property", price: 250 },
      { id: "eventphoto", name: "Event Photography", unit: "Hour", price: 150 },
      { id: "lifestylephoto", name: "Lifestyle Photography", unit: "Hour", price: 175 },
      { id: "photoedit", name: "Photo Editing", unit: "Image", price: 10 },
    ],
  },
  {
    id: "delivery",
    name: "Delivery, Travel & Add-ons",
    services: [
      { id: "overnight", name: "Overnight Travel", unit: "Night", price: 250 },
      { id: "harddrive", name: "Hard Drive Delivery", unit: "Drive", price: 25 },
      { id: "rawfootage", name: "Raw Footage Delivery", unit: "Project", price: 200 },
      { id: "archive", name: "Project Archive (1 Year)", unit: "Project", price: 50 },
      { id: "aivoice", name: "AI Voiceover", unit: "Minute", price: 40 },
      { id: "provoice", name: "Professional Voiceover", unit: "Minute", price: 150 },
    ],
  },
];

/* Percentage surcharges applied to the services subtotal (mutually exclusive) */
const RUSH_OPTIONS = [
  { id: "none", name: "Standard Delivery", pct: 0 },
  { id: "rush48", name: "Rush Delivery (48 Hours)", pct: 30 },
  { id: "sameday", name: "Same-Day Delivery", pct: 50 },
];

/* Travel: $0.75/mile, first 25 miles free */
const TRAVEL_RATE = 0.75;
const TRAVEL_FREE_MILES = 25;

const DEFAULT_DEPOSIT_PCT = 50;

function money(n) {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function findService(id) {
  for (const cat of PRICING_CATEGORIES) {
    const s = cat.services.find((s) => s.id === id);
    if (s) return s;
  }
  return null;
}
