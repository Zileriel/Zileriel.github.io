/* ==================== Configuration ==================== */
const CONFIG = {
  githubUser: "Zileriel",
  portfolioTopic: "portfolio",
  contact: {
    email: "herkus.zilaitis@gmail.com",
    phone: "+370 629 77830",
    linkedin: "https://www.linkedin.com/in/herkus-%C5%BEilaitis/",
    github: "https://github.com/Zileriel",
    services: "https://hestiq.com",
  },
};

//#region Markdown
marked.use({
  renderer: {
    code({ text, lang }) {
      let highlighted;

      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(text, {
          language: lang,
        }).value;
      } else {
        highlighted = hljs.highlightAuto(text).value;
      }

      return `<pre><code class="hljs${lang ? ` language-${lang}` : ""}">${highlighted}</code></pre>`;
    },

    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);

      const slug = text
        .toLowerCase()
        .trim()
        .replace(/<[^>]*>/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      return `<h${depth} id="${slug}">${text}</h${depth}>`;
    },
  },
});

function renderGitHubAlerts(md) {
  return md.replace(
    /^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*(?:\n|$))*)/gm,
    (_, type, body) => {
      const content = body
        .split("\n")
        .map((line) => line.replace(/^>\s?/, ""))
        .join("\n")
        .trim();

      return `<div class="github-alert github-alert-${type.toLowerCase()}">

${content}

</div>`;
    },
  );
}
//#endregion

//#region DOM
const grid = document.querySelector("#project-grid"),
  filters = document.querySelector("#filters"),
  status = document.querySelector("#status"),
  dialog = document.querySelector("#dialog"),
  content = document.querySelector("#dialog-content");
let projects = [],
  active = "all";
document.querySelector("#year").textContent = new Date().getFullYear();
//#endregion

//#region Utilities
const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const text = (s) => esc(s).replaceAll("-", " ");

const readmeCache = new Map();

async function getReadme(p) {
  if (readmeCache.has(p.full)) {
    return readmeCache.get(p.full);
  }

  const promise = (async () => {
    const r = await fetch(
      `https://raw.githubusercontent.com/${p.full}/${p.branch}/README.md`,
    );

    if (!r.ok) throw Error(`README unavailable (${r.status})`);

    const md = await r.text();

    const parsed = document.createElement("div");
    parsed.innerHTML = marked.parse(md);

    parsed.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");

      if (!src || /^(https?:|data:|\/\/|#)/i.test(src)) return;

      img.src = new URL(
        src,
        `https://raw.githubusercontent.com/${p.full}/${p.branch}/`,
      ).href;
    });

    return {
      md,
      html: parsed.innerHTML,
      thumbnail: parsed.querySelector("img")?.src || null,
    };
  })();

  readmeCache.set(p.full, promise);

  return promise;
}
//#endregion

