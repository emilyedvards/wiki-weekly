import "./styles.css";

type WikimediaTopArticle = {
  article: string;
  views: number;
};

type WikimediaTopResponse = {
  items: Array<{
    articles: WikimediaTopArticle[];
  }>;
};

type RankedArticle = {
  title: string;
  slug: string;
  views: number;
  categories?: string[];
  thumbnailUrl?: string;
};

type EowWeek = {
  year: number;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  title: string;
  views: number;
  pageUrl: string;
  descriptionHtml?: string;
  thumbnailUrl?: string;
  pageId?: string;
  slug?: string;
};

type EowArchive = {
  year: number;
  updatedAt: string;
  weeks: EowWeek[];
};

const CATEGORIES = [
  "Overall",
  "Music",
  "Movies",
  "TV",
  "Celebrities",
  "Internet Culture",
  "Sports",
  "Politics",
  "Current Events",
] as const;

type Category = (typeof CATEGORIES)[number];

type WikipediaImageResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        thumbnail?: {
          source?: string;
        };
      }
    >;
  };
};

type WikipediaArticleFilesResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        images?: Array<{
          title: string;
        }>;
      }
    >;
  };
};

type WikipediaFileInfoResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: Array<{
          thumburl?: string;
          url?: string;
        }>;
      }
    >;
  };
};

type WikipediaCategoriesResponse = {
  continue?: {
    clcontinue?: string;
    continue?: string;
  };
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        categories?: Array<{
          title: string;
        }>;
      }
    >;
  };
};

const appRoot = document.querySelector<HTMLElement>("#app");

if (!appRoot) {
  throw new Error("App root was not found.");
}

const app: HTMLElement = appRoot;

type LogoFont = {
  name: string;
  stack: string;
};

const LOGO_FONTS = [
  { name: "Noseblood", stack: '"Noseblood", Arial, Helvetica, sans-serif' },
  { name: "Thinman", stack: '"Thinman", Arial, Helvetica, sans-serif' },
  { name: "Tetrominoes", stack: '"Tetrominoes", Arial, Helvetica, sans-serif' },
  { name: "Arial Black", stack: '"Arial Black", Impact, sans-serif' },
  { name: "Impact", stack: 'Impact, "Arial Black", sans-serif' },
  { name: "Georgia", stack: 'Georgia, "Times New Roman", serif' },
  { name: "Times New Roman", stack: '"Times New Roman", Times, serif' },
  { name: "Courier New", stack: '"Courier New", Courier, monospace' },
  { name: "Verdana", stack: 'Verdana, Geneva, sans-serif' },
  { name: "Trebuchet MS", stack: '"Trebuchet MS", Arial, sans-serif' },
  { name: "System Serif", stack: 'ui-serif, Georgia, "Times New Roman", serif' },
  { name: "System Mono", stack: 'ui-monospace, "Courier New", monospace' },
];
const LOGO_ANIMATION_INTERVAL_MS = 90;
const LOADING_PROGRESS_INTERVAL_MS = 100;
const LOGO_FONT_STORAGE_KEY = "twow-logo-font";
const EOW_TILE_SIZE_STORAGE_KEY = "twow-eow-tile-size";
const EOW_TILE_SIZE_DEFAULT = 160;
const EOW_TILE_SIZE_MIN = 88;
const EOW_TILE_SIZE_MAX = 260;
const EOW_SHARE_WIDTH = 1080;
const EOW_SHARE_HEIGHT = 1920;
function getLogoFinalFont(): LogoFont {
  const storedFontName = window.localStorage.getItem(LOGO_FONT_STORAGE_KEY);
  const storedFont = LOGO_FONTS.find((font) => font.name === storedFontName);

  if (storedFont) {
    return storedFont;
  }

  const font = LOGO_FONTS[Math.floor(Math.random() * LOGO_FONTS.length)];
  window.localStorage.setItem(LOGO_FONT_STORAGE_KEY, font.name);
  return font;
}

const logoFinalFont = getLogoFinalFont();
let logoAnimationTimer: number | undefined;
let logoAnimationRequested = false;
let loadingProgressTimer: number | undefined;
let loadingProgressValue = 0;

function getToday(): Date {
  const previewDate = new URLSearchParams(window.location.search).get("previewDate");

  if (previewDate) {
    const [year, month, day] = previewDate.split("-").map(Number);

    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }

  return new Date();
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getCurrentWeekRange(today = getToday()): { monday: Date; sunday: Date } {
  const localToday = startOfLocalDay(today);
  const day = localToday.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  // Monday reset logic: every local Monday at 12:00 AM, the visible week starts over.
  const monday = addDays(localToday, -daysSinceMonday);
  const sunday = addDays(monday, 6);

  return { monday, sunday };
}

function getCompletedDaysForCurrentWeek(today = getToday()): Date[] {
  const { monday } = getCurrentWeekRange(today);
  const localToday = startOfLocalDay(today);
  const completedDays: Date[] = [];

  // Week date calculations: only days before local today are complete enough to count.
  for (let day = new Date(monday); day.getTime() < localToday.getTime(); day = addDays(day, 1)) {
    completedDays.push(new Date(day));
  }

  return completedDays;
}

function getPreviousWeekDays(today = getToday()): Date[] {
  const { monday } = getCurrentWeekRange(today);
  const previousMonday = addDays(monday, -7);

  // Week date calculations: the fallback list uses the previous full Monday-Sunday week.
  return Array.from({ length: 7 }, (_, index) => addDays(previousMonday, index));
}

function formatApiDate(date: Date): { year: string; month: string; day: string } {
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    day: String(date.getDate()).padStart(2, "0"),
  };
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatDateRange(monday: Date, sunday: Date): string {
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(monday);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const sameYear = monday.getFullYear() === sunday.getFullYear();

  if (sameMonth && sameYear) {
    return `${month} ${monday.getDate()}–${sunday.getDate()}, ${sunday.getFullYear()}`;
  }

  if (sameYear) {
    return `${formatDisplayDate(monday)}–${formatDisplayDate(sunday)}, ${sunday.getFullYear()}`;
  }

  return `${formatDisplayDate(monday)}, ${monday.getFullYear()}–${formatDisplayDate(sunday)}, ${sunday.getFullYear()}`;
}

function formatEowDateRange(startDate: Date, endDate: Date): string {
  return formatDateRange(startDate, endDate);
}

function formatViews(views: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  });

  return `${formatter.format(views)} views`;
}

