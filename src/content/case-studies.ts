/* ============================================================
   CASE STUDIES — EDIT ME
   Each entry renders at /work/[slug]. Update copy, add gallery
   images (drop files in /public/img and reference them), and
   replace placeholder testimonials with real client quotes.
   Results are intentionally qualitative until real metrics exist.
   ============================================================ */

export type CaseStudy = {
  slug: string;
  client: string;
  title: string;
  category: "corporate" | "political" | "nonprofit" | "ecommerce" | "media";
  categoryLabel: string;
  year: string;
  image?: string; // cinematic still, rendered with the grayscale→color photo treatment
  logo?: string; // brand logo, rendered on a light plate (for clients without a usable still)
  summary: string;
  challenge: string;
  solution: string;
  deliverables: string[];
  results: string[];
  gallery: string[];
  featured?: boolean;
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "exxonmobil",
    client: "ExxonMobil",
    title: "Campaign films for a global energy leader",
    category: "corporate",
    categoryLabel: "Corporate",
    year: "2025",
    image: "/img/exxonmobil.avif",
    summary:
      "A multi-year video partnership spanning internal communications and social advertising for one of the world's largest energy companies.",
    challenge:
      "ExxonMobil needed a steady stream of polished video content across wildly different audiences — Louisiana communities learning about carbon capture, internal teams in Canada, and students entering the energy workforce — all under strict brand compliance.",
    solution:
      "Gray Content Studio delivered an ongoing production pipeline: the LA CCS campaign films ('CO2 Underground,' 'EM Experience'), Canada TEEX training videos, and the Tapia SOWELA 2025 PD Camp teaser — each cut to its channel, from broadcast to social to internal platforms.",
    deliverables: [
      "LA CCS campaign films — 'CO2 Underground' & 'EM Experience'",
      "Canada TEEX training video series",
      "Tapia SOWELA 2025 PD Camp teaser",
      "Platform-specific edits for broadcast, web, social, and internal comms",
    ],
    results: [
      "A repeatable, brand-compliant production pipeline across three business units",
      "Complex technical subject matter translated into accessible, watchable stories",
      "Content delivered on schedule across every distribution channel",
    ],
    gallery: [],
    featured: true,
  },
  {
    slug: "iheartradio",
    client: "iHeartRadio",
    title: "Daily celebrity podcast post-production at network scale",
    category: "media",
    categoryLabel: "Media",
    year: "2024",
    image: "/img/iheart.jpg",
    summary:
      "Daily and overnight podcast editing featuring A-list celebrities for one of the largest audio networks in America.",
    challenge:
      "iHeartRadio's premium podcast slate — including shows featuring A-list celebrities — required daily and overnight turnaround with zero tolerance for missed broadcast deadlines.",
    solution:
      "A high-volume post-production workflow covering The Psychology Podcast (distributed on Spotify, Apple Music, and Amazon) and Culturalistas: audio enhancement, transitions, and platform-ready masters delivered on network schedules, night after night.",
    deliverables: [
      "Daily & overnight podcast episode edits",
      "The Psychology Podcast — full edit pipeline (Spotify, Apple Music, Amazon)",
      "Culturalistas — social-ready episode content",
      "Audio cleanup, transitions, and broadcast-standard masters",
    ],
    results: [
      "Every broadcast deadline met across a daily production calendar",
      "Consistent, network-standard quality across hundreds of episodes",
      "Multi-platform distribution handled from a single edit pipeline",
    ],
    gallery: ["/img/iheart.jpg"],
    featured: true,
  },
  {
    slug: "zohran-mamdani",
    client: "Zohran Mamdani",
    title: "An acceptance speech the whole country watched",
    category: "political",
    categoryLabel: "Political",
    year: "2025",
    image: "/img/mamdani-1.jpg",
    summary:
      "Editing the acceptance speech video for campaign platforms — a landmark political moment cut for maximum reach.",
    challenge:
      "A historic campaign victory needed its defining moment packaged for every platform within hours — while the moment was still the story.",
    solution:
      "Gray Content Studio edited the acceptance speech video for the campaign's platforms: tight pacing, clean audio, and framing that let the moment land — versioned for the channels where audiences were already watching.",
    deliverables: [
      "Acceptance speech hero edit",
      "Platform-optimized versions for campaign channels",
    ],
    results: [
      "Turnaround measured in hours, not days",
      "A defining campaign moment preserved with broadcast polish",
    ],
    gallery: ["/img/mamdani-1.jpg", "/img/mamdani-2.jpg"],
    featured: true,
  },
  {
    slug: "michael-blake",
    client: "Michael Blake",
    title: "Weekly content for a Bronx congressional campaign",
    category: "political",
    categoryLabel: "Political",
    year: "2026",
    image: "/img/blake-2.jpg",
    summary:
      "Weekly social media content keeping a congressional campaign sharp, local, and everywhere voters scroll.",
    challenge:
      "A congressional campaign in the Bronx needed a constant drumbeat of authentic video content — produced on campaign timelines and budgets, week after week.",
    solution:
      "A weekly production cadence delivering 'Economic Justice' (featuring Mysonne), 'Love Bronx,' Black History Month and Ramadan features, and endorsement videos — rapid-turnaround content built for social feeds.",
    deliverables: [
      "'Economic Justice' ft. Mysonne",
      "'Love Bronx' community video",
      "Black History Month & 'MB x Ramadan' features",
      "Endorsement video series",
      "Weekly social content pipeline",
    ],
    results: [
      "A reliable weekly content engine for the length of the campaign",
      "Message discipline maintained across dozens of rapid-turnaround videos",
    ],
    gallery: ["/img/blake-2.jpg", "/img/blake-1.jpg"],
  },
  {
    slug: "anthem",
    client: "Anthem",
    title: "Human stories for a national health insurer",
    category: "corporate",
    categoryLabel: "Corporate",
    year: "2025–2026",
    logo: "/img/anthem-logo.jpeg",
    summary:
      "Social media advertising that translates complex healthcare messaging into clear, human, short-form video.",
    challenge:
      "Healthcare messaging is dense, regulated, and easy to ignore. Anthem needed social content that people would actually watch — without compromising brand compliance.",
    solution:
      "Working with account executives to ensure compliance, Gray Content Studio produced the BOA testimonial video (Lisa Watson ABS), the Anthem Holiday video, and the Peak Time Rebates campaign — motion graphics and visual storytelling built for digital platforms.",
    deliverables: [
      "BOA Testimonial — Lisa Watson ABS (social + web)",
      "Anthem Holiday video",
      "Peak Time Rebates campaign (social + web)",
      "Motion graphics and brand-compliant editing",
    ],
    results: [
      "Complex programs explained in seconds, not paragraphs",
      "Brand and regulatory compliance maintained across every deliverable",
    ],
    gallery: [],
  },
  {
    slug: "dominion-energy",
    client: "Dominion Energy",
    title: "Powering a Fortune 500 utility's story",
    category: "corporate",
    categoryLabel: "Corporate",
    year: "2024–2025",
    image: "/img/dominion.avif",
    summary:
      "Short-form video for brand and internal communications — employee spotlights, event promos, and community campaigns.",
    challenge:
      "A Fortune 500 utility needed consistent, polished short-form video across brand, internal, and community channels — each with its own audience and tone.",
    solution:
      "An ongoing engagement producing employee spotlights, the Riverrock promo (featuring Hardywood), and the DECC 5k promo — one visual standard across every channel.",
    deliverables: [
      "Employee spotlight series",
      "Riverrock promo ft. Hardywood",
      "DECC 5k community event promo",
      "Brand + internal communications editing",
    ],
    results: [
      "One consistent visual voice across brand, internal, and community content",
      "A dependable production partner for recurring campaigns",
    ],
    gallery: ["/img/dominion.avif"],
  },
  {
    slug: "ll-flooring",
    client: "LL Flooring",
    title: "A full-stack content engine for national retail",
    category: "corporate",
    categoryLabel: "Corporate",
    year: "2024",
    image: "/img/llflooring.jpg",
    summary:
      "Internal videos, monthly social content, and TV commercial motion graphics for a national flooring retailer.",
    challenge:
      "A national retailer's marketing calendar never stops: seasonal TV spots, monthly social content, product launches, and internal comms all competing for production time.",
    solution:
      "Gray Content Studio became the retailer's content engine — Memorial Day and Labor Day TV spots, the Summer Clearance Event campaign, the Hazelton Oak Duravana product video, and monthly social content, all delivered on retail deadlines.",
    deliverables: [
      "Memorial Day & Labor Day TV commercial motion graphics",
      "Summer Clearance Event campaign",
      "Hazelton Oak Duravana product video",
      "Monthly social content + internal videos",
    ],
    results: [
      "Every seasonal campaign shipped on time across a full retail calendar",
      "TV, social, product, and internal video handled by one partner",
    ],
    gallery: ["/img/llflooring.jpg"],
  },
  {
    slug: "1md-nutrition",
    client: "1MD Nutrition",
    title: "The CardioFitMD campaign that moved product",
    category: "ecommerce",
    categoryLabel: "E-commerce",
    year: "2023",
    image: "/img/1md.jpg",
    summary:
      "Promotional advertising for Amazon and YouTube — doctor demonstrations, PPC ads, and customer testimonials.",
    challenge:
      "In supplement e-commerce, the first three seconds decide everything. 1MD needed CardioFitMD creative that stopped the scroll and converted.",
    solution:
      "A conversion-focused campaign: doctor product-usage videos for credibility, a PPC ad engineered for paid placement, and customer testimonials for social proof — built for Amazon and YouTube.",
    deliverables: [
      "Doctor product-usage videos",
      "PPC advertisement",
      "Customer testimonial videos",
      "Amazon + YouTube platform versions",
    ],
    results: [
      "Elevated product sales following campaign launch",
      "Increased online visibility for the CardioFitMD line",
      "Creative that attracted high-end athletes to the brand",
    ],
    gallery: ["/img/1md.jpg"],
  },
  {
    slug: "hair-la-vie",
    client: "Hair La Vie",
    title: "One tutorial, a whole content series",
    category: "ecommerce",
    categoryLabel: "E-commerce",
    year: "2021",
    image: "/img/hairlavie.jpg",
    summary:
      "A 60-second 'How To: Lash24' video spun into a full micro-content series for Amazon and social.",
    challenge:
      "A natural hair care brand needed product education that worked as hard on Amazon product pages as it did in social feeds — without shooting everything twice.",
    solution:
      "Gray Content Studio produced the 60-second 'How To: Lash24' hero video, then spun it into a series of micro-content pieces — one shoot, a month of platform-native content.",
    deliverables: [
      "'How To: Lash24' 60-second hero video",
      "Micro-content series for social",
      "Amazon product page versions",
    ],
    results: [
      "One production multiplied into a full multi-platform content series",
      "Consistent product education across Amazon and social",
    ],
    gallery: ["/img/hairlavie.jpg"],
  },
  {
    slug: "essential-elements",
    client: "Essential Elements",
    title: "Wellness creative that looks as good as it feels",
    category: "ecommerce",
    categoryLabel: "E-commerce",
    year: "2022",
    image: "/img/hero.jpg",
    summary:
      "Social and YouTube content for a health and wellness supplement brand — bright, energetic, and built to convert.",
    challenge:
      "In a crowded wellness market, Essential Elements needed video creative with the energy and polish to stand apart in paid and organic feeds.",
    solution:
      "Bright, lifestyle-led social and YouTube content that makes the product feel like part of a life people want — shot and cut for the platforms where wellness audiences live.",
    deliverables: ["Social ad creative", "YouTube content", "Lifestyle product videos"],
    results: [
      "A distinctive, energetic brand look across paid and organic channels",
    ],
    gallery: ["/img/hero.jpg"],
  },
  {
    slug: "vpap",
    client: "Virginia Public Access Project",
    title: "Making public data feel personal",
    category: "nonprofit",
    categoryLabel: "Nonprofit",
    year: "2025",
    image: "/img/vpap.jpeg",
    summary:
      "A brand video and Civics Navigator app showcase for Virginia's nonpartisan transparency nonprofit.",
    challenge:
      "VPAP's mission — political transparency through public data — is vital but abstract. They needed video that made it tangible for everyday Virginians.",
    solution:
      "A brand video articulating the mission, plus a Civics Navigator app-feature demonstration that shows citizens exactly what the tool does for them.",
    deliverables: ["Brand video", "Civics Navigator app showcase"],
    results: [
      "A complex civic mission communicated in plain, human terms",
      "The flagship app demonstrated clearly enough for first-time users",
    ],
    gallery: ["/img/vpap.jpeg"],
  },
  {
    slug: "ccwa",
    client: "Community College Workforce Alliance",
    title: "Student stories that drive enrollment",
    category: "nonprofit",
    categoryLabel: "Nonprofit",
    year: "2024",
    summary:
      "Feature videos showcasing student and program stories for workforce education.",
    challenge:
      "Workforce programs change lives, but statistics don't enroll students — stories do. CCWA needed its students' journeys told with warmth and credibility.",
    solution:
      "Human-first feature videos putting real students and programs on camera — stories that make prospective students see themselves in the outcome.",
    deliverables: ["Student story features", "Program showcase videos"],
    results: [
      "Authentic, human-first storytelling for enrollment marketing",
    ],
    gallery: [],
  },
  {
    slug: "visit-tappahannock",
    client: "Visit Tappahannock",
    title: "Putting a historic river town on the map",
    category: "nonprofit",
    categoryLabel: "Nonprofit",
    year: "2024",
    image: "/img/tappahannock.avif",
    summary:
      "Promotional tourism content highlighting local attractions and businesses.",
    challenge:
      "A historic Virginia river town competing for weekend visitors needed its charm captured — not described.",
    solution:
      "Promotional tourism content spotlighting local attractions and businesses, one story at a time.",
    deliverables: ["Tourism promotional videos", "Local business features"],
    results: ["A visual identity for the town's tourism push"],
    gallery: ["/img/tappahannock.avif"],
  },
  {
    slug: "gigantic",
    client: "Gigantic",
    title: "Making frontier tech feel accessible",
    category: "media",
    categoryLabel: "Media",
    year: "2023",
    image: "/img/gigantic.jpg",
    summary:
      "Course trailers, founder interviews, and social content for Web3, NFT, and AI education.",
    challenge:
      "Web3, NFTs, and AI intimidate exactly the learners Gigantic wanted to reach. The content had to make frontier tech feel approachable.",
    solution:
      "Gray Content Studio transformed 4K raw footage into the Gigantic landing-page trailer, a Web3 eCourse trailer, founder and team interviews, and a Social Tips series — energy and clarity over jargon.",
    deliverables: [
      "Gigantic landing-page trailer",
      "Web3 eCourse trailer",
      "Founder & team interviews",
      "Social Tips series",
    ],
    results: [
      "Intimidating subject matter repositioned as approachable education",
    ],
    gallery: ["/img/gigantic.jpg"],
  },
  {
    slug: "teddy",
    client: "TEDDY · E&P Pawductions, LLC",
    title: "An 18-video eCourse, end to end",
    category: "media",
    categoryLabel: "Media",
    year: "2021",
    image: "/img/teddy.avif",
    summary:
      "A complete dog-training eCourse — shot, edited, and delivered as a standalone product and in-app content.",
    challenge:
      "E&P Pawductions, LLC needed a full educational product — not clips, but a structured 18-video curriculum teaching fundamental dog training commands.",
    solution:
      "End-to-end production of the TEDDY course, including 'Crate 101' — planned, shot, edited, and delivered for both standalone sale and the TEDDY mobile app.",
    deliverables: [
      "18-video structured eCourse (incl. 'Crate 101')",
      "Standalone course masters",
      "TEDDY app-ready versions",
    ],
    results: [
      "A sellable educational product delivered production-complete",
      "Content serving both direct sales and the app experience",
    ],
    gallery: ["/img/teddy.avif"],
  },
];

export function getCaseStudy(slug: string) {
  return CASE_STUDIES.find((c) => c.slug === slug);
}

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "corporate", label: "Corporate" },
  { id: "political", label: "Political" },
  { id: "nonprofit", label: "Nonprofit" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "media", label: "Media" },
] as const;
