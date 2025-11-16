// helper: odstráni diakritiku a urobí pekný názov súboru
function slugifyTitle(title) {
    if (!title) return "clanok";
    let slug = title
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // diakritika preč
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")                      // všetko okrem a-z0-9 -> -
      .replace(/^-+|-+$/g, "");                         // orezanie pomlčiek na krajoch
    return slug || "clanok";
  }
  
  // helper: formát dátumu na SK zápis
  function formatDateSk(isoDate) {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-").map(Number);
    if (!y || !m || !d) return "";
    return `${d}. ${m}. ${y}`;
  }
  
  // helper: krátky popis z obsahu
  function createExcerpt(text, maxLen = 180) {
    if (!text) return "";
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return "";
    if (cleaned.length <= maxLen) return cleaned;
    return cleaned.slice(0, maxLen).replace(/[,.;:]?$/, "") + "…";
  }
  
  // jednoduché escapovanie pre meta/atribúty
  function escapeAttr(str) {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  
  // načítanie súboru ako data URL (base64)
  function readImageAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Chyba pri čítaní obrázka"));
      reader.readAsDataURL(file);
    });
  }
  
  function buildArticleHtml({
    title,
    isoDate,
    displayDate,
    imageDataUrl,
    imageAlt,
    contentHtml,
    excerpt
  }) {
    const safeTitle = escapeAttr(title);
    const safeDesc  = escapeAttr(excerpt || title);
    const safeImage = imageDataUrl ? escapeAttr(imageDataUrl) : "";
    const safeAlt   = escapeAttr(imageAlt || title || "Ilustračný obrázok");
  
    const heroBlock = imageDataUrl
      ? `
        <div class="post-hero">
          <img src="${safeImage}" alt="${safeAlt}">
        </div>`
      : "";
  
    const dateMeta = isoDate ? ` data-published="${isoDate}"` : "";
  
    return `<!DOCTYPE html>
  <html lang="sk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle} – Fyziodom</title>
    <link rel="icon" href="../favicon.ico" />
    <link rel="stylesheet" href="../styles.css" />
  
    <meta name="description" content="${safeDesc}" />
    <meta property="og:title" content="${safeTitle} – Fyziodom" />
    <meta property="og:description" content="${safeDesc}" />
    ${imageDataUrl ? `<meta property="og:image" content="${safeImage}" />` : ""}
  </head>
  <body>
    <header>
      <div class="container">
        <nav aria-label="Primárna navigácia">
          <a class="brand" href="../index.html#top">
            <img class="brand-mark" src="../Images/Logo.png" alt="Fyziodom logo" />
            <span>Fyziodom</span>
          </a>
          <button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false" aria-label="Menu">☰</button>
          <div id="primary-menu" class="nav-links" role="menu">
            <a href="../index.html#sluzby" role="menuitem">Služby</a>
            <a href="../index.html#cennik" role="menuitem">Cenník</a>
            <a href="../index.html#hodiny" role="menuitem">Ordinačné hodiny</a>
            <a href="../index.html#onas" role="menuitem">O nás</a>
            <a href="../index.html#kontakt" role="menuitem">Kontakt</a>
            <a href="../blog.php" role="menuitem">Blog</a>
            <a class="btn" href="javascript:void(0)" onclick="onClickOpen()" aria-label="Otvoriť rezerváciu" role="menuitem">Rezervovať termín</a>
          </div>
        </nav>
      </div>
    </header>
  
    <!-- Modal rezervácie -->
    <div onclick="onClickClose()" style="height:100vh;width:100vw;display:none;position:fixed;top:0;left:0;justify-content:center;align-items:center;background-color:rgba(0,0,0,.6);z-index:1000" id="reservationModal">
      <iframe src="https://krisztian-ferenc-domonkos.fyzion.sk/reservations" style="width:100%;max-width:1200px;border:none;border-radius:8px;height:80%"></iframe>
    </div>
  
    <main class="container" id="top">
      <article class="post-full card"${dateMeta}>
        <div class="post-head">
          ${displayDate ? `<p class="post-meta">${displayDate}</p>` : ""}
          <h1>${title}</h1>
        </div>
        ${heroBlock}
        <div class="post-body">
  ${contentHtml}
        </div>
      </article>
    </main>
  
    <footer>
      <div class="container footer-flex">
        <p>© <span id="year"></span> Fyziodom. Všetky práva vyhradené.</p>
      </div>
    </footer>
  
    <script>
      const onClickOpen = () => {
        document.getElementById("reservationModal").style.display = "flex";
        document.body.style.overflow = "hidden";
      };
      const onClickClose = () => {
        document.getElementById("reservationModal").style.display = "none";
        document.body.style.overflow = "";
      };
      (function(){
        const btn=document.querySelector('.menu-toggle'); 
        const menu=document.getElementById('primary-menu');
        if(btn&&menu){
          btn.addEventListener('click', ()=>{
            menu.classList.toggle('open');
            btn.setAttribute('aria-expanded', menu.classList.contains('open')?'true':'false');
          });
        }
        const y=document.getElementById('year');
        if(y) y.textContent=new Date().getFullYear();
      })();
    </script>
  </body>
  </html>`;
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("post-form");
    const preview = document.getElementById("html-preview");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const title = document.getElementById("title").value.trim();
      const dateInput = document.getElementById("date").value.trim();
      const imageFileInput = document.getElementById("imageFile");
      const imageAlt = document.getElementById("imageAlt").value.trim();
      const contentRaw = document.getElementById("content").value;
  
      if (!title || !contentRaw.trim()) {
        alert("Prosím vyplň nadpis aj obsah článku.");
        return;
      }
  
      const now = new Date();
      const isoDate = dateInput || now.toISOString().slice(0, 10);
      const displayDate = formatDateSk(isoDate);
      const excerpt = createExcerpt(contentRaw);
  
      // ak je priložený obrázok, načítame ho ako base64
      let imageDataUrl = "";
      const file = imageFileInput && imageFileInput.files && imageFileInput.files[0];
      if (file) {
        try {
          imageDataUrl = await readImageAsDataURL(file);
        } catch (err) {
          console.error(err);
          alert("Nepodarilo sa načítať obrázok. Skús to prosím znova.");
          return;
        }
      }
  
      // odseky: prázdny riadok = nový <p>, jednoduchý enter = <br>
      const blocks = contentRaw.trim().split(/\n\s*\n/);
      const contentHtml = blocks.map(block => {
        const inner = block.trim().replace(/\n/g, "<br>");
        return inner ? `        <p>${inner}</p>` : "";
      }).join("\n");
  
      const articleHtml = buildArticleHtml({
        title,
        isoDate,
        displayDate,
        imageDataUrl,
        imageAlt,
        contentHtml,
        excerpt
      });
  
      if (preview) {
        preview.value = articleHtml;
      }
  
      const filename = slugifyTitle(title) + ".html";
      const blob = new Blob([articleHtml], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
  
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  });

  