function formatViewsNumber(views: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(views);
}

function readableTitle(slug: string): string {
  return decodeURIComponent(slug).replaceAll("_", " ");
}

function articleUrl(slug: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(slug).replaceAll("%2F", "/")}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}

function sanitizeInlineHtml(value: string): string {
  const allowedTags = new Set(["b", "strong", "i", "em", "sup", "sub"]);
  const template = document.createElement("template");

  template.innerHTML = value;

  const sanitizeNode = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        continue;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        continue;
      }

      const element = child as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      sanitizeNode(element);

      if (!allowedTags.has(tagName)) {
        element.replaceWith(...Array.from(element.childNodes));
        continue;
      }

      for (const attribute of Array.from(element.attributes)) {
        element.removeAttribute(attribute.name);
      }
    }
  };

  sanitizeNode(template.content);

  return template.innerHTML;
}

function splitLeadDescriptionHtml(descriptionHtml: string): { lead: string; rest: string } {
  const boundaryPatterns = [/\s+\(/, /\s+(?:is|are|was|were)\s+/i];

  for (const pattern of boundaryPatterns) {
    const match = pattern.exec(descriptionHtml);

    if (match && match.index > 0) {
      return {
        lead: descriptionHtml.slice(0, match.index),
        rest: descriptionHtml.slice(match.index),
      };
    }
  }

  return {
    lead: descriptionHtml,
    rest: "",
  };
}

function renderLinkedDescription(week: EowWeek): string {
  if (!week.descriptionHtml) {
    return `
      <h2 id="eow-modal-title">
        <a href="${escapeHtml(week.pageUrl)}" target="_blank" rel="noreferrer">${escapeHtml(week.title)}</a>
      </h2>
    `;
  }

  const description = sanitizeInlineHtml(week.descriptionHtml);
  const { lead, rest } = splitLeadDescriptionHtml(description);

  if (!rest) {
    return `
      <p class="modal-description" id="eow-modal-title">
        <a class="modal-description-link" href="${escapeHtml(week.pageUrl)}" target="_blank" rel="noreferrer">${escapeHtml(week.title)}</a>: ${description}
      </p>
    `;
  }

  return `
    <p class="modal-description" id="eow-modal-title">
      <a class="modal-description-link" href="${escapeHtml(week.pageUrl)}" target="_blank" rel="noreferrer">${lead}</a>${rest}
    </p>
  `;
}

function getPathSegments(): string[] {
  return window.location.pathname.split("/").filter(Boolean);
}

function getCurrentArchiveYear(): number {
  return getToday().getFullYear();
}

function archiveDataUrl(year: number): string {
  return `/data/eow-${year}.json`;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getEowTileSize(): number {
  const storedValue = window.localStorage.getItem(EOW_TILE_SIZE_STORAGE_KEY);
  const parsedValue = storedValue ? Number(storedValue) : EOW_TILE_SIZE_DEFAULT;

  if (!Number.isFinite(parsedValue)) {
    return EOW_TILE_SIZE_DEFAULT;
  }

  return clampNumber(parsedValue, EOW_TILE_SIZE_MIN, EOW_TILE_SIZE_MAX);
}

function getEowSliderProgress(tileSize: number): number {
  return ((tileSize - EOW_TILE_SIZE_MIN) / (EOW_TILE_SIZE_MAX - EOW_TILE_SIZE_MIN)) * 100;
}

function setLogoFont(font: LogoFont): void {
  const logo = app.querySelector<HTMLElement>(".title");

  if (!logo) {
    return;
  }

  logo.style.fontFamily = font.stack;
}

async function waitForLogoFonts(): Promise<void> {
  if (!("fonts" in document)) {
    return;
  }

  await Promise.all([
    document.fonts.load('1em "Noseblood"'),
    document.fonts.load('1em "Thinman"'),
    document.fonts.load('1em "Tetrominoes"'),
    document.fonts.ready,
  ]);
}

function startLogoAnimation(): void {
  if (logoAnimationTimer !== undefined) {
    return;
  }

  logoAnimationRequested = true;

  void waitForLogoFonts().finally(() => {
    if (!logoAnimationRequested) {
      setLogoFont(logoFinalFont);
      return;
    }

    let step = 0;

    logoAnimationTimer = window.setInterval(() => {
      const font = LOGO_FONTS[step % LOGO_FONTS.length];
      setLogoFont(font);
      step += 1;
    }, LOGO_ANIMATION_INTERVAL_MS);
  });
}

function stopLogoAnimation(): void {
  logoAnimationRequested = false;

  if (logoAnimationTimer !== undefined) {
    window.clearInterval(logoAnimationTimer);
    logoAnimationTimer = undefined;
  }

  setLogoFont(logoFinalFont);
}

function updateLoadingProgress(value: number): void {
  const progress = app.querySelector<HTMLElement>(".loading-progress");

  if (!progress) {
    return;
  }

  loadingProgressValue = value;
  progress.textContent = `${value}%`;
  progress.setAttribute("aria-valuenow", String(value));
}

function startLoadingProgress(): void {
  loadingProgressValue = 0;
  updateLoadingProgress(loadingProgressValue);

  loadingProgressTimer = window.setInterval(() => {
    const increment = loadingProgressValue < 60 ? 2 : 1;
    updateLoadingProgress(Math.min(95, loadingProgressValue + increment));

    if (loadingProgressValue >= 95 && loadingProgressTimer !== undefined) {
      window.clearInterval(loadingProgressTimer);
      loadingProgressTimer = undefined;
    }
  }, LOADING_PROGRESS_INTERVAL_MS);
}

async function completeLoadingProgress(): Promise<void> {
  const progress = app.querySelector<HTMLElement>(".loading-progress");

  if (!progress) {
    return;
  }

  if (loadingProgressTimer !== undefined) {
    window.clearInterval(loadingProgressTimer);
    loadingProgressTimer = undefined;
  }

  updateLoadingProgress(100);
  await new Promise<void>((resolve) => window.setTimeout(resolve, 180));
}

function imageScore(articleTitle: string, fileTitle: string): number {
  const article = articleTitle.toLowerCase();
  const file = fileTitle.toLowerCase();
  const significantWords = article
    .replace(/\(.+?\)/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  let score = 0;

  if (file.includes(article)) {
    score += 100;
  }

  for (const word of significantWords) {
    if (file.includes(word)) {
      score += 10;
    }
  }

  if (file.endsWith(".svg")) {
    score += 5;
  }

  if (/\b(app icon|lockup|title card|titlecard|wordmark)\b/.test(file)) {
    score += 25;
  }

  if (/\b(poster|cover|emblem|logo|seal|flag)\b/.test(file)) {
    score += 40;
  }

  if (/\b(first|old|former|historical|2004|2006|2010|2017)\b/.test(file)) {
    score -= 20;
  }

  if (/\b(portal|puzzle|protection|shackle|userbox|wikiquote|generic|icon|smiley)\b/.test(file)) {
    score -= 100;
  }

  return score;
}

function chooseArticleImage(articleTitle: string, files: Array<{ title: string }> = []): string | undefined {
  const usableFiles = files.filter((file) => /\.(gif|jpe?g|png|svg|webp)$/i.test(file.title));

  return usableFiles
    .map((file) => ({
      title: file.title,
      score: imageScore(articleTitle, file.title),
    }))
    .filter((file) => file.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.title;
}

function isWeakThumbnailUrl(articleTitle: string, thumbnailUrl = ""): boolean {
  const normalizedTitle = articleTitle.toLowerCase();
  const decodedUrl = decodeURIComponent(thumbnailUrl).toLowerCase();
  const mapPattern = /(?:^|[^a-z0-9])map(?:[^a-z0-9]|$)|location[_ -]?map/;

  if (mapPattern.test(normalizedTitle)) {
    return false;
  }

  return mapPattern.test(decodedUrl);
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function isArticlePage(slug: string): boolean {
  const title = readableTitle(slug).trim();
  const normalized = title.toLowerCase();

  // Filtering utility pages: remove namespaces and obvious non-content destinations.
  const blockedPrefixes = [
    "api/",
    "book:",
    "category:",
    "draft:",
    "file:",
    "help:",
    "mediawiki:",
    "module:",
    "portal:",
    "special:",
    "talk:",
    "template:",
    "template talk:",
    "timedtext:",
    "user:",
    "user talk:",
    "wikipedia:",
    "wikipedia talk:",
  ];

  const blockedExactTitles = new Set([
    "",
    ".xyz",
    "ejaculation",
    "erection",
    "main page",
    "neatsville, kentucky",
    "search",
    "wikimedia foundation",
    "wikipedia",
  ]);

  if (blockedExactTitles.has(normalized)) {
    return false;
  }

  if (/^\.[a-z0-9-]{2,63}$/.test(normalized)) {
    return false;
  }

  if (blockedPrefixes.some((prefix) => normalized.startsWith(prefix))) {
    return false;
  }

  return !normalized.includes("404.php") && !normalized.includes("undefined");
}

function categoryMatches(article: RankedArticle, category: Category): boolean {
  if (category === "Overall") {
    return true;
  }

  const title = article.title.toLowerCase();
  const categoryText = (article.categories ?? []).join(" ").toLowerCase();
  const haystack = `${title} ${categoryText}`;
  const currentYear = String(getToday().getFullYear());
  const forcedCategories: Partial<Record<Category, string[]>> = {
    Movies: ["the odyssey (2026 film)", "obsession (2025 film)"],
    TV: ["house of the dragon", "ted lasso"],
    Celebrities: ["tom holland"],
    "Current Events": ["pan am flight 103", "2026 iran war"],
  };
  const excludedCategories: Partial<Record<Category, string[]>> = {
    Sports: ["ted lasso", "tom holland"],
    Movies: ["house of the dragon", "odyssey", "ted lasso"],
    Celebrities: ["obsession (2025 film)"],
    Politics: ["christopher nolan", "pan am flight 103"],
  };

  if (excludedCategories[category]?.includes(title)) {
    return false;
  }

  if (forcedCategories[category]?.includes(title)) {
    return true;
  }

  const isPerson = /\b(living people|births|deaths|actors|actresses|singers|rappers|musicians|athletes|players|people from|models|stylists|directors|writers|businesspeople|entrepreneurs|chief executives|podcasters|media personalities|bodyguards|comedians)\b/.test(
    categoryText,
  );
  const isFilm = /\b(film|films|movie|movies|cinema)\b/.test(haystack);
  const isTelevision = /\b(television series|tv series|television show|television program|television episode|streaming television|sitcom|miniseries|soap opera|game show|reality television series)\b/.test(
    haystack,
  );
  const isVideoGame = /\b(video game|video games|playstation|xbox|nintendo)\b/.test(haystack);
  const isSexPosition = /\b(sex position|sex positions|sexual position|sexual positions)\b/.test(haystack);
  const isSports = /\b(sport|sports|football|soccer|basketball|baseball|tennis|wimbledon|golf|cricket|ufc|mma|fighter|athlete|olympic|fifa|nba|nfl|mlb|nhl|wrestl)\b/.test(
    haystack,
  );
  const isPoliticalPerson = /\b(politician|politicians|president|presidents|prime minister|prime ministers|government minister|government ministers|cabinet member|cabinet members|senator|senators|representative|representatives|governor|governors|mayor|mayors|heads of state|heads of government|members of parliament|members of congress|members of the lok sabha)\b/.test(
    categoryText,
  );
  const isPoliticalTopic =
    /\b(election|elections|referendum|referendums|political party|political parties|legislature|legislatures|parliament|parliamentary|congress|congressional|senate|cabinet|government agency|government agencies|government ministry|government ministries|supreme court|constitutional court|legislation|treaty|treaties|diplomacy|diplomatic)\b/.test(
      haystack,
    ) ||
    // Avoid treating names such as Law Roach or Bill Murray as political topics.
    /\b(law|laws|bill|bills)\b/.test(categoryText);
  const isPoliticalAdjacentPerson = /\b(journalist|journalists|bodyguard|bodyguards|security guards|media personalities|podcaster|podcasters|commentator|commentators)\b/.test(
    `${title} ${categoryText}`,
  );
  const isCelebrityRole = /\b(actor|actors|actress|actresses|singer|singers|rapper|rappers|musician|musicians|athlete|athletes|footballer|basketball player|baseball player|tennis player|fighter|wrestler|comedian|comedians)\b/.test(
    categoryText,
  );
  const hasMajorPoliticalOffice = /\b(president|presidents|prime minister|prime ministers|government minister|government ministers|cabinet member|cabinet members|senator|senators|representative|representatives|governor|governors|heads of state|heads of government|members of parliament|members of congress|members of the lok sabha)\b/.test(
    categoryText,
  );
  const isMusicWork = /\b(\d{4} (albums|songs|singles|eps)|studio albums|live albums|compilation albums|soundtrack albums|debut albums|songs by|singles by|albums by|extended plays|concert tours|music festivals|record labels|discographies)\b/.test(
    categoryText,
  );
  const isMusicArtist = /\b(singer|singers|rapper|rappers|musician|musicians|songwriter|songwriters|record producer|record producers|musical artist|musical artists|band|bands|music groups|musical groups)\b/.test(
    categoryText,
  );
  const hasExplicitMusicTitle = /\((song|album|ep|soundtrack)\)|\bdiscography\b/.test(title);
  const isCurrentEventTopic =
    (title.includes(currentYear) ||
      /\b(war|attack|disaster|earthquake|hurricane|protest|summit|trial|conflict|crisis|incident|assassination|assassinations|shooting|shootings|murder|murders)\b/.test(
        title,
      )) &&
    /\b(event|events|war|attack|disaster|earthquake|hurricane|protest|summit|trial|conflict|crisis|incident|tournament|world cup|championship|awards|ceremony|assassination|assassinations|shooting|shootings|murder|murders)\b/.test(
      haystack,
    );

  switch (category) {
    case "Music":
      return (
        !isSports &&
        !isPoliticalPerson &&
        (!(isFilm || isTelevision || isVideoGame) || hasExplicitMusicTitle) &&
        (isMusicWork || isMusicArtist || hasExplicitMusicTitle)
      );

    case "Movies":
      return !isTelevision && /\b(film|films|movie|movies|cinema|box office)\b/.test(haystack) && !isPerson;

    case "TV":
      return !isPerson && !isSports && !isFilm && isTelevision;

    case "Celebrities":
      return /\b(celebrity|actor|actress|model|stylist|stylists|influencer|youtuber|tiktoker|media personality|socialite|royalty|singer|rapper|musician)\b/.test(
        haystack,
      );

    case "Internet Culture":
      return (
        !isSports &&
        !isPoliticalPerson &&
        !isPoliticalTopic &&
        !isMusicArtist &&
        !isCurrentEventTopic &&
        !isSexPosition &&
        !isFilm &&
        !/\b(television series|tv series|television show|television program|streaming television|sitcom|miniseries|soap opera|game show)\b/.test(
          haystack,
        ) &&
        /\b(internet meme|internet memes|meme|memes|viral video|viral videos|viral phenomenon|viral phenomena|viral trend|viral trends|viral phrase|viral phrases|internet slang|online slang|slang|catchphrase|catchphrases|internet culture|online culture|digital culture|web culture|tiktok trend|tiktok trends|hashtag|hashtags|challenge|challenges|creepypasta|reaction image|reaction images|emoji|emojis|content creator|content creators|online creator|online creators|youtuber|youtubers|tiktoker|tiktokers|streamer|streamers|influencer|influencers|social media platform|social media platforms|online platform|online platforms|video-sharing platform|video-sharing platforms|mobile app|mobile apps|social media app|social media apps|online community|online communities|internet forum|internet forums|message board|message boards|internet phenomenon|internet phenomena|online phenomenon|online phenomena|collectible toy|collectible toys|designer toy|designer toys|art toy|art toys)\b/.test(
          haystack,
        )
      );

    case "Sports":
      return isSports;

    case "Politics":
      return (
        !isCurrentEventTopic &&
        !isPoliticalAdjacentPerson &&
        (!isCelebrityRole || hasMajorPoliticalOffice) &&
        (isPoliticalPerson || (!isPerson && isPoliticalTopic)) &&
        !isSports
      );

    case "Current Events":
      return (
        !isPoliticalPerson &&
        !isPoliticalTopic &&
        !isPerson &&
        !title.startsWith("list of ") &&
        isCurrentEventTopic
      );
  }
}

async function fetchTopArticlesForDay(date: Date): Promise<WikimediaTopArticle[]> {
  const { year, month, day } = formatApiDate(date);
  const endpoint = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia.org/all-access/${year}/${month}/${day}`;

  // Wikimedia API requests: request English Wikipedia's daily top pageviews endpoint.
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikimedia returned ${response.status} for ${year}-${month}-${day}.`);
  }

  const data = (await response.json()) as WikimediaTopResponse;
  return data.items[0]?.articles ?? [];
}

async function fetchArticleCategories(articles: RankedArticle[]): Promise<Map<string, string[]>> {
  const categories = new Map<string, string[]>();

  for (const articleChunk of chunkArray(articles, 50)) {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      prop: "categories",
      cllimit: "max",
      titles: articleChunk.map((article) => article.slug).join("|"),
    });

    while (true) {
      // Wikimedia API requests: fetch all category pages used for client-side filtering.
      const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Wikipedia categories returned ${response.status}.`);
      }

      const data = (await response.json()) as WikipediaCategoriesResponse;

      for (const page of Object.values(data.query?.pages ?? {})) {
        if (!page.title) {
          continue;
        }

        const existingCategories = categories.get(page.title) ?? [];
        const returnedCategories = (page.categories ?? []).map((category) =>
          category.title.replace(/^Category:/, ""),
        );
        categories.set(page.title, [...existingCategories, ...returnedCategories]);
      }

      if (!data.continue?.clcontinue) {
        break;
      }

      params.set("clcontinue", data.continue.clcontinue);
      params.set("continue", data.continue.continue ?? "");
    }
  }

  return categories;
}

async function fetchArticleThumbnails(slugs: string[]): Promise<Map<string, string>> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    redirects: "1",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "360",
    pilicense: "any",
    titles: slugs.join("|"),
  });

  // Wikimedia API requests: ask English Wikipedia for each article's preferred page image.
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikipedia image metadata returned ${response.status}.`);
  }

  const data = (await response.json()) as WikipediaImageResponse;
  const thumbnails = new Map<string, string>();

  for (const page of Object.values(data.query?.pages ?? {})) {
    if (page.title && page.thumbnail?.source) {
      thumbnails.set(page.title, page.thumbnail.source);
    }
  }

  return thumbnails;
}

async function fetchArticleFileThumbnails(articles: RankedArticle[]): Promise<Map<string, string>> {
  const thumbnails = new Map<string, string>();

  for (const article of articles) {
    const fileTitle = await fetchBestArticleFileTitle(article);

    if (!fileTitle) {
      continue;
    }

    const imageUrl = await fetchFileThumbnailUrl(fileTitle);

    if (imageUrl) {
      thumbnails.set(article.title, imageUrl);
    }
  }

  return thumbnails;
}

async function fetchBestArticleFileTitle(article: RankedArticle): Promise<string | undefined> {
  const fileParams = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    redirects: "1",
    prop: "images",
    imlimit: "50",
    titles: article.slug,
  });

  // Wikimedia API requests: fallback to files embedded in the article when no page image exists.
  const fileResponse = await fetch(`https://en.wikipedia.org/w/api.php?${fileParams.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!fileResponse.ok) {
    throw new Error(`Wikipedia article files returned ${fileResponse.status}.`);
  }

  const fileData = (await fileResponse.json()) as WikipediaArticleFilesResponse;
  const page = Object.values(fileData.query?.pages ?? {})[0];

  return page?.title ? chooseArticleImage(page.title, page.images) : undefined;
}

async function fetchFileThumbnailUrl(fileTitle: string): Promise<string | undefined> {
  const imageInfoParams = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "360",
    titles: fileTitle,
  });

  const imageInfoResponse = await fetch(`https://en.wikipedia.org/w/api.php?${imageInfoParams.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!imageInfoResponse.ok) {
    throw new Error(`Wikipedia image files returned ${imageInfoResponse.status}.`);
  }

  const imageInfoData = (await imageInfoResponse.json()) as WikipediaFileInfoResponse;
  const page = Object.values(imageInfoData.query?.pages ?? {})[0];

  return page?.imageinfo?.[0]?.thumburl ?? page?.imageinfo?.[0]?.url;
}

