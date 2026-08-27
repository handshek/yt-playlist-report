export interface ComparisonFeatureRow {
  feature: string;
  ytpr: string;
  competitor: string;
  winner: "YT Playlist Report" | "Competitor" | "Tie";
}

export interface ComparisonFaq {
  question: string;
  answer: string;
}

export interface ComparisonSource {
  label: string;
  url: string;
}

export interface Comparison {
  slug: string;
  competitorName: string;
  competitorUrl: string;
  seo: {
    title: string;
    description: string;
  };
  eyebrow: string;
  verdict: string;
  summary: string;
  bestFor: string;
  competitorBestFor: string;
  featureRows: ComparisonFeatureRow[];
  strengths: string[];
  concessions: string[];
  faqs: ComparisonFaq[];
  sources: ComparisonSource[];
  lastReviewed: string;
}

const lastReviewed = "August 27, 2026";

export const comparisons: Comparison[] = [
  {
    slug: "yt-playlist-report-vs-ytpla",
    competitorName: "YTPLA",
    competitorUrl: "https://www.ytpla.in/",
    seo: {
      title: "YT Playlist Report vs YTPLA: Which Playlist Analyzer Is Better?",
      description:
        "Compare YT Playlist Report and YTPLA for playlist duration, video search, private playlists, sharing, range analysis, and everyday study planning.",
    },
    eyebrow: "Public reports vs account-connected analysis",
    verdict:
      "Choose YT Playlist Report for a fast, shareable breakdown of a public playlist. Choose YTPLA when access to private or Liked playlists is essential.",
    summary:
      "YT Playlist Report is the stronger default for learners who want to paste a public playlist and immediately explore its duration, videos, viewing metrics, and practical study range. Its report has a stable URL that is easy to revisit or share. YTPLA serves a broader account-connected workflow: Google sign-in, private and Liked playlists, Takeout imports, and a browser extension can matter more than a public report for some users.",
    bestFor:
      "Students, course viewers, and researchers analyzing a public playlist without connecting a Google account.",
    competitorBestFor:
      "People who need private or Liked playlist access, Google Takeout import, or an extension-based workflow.",
    featureRows: [
      { feature: "Public playlist analysis", ytpr: "Paste a URL and analyze", competitor: "Available", winner: "YT Playlist Report" },
      { feature: "Shareable report URL", ytpr: "Dedicated report route", competitor: "Not highlighted", winner: "YT Playlist Report" },
      { feature: "Title search and sorting", ytpr: "Search plus sortable metrics", competitor: "Selected-video tools", winner: "YT Playlist Report" },
      { feature: "Range and speed planning", ytpr: "Choose a video range and 0.25×–2× speed", competitor: "Selected-video totals", winner: "YT Playlist Report" },
      { feature: "Private and Liked playlists", ytpr: "Public playlists only", competitor: "Google-authenticated access", winner: "Competitor" },
      { feature: "Google Takeout import", ytpr: "Not available", competitor: "Available", winner: "Competitor" },
      { feature: "Browser extension", ytpr: "No installation needed", competitor: "Available", winner: "Tie" },
    ],
    strengths: [
      "Open a public playlist report without signing in or granting Google account access.",
      "Search titles, sort engagement and duration metrics, and choose which columns stay visible.",
      "Analyze only a selected video range and recalculate time at different playback speeds.",
      "Share or bookmark a stable report URL for a class, research project, or viewing plan.",
    ],
    concessions: [
      "YTPLA supports Google-authenticated private and Liked playlists, while YT Playlist Report intentionally focuses on public playlists.",
      "YTPLA also documents Takeout imports and a browser extension, useful for users building a personal library workflow.",
    ],
    faqs: [
      { question: "Can either tool analyze private YouTube playlists?", answer: "YTPLA documents Google sign-in for private and Liked playlists. YT Playlist Report currently analyzes public playlists without requiring an account connection." },
      { question: "Which tool is easier for sharing results?", answer: "YT Playlist Report gives each analyzed playlist a dedicated report URL, making it the clearer choice when classmates, collaborators, or clients need the same view." },
      { question: "Does YT Playlist Report replace the YTPLA extension?", answer: "Not for every workflow. YT Playlist Report works in the browser without installation; YTPLA's extension may be more convenient if you specifically want analysis integrated into browsing." },
      { question: "Which is better for planning a course playlist?", answer: "YT Playlist Report is especially useful for course planning because you can select a range, adjust playback speed, search titles, and inspect the exact videos in one report." },
    ],
    sources: [
      { label: "YTPLA homepage", url: "https://www.ytpla.in/" },
      { label: "YTPLA about page", url: "https://www.ytpla.in/about" },
      { label: "YTPLA privacy page", url: "https://www.ytpla.in/privacy" },
    ],
    lastReviewed,
  },
  {
    slug: "yt-playlist-report-vs-youtube-playlist-analyzer",
    competitorName: "YouTube Playlist Analyzer",
    competitorUrl: "https://www.youtubeplaylistanalyzer.com/",
    seo: {
      title: "YT Playlist Report vs YouTube Playlist Analyzer: Full Comparison",
      description:
        "Compare YT Playlist Report with YouTube Playlist Analyzer for duration, exports, API keys, multi-playlist tools, study planning, search, and sharing.",
    },
    eyebrow: "Focused playlist reports vs an export-heavy toolkit",
    verdict:
      "YT Playlist Report is the simpler default for exploring one public playlist. YouTube Playlist Analyzer wins when exports or multi-playlist comparison are non-negotiable.",
    summary:
      "Both tools go beyond a bare playlist duration, but they optimize for different jobs. YT Playlist Report turns one public playlist into an approachable, shareable report with title search, sortable metrics, column controls, range selection, and speed-adjusted timing. YouTube Playlist Analyzer advertises a larger utility set, including several export formats, multiple-playlist comparison, schedule planning, localization, and YouTube Music support. That breadth is valuable, though its API-key option creates an extra decision for users who simply want a report.",
    bestFor:
      "Anyone who wants a focused, visual report for one public playlist with no personal API key prompt.",
    competitorBestFor:
      "Power users who need CSV, JSON, or TXT exports, compare several playlists, or use YouTube Music links.",
    featureRows: [
      { feature: "Single public playlist report", ytpr: "Focused interactive report", competitor: "Available", winner: "YT Playlist Report" },
      { feature: "Personal API key required", ytpr: "No", competitor: "Optional workflow", winner: "YT Playlist Report" },
      { feature: "Title search and sortable table", ytpr: "Built in", competitor: "Analysis tools available", winner: "YT Playlist Report" },
      { feature: "Range and speed planning", ytpr: "Range plus 0.25×–2×", competitor: "Schedule planner", winner: "Tie" },
      { feature: "CSV, JSON, and TXT export", ytpr: "Not available", competitor: "Available", winner: "Competitor" },
      { feature: "Multi-playlist comparison", ytpr: "One playlist per report", competitor: "Available", winner: "Competitor" },
      { feature: "YouTube Music and localization", ytpr: "Not highlighted", competitor: "Advertised", winner: "Competitor" },
    ],
    strengths: [
      "Get a clear report without first deciding whether to supply a personal YouTube API key.",
      "Filter by title and sort videos by position, duration, views, likes, or publication date.",
      "Narrow the calculation to part of a playlist and model viewing time at several speeds.",
      "Send the report URL to someone else instead of exporting and passing around a file.",
    ],
    concessions: [
      "YouTube Playlist Analyzer advertises CSV, JSON, and TXT exports that YT Playlist Report does not currently offer.",
      "It also covers multi-playlist comparison, scheduling, localization, and YouTube Music—stronger breadth for specialist workflows.",
    ],
    faqs: [
      { question: "Do I need a YouTube API key for YT Playlist Report?", answer: "No personal API key is requested. Paste a public playlist URL and YT Playlist Report handles the report workflow for you." },
      { question: "Which tool can export playlist data?", answer: "YouTube Playlist Analyzer advertises CSV, JSON, and TXT exports. YT Playlist Report emphasizes an interactive, shareable browser report instead." },
      { question: "Can YT Playlist Report compare multiple playlists?", answer: "Not in one combined view. Each YT Playlist Report URL covers one playlist; use YouTube Playlist Analyzer if side-by-side multi-playlist comparison is essential." },
      { question: "Which one is better for a student?", answer: "For one course or lecture playlist, YT Playlist Report offers the more focused experience: search titles, select a range, adjust playback speed, and inspect each video's metrics." },
    ],
    sources: [
      { label: "YouTube Playlist Analyzer homepage", url: "https://www.youtubeplaylistanalyzer.com/" },
      { label: "YouTube Playlist Analyzer FAQ", url: "https://www.youtubeplaylistanalyzer.com/faq" },
    ],
    lastReviewed,
  },
  {
    slug: "yt-playlist-report-vs-playlistlength-app",
    competitorName: "PlaylistLength.app",
    competitorUrl: "https://playlistlength.app/",
    seo: {
      title: "YT Playlist Report vs PlaylistLength.app: Detailed Comparison",
      description:
        "Compare YT Playlist Report and PlaylistLength.app for playlist duration, CSV export, video metrics, API key fallback, range analysis, search, and sharing.",
    },
    eyebrow: "Interactive exploration vs quick duration and export",
    verdict:
      "Use YT Playlist Report when you want to investigate the videos, not just total them. PlaylistLength.app is a good fit when CSV export or its API-key fallback matters.",
    summary:
      "PlaylistLength.app keeps the job compact: calculate a playlist's length, surface useful extremes, and offer data export. YT Playlist Report is designed for the next set of questions learners usually ask—what videos are included, which are longest or most viewed, how long does a chosen section take, and how can the report be shared? Its searchable and sortable per-video table makes it a more capable everyday analysis workspace. PlaylistLength.app remains attractive when a downloadable CSV or bring-your-own-key fallback is more important than interactive exploration.",
    bestFor:
      "Learners and researchers who need to search, sort, filter, and share a detailed public playlist report.",
    competitorBestFor:
      "Users who mainly need a quick aggregate, shortest and longest video callouts, or a CSV file.",
    featureRows: [
      { feature: "Total playlist duration", ytpr: "Available", competitor: "Available", winner: "Tie" },
      { feature: "Per-video engagement metrics", ytpr: "Views, likes, and publish date", competitor: "Duration-focused", winner: "YT Playlist Report" },
      { feature: "Search, sorting, and columns", ytpr: "Built in", competitor: "Not highlighted", winner: "YT Playlist Report" },
      { feature: "Range and speed calculation", ytpr: "Range plus 0.25×–2×", competitor: "Speed-adjusted totals", winner: "YT Playlist Report" },
      { feature: "Shareable report route", ytpr: "Dedicated URL", competitor: "Not highlighted", winner: "YT Playlist Report" },
      { feature: "CSV export", ytpr: "Not available", competitor: "Available", winner: "Competitor" },
      { feature: "Bring-your-own API key fallback", ytpr: "Not needed", competitor: "Available", winner: "Competitor" },
    ],
    strengths: [
      "Inspect views, likes, publication dates, video lengths, and positions in the same report.",
      "Find a particular lesson by title and sort the table around the question you are answering.",
      "Calculate only the part you intend to watch and immediately adjust that plan for playback speed.",
      "Bookmark or share the report URL without downloading a file first.",
    ],
    concessions: [
      "PlaylistLength.app offers CSV export, while YT Playlist Report currently keeps results in its interactive report.",
      "Its shortest and longest summaries and bring-your-own API key fallback are useful conveniences for a duration-first workflow.",
    ],
    faqs: [
      { question: "Which tool shows more information about each video?", answer: "YT Playlist Report exposes a configurable table with duration, views, likes, publication date, position, and direct video links." },
      { question: "Can I download a CSV from YT Playlist Report?", answer: "Not currently. PlaylistLength.app is the better choice if CSV export is a required part of your workflow." },
      { question: "What is the benefit of a shareable report URL?", answer: "A stable report link lets collaborators open the same playlist view without receiving an exported file or repeating your setup." },
      { question: "Do either of these tools support playback speed?", answer: "Both address speed-adjusted viewing time. YT Playlist Report pairs speed with an adjustable video range for planning just one section." },
    ],
    sources: [{ label: "PlaylistLength.app homepage", url: "https://playlistlength.app/" }],
    lastReviewed,
  },
  {
    slug: "yt-playlist-report-vs-youtubeplaylistlength-org",
    competitorName: "YouTubePlaylistLength.org",
    competitorUrl: "https://youtubeplaylistlength.org/playlist-duration-calculator/",
    seo: {
      title: "YT Playlist Report vs YouTubePlaylistLength.org: Comparison",
      description:
        "Compare YT Playlist Report and YouTubePlaylistLength.org for playlist duration, multi-link totals, planning, exports, metrics, search, ranges, and sharing.",
    },
    eyebrow: "One deep report vs multi-link duration planning",
    verdict:
      "YT Playlist Report is better for exploring one playlist in depth. YouTubePlaylistLength.org is more suitable for combining links, exporting results, or planning by day.",
    summary:
      "These tools answer related but distinct planning questions. YT Playlist Report builds a detailed workspace around one public playlist, with engagement data, title search, sorting, configurable columns, range selection, speed controls, and a shareable route. YouTubePlaylistLength.org advertises a broader calculator workflow that can accept multiple links, divide viewing into daily plans, export data, and support more languages. Pick based on whether you need depth inside one playlist or aggregate planning across several inputs.",
    bestFor:
      "People investigating the contents and engagement signals of a single public playlist in detail.",
    competitorBestFor:
      "People combining multiple playlist links, producing an export, localizing the interface, or dividing viewing across days.",
    featureRows: [
      { feature: "Detailed one-playlist report", ytpr: "Core workflow", competitor: "Calculator view", winner: "YT Playlist Report" },
      { feature: "Video engagement table", ytpr: "Views, likes, dates, and duration", competitor: "Duration-oriented", winner: "YT Playlist Report" },
      { feature: "Title search and column controls", ytpr: "Built in", competitor: "Not highlighted", winner: "YT Playlist Report" },
      { feature: "Selected video range", ytpr: "Interactive range selector", competitor: "Planning tools", winner: "YT Playlist Report" },
      { feature: "Multiple playlist links", ytpr: "One playlist per report", competitor: "Available", winner: "Competitor" },
      { feature: "Daily viewing plan", ytpr: "Manual via ranges", competitor: "Available", winner: "Competitor" },
      { feature: "Exports and localization", ytpr: "Not available", competitor: "Advertised", winner: "Competitor" },
    ],
    strengths: [
      "Move from an aggregate duration into the exact videos, metrics, and sequence behind it.",
      "Search and sort the playlist when you are studying a topic or auditing a creator's catalog.",
      "Select a precise run of videos and see its total and average duration at your playback speed.",
      "Give another person the report URL so the analysis remains easy to revisit.",
    ],
    concessions: [
      "YouTubePlaylistLength.org supports multi-link calculations and daily planning, which are outside YT Playlist Report's current one-playlist scope.",
      "It also advertises exports and localization, making it more flexible for some international or spreadsheet-based workflows.",
    ],
    faqs: [
      { question: "Can YT Playlist Report total several playlists together?", answer: "No. It creates a focused report for one playlist at a time. YouTubePlaylistLength.org is better suited to a combined multi-link total." },
      { question: "Which tool has the richer per-video view?", answer: "YT Playlist Report is built around a searchable, sortable table with duration and engagement details for each available video." },
      { question: "How can I make a daily study plan in YT Playlist Report?", answer: "Use the range selector and playback-speed control to size a session, then move the range forward as you progress. The competing tool offers a more explicit daily planner." },
      { question: "Are the reports shareable?", answer: "YT Playlist Report gives public playlist analyses a dedicated URL you can bookmark or send to someone else." },
    ],
    sources: [
      { label: "YouTubePlaylistLength.org calculator", url: "https://youtubeplaylistlength.org/playlist-duration-calculator/" },
      { label: "YouTubePlaylistLength.org privacy page", url: "https://youtubeplaylistlength.org/privacy/" },
    ],
    lastReviewed,
  },
  {
    slug: "yt-playlist-report-vs-tunepocket",
    competitorName: "TunePocket",
    competitorUrl: "https://www.tunepocket.com/youtube-playlist-length-calculator/",
    seo: {
      title: "YT Playlist Report vs TunePocket Playlist Calculator Compared",
      description:
        "Compare YT Playlist Report and TunePocket for YouTube playlist length, ads, captcha, detailed metrics, range selection, search, sorting, and creator tools.",
    },
    eyebrow: "Dedicated ad-free analysis vs a creator-tool calculator",
    verdict:
      "YT Playlist Report is the better dedicated analyzer for detailed, distraction-free playlist work. TunePocket makes sense if you already use its broader creator suite.",
    summary:
      "TunePocket's playlist length calculator is one utility inside a larger collection of creator tools. It is useful for a quick aggregate and may fit naturally if you already use that ecosystem. YT Playlist Report is purpose-built around public playlist analysis: it provides a detailed video table, engagement signals, title search, sorting, selectable columns, range calculations, multiple playback speeds, and a shareable report URL. It also presents the analysis without advertising or a captcha, which keeps repeat study and research sessions focused.",
    bestFor:
      "Learners, reviewers, and researchers who want a dedicated, ad-free report with detailed controls.",
    competitorBestFor:
      "Creators who want a simple aggregate calculator alongside TunePocket's wider music and video utilities.",
    featureRows: [
      { feature: "Playlist duration total", ytpr: "Available", competitor: "Available", winner: "Tie" },
      { feature: "Advertising in analyzer", ytpr: "No ads", competitor: "Ads may be shown", winner: "YT Playlist Report" },
      { feature: "Captcha during use", ytpr: "No captcha", competitor: "Login can hide captcha", winner: "YT Playlist Report" },
      { feature: "Detailed video metrics", ytpr: "Duration, views, likes, dates", competitor: "Aggregate-focused", winner: "YT Playlist Report" },
      { feature: "Range, search, and sorting", ytpr: "Built in", competitor: "Not highlighted", winner: "YT Playlist Report" },
      { feature: "Shareable report URL", ytpr: "Dedicated route", competitor: "Calculator page", winner: "YT Playlist Report" },
      { feature: "Broader creator toolkit", ytpr: "Playlist analysis only", competitor: "Large creator-tool suite", winner: "Competitor" },
    ],
    strengths: [
      "Analyze repeatedly without advertisements interrupting the report or a captcha interrupting the workflow.",
      "Inspect and reorganize a detailed per-video table instead of stopping at an overall duration.",
      "Search a large playlist and limit timing calculations to the exact videos you plan to watch.",
      "Share a direct report route with classmates, collaborators, or clients.",
    ],
    concessions: [
      "TunePocket's calculator sits beside a broad set of music, video, and creator utilities, which is convenient for people already using that suite.",
      "TunePocket says an optional login can remove calculator ads and captcha, although that adds an account step YT Playlist Report does not require.",
    ],
    faqs: [
      { question: "Does YT Playlist Report show ads or a captcha?", answer: "No. The current analysis flow is ad-free and does not ask you to complete a captcha." },
      { question: "Is TunePocket only a playlist calculator?", answer: "No. Its calculator is part of a much larger creator-focused toolkit, which may be a benefit if you need those adjacent utilities." },
      { question: "Which tool is better for examining individual videos?", answer: "YT Playlist Report provides the deeper view, including a searchable and sortable table with duration, views, likes, publication date, and links." },
      { question: "Do I need an account for YT Playlist Report?", answer: "No account is required to analyze a supported public playlist or share its report URL." },
    ],
    sources: [
      { label: "TunePocket playlist length calculator", url: "https://www.tunepocket.com/youtube-playlist-length-calculator/" },
    ],
    lastReviewed,
  },
];

export const comparisonBySlug = new Map(
  comparisons.map((comparison) => [comparison.slug, comparison])
);

export const comparisonPath = (comparison: Comparison) =>
  `/compare/${comparison.slug}`;
