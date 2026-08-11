/* ============================================================================
   DeltaMax Assistant — floating chat widget
   ----------------------------------------------------------------------------
   Self contained: no build step, no network calls, no third party libraries.
   All answers come from chatbot-data.js, which must be loaded first.

   Add to any page, just before </body>:
       <script src="chatbot-data.js" defer></script>
       <script src="chatbot.js" defer></script>

   The whole UI lives inside a shadow root, so page CSS (Tailwind included)
   cannot leak in and the widget's own CSS cannot leak out.
   ========================================================================== */

(function () {
    'use strict';

    if (window.__deltamaxChatMounted) return;
    window.__deltamaxChatMounted = true;

    /* Resolve asset + page links against this script's folder so the widget
       keeps working if it is ever included from a sub directory. */
    var SCRIPT_URL = (document.currentScript && document.currentScript.src) || location.href;
    function resolve(path) {
        try { return new URL(path, SCRIPT_URL).href; } catch (e) { return path; }
    }

    var STORE_KEY = 'deltamax.chat.v2';   // conversation, per browser tab
    var SEEN_KEY = 'deltamax.chat.seen';  // hides the attention dot after first open

    var DATA = window.DELTAMAX_CHAT_DATA;
    if (!DATA || !DATA.entries) {
        console.error('[DeltaMax chat] chatbot-data.js must be loaded before chatbot.js');
        return;
    }

    /* ======================================================================
       1. Text matching
       ==================================================================== */

    var STOPWORDS = {
        a: 1, an: 1, the: 1, is: 1, are: 1, am: 1, was: 1, were: 1, be: 1, been: 1, being: 1,
        do: 1, does: 1, did: 1, doing: 1, can: 1, could: 1, will: 1, would: 1, shall: 1,
        should: 1, may: 1, might: 1, must: 1, have: 1, has: 1, had: 1, i: 1, me: 1, my: 1,
        we: 1, our: 1, us: 1, you: 1, your: 1, it: 1, its: 1, they: 1, them: 1, their: 1,
        this: 1, that: 1, these: 1, those: 1, to: 1, of: 1, in: 1, on: 1, at: 1, for: 1,
        with: 1, and: 1, or: 1, but: 1, if: 1, so: 1, as: 1, by: 1, from: 1, about: 1,
        into: 1, over: 1, then: 1, there: 1, here: 1, please: 1, just: 1, any: 1, some: 1,
        get: 1, got: 1, want: 1, need: 1, know: 1, like: 1, tell: 1, give: 1, show: 1
    };

    /* Words people use that aren't in the keyword lists verbatim. */
    var SYNONYMS = {
        cost: ['pricing', 'price'], price: ['pricing', 'cost'], pricing: ['cost', 'price'],
        expensive: ['pricing', 'cost'], cheap: ['pricing', 'cost'], quote: ['pricing'],
        buy: ['purchase', 'marketplace'], purchase: ['buy', 'marketplace'],
        subscribe: ['buy', 'purchase'], licence: ['license', 'buy'],
        trial: ['demo'], meeting: ['demo'], walkthrough: ['demo'],
        safe: ['security'], secure: ['security'], gdpr: ['compliance', 'security'],
        pii: ['privacy', 'security'], soc2: ['compliance', 'security'],
        stale: ['freshness'], late: ['freshness'], sla: ['freshness'],
        outlier: ['anomaly'], outliers: ['anomaly'], spike: ['anomaly'],
        notification: ['alerts'], notifications: ['alerts'], slack: ['alerts'],
        email: ['alerts', 'contact'], webhook: ['alerts'],
        connector: ['data sources'], connectors: ['data sources'],
        integration: ['data sources'], integrations: ['data sources'],
        setup: ['deployment'], install: ['deployment'], onprem: ['deployment'],
        speed: ['scale', 'performance'], fast: ['scale', 'performance'],
        competitor: ['competitors'], alternative: ['competitors'], alternatives: ['competitors'],
        rival: ['competitors'], versus: ['competitors'], vs: ['competitors'],
        team: ['contact'], sales: ['contact'], support: ['contact'],
        docs: ['blog'], documentation: ['blog'], article: ['blog'], articles: ['blog']
    };

    function normalise(str) {
        return String(str || '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /* Crude singulariser so "anomalies" matches "anomaly", "alerts" matches "alert". */
    function singular(word) {
        if (word.length > 4 && /ies$/.test(word)) return word.slice(0, -3) + 'y';
        if (word.length > 4 && /(ses|xes|ches|shes)$/.test(word)) return word.slice(0, -2);
        if (word.length > 3 && /[^s]s$/.test(word)) return word.slice(0, -1);
        return word;
    }

    function tokenise(text) {
        var words = normalise(text).split(' ');
        var out = {};
        for (var i = 0; i < words.length; i++) {
            var w = words[i];
            if (!w || w.length < 2 || STOPWORDS[w]) continue;
            out[singular(w)] = true;
            var syn = SYNONYMS[w];
            if (syn) {
                for (var j = 0; j < syn.length; j++) {
                    var parts = syn[j].split(' ');
                    for (var k = 0; k < parts.length; k++) out[singular(parts[k])] = true;
                }
            }
        }
        return out;
    }

    /* Pre-compute the searchable shape of every entry once. */
    var INDEX = DATA.entries.map(function (entry) {
        var phrases = [];
        var words = {};
        (entry.keywords || []).forEach(function (raw) {
            var n = normalise(raw);
            if (!n) return;
            if (n.indexOf(' ') !== -1) phrases.push({ text: n, size: n.split(' ').length });
            else words[singular(n)] = true;
        });
        return {
            entry: entry,
            question: normalise(entry.q),
            questionTokens: tokenise(entry.q),
            phrases: phrases,
            words: words
        };
    });

    var BY_ID = {};
    DATA.entries.forEach(function (e) { BY_ID[e.id] = e; });

    var ANSWER_AT = 5.5;   // confident enough to answer outright
    var SUGGEST_AT = 2.4;  // confident enough to offer "did you mean"
    var BROWSE_CHIP = '__topics__';  // pseudo-id: renders a chip that opens the topic list

    function rank(query) {
        var nq = normalise(query);
        var tokens = tokenise(query);
        var scored = [];

        for (var i = 0; i < INDEX.length; i++) {
            var item = INDEX[i];
            var score = 0;

            if (item.question === nq) {
                score = 1000;
            } else {
                if (nq.length > 6 && item.question.indexOf(nq) !== -1) score += 10;

                for (var p = 0; p < item.phrases.length; p++) {
                    if (nq.indexOf(item.phrases[p].text) !== -1) {
                        score += 7 + item.phrases[p].size * 2;
                    }
                }
                for (var t in tokens) {
                    /* A word listed as a keyword is enough on its own; appearing in the
                       canonical question too is extra confirmation, so these stack. */
                    if (item.words[t]) score += 5.6;
                    if (item.questionTokens[t]) score += 1.4;
                }
            }

            if (score > 0) scored.push({ entry: item.entry, score: score });
        }

        scored.sort(function (a, b) { return b.score - a.score; });
        return scored;
    }

    function respond(query) {
        var ranked = rank(query);
        var best = ranked[0];

        if (best && best.score >= ANSWER_AT) {
            return { kind: 'answer', entry: best.entry, runnerUp: ranked[1] };
        }

        var small = matchSmallTalk(query);
        if (small) return { kind: 'small', entry: small };

        if (best && best.score >= SUGGEST_AT) {
            return {
                kind: 'suggest',
                ids: ranked.slice(0, 3).map(function (r) { return r.entry.id; })
            };
        }
        return { kind: 'none' };
    }

    function matchSmallTalk(query) {
        var list = DATA.smallTalk || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].match && list[i].match.test(query.trim())) return list[i];
        }
        return null;
    }

    /* ======================================================================
       2. Tiny markup renderer  (**bold**, *italic*, - bullets, [text](href))
       ==================================================================== */

    var ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (c) { return ESCAPES[c]; });
    }

    function inline(text) {
        var out = escapeHtml(text);

        out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (match, label, href) {
            if (/^\s*javascript:/i.test(href)) return label;
            var external = /^https?:/i.test(href);
            var url = external || /^mailto:/i.test(href) ? href : resolve(href);
            return '<a href="' + escapeHtml(url) + '"' +
                (external ? ' target="_blank" rel="noopener noreferrer"' : '') +
                '>' + label + '</a>';
        });

        out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        out = out.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
        return out;
    }

    function markup(source) {
        var lines = String(source || '').split('\n');
        var html = '';
        var listOpen = false;
        var buffer = [];

        function flushParagraph() {
            if (!buffer.length) return;
            html += '<p>' + buffer.join('<br>') + '</p>';
            buffer = [];
        }
        function closeList() {
            if (listOpen) { html += '</ul>'; listOpen = false; }
        }

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();

            if (/^-\s+/.test(line)) {
                flushParagraph();
                if (!listOpen) { html += '<ul>'; listOpen = true; }
                html += '<li>' + inline(line.replace(/^-\s+/, '')) + '</li>';
            } else if (!line) {
                flushParagraph();
                closeList();
            } else {
                closeList();
                buffer.push(inline(line));
            }
        }
        flushParagraph();
        closeList();
        return html;
    }

    /* ======================================================================
       3. Markup for the widget itself
       ==================================================================== */

    var ICON = {
        grid: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>',
        reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
        send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4l17.5-7.5a1 1 0 0 0 0-1.84L3.4 3.6a1 1 0 0 0-1.39 1.02L3.2 10.2a1 1 0 0 0 .83.82l8.4 1.2-8.4 1.2a1 1 0 0 0-.83.82l-1.19 5.58a1 1 0 0 0 1.39 1.02z"/></svg>',
        chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
        chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/></svg>',
        page: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>',
        arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
    };

    var CSS = [
        ':host{position:fixed;right:0;bottom:0;z-index:2147483000;',
        'font-family:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
        'font-size:14px;line-height:1.55;color:#0F172A;-webkit-font-smoothing:antialiased}',
        '.dmx *,.dmx *::before,.dmx *::after{box-sizing:border-box;margin:0;padding:0}',
        /* :where() keeps this reset at zero specificity, so the component rules below
           (plain single class selectors) still win instead of being out-specified. */
        ':where(.dmx) :where(button){font:inherit;color:inherit;background:none;border:0;cursor:pointer}',

        /* ---------- launcher ---------- */
        '.dmx-launcher{position:fixed;right:24px;bottom:24px;width:60px;height:60px;border-radius:50%;',
        'background:#fff;display:flex;align-items:center;justify-content:center;',
        'box-shadow:0 10px 30px -6px rgba(15,23,42,.35),0 0 0 1px rgba(15,23,42,.06);',
        'transition:transform .25s cubic-bezier(.34,1.4,.64,1),box-shadow .25s}',
        '.dmx-launcher:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 16px 36px -8px rgba(3,105,161,.45),0 0 0 1px rgba(14,165,233,.25)}',
        '.dmx-launcher:focus-visible{outline:3px solid #0EA5E9;outline-offset:3px}',
        '.dmx-launcher img{width:34px;height:34px;object-fit:contain;transition:opacity .2s,transform .3s}',
        '.dmx-launcher .dmx-x{position:absolute;width:22px;height:22px;color:#0F172A;opacity:0;transform:rotate(-90deg) scale(.6);transition:opacity .2s,transform .3s}',
        '.dmx[data-open="true"] .dmx-launcher img{opacity:0;transform:rotate(90deg) scale(.6)}',
        '.dmx[data-open="true"] .dmx-launcher .dmx-x{opacity:1;transform:rotate(0) scale(1)}',
        '.dmx-ping{position:absolute;top:2px;right:2px;width:13px;height:13px;border-radius:50%;',
        'background:#0EA5E9;border:2.5px solid #fff}',
        '.dmx-ping::after{content:"";position:absolute;inset:-2px;border-radius:50%;background:#0EA5E9;',
        'opacity:.55;animation:dmx-ping 1.9s cubic-bezier(0,0,.2,1) infinite}',
        '@keyframes dmx-ping{0%{transform:scale(1);opacity:.55}70%,100%{transform:scale(2.2);opacity:0}}',
        '.dmx[data-open="true"] .dmx-ping,.dmx[data-seen="true"] .dmx-ping{display:none}',

        /* ---------- panel ---------- */
        '.dmx-panel{position:fixed;right:24px;bottom:98px;width:384px;max-width:calc(100vw - 32px);',
        /* the 180px reserve keeps the top edge clear of the site's fixed navbar on short screens */
        'height:min(618px,calc(100vh - 180px));min-height:320px;display:flex;flex-direction:column;overflow:hidden;',
        'background:#fff;border-radius:20px;border:1px solid rgba(15,23,42,.08);',
        'box-shadow:0 32px 70px -18px rgba(15,23,42,.42),0 0 0 1px rgba(15,23,42,.04);',
        'opacity:0;visibility:hidden;transform:translateY(14px) scale(.97);transform-origin:100% 100%;',
        'transition:opacity .22s ease,transform .26s cubic-bezier(.34,1.3,.64,1),visibility .26s}',
        '.dmx[data-open="true"] .dmx-panel{opacity:1;visibility:visible;transform:none}',

        /* ---------- header ---------- */
        '.dmx-head{display:flex;align-items:center;gap:10px;padding:13px 14px;flex:0 0 auto;',
        'background:linear-gradient(125deg,#0F172A 0%,#0B3B63 55%,#0369A1 100%);color:#fff}',
        '.dmx-avatar{width:38px;height:38px;border-radius:12px;background:#fff;flex:0 0 auto;',
        'display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.22)}',
        '.dmx-avatar img{width:26px;height:26px;object-fit:contain}',
        '.dmx-id{display:flex;align-items:center;gap:10px;min-width:0;flex:1}',
        '.dmx-id b{display:block;font-size:14.5px;font-weight:600;letter-spacing:-.01em}',
        '.dmx-id small{display:flex;align-items:center;gap:5px;font-size:11.5px;color:rgba(255,255,255,.72)}',
        '.dmx-live{width:6px;height:6px;border-radius:50%;background:#34D399;box-shadow:0 0 0 2px rgba(52,211,153,.25)}',
        '.dmx-head-actions{display:flex;gap:2px;flex:0 0 auto}',
        '.dmx-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;',
        'color:rgba(255,255,255,.85);transition:background .18s,color .18s}',
        '.dmx-icon:hover{background:rgba(255,255,255,.16);color:#fff}',
        '.dmx-icon:focus-visible{outline:2px solid #7DD3FC;outline-offset:1px}',
        /* no fill here: these icons are stroke-drawn and set fill="none" inline, which a
           CSS fill would override (presentation attributes lose to any CSS rule) */
        '.dmx-icon svg{width:16px;height:16px}',
        '.dmx-icon[data-act="topics"] svg{width:14px;height:14px}',

        /* ---------- log ---------- */
        /* .dmx-main is the positioning context for the topics overlay, so the overlay
           always lines up with the message area whatever the header height turns out to be. */
        '.dmx-main{position:relative;flex:1 1 auto;display:flex;min-height:0}',
        '.dmx-scroll{flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain;background:#F6F9FC;padding:16px 14px 6px}',
        '.dmx-scroll::-webkit-scrollbar{width:8px}',
        '.dmx-scroll::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:8px;border:2px solid #F6F9FC}',
        '.dmx-scroll::-webkit-scrollbar-thumb:hover{background:#94A3B8}',
        '.dmx-row{display:flex;gap:8px;margin-bottom:14px;animation:dmx-in .3s ease both}',
        '@keyframes dmx-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
        '.dmx-row.me{justify-content:flex-end}',
        '.dmx-pic{width:26px;height:26px;border-radius:8px;background:#fff;flex:0 0 auto;margin-top:2px;',
        'display:flex;align-items:center;justify-content:center;border:1px solid #E2E8F0}',
        '.dmx-pic img{width:17px;height:17px;object-fit:contain}',
        '.dmx-stack{min-width:0;max-width:84%;display:flex;flex-direction:column;gap:8px}',
        '.dmx-bubble{background:#fff;border:1px solid #E4EBF3;border-radius:14px 14px 14px 4px;',
        'padding:11px 13px;font-size:13.5px;color:#1E293B;box-shadow:0 1px 2px rgba(15,23,42,.05)}',
        '.dmx-row.me .dmx-bubble{background:linear-gradient(135deg,#0369A1,#0EA5E9);color:#fff;',
        'border-color:transparent;border-radius:14px 14px 4px 14px;box-shadow:0 4px 12px -3px rgba(3,105,161,.4)}',
        '.dmx-bubble p+p{margin-top:9px}',
        '.dmx-bubble strong{font-weight:650;color:#0F172A}',
        '.dmx-row.me .dmx-bubble strong{color:#fff}',
        '.dmx-bubble ul{list-style:none;margin:8px 0 0;display:flex;flex-direction:column;gap:6px}',
        '.dmx-bubble ul:first-child{margin-top:0}',
        '.dmx-bubble li{position:relative;padding-left:16px}',
        '.dmx-bubble li::before{content:"";position:absolute;left:3px;top:8px;width:5px;height:5px;',
        'border-radius:50%;background:#0EA5E9}',
        '.dmx-bubble a{color:#0369A1;font-weight:550;text-decoration:underline;text-underline-offset:2px}',
        '.dmx-bubble a:hover{color:#0EA5E9}',

        /* ---------- chips + actions ---------- */
        '.dmx-chips{display:flex;flex-wrap:wrap;gap:6px}',
        '.dmx-chip{border:1.5px solid #BFE3F8;background:#fff;color:#0369A1;border-radius:999px;',
        'padding:6px 12px;font-size:12.5px;font-weight:550;text-align:left;line-height:1.35;',
        'transition:background .16s,border-color .16s,transform .16s}',
        '.dmx-chip:hover{background:#E8F6FE;border-color:#0EA5E9;transform:translateY(-1px)}',
        '.dmx-chip:focus-visible{outline:2px solid #0EA5E9;outline-offset:2px}',
        '.dmx-cta{display:inline-flex;align-items:center;gap:7px;align-self:flex-start;',
        'background:linear-gradient(135deg,#0369A1,#0EA5E9);color:#fff;border-radius:11px;',
        'padding:9px 14px;font-size:13px;font-weight:600;text-decoration:none;',
        'box-shadow:0 6px 16px -5px rgba(3,105,161,.55);transition:transform .18s,box-shadow .18s}',
        '.dmx-cta:hover{transform:translateY(-1px);box-shadow:0 10px 22px -6px rgba(3,105,161,.6)}',
        '.dmx-cta svg{width:13px;height:13px;flex:0 0 auto}',
        '.dmx-acts{display:flex;flex-wrap:wrap;gap:8px}',
        /* the "browse topics" chip is visually distinct from question chips */
        '.dmx-chip.is-browse{background:#0F172A;border-color:#0F172A;color:#fff;display:inline-flex;',
        'align-items:center;gap:6px}',
        '.dmx-chip.is-browse:hover{background:#1E293B;border-color:#1E293B}',
        '.dmx-chip.is-browse svg{width:11px;height:11px;flex:0 0 auto}',

        /* ---------- "more on the site" section under every answer ---------- */
        '.dmx-source{border:1px solid #DCE7F2;background:#fff;border-radius:13px;overflow:hidden}',
        '.dmx-source-head{display:flex;align-items:center;gap:6px;padding:8px 11px 7px;',
        'background:#F1F7FD;border-bottom:1px solid #DCE7F2;font-size:10.5px;font-weight:700;',
        'letter-spacing:.07em;text-transform:uppercase;color:#0369A1}',
        '.dmx-source-head svg{width:12px;height:12px}',
        '.dmx-source-row{display:flex;align-items:center;gap:9px;padding:9px 11px;text-decoration:none;',
        'color:#1E293B;transition:background .16s}',
        '.dmx-source-row+.dmx-source-row{border-top:1px solid #EEF3F9}',
        '.dmx-source-row:hover{background:#F6FBFF}',
        '.dmx-source-ico{width:26px;height:26px;flex:0 0 auto;border-radius:8px;background:#E8F4FE;',
        'color:#0369A1;display:flex;align-items:center;justify-content:center}',
        '.dmx-source-ico svg{width:14px;height:14px}',
        '.dmx-source-txt{min-width:0;flex:1}',
        '.dmx-source-txt b{display:block;font-size:12.5px;font-weight:650;color:#0F172A;line-height:1.3}',
        '.dmx-source-txt small{display:block;font-size:11.5px;color:#64748B;line-height:1.4;margin-top:1px}',
        '.dmx-source-row>svg:last-child{width:13px;height:13px;flex:0 0 auto;color:#94A3B8}',
        '.dmx-source-row:hover>svg:last-child{color:#0EA5E9}',

        /* ---------- typing ---------- */
        '.dmx-typing{display:flex;gap:4px;align-items:center;padding:13px}',
        '.dmx-typing i{width:6px;height:6px;border-radius:50%;background:#94A3B8;animation:dmx-bob 1.2s infinite}',
        '.dmx-typing i:nth-child(2){animation-delay:.16s}.dmx-typing i:nth-child(3){animation-delay:.32s}',
        '@keyframes dmx-bob{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-4px);opacity:1}}',

        /* ---------- topics view ---------- */
        '.dmx-topics{position:absolute;inset:0;background:#F6F9FC;display:flex;flex-direction:column;',
        'opacity:0;visibility:hidden;transform:translateY(10px);transition:opacity .2s,transform .22s,visibility .22s}',
        '.dmx[data-view="topics"] .dmx-topics{opacity:1;visibility:visible;transform:none}',
        '.dmx-find{flex:0 0 auto;position:relative;padding:12px 14px 10px;background:#fff;',
        'border-bottom:1px solid #E9EFF6}',
        '.dmx-find svg{position:absolute;left:25px;top:50%;transform:translateY(-40%);width:14px;height:14px;',
        'color:#94A3B8;pointer-events:none}',
        '.dmx-find input{width:100%;border:1.5px solid #E2E8F0;border-radius:11px;background:#F8FAFC;',
        'padding:9px 12px 9px 34px;font-family:inherit;font-size:13px;color:#0F172A}',
        '.dmx-find input::placeholder{color:#94A3B8}',
        '.dmx-find input:focus{outline:0;border-color:#0EA5E9;background:#fff;box-shadow:0 0 0 3px rgba(14,165,233,.14)}',
        '.dmx-topic-list{flex:1 1 auto;overflow-y:auto;padding:14px}',
        '.dmx-topic-list::-webkit-scrollbar{width:8px}',
        '.dmx-topic-list::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:8px;border:2px solid #F6F9FC}',
        '.dmx-topics h4{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;',
        'color:#0EA5E9;margin:16px 0 7px;padding-left:2px}',
        '.dmx-topics h4:first-child{margin-top:0}',
        '.dmx-topics [hidden]{display:none}',
        '.dmx-empty{text-align:center;color:#64748B;font-size:12.5px;padding:26px 10px}',
        '.dmx-topic{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;',
        'background:#fff;border:1px solid #E4EBF3;border-radius:11px;padding:10px 12px;margin-bottom:6px;',
        'font-size:13px;color:#1E293B;text-align:left;transition:border-color .16s,transform .16s,box-shadow .16s}',
        '.dmx-topic:hover{border-color:#0EA5E9;transform:translateX(2px);box-shadow:0 3px 10px -4px rgba(3,105,161,.4)}',
        '.dmx-topic svg{width:13px;height:13px;flex:0 0 auto;color:#94A3B8}',
        '.dmx-topic:hover svg{color:#0EA5E9}',

        /* ---------- composer ---------- */
        '.dmx-foot{flex:0 0 auto;background:#fff;border-top:1px solid #EAF0F6;padding:9px 12px 8px}',
        /* always-visible way into the topic list — the header icon alone was too easy to miss */
        '.dmx-browse{display:inline-flex;align-items:center;gap:7px;margin-bottom:8px;padding:7px 12px;',
        'border-radius:999px;background:#EEF6FD;border:1.5px solid #D3E9FA;color:#0369A1;',
        'font-size:12.5px;font-weight:600;transition:background .16s,border-color .16s,transform .16s}',
        '.dmx-browse:hover{background:#DFF0FC;border-color:#0EA5E9;transform:translateY(-1px)}',
        '.dmx-browse:focus-visible{outline:2px solid #0EA5E9;outline-offset:2px}',
        '.dmx-browse svg{width:12px;height:12px;flex:0 0 auto}',
        '.dmx-browse .dmx-count{background:#0369A1;color:#fff;border-radius:999px;font-size:10.5px;',
        'font-weight:700;padding:1px 6px;margin-left:1px}',
        '.dmx[data-view="topics"] .dmx-browse{background:#0F172A;border-color:#0F172A;color:#fff}',
        '.dmx[data-view="topics"] .dmx-browse .dmx-count{background:rgba(255,255,255,.2)}',
        '.dmx-form{display:flex;align-items:flex-end;gap:8px}',
        '.dmx-input{flex:1;min-width:0;border:1.5px solid #E2E8F0;border-radius:13px;padding:10px 12px;',
        'font-family:inherit;font-size:13.5px;color:#0F172A;background:#F8FAFC;resize:none;',
        'transition:border-color .16s,background .16s}',
        '.dmx-input::placeholder{color:#94A3B8}',
        '.dmx-input:focus{outline:0;border-color:#0EA5E9;background:#fff;box-shadow:0 0 0 3px rgba(14,165,233,.14)}',
        '.dmx-send{width:40px;height:40px;flex:0 0 auto;border-radius:12px;display:flex;align-items:center;',
        'justify-content:center;background:linear-gradient(135deg,#0369A1,#0EA5E9);color:#fff;',
        'box-shadow:0 5px 14px -4px rgba(3,105,161,.55);transition:transform .18s,opacity .18s}',
        '.dmx-send:hover{transform:translateY(-1px)}',
        '.dmx-send:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}',
        '.dmx-send svg{width:16px;height:16px;fill:currentColor;margin-right:1px}',
        '.dmx-note{text-align:center;font-size:10.5px;color:#94A3B8;margin-top:7px}',

        /* ---------- responsive ---------- */
        '@media (max-width:640px){',
        '.dmx-launcher{right:16px;bottom:16px;width:54px;height:54px}',
        '.dmx-launcher img{width:30px;height:30px}',
        '.dmx-panel{right:10px;left:10px;bottom:82px;top:14px;width:auto;max-width:none;height:auto;border-radius:18px}',
        '.dmx-stack{max-width:88%}',
        '.dmx-input{font-size:16px}',  /* stops iOS zooming on focus */
        '}',
        '@media (prefers-reduced-motion:reduce){',
        '.dmx *,.dmx *::before,.dmx *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}',
        '}'
    ].join('');

    /* ======================================================================
       4. Build the widget
       ==================================================================== */

    var logoSrc = resolve((DATA.brand && DATA.brand.logo) || 'images/Logo.png');
    var brandName = (DATA.brand && DATA.brand.name) || 'DeltaMax Assistant';
    var brandStatus = (DATA.brand && DATA.brand.status) || 'Ask me about the platform';

    var host = document.createElement('div');
    host.id = 'deltamax-chat-widget';
    var root = host.attachShadow({ mode: 'open' });

    root.innerHTML =
        '<style>' + CSS + '</style>' +
        '<div class="dmx" data-open="false" data-view="chat">' +
          '<section class="dmx-panel" role="dialog" aria-label="' + escapeHtml(brandName) + '">' +
            '<header class="dmx-head">' +
              '<span class="dmx-avatar"><img src="' + escapeHtml(logoSrc) + '" alt=""></span>' +
              '<span class="dmx-id"><span><b>' + escapeHtml(brandName) + '</b>' +
                '<small><i class="dmx-live"></i>' + escapeHtml(brandStatus) + '</small></span></span>' +
              '<span class="dmx-head-actions">' +
                '<button class="dmx-icon" data-act="topics" title="Browse topics" aria-label="Browse topics">' + ICON.grid + '</button>' +
                '<button class="dmx-icon" data-act="reset" title="Start over" aria-label="Start the conversation over">' + ICON.reset + '</button>' +
                '<button class="dmx-icon" data-act="close" title="Close" aria-label="Close the assistant">' + ICON.close + '</button>' +
              '</span>' +
            '</header>' +
            '<div class="dmx-main">' +
              '<div class="dmx-scroll" role="log" aria-live="polite" aria-atomic="false"></div>' +
              '<div class="dmx-topics" aria-label="All topics">' +
                '<div class="dmx-find">' + ICON.search +
                  '<input type="text" autocomplete="off" placeholder="Filter topics…" aria-label="Filter topics">' +
                '</div>' +
                '<div class="dmx-topic-list"></div>' +
              '</div>' +
            '</div>' +
            '<div class="dmx-foot">' +
              '<button class="dmx-browse" type="button" aria-label="Browse all topics">' +
                ICON.grid + '<span class="dmx-browse-label">Browse all topics</span>' +
                '<span class="dmx-count"></span>' +
              '</button>' +
              '<form class="dmx-form">' +
                '<input class="dmx-input" type="text" autocomplete="off" ' +
                  'placeholder="Ask about DeltaMax…" aria-label="Type your question">' +
                '<button class="dmx-send" type="submit" aria-label="Send message" disabled>' + ICON.send + '</button>' +
              '</form>' +
              '<p class="dmx-note">Pre-set answers · runs entirely in your browser</p>' +
            '</div>' +
          '</section>' +
          '<button class="dmx-launcher" aria-label="Open the DeltaMax assistant" aria-expanded="false">' +
            '<img src="' + escapeHtml(logoSrc) + '" alt="">' +
            '<span class="dmx-x">' + ICON.close + '</span>' +
            '<span class="dmx-ping"></span>' +
          '</button>' +
        '</div>';

    var ui = {
        shell: root.querySelector('.dmx'),
        panel: root.querySelector('.dmx-panel'),
        scroll: root.querySelector('.dmx-scroll'),
        topics: root.querySelector('.dmx-topics'),
        topicList: root.querySelector('.dmx-topic-list'),
        find: root.querySelector('.dmx-find input'),
        browse: root.querySelector('.dmx-browse'),
        count: root.querySelector('.dmx-count'),
        form: root.querySelector('.dmx-form'),
        input: root.querySelector('.dmx-input'),
        send: root.querySelector('.dmx-send'),
        launcher: root.querySelector('.dmx-launcher')
    };

    /* ======================================================================
       5. State
       ==================================================================== */

    var log = [];       // [{r:'u'|'b', t|body, chips, actions, sources}]
    var asked = [];   // questions the visitor has typed, for Up/Down recall
    var historyAt = -1;
    var isOpen = false;
    var busy = false;

    function safeStore(store, fn, fallback) {
        try { return fn(window[store]); } catch (e) { return fallback; }
    }

    function save() {
        safeStore('sessionStorage', function (s) {
            s.setItem(STORE_KEY, JSON.stringify({ open: isOpen, log: log }));
        });
    }

    function load() {
        return safeStore('sessionStorage', function (s) {
            return JSON.parse(s.getItem(STORE_KEY) || 'null');
        }, null);
    }

    function markSeen() {
        safeStore('localStorage', function (s) { s.setItem(SEEN_KEY, '1'); });
        ui.shell.setAttribute('data-seen', 'true');
    }

    if (safeStore('localStorage', function (s) { return s.getItem(SEEN_KEY); }, null)) {
        ui.shell.setAttribute('data-seen', 'true');
    }

    /* ======================================================================
       6. Rendering
       ==================================================================== */

    function el(tag, cls, html) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (html != null) node.innerHTML = html;
        return node;
    }

    function paint(message) {
        var row = el('div', 'dmx-row' + (message.r === 'u' ? ' me' : ''));

        if (message.r === 'b') {
            row.appendChild(el('span', 'dmx-pic', '<img src="' + escapeHtml(logoSrc) + '" alt="">'));
        }

        var stack = el('div', 'dmx-stack');
        stack.appendChild(el('div', 'dmx-bubble',
            message.r === 'u' ? '<p>' + escapeHtml(message.t) + '</p>' : markup(message.body)));

        if (message.actions && message.actions.length) {
            var acts = el('div', 'dmx-acts');
            message.actions.forEach(function (action) {
                var link = el('a', 'dmx-cta', escapeHtml(action.label) + ICON.chevron);
                link.href = /^(https?:|mailto:)/i.test(action.href) ? action.href : resolve(action.href);
                if (/^https?:/i.test(action.href)) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
                acts.appendChild(link);
            });
            stack.appendChild(acts);
        }

        /* "More on the site" — every answer points at the page with the fuller story */
        if (message.sources && message.sources.length) {
            var box = el('div', 'dmx-source');
            box.appendChild(el('div', 'dmx-source-head', ICON.page + '<span>More on the site</span>'));
            message.sources.forEach(function (src) {
                var row = el('a', 'dmx-source-row',
                    '<span class="dmx-source-ico">' + ICON.page + '</span>' +
                    '<span class="dmx-source-txt"><b>' + escapeHtml(src.label) + '</b>' +
                    (src.note ? '<small>' + escapeHtml(src.note) + '</small>' : '') + '</span>' +
                    ICON.arrow);
                row.href = /^(https?:|mailto:)/i.test(src.href) ? src.href : resolve(src.href);
                if (/^https?:/i.test(src.href)) { row.target = '_blank'; row.rel = 'noopener noreferrer'; }
                box.appendChild(row);
            });
            stack.appendChild(box);
        }

        if (message.chips && message.chips.length) {
            var chips = el('div', 'dmx-chips');
            message.chips.forEach(function (id) {
                if (id === BROWSE_CHIP) {
                    var browse = el('button', 'dmx-chip is-browse',
                        ICON.grid + '<span>Browse all topics</span>');
                    browse.type = 'button';
                    browse.setAttribute('data-browse', '1');
                    chips.appendChild(browse);
                    return;
                }
                var entry = BY_ID[id];
                if (!entry) return;
                var chip = el('button', 'dmx-chip', escapeHtml(entry.q));
                chip.type = 'button';
                chip.setAttribute('data-ask', id);
                chips.appendChild(chip);
            });
            if (chips.childNodes.length) stack.appendChild(chips);
        }

        row.appendChild(stack);
        ui.scroll.appendChild(row);
        return row;
    }

    function toBottom(smooth) {
        ui.scroll.scrollTo({
            top: ui.scroll.scrollHeight,
            behavior: smooth === false ? 'auto' : 'smooth'
        });
    }

    function push(message, opts) {
        log.push(message);
        paint(message);
        save();
        toBottom(!(opts && opts.instant));
    }

    function showTyping() {
        var row = el('div', 'dmx-row');
        row.appendChild(el('span', 'dmx-pic', '<img src="' + escapeHtml(logoSrc) + '" alt="">'));
        var stack = el('div', 'dmx-stack');
        stack.appendChild(el('div', 'dmx-bubble',
            '<span class="dmx-typing"><i></i><i></i><i></i></span>'));
        stack.firstChild.style.padding = '0';
        row.appendChild(stack);
        row.setAttribute('data-typing', '1');
        ui.scroll.appendChild(row);
        toBottom();
        return row;
    }

    function replyWith(message) {
        busy = true;
        var typing = showTyping();
        var pause = Math.min(1100, 340 + (message.body || '').length * 2.4);

        setTimeout(function () {
            typing.remove();
            push(message);
            busy = false;
        }, pause);
    }

    /* ======================================================================
       7. Conversation flow
       ==================================================================== */

    function greet() {
        log = [];
        asked = [];
        historyAt = -1;
        ui.scroll.innerHTML = '';
        ui.find.value = '';
        filterTopics('');
        push({ r: 'b', body: DATA.welcome, chips: DATA.starters || [] }, { instant: true });
    }

    function answerFor(entry, runnerUp) {
        var chips = (entry.related || []).slice();
        if (runnerUp && runnerUp.entry && chips.indexOf(runnerUp.entry.id) === -1 && runnerUp.score >= SUGGEST_AT) {
            chips.push(runnerUp.entry.id);
        }
        return {
            r: 'b',
            body: entry.a,
            actions: entry.actions || [],
            sources: entry.sources || [],
            chips: chips.slice(0, 4)
        };
    }

    function ask(text) {
        if (busy) return;
        var query = String(text || '').trim();
        if (!query) return;

        if (asked[asked.length - 1] !== query) asked.push(query);
        historyAt = -1;
        push({ r: 'u', t: query });

        var result = respond(query);
        var message;

        if (result.kind === 'answer') {
            message = answerFor(result.entry, result.runnerUp);
        } else if (result.kind === 'small') {
            message = {
                r: 'b',
                body: result.entry.a,
                actions: result.entry.actions || [],
                sources: result.entry.sources || [],
                chips: result.entry.related || []
            };
        } else if (result.kind === 'suggest') {
            message = { r: 'b', body: DATA.fallback.low, chips: result.ids };
        } else {
            message = {
                r: 'b',
                body: DATA.fallback.none,
                chips: (DATA.starters || []).slice(0, 3),
                sources: DATA.fallback.noneSources || []
            };
        }

        replyWith(message);
    }

    function askById(id) {
        if (busy) return;
        var entry = BY_ID[id];
        if (!entry) return;
        push({ r: 'u', t: entry.q });
        replyWith(answerFor(entry));
    }

    /* ======================================================================
       8. Topics view
       ==================================================================== */

    function buildTopics() {
        var html = '';
        var total = 0;
        (DATA.categories || []).forEach(function (group) {
            var rows = '';
            group.ids.forEach(function (id) {
                var entry = BY_ID[id];
                if (!entry) return;
                total++;
                /* data-find holds the searchable text so filtering never touches the DOM text */
                rows += '<button class="dmx-topic" type="button" data-ask="' + escapeHtml(id) + '" ' +
                        'data-find="' + escapeHtml(normalise(entry.q + ' ' + (entry.keywords || []).join(' '))) + '">' +
                        '<span>' + escapeHtml(entry.q) + '</span>' + ICON.chevron + '</button>';
            });
            if (rows) {
                html += '<h4 data-group="' + escapeHtml(group.name) + '">' + escapeHtml(group.name) + '</h4>' +
                        '<div data-rows="' + escapeHtml(group.name) + '">' + rows + '</div>';
            }
        });
        ui.topicList.innerHTML = html + '<p class="dmx-empty" hidden>No topic matches that. Try a different word, or just ask me directly.</p>';
        ui.count.textContent = total;
    }

    function filterTopics(term) {
        var needle = normalise(term);
        var groups = ui.topicList.querySelectorAll('[data-rows]');
        var shown = 0;

        groups.forEach(function (group) {
            var visible = 0;
            group.querySelectorAll('.dmx-topic').forEach(function (row) {
                var hit = !needle || row.getAttribute('data-find').indexOf(needle) !== -1;
                row.hidden = !hit;
                if (hit) visible++;
            });
            group.hidden = visible === 0;
            var heading = ui.topicList.querySelector('h4[data-group="' + group.getAttribute('data-rows') + '"]');
            if (heading) heading.hidden = visible === 0;
            shown += visible;
        });

        ui.topicList.querySelector('.dmx-empty').hidden = shown > 0;
        ui.count.textContent = shown;
    }

    function setView(view) {
        ui.shell.setAttribute('data-view', view);
        var btn = root.querySelector('.dmx-icon[data-act="topics"]');
        var showingTopics = view === 'topics';
        btn.innerHTML = showingTopics ? ICON.back : ICON.grid;
        btn.setAttribute('aria-label', showingTopics ? 'Back to the conversation' : 'Browse topics');
        btn.title = showingTopics ? 'Back to chat' : 'Browse topics';
        ui.browse.setAttribute('aria-expanded', showingTopics ? 'true' : 'false');
        root.querySelector('.dmx-browse-label').textContent =
            showingTopics ? 'Back to chat' : 'Browse all topics';

        if (showingTopics) {
            ui.topicList.scrollTop = 0;
            if (window.innerWidth > 640) setTimeout(function () { ui.find.focus(); }, 240);
        }
    }

    /* ======================================================================
       9. Open / close
       ==================================================================== */

    function setOpen(open) {
        isOpen = open;
        ui.shell.setAttribute('data-open', open ? 'true' : 'false');
        ui.launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
        ui.launcher.setAttribute('aria-label', open ? 'Close the DeltaMax assistant' : 'Open the DeltaMax assistant');

        if (open) {
            markSeen();
            setView('chat');
            if (window.innerWidth > 640) {
                setTimeout(function () { ui.input.focus(); }, 260);
            }
            toBottom(false);
        }
        save();
    }

    /* ======================================================================
       10. Wiring
       ==================================================================== */

    ui.launcher.addEventListener('click', function () { setOpen(!isOpen); });

    root.querySelector('.dmx-head-actions').addEventListener('click', function (event) {
        var btn = event.target.closest('.dmx-icon');
        if (!btn) return;
        var act = btn.getAttribute('data-act');

        if (act === 'close') setOpen(false);
        if (act === 'reset') { greet(); setView('chat'); ui.input.focus(); }
        if (act === 'topics') toggleTopics();
    });

    function toggleTopics() {
        setView(ui.shell.getAttribute('data-view') === 'topics' ? 'chat' : 'topics');
    }
    ui.browse.addEventListener('click', toggleTopics);

    function delegateAsk(event) {
        if (event.target.closest('[data-browse]')) { setView('topics'); return; }
        var btn = event.target.closest('[data-ask]');
        if (!btn) return;
        setView('chat');
        askById(btn.getAttribute('data-ask'));
    }
    ui.scroll.addEventListener('click', delegateAsk);
    ui.topics.addEventListener('click', delegateAsk);

    ui.find.addEventListener('input', function () { filterTopics(ui.find.value); });
    ui.find.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        var first = ui.topicList.querySelector('.dmx-topic:not([hidden])');
        if (first) { setView('chat'); askById(first.getAttribute('data-ask')); }
    });

    ui.input.addEventListener('input', function () {
        ui.send.disabled = !ui.input.value.trim();
    });

    /* Up/Down cycles through questions already asked, like a shell history. */
    ui.input.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        if (!asked.length) return;
        if (event.key === 'ArrowUp' && historyAt === -1 && ui.input.value.trim()) return;

        event.preventDefault();
        if (event.key === 'ArrowUp') {
            historyAt = historyAt === -1 ? asked.length - 1 : Math.max(0, historyAt - 1);
        } else {
            if (historyAt === -1) return;
            historyAt = historyAt + 1 >= asked.length ? -1 : historyAt + 1;
        }
        ui.input.value = historyAt === -1 ? '' : asked[historyAt];
        ui.send.disabled = !ui.input.value.trim();
        ui.input.setSelectionRange(ui.input.value.length, ui.input.value.length);
    });

    ui.form.addEventListener('submit', function (event) {
        event.preventDefault();
        var value = ui.input.value;
        ui.input.value = '';
        ui.send.disabled = true;
        ask(value);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && isOpen) {
            if (ui.shell.getAttribute('data-view') === 'topics') setView('chat');
            else { setOpen(false); ui.launcher.focus(); }
        }
    });

    /* ======================================================================
       11. Boot
       ==================================================================== */

    /* Deep links, so any page or email can drop a visitor straight into a topic:
         index.html#chat            → opens the assistant
         index.html#topics          → opens the topic list
         index.html#ask=pricing     → opens and answers that topic */
    function applyHash() {
        var hash = (location.hash || '').replace(/^#/, '');
        if (!hash) return false;

        if (hash === 'chat') { setOpen(true); return true; }
        if (hash === 'topics') { setOpen(true); setView('topics'); return true; }

        var match = /^ask=(.+)$/.exec(hash);
        if (match && BY_ID[decodeURIComponent(match[1])]) {
            setOpen(true);
            setTimeout(function () { askById(decodeURIComponent(match[1])); }, 350);
            return true;
        }
        return false;
    }

    function mount() {
        document.body.appendChild(host);
        buildTopics();

        var saved = load();
        if (saved && saved.log && saved.log.length) {
            log = saved.log;
            log.forEach(paint);
            toBottom(false);
            if (saved.open) setOpen(true);
        } else {
            greet();
        }
        applyHash();
    }

    window.addEventListener('hashchange', applyHash);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }

    /* Public hooks, for "Ask the assistant" links elsewhere on the site:
         window.DeltaMaxChat.open('pricing')   open and answer a topic
         window.DeltaMaxChat.topics()          open straight to the topic list
         window.DeltaMaxChat.ask('how much')   open and run a free-text question
       Or use a plain link: <a href="#ask=pricing">What does it cost?</a> */
    window.DeltaMaxChat = {
        open: function (topicId) {
            setOpen(true);
            if (topicId) setTimeout(function () { askById(topicId); }, 320);
        },
        topics: function () { setOpen(true); setView('topics'); },
        close: function () { setOpen(false); },
        ask: function (text) { setOpen(true); setTimeout(function () { ask(text); }, 320); },
        reset: greet,
        ids: function () { return DATA.entries.map(function (e) { return e.id; }); }
    };
})();