function canUseArticleFileThumbnailFallback(article: RankedArticle): boolean {
  const categoryText = (article.categories ?? []).join(" ").toLowerCase();

  if (
    /\b(living people|births|deaths|actors|actresses|singers|rappers|musicians|politicians|athletes|players|people from)\b/.test(
      categoryText,
    )
  ) {
    return false;
  }

  return /\b(films|television|tv series|video games|browser games|word games|online games|internet culture|media franchises)\b/.test(
    categoryText,
  );
}

async function hydrateThumbnails(articles: RankedArticle[]): Promise<RankedArticle[]> {
  try {
    const thumbnails = await fetchArticleThumbnails(articles.map((article) => article.slug));
    const missingFallbackArticles = articles.filter((article) => {
      const thumbnailUrl = thumbnails.get(article.title);

      return (!thumbnailUrl || isWeakThumbnailUrl(article.title, thumbnailUrl)) && canUseArticleFileThumbnailFallback(article);
    });
    const fallbackThumbnails =
      missingFallbackArticles.length > 0 ? await fetchArticleFileThumbnails(missingFallbackArticles) : new Map<string, string>();

    return articles.map((article) => ({
      ...article,
      thumbnailUrl: fallbackThumbnails.get(article.title) ??
        (isWeakThumbnailUrl(article.title, thumbnails.get(article.title)) ? undefined : thumbnails.get(article.title)),
    }));
  } catch {
    return articles;
  }
}

