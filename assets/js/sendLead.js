(function () {
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyGL5Y4gBm9-2V_bBsT8QOmRwiJ1-sHOjnCOfYfzHeEXh-_FmeMsqISHJGEhrE1-8sV/exec";
  const SITE_CONFIG_FALLBACK = {
    siteId: "volna-alean",
    siteUrl: "https://xn----7sbabjp5bepdj.xn--p1ai",
    chatId: "-1003736835402",
  };
  const REQUEST_TIMEOUT_MS = 10000;

  const FIELD_LIMITS = {
    siteId: 80,
    siteUrl: 255,
    chatId: 80,
    name: 100,
    phone: 30,
    email: 120,
    source: 80,
    message: 4000,
    quiz: 12000,
    pageUrl: 1500,
    siteHost: 255,
    hp: 255,
    utm: 120,
  };

  let cachedSiteConfig = null;

  function clean(value, maxLength) {
    return String(value == null ? "" : value).trim().slice(0, maxLength);
  }

  async function loadSiteConfig() {
    if (cachedSiteConfig) {
      return cachedSiteConfig;
    }

    try {
      const response = await fetch("site.config.json", { cache: "no-store" });
      if (!response.ok) {
        cachedSiteConfig = SITE_CONFIG_FALLBACK;
        return cachedSiteConfig;
      }

      const json = await response.json();
      cachedSiteConfig = {
        ...SITE_CONFIG_FALLBACK,
        ...json,
      };
      return cachedSiteConfig;
    } catch (error) {
      cachedSiteConfig = SITE_CONFIG_FALLBACK;
      return cachedSiteConfig;
    }
  }

  function getUrlUtm() {
    const search = new URLSearchParams(window.location.search);
    return {
      utm_source: search.get("utm_source") || "",
      utm_medium: search.get("utm_medium") || "",
      utm_campaign: search.get("utm_campaign") || "",
      utm_content: search.get("utm_content") || "",
      utm_term: search.get("utm_term") || "",
    };
  }

  function normalizeUtm(payload) {
    const fromPayload = payload.utm || {};
    const fromUrl = getUrlUtm();

    return {
      utm_source: clean(payload.utm_source || fromPayload.utm_source || fromUrl.utm_source, FIELD_LIMITS.utm),
      utm_medium: clean(payload.utm_medium || fromPayload.utm_medium || fromUrl.utm_medium, FIELD_LIMITS.utm),
      utm_campaign: clean(
        payload.utm_campaign || fromPayload.utm_campaign || fromUrl.utm_campaign,
        FIELD_LIMITS.utm,
      ),
      utm_content: clean(payload.utm_content || fromPayload.utm_content || fromUrl.utm_content, FIELD_LIMITS.utm),
      utm_term: clean(payload.utm_term || fromPayload.utm_term || fromUrl.utm_term, FIELD_LIMITS.utm),
    };
  }

  function normalizeQuiz(quiz) {
    if (!quiz) {
      return "";
    }

    if (typeof quiz === "string") {
      return clean(quiz, FIELD_LIMITS.quiz);
    }

    try {
      return clean(JSON.stringify(quiz), FIELD_LIMITS.quiz);
    } catch (error) {
      return "";
    }
  }

  async function sendLead(payload) {
    const safePayload = payload || {};
    const siteConfig = await loadSiteConfig();
    const controller = new AbortController();
    const timeoutId = setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);
    const rawSiteUrl = String(siteConfig.siteUrl || "").trim();
    const siteUrl =
      rawSiteUrl && !rawSiteUrl.includes("<") && !rawSiteUrl.includes(">")
        ? rawSiteUrl
        : window.location.origin;

    const utm = normalizeUtm(safePayload);
    const quiz = normalizeQuiz(safePayload.quiz);

    const flatPayload = {
      siteId: clean(siteConfig.siteId, FIELD_LIMITS.siteId),
      siteUrl: clean(siteUrl, FIELD_LIMITS.siteUrl),
      chatId: clean(siteConfig.chatId, FIELD_LIMITS.chatId),
      name: clean(safePayload.name, FIELD_LIMITS.name),
      phone: clean(safePayload.phone, FIELD_LIMITS.phone),
      email: clean(safePayload.email, FIELD_LIMITS.email),
      source: clean(safePayload.source || "lead", FIELD_LIMITS.source),
      message: clean(safePayload.message, FIELD_LIMITS.message),
      hp: clean(safePayload.hp, FIELD_LIMITS.hp),
      pageUrl: clean(safePayload.pageUrl || window.location.href, FIELD_LIMITS.pageUrl),
      siteHost: clean(safePayload.siteHost || window.location.hostname, FIELD_LIMITS.siteHost),
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      utm_term: utm.utm_term,
    };

    if (quiz) {
      flatPayload.quiz = quiz;
    }

    const body = new URLSearchParams(flatPayload).toString();

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error("Lead request failed: HTTP " + response.status + "; body=" + responseText.slice(0, 300));
      }

      return { ok: true };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  window.sendLead = sendLead;
})();