async function load() {
  try {
    const q = encodeURIComponent(
        `user:${CONFIG.githubUser} topic:${CONFIG.portfolioTopic}`,
      ),
      r = await fetch(
        `https://api.github.com/search/repositories?q=${q}&sort=updated&per_page=24`,
        { headers: { Accept: "application/vnd.github+json" } },
      );
    if (!r.ok) throw Error(r.status);
    const d = await r.json();
    projects = d.items.map((x) => ({
      id: x.id,
      name: x.name,
      full: x.full_name,
      description: x.description || "No description provided.",
      url: x.html_url,
      homepage: x.homepage,
      topics: x.topics || [],
      branch: x.default_branch,
      language: x.language,
      thumbnail: null,
    }));

    await Promise.all(
      projects.map(async (p) => {
        try {
          const r = await fetch(
            `https://raw.githubusercontent.com/${p.full}/${p.branch}/README.md`,
          );

          if (!r.ok) return;

          const md = await r.text();

          const parsed = document.createElement("div");
          parsed.innerHTML = marked.parse(md);

          const img = parsed.querySelector("img");
          if (!img) return;

          const src = img.getAttribute("src");

          if (!src || /^(https?:|data:|\/\/|#)/i.test(src)) {
            p.thumbnail = src;
          } else {
            p.thumbnail = new URL(
              src,
              `https://raw.githubusercontent.com/${p.full}/${p.branch}/`,
            ).href;
          }
        } catch {
          // No README thumbnail
        }
      }),
    );
    buildFilters();
    render();
    status.textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}`;
  } catch (e) {
    console.error(e);
    status.textContent = "GitHub unavailable";
    grid.innerHTML =
      '<div class="empty"><strong>Projects could not be loaded.</strong></div>';
  }
}
function buildFilters() {
  filters.querySelectorAll(".tech").forEach((x) => x.remove());

  [...new Set(projects.map((x) => x.language).filter(Boolean))]
    .sort()
    .forEach((language) => {
      const b = document.createElement("button");
      b.className = "tech";
      b.dataset.filter = language;
      b.textContent = language;
      filters.appendChild(b);
    });
}
function render() {
  const list =
    active === "all" ? projects : projects.filter((x) => x.language === active);
  if (!list.length) {
    grid.innerHTML = '<div class="empty">No projects in this filter.</div>';
    return;
  }
  grid.innerHTML = list
    .map(
      (x, i) =>
        `<button class="project" data-id="${x.id}">
  <div class="project-content">
    <span class="num">${String(i + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}</span>
    <h3>${esc(x.name)}</h3>
    <p>${esc(x.description)}</p>
  </div>

  ${
    x.thumbnail
      ? `<div class="project-preview">
          <img src="${esc(x.thumbnail)}" alt="" loading="lazy">
        </div>`
      : ""
  }

  <div class="bottom">
    <div class="tech">
      ${x.language ? `<span>${esc(x.language)}</span>` : ""}
    </div>
  </div>
</button>`,
    )
    .join("");
  grid
    .querySelectorAll(".project")
    .forEach(
      (b) =>
        (b.onclick = () =>
          open(projects.find((x) => String(x.id) === b.dataset.id))),
    );
}
filters.onclick = (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  active = b.dataset.filter;
  filters
    .querySelectorAll("button")
    .forEach((x) => x.classList.remove("active"));
  b.classList.add("active");
  render();
};
async function open(p) {
  content.innerHTML = `<div class="dialog-inner"><span class="meta">${text(p.full)}</span><h2>${text(p.name)}</h2><p class="description">${text(p.description)}</p><div class="dialog-links"><a class="button dark" href="${p.url}" target="_blank">GitHub ↗</a>${p.homepage ? `<a class="button" href="${text(p.homepage)}" target="_blank">Live site ↗</a>` : ""}</div><article class="readme"><p class="eyebrow">README.md</p><p>Loading documentation…</p></article></div>`;
  document.body.classList.add("modal-open");
  dialog.showModal();
  try {
    const { html } = await getReadme(p);

    const parsed = document.createElement("div");
    parsed.innerHTML = html;

    parsed.querySelectorAll("blockquote").forEach((blockquote) => {
      const firstParagraph = blockquote.querySelector("p");

      if (!firstParagraph) return;

      const match = firstParagraph.textContent.match(
        /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i,
      );

      if (!match) return;

      const type = match[1].toLowerCase();

      const walker = document.createTreeWalker(
        firstParagraph,
        NodeFilter.SHOW_TEXT,
      );

      let node;

      while ((node = walker.nextNode())) {
        if (node.textContent.includes(match[0])) {
          node.textContent = node.textContent.replace(match[0], "").trimStart();
          break;
        }
      }

      const bodyWalker = document.createTreeWalker(
        blockquote,
        NodeFilter.SHOW_TEXT,
      );

      while ((node = bodyWalker.nextNode())) {
        if (node.parentElement?.classList.contains("github-alert-label")) {
          continue;
        }

        const text = node.textContent;

        if (text.trim().toUpperCase() === type.toUpperCase()) {
          node.remove();
          break;
        }

        if (new RegExp(`^\\s*${type}\\s*`, "i").test(text)) {
          node.textContent = text.replace(
            new RegExp(`^\\s*${type}\\s*`, "i"),
            "",
          );
          break;
        }
      }

      const first = firstParagraph.firstChild;

      if (first?.nodeName === "BR") {
        first.remove();
      }

      blockquote.classList.add("github-alert", `github-alert-${type}`);
    });

    parsed.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");

      if (!src || /^(https?:|data:|\/\/|#)/i.test(src)) return;

      img.src = new URL(
        src,
        `https://raw.githubusercontent.com/${p.full}/${p.branch}/`,
      ).href;
    });

    const htmls = DOMPurify.sanitize(parsed.innerHTML);

    content.querySelector(".readme").innerHTML =
      '<p class="eyebrow">README.md</p>' + htmls;

    const readme = content.querySelector(".readme");

    readme.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const id = decodeURIComponent(link.getAttribute("href").slice(1));
        const target = readme.querySelector(`#${CSS.escape(id)}`);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  } catch (error) {
    console.error("README error:", error);

    content.querySelector(".readme").innerHTML =
      `<p class="eyebrow">README.md</p><p>${text(error.message)}</p>`;
  }
}
const closeDialog = () => {
  dialog.close();
  document.body.classList.remove("modal-open");
};
document.querySelector("#close").onclick = closeDialog;
dialog.addEventListener("close", () =>
  document.body.classList.remove("modal-open"),
);
dialog.onclick = (e) => {
  if (e.target === dialog) closeDialog();
};
document.querySelector("#contact-links").innerHTML = [
  ["Email", CONFIG.contact.email, `mailto:${CONFIG.contact.email}`],
  [
    "Phone",
    CONFIG.contact.phone,
    `tel:${CONFIG.contact.phone.replace(/\s/g, "")}`,
  ],
  ["LinkedIn", "LinkedIn profile", CONFIG.contact.linkedin],
  ["GitHub", "@Zileriel", CONFIG.contact.github],
  ["Services", "HestiQ — design & development", CONFIG.contact.services],
]
  .map(
    (x) =>
      `<a class="contact-link" href="${esc(x[2])}" ${x[2].startsWith("http") ? 'target="_blank"' : ""}><small>${x[0]}</small><span>${text(x[1])}</span></a>`,
  )
  .join("");
load();