async function getRankedArticlesForDays(days: Date[]): Promise<RankedArticle[]> {
  const dailyResults = await Promise.allSettled(days.map(fetchTopArticlesForDay));
  const fulfilledResults = dailyResults.filter((result) => result.status === "fulfilled");
  const totals = new Map<string, number>();

  if (fulfilledResults.length === 0) {
    throw new Error("No Wikimedia pageview data was available for the completed days.");
  }

  // Pageview aggregation logic: add each article's daily views across completed days.
  for (const result of fulfilledResults) {
    for (const article of result.value) {
      if (!isArticlePage(article.article)) {
        continue;
      }

      totals.set(article.article, (totals.get(article.article) ?? 0) + article.views);
    }
  }

  const articles = Array.from(totals.entries())
    .map(([slug, views]) => ({
      title: readableTitle(slug),
      slug,
      views,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 1000);

  try {
    const categoryMap = await fetchArticleCategories(articles);

    return articles.map((article) => ({
      ...article,
      categories: categoryMap.get(article.title) ?? [],
    }));
  } catch {
    return articles;
  }
}

async function getWeeklyTopTen(): Promise<RankedArticle[]> {
  const days = getCompletedDaysForCurrentWeek();

  if (days.length === 0) {
    return [];
  }

  return getRankedArticlesForDays(days);
}

async function getPreviousWeeklyTopTen(): Promise<RankedArticle[]> {
  return getRankedArticlesForDays(getPreviousWeekDays());
}

function categoryFiltersMarkup(selectedCategory: Category): string {
  return `
    <nav class="category-filter" aria-label="Ranking categories">
      ${CATEGORIES.map((category, index) => {
        const separator = index < CATEGORIES.length - 1 ? `<span class="category-separator">|</span>` : "";

        return `
          <button
            class="category-button${category === selectedCategory ? " is-selected" : ""}"
            type="button"
            data-category="${category}"
            aria-pressed="${category === selectedCategory}"
          >${category}</button>${separator}
        `;
      }).join("")}
    </nav>
  `;
}

function shell(content: string, selectedCategory: Category = "Overall"): string {
  const { monday, sunday } = getCurrentWeekRange();

  return `
    <section class="publication">
      <header class="masthead">
        <a class="title title-link" href="/">TWOW</a>
        <p class="kicker">This Week on Wikipedia</p>
        <time class="date-range">Week of: ${formatDateRange(monday, sunday)}</time>
        <h1>What people are reading.</h1>
        ${categoryFiltersMarkup(selectedCategory)}
      </header>
      ${content}
      <footer>
        <span class="delay-note">*24-hour delay</span>
        <a class="footer-link" href="/EOW">EOW</a>
        <a class="credit" href="https://www.instagram.com/emilyedwards" target="_blank" rel="noreferrer">TWOW by ee</a>
      </footer>
    </section>
  `;
}

function eowShell(content: string, archiveLinks = ""): string {
  return `
    <section class="publication eow-publication">
      <header class="masthead eow-masthead">
        <a class="title title-link" href="/">TWOW</a>
        <p class="kicker">This Week on Wikipedia</p>
        <p class="date-range eow-archive-title">End of Week Archive</p>
        <h1 class="eow-archive-subhead">Wikipedia’s top-viewed page by week.</h1>
      </header>
      ${content}
      <footer>
        <span class="delay-note">*Updates every Monday</span>
        <span class="footer-center">
          <a class="footer-link" href="/">TWOW</a>
          ${archiveLinks}
        </span>
        <a class="credit" href="https://www.instagram.com/emilyedwards" target="_blank" rel="noreferrer">TWOW by ee</a>
      </footer>
    </section>
  `;
}

function renderLoading(): void {
  app.innerHTML = shell(`
    <p class="status">
      Loading this week's pages.
      <span class="loading-progress" role="progressbar" aria-label="Loading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">0%</span>
    </p>
  `);
  startLoadingProgress();
  startLogoAnimation();
}

async function renderEmpty(): Promise<void> {
  await completeLoadingProgress();
  app.innerHTML = shell(`<p class="status">This week is still coming into view.</p>`);
  stopLogoAnimation();
}

async function renderPreviousWeekFallback(articles: RankedArticle[], selectedCategory: Category = "Overall"): Promise<void> {
  const selectedArticles = articlesForCategory(articles, selectedCategory);
  const hydratedArticles = await hydrateThumbnails(selectedArticles);
  await completeLoadingProgress();

  app.innerHTML = shell(`
    <p class="status">*Note: This week will be available starting tomorrow. In the meantime, here's what people were reading about the last 7 days.</p>
    ${rankedTableMarkup(hydratedArticles)}
  `, selectedCategory);
  stopLogoAnimation();
  enableCategoryFilters(articles, selectedCategory, renderPreviousWeekFallback);
  enableThumbnailPreviews();
}

async function renderError(): Promise<void> {
  await completeLoadingProgress();
  app.innerHTML = shell(`<p class="status">This week is temporarily unavailable.</p>`);
  stopLogoAnimation();
}

async function fetchEowArchive(year: number): Promise<EowArchive | undefined> {
  const response = await fetch(archiveDataUrl(year), {
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(`EOW archive returned ${response.status}.`);
  }

  const archive = (await response.json()) as EowArchive;

  return {
    year: archive.year,
    updatedAt: archive.updatedAt ?? "",
    weeks: Array.isArray(archive.weeks) ? archive.weeks : [],
  };
}

async function getPreviousArchiveYears(currentYear: number): Promise<number[]> {
  const years: number[] = [];

  for (let year = 2026; year < currentYear; year += 1) {
    const archive = await fetchEowArchive(year).catch(() => undefined);

    if (archive && archive.weeks.length > 0) {
      years.push(year);
    }
  }

  return years;
}

function archiveLinksMarkup(years: number[]): string {
  if (years.length === 0) {
    return "";
  }

  return years
    .map((year) => `<a class="footer-link archive-link" href="/EOW/${year}">${year} Archive</a>`)
    .join("");
}

function eowGridMarkup(weeks: EowWeek[]): string {
  if (weeks.length === 0) {
    return `<p class="status">This year's archive will start filling in after the first completed week is available.</p>`;
  }

  const tileSize = getEowTileSize();
  const sliderProgress = getEowSliderProgress(tileSize);

  return `
    <div class="eow-toolbar">
      <button class="eow-share-link" type="button">Share</button>
      <div class="eow-size-control">
        <label for="eow-size-slider">Size</label>
        <input
          id="eow-size-slider"
          type="range"
          min="${EOW_TILE_SIZE_MIN}"
          max="${EOW_TILE_SIZE_MAX}"
          step="4"
          value="${tileSize}"
          style="--eow-slider-progress: ${sliderProgress}%"
          aria-label="Thumbnail size"
        />
      </div>
    </div>
    <div class="eow-grid" aria-label="Weekly Wikipedia winners" style="--eow-tile-size: ${tileSize}px">
      ${weeks
        .map((week, index) => {
          const image = week.thumbnailUrl
            ? `<img src="${escapeHtml(week.thumbnailUrl)}" alt="" loading="lazy" decoding="async" />`
            : `<span class="eow-fallback-title">${escapeHtml(week.title)}</span>`;
          const start = parseArchiveDate(week.weekStart);
          const end = parseArchiveDate(week.weekEnd);

          return `
            <button
              class="eow-tile${week.thumbnailUrl ? "" : " eow-tile-fallback"}"
              type="button"
              data-week-index="${index}"
              aria-label="${escapeHtml(`${week.title}, week of ${formatEowDateRange(start, end)}`)}"
            >
              ${image}
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function parseArchiveDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function renderEowModal(week: EowWeek): HTMLElement {
  const start = parseArchiveDate(week.weekStart);
  const end = parseArchiveDate(week.weekEnd);
  const overlay = document.createElement("div");

  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div
      class="eow-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eow-modal-title"
      aria-describedby="eow-modal-meta"
      tabindex="-1"
    >
      <button class="modal-close" type="button" aria-label="Close dialog">×</button>
      <p class="modal-date" id="eow-modal-meta">Week of: ${escapeHtml(formatEowDateRange(start, end))}</p>
      ${renderLinkedDescription(week)}
      <p class="modal-views">${formatViewsNumber(week.views)} views</p>
    </div>
  `;

  return overlay;
}

function renderEowShareModal(): HTMLElement {
  const overlay = document.createElement("div");

  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div
      class="eow-modal eow-share-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eow-share-title"
      aria-describedby="eow-share-status"
      tabindex="-1"
    >
      <button class="modal-close" type="button" aria-label="Close dialog">×</button>
      <h2 id="eow-share-title">Share EOW</h2>
      <p class="modal-date" id="eow-share-status">Preparing image.</p>
      <div class="eow-share-preview" aria-live="polite"></div>
      <a class="eow-download-link" href="#" download="eow-wikipedia-weeks.png" hidden>Download PNG</a>
    </div>
  `;

  return overlay;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'),
  ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
}

function openEowModal(week: EowWeek, trigger: HTMLElement): void {
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
  const overlay = renderEowModal(week);
  const dialog = overlay.querySelector<HTMLElement>(".eow-modal");
  const closeButton = overlay.querySelector<HTMLButtonElement>(".modal-close");

  if (!dialog || !closeButton) {
    return;
  }

  const close = () => {
    document.removeEventListener("keydown", handleKeydown);
    overlay.remove();
    document.body.classList.remove("is-modal-open");
    document.body.style.paddingRight = "";
    trigger.focus();
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(dialog);
    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (!firstElement || !lastElement) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      close();
    }
  });
  closeButton.addEventListener("click", close);
  document.addEventListener("keydown", handleKeydown);
  document.body.classList.add("is-modal-open");
  document.body.style.paddingRight = scrollBarWidth > 0 ? `${scrollBarWidth}px` : "";
  document.body.append(overlay);
  closeButton.focus();
}

function loadShareImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${src}`));
    image.src = src;
  });
}

function drawCoveredImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  const sourceWidth = imageRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
  const sourceHeight = imageRatio > targetRatio ? image.naturalHeight : image.naturalWidth / targetRatio;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawCoveredImageGrayscale(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  context.save();
  context.filter = "grayscale(1)";
  drawCoveredImage(context, image, x, y, width, height);
  context.restore();
}

function drawShareFallbackTile(
  context: CanvasRenderingContext2D,
  week: EowWeek,
  x: number,
  y: number,
  size: number,
): void {
  context.fillStyle = "#fff";
  context.fillRect(x, y, size, size);
  context.strokeStyle = "#c8ccd1";
  context.lineWidth = 2;
  context.strokeRect(x + 1, y + 1, size - 2, size - 2);
  context.fillStyle = "#202122";
  context.font = `${Math.max(22, Math.floor(size * 0.09))}px Arial, Helvetica, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  const words = week.title.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;

    if (context.measureText(testLine).width > size * 0.78 && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) {
    lines.push(line);
  }

  const visibleLines = lines.slice(0, 4);
  const lineHeight = Math.max(28, size * 0.12);
  const startY = y + size / 2 - ((visibleLines.length - 1) * lineHeight) / 2;

  visibleLines.forEach((visibleLine, index) => {
    context.fillText(visibleLine, x + size / 2, startY + index * lineHeight, size * 0.84);
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not create PNG."));
      }
    }, "image/png");
  });
}

async function generateEowShareImage(weeks: EowWeek[]): Promise<{ dataUrl: string; downloadUrl: string }> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable.");
  }

  canvas.width = EOW_SHARE_WIDTH;
  canvas.height = EOW_SHARE_HEIGHT;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000";
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.font = "34px Arial, Helvetica, sans-serif";
  context.fillText("Wikipedia's top-viewed pages by week in 2026.", canvas.width / 2, 112);

  const columns = 4;
  const rows = Math.ceil(weeks.length / columns);
  const horizontalMargin = 72;
  const gridTop = 170;
  const bottomMargin = 120;
  const gap = 6;
  const maxTileWidth = (canvas.width - horizontalMargin * 2 - gap * (columns - 1)) / columns;
  const maxTileHeight = (canvas.height - gridTop - bottomMargin - gap * Math.max(0, rows - 1)) / rows;
  const tileSize = Math.floor(Math.min(maxTileWidth, maxTileHeight));
  const gridWidth = tileSize * columns + gap * (columns - 1);
  const gridLeft = Math.floor((canvas.width - gridWidth) / 2);

  for (const [index, week] of weeks.entries()) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = gridLeft + column * (tileSize + gap);
    const y = gridTop + row * (tileSize + gap);

    if (!week.thumbnailUrl) {
      drawShareFallbackTile(context, week, x, y, tileSize);
      continue;
    }

    try {
      const image = await loadShareImage(week.thumbnailUrl);
      drawCoveredImageGrayscale(context, image, x, y, tileSize, tileSize);
    } catch {
      drawShareFallbackTile(context, week, x, y, tileSize);
    }
  }

  const gridBottom = gridTop + rows * tileSize + gap * Math.max(0, rows - 1);
  context.fillStyle = "#0000ee";
  context.font = "italic 24px Arial, Helvetica, sans-serif";
  context.fillText("https://wiki-weekly.com/eow", canvas.width / 2, Math.min(canvas.height - 56, gridBottom + 54));

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await canvasToBlob(canvas);
  return {
    dataUrl,
    downloadUrl: URL.createObjectURL(blob),
  };
}

function openEowShareModal(weeks: EowWeek[], trigger: HTMLElement): void {
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
  const overlay = renderEowShareModal();
  const dialog = overlay.querySelector<HTMLElement>(".eow-share-modal");
  const closeButton = overlay.querySelector<HTMLButtonElement>(".modal-close");
  const status = overlay.querySelector<HTMLElement>("#eow-share-status");
  const preview = overlay.querySelector<HTMLElement>(".eow-share-preview");
  const downloadLink = overlay.querySelector<HTMLAnchorElement>(".eow-download-link");
  let downloadUrl = "";

  if (!dialog || !closeButton || !status || !preview || !downloadLink) {
    return;
  }

  const close = () => {
    document.removeEventListener("keydown", handleKeydown);
    overlay.remove();
    document.body.classList.remove("is-modal-open");
    document.body.style.paddingRight = "";
    trigger.focus();

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(dialog);
    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (!firstElement || !lastElement) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      close();
    }
  });
  closeButton.addEventListener("click", close);
  document.addEventListener("keydown", handleKeydown);
  document.body.classList.add("is-modal-open");
  document.body.style.paddingRight = scrollBarWidth > 0 ? `${scrollBarWidth}px` : "";
  document.body.append(overlay);
  closeButton.focus();

  void generateEowShareImage(weeks)
    .then((image) => {
      downloadUrl = image.downloadUrl;
      status.textContent = "Ready to download.";
      preview.innerHTML = `<img src="${image.dataUrl}" alt="EOW share image preview" />`;
      downloadLink.href = downloadUrl;
      downloadLink.hidden = false;
    })
    .catch(() => {
      status.textContent = "The share image could not be prepared.";
    });
}

function enableEowModal(weeks: EowWeek[]): void {
  const buttons = app.querySelectorAll<HTMLButtonElement>(".eow-tile");
  const tooltip = document.createElement("div");

  tooltip.className = "eow-hover-tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.append(tooltip);

  const hideTooltip = () => {
    tooltip.classList.remove("is-visible");
  };

  const moveTooltip = (event: PointerEvent) => {
    tooltip.style.left = `${event.clientX + 14}px`;
    tooltip.style.top = `${event.clientY + 14}px`;
  };

  for (const button of buttons) {
    const index = Number(button.dataset.weekIndex);
    const week = weeks[index];

    if (!week) {
      continue;
    }

    button.addEventListener("click", () => openEowModal(week, button));
    button.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") {
        return;
      }

      tooltip.textContent = week.title;
      moveTooltip(event);
      tooltip.classList.add("is-visible");
    });
    button.addEventListener("pointermove", (event) => {
      if (event.pointerType === "mouse") {
        moveTooltip(event);
      }
    });
    button.addEventListener("pointerleave", hideTooltip);
    button.addEventListener("blur", hideTooltip);
  }
}

function enableEowSizeControl(): void {
  const slider = app.querySelector<HTMLInputElement>("#eow-size-slider");
  const grid = app.querySelector<HTMLElement>(".eow-grid");

  if (!slider || !grid) {
    return;
  }

  slider.addEventListener("input", () => {
    const tileSize = clampNumber(Number(slider.value), EOW_TILE_SIZE_MIN, EOW_TILE_SIZE_MAX);
    grid.style.setProperty("--eow-tile-size", `${tileSize}px`);
    slider.style.setProperty("--eow-slider-progress", `${getEowSliderProgress(tileSize)}%`);
    window.localStorage.setItem(EOW_TILE_SIZE_STORAGE_KEY, String(tileSize));
  });
}

function enableEowShare(weeks: EowWeek[]): void {
  const shareButton = app.querySelector<HTMLButtonElement>(".eow-share-link");

  if (!shareButton) {
    return;
  }

  shareButton.addEventListener("click", () => openEowShareModal(weeks, shareButton));
}

async function renderEowPage(): Promise<void> {
  const [, archiveYear] = getPathSegments();
  const year = archiveYear ? Number(archiveYear) : getCurrentArchiveYear();
  const archive = Number.isInteger(year) ? await fetchEowArchive(year) : undefined;
  const archiveLinks = archiveLinksMarkup(await getPreviousArchiveYears(getCurrentArchiveYear()));

  app.innerHTML = eowShell(eowGridMarkup(archive?.weeks ?? []), archiveLinks);
  stopLogoAnimation();
  enableEowSizeControl();
  enableEowShare(archive?.weeks ?? []);
  enableEowModal(archive?.weeks ?? []);
}

function articlesForCategory(articles: RankedArticle[], category: Category): RankedArticle[] {
  return articles.filter((article) => categoryMatches(article, category)).slice(0, 10);
}

function rankedTableMarkup(articles: RankedArticle[]): string {
  if (articles.length === 0) {
    return `
      <table class="ranked-table">
        <tbody>
          <tr class="ranked-item">
            <td class="article-cell" colspan="3">
              No rankings. Pages in this category have not reached Wikipedia's top 1,000 viewed yet.
            </td>
          </tr>
        </tbody>
      </table>
    `;
  }

  const rows = articles
    .map((article, index) => {
      const thumbnail = article.thumbnailUrl
        ? `<img class="thumbnail" src="${escapeHtml(article.thumbnailUrl)}" alt="" loading="lazy" decoding="async" />`
        : "";

      return `
        <tr class="ranked-item">
          <td class="rank">${index + 1}.</td>
          <td class="article-cell">
            <span class="article-link-wrap">
              <a href="${articleUrl(article.slug)}" target="_blank" rel="noreferrer">${escapeHtml(article.title)}</a>
              ${thumbnail}
            </span>
          </td>
          <td class="views">${formatViews(article.views)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table class="ranked-table">
      <tbody>${rows}</tbody>
    </table>
  `;
}

function enableCategoryFilters(
  articles: RankedArticle[],
  selectedCategory: Category,
  renderCategory: (articles: RankedArticle[], category: Category) => Promise<void>,
): void {
  const buttons = app.querySelectorAll<HTMLButtonElement>(".category-button");

  for (const button of buttons) {
    const category = button.dataset.category as Category | undefined;

    if (!category || category === selectedCategory) {
      continue;
    }

    button.addEventListener("click", () => {
      void renderCategory(articles, category);
    });
  }
}

function enableThumbnailPreviews(): void {
  const wrappers = app.querySelectorAll<HTMLElement>(".article-link-wrap");

  for (const wrapper of wrappers) {
    const row = wrapper.closest<HTMLElement>(".ranked-item");
    let longPressTimer: number | undefined;

    const clearLongPress = () => {
      if (longPressTimer !== undefined) {
        window.clearTimeout(longPressTimer);
        longPressTimer = undefined;
      }

      wrapper.classList.remove("is-previewing");
    };

    wrapper.addEventListener("pointerenter", () => wrapper.classList.add("is-previewing"));
    wrapper.addEventListener("pointerleave", () => wrapper.classList.remove("is-previewing"));
    wrapper.addEventListener("focusin", () => wrapper.classList.add("is-previewing"));
    wrapper.addEventListener("focusout", () => wrapper.classList.remove("is-previewing"));

    row?.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") {
        return;
      }

      longPressTimer = window.setTimeout(() => {
        wrapper.classList.add("is-previewing");
      }, 350);
    });

    row?.addEventListener("pointerup", clearLongPress);
    row?.addEventListener("pointercancel", clearLongPress);
    row?.addEventListener("pointerleave", clearLongPress);
    row?.addEventListener("contextmenu", (event) => {
      if (wrapper.classList.contains("is-previewing")) {
        event.preventDefault();
      }
    });
  }
}

async function renderRankingsView(articles: RankedArticle[], selectedCategory: Category = "Overall"): Promise<void> {
  const selectedArticles = articlesForCategory(articles, selectedCategory);
  const hydratedArticles = await hydrateThumbnails(selectedArticles);
  await completeLoadingProgress();

  app.innerHTML = shell(rankedTableMarkup(hydratedArticles), selectedCategory);
  stopLogoAnimation();
  enableCategoryFilters(articles, selectedCategory, renderRankingsView);
  enableThumbnailPreviews();
}

async function init(): Promise<void> {
  const [route] = getPathSegments();

  if (route?.toLowerCase() === "eow") {
    try {
      await renderEowPage();
    } catch {
      app.innerHTML = eowShell(`<p class="status">The archive is temporarily unavailable.</p>`);
    }

    return;
  }

  renderLoading();

  try {
    const articles = await getWeeklyTopTen();

    if (articles.length === 0) {
      const previousArticles = await getPreviousWeeklyTopTen();

      if (previousArticles.length === 0) {
        await renderEmpty();
        return;
      }

      await renderPreviousWeekFallback(previousArticles);
      return;
    }

    await renderRankingsView(articles);
  } catch {
    await renderError();
  }
}

void init();
