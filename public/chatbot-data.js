/* ============================================================================
   DeltaMax Assistant — Knowledge Base
   ----------------------------------------------------------------------------
   Every answer the chatbot can give lives in this file. Nothing is fetched from
   a server and no AI model is called — the widget matches what a visitor types
   against the `keywords` below and replies with the matching `a` text.

   To add a question:
     1. Copy an entry in `entries` and give it a new unique `id`.
     2. Write the canonical question in `q` (this is what shows on the chips).
     3. List the ways people might phrase it in `keywords` (lowercase).
     4. Write the answer in `a`. Supported markup:
          **bold**            → bold text
          - item              → bullet list (one per line)
          [label](page.html)  → link
          blank line          → paragraph break
     5. Add `sources` — the page(s) on this site with the fuller story. These
        render as a "More on the site" section under every answer, so a visitor
        always has somewhere to go for detail. Give every entry at least one.
     6. Optionally add `actions` (a prominent button, for commercial intent only)
        and `related` (follow-up chips).
     7. Add the id to a group in `categories` so it shows in "Browse topics".
   ========================================================================== */

window.DELTAMAX_CHAT_DATA = {

  /* --- Widget identity -------------------------------------------------- */
  brand: {
    name: 'DeltaMax Assistant',
    status: 'Ask me about the platform',
    logo: 'images/Logo.png'
  },

  /* --- First message shown when the panel opens ------------------------- */
  welcome:
    "Hi there 👋 I'm the **DeltaMax Assistant**.\n\n" +
    "I can answer questions about the platform — how the Trust Score works, " +
    "what we monitor, how we compare to other tools, and how to get started. " +
    "Every answer points you to the page with the full detail.\n\n" +
    "Pick a question below, browse all topics, or type your own.",

  /* --- Chips shown under the welcome message ----------------------------
     Add the special id '__topics__' to any chip list to render an inline
     "Browse all topics" chip. Left out by default because the persistent
     Browse button above the composer already covers it. */
  starters: ['what-is-deltamax', 'trust-score', 'features', 'how-it-works', 'demo'],

  /* --- "Browse topics" menu --------------------------------------------- */
  categories: [
    {
      name: 'The platform',
      ids: ['what-is-deltamax', 'why-deltamax', 'trust-score', 'features', 'use-cases', 'who-built-it']
    },
    {
      name: 'Capabilities',
      ids: ['anomaly-detection', 'drift-monitoring', 'freshness-monitoring', 'business-rules',
            'ai-agent', 'root-cause', 'alerts', 'forecasting', 'budgets', 'hyperparameters']
    },
    {
      name: 'How it works',
      ids: ['how-it-works', 'architecture', 'algorithms', 'data-sources', 'tech-stack', 'scale']
    },
    {
      name: 'Buying & deployment',
      ids: ['demo', 'buy', 'pricing', 'deployment', 'security', 'getting-started', 'contact']
    },
    {
      name: 'Comparison & resources',
      ids: ['competitors', 'vs-monte-carlo', 'vs-databricks', 'vs-snowflake', 'vs-informatica',
            'blog', 'site-guide']
    }
  ],

  /* --- Replies used when nothing matches well --------------------------- */
  fallback: {
    low: "I'm not certain I got that one. Did you mean one of these?",
    none:
      "I don't have a pre-written answer for that yet — I only cover DeltaMax topics.\n\n" +
      "Try browsing everything I know, or ask the team directly.",
    noneSources: [
      { label: 'Talk to the team', href: 'schedule.html', note: 'Send the question straight to us.' },
      { label: 'Platform overview', href: 'data-quality.html', note: 'Architecture, components and dataflow.' }
    ]
  },

  /* --- Conversational odds and ends ------------------------------------- */
  smallTalk: [
    {
      id: 'greeting',
      match: /^(hi|hey|hello|yo|hiya|howdy|good (morning|afternoon|evening)|namaste)\b/i,
      a: "Hello! 👋 Ask me anything about DeltaMax — the Trust Score, what we monitor, " +
         "pricing, or how to get a demo. You can also browse every topic I cover.",
      related: ['what-is-deltamax', 'features', 'demo']
    },
    {
      id: 'thanks',
      match: /\b(thanks|thank you|thx|ty|appreciate it|cheers)\b/i,
      a: "Happy to help! Anything else you'd like to know?",
      related: ['features', 'pricing', 'demo']
    },
    {
      id: 'bye',
      match: /^(bye|goodbye|see ya|see you|later|that'?s all|nothing else)\b/i,
      a: "Thanks for stopping by. If you'd like to see DeltaMax on your own data, " +
         "book a slot with the team any time. 👋",
      actions: [{ label: 'Schedule a demo', href: 'schedule.html' }]
    },
    {
      id: 'capabilities',
      match: /(what can you (do|help|answer)|who are you|are you (a )?(bot|human|ai|real)|help me|^help\b|^menu$|^options$)/i,
      a: "I'm a small built-in assistant with pre-written answers about DeltaMax — " +
         "no AI model, no server, nothing leaves your browser.\n\n" +
         "I cover the platform overview, all ten capabilities, the architecture and " +
         "algorithms, security, marketplaces and pricing, and how we compare to other tools. " +
         "Every answer links to the page with the full detail.",
      related: ['what-is-deltamax', 'features', 'how-it-works', 'site-guide'],
      sources: [{ label: 'Browse the site', href: 'index.html', note: 'Trust Score, features and the five-phase journey.' }]
    },
    {
      id: 'human',
      match: /(talk to (a )?(human|person|someone|sales|rep)|speak to|real person|contact sales|call me)/i,
      a: "Of course — the fastest route is the contact form, which reaches the team directly.\n\n" +
         "You can also email [contact@katalyststreet.com](mailto:contact@katalyststreet.com).",
      actions: [{ label: 'Talk to the team', href: 'schedule.html' }],
      sources: [{ label: 'About us', href: 'about.html', note: 'The team behind DeltaMax.' }],
      related: ['demo', 'contact']
    }
  ],

  /* --- The knowledge base ----------------------------------------------- */
  entries: [

    /* ===================== THE PLATFORM ===================== */
    {
      id: 'what-is-deltamax',
      category: 'The platform',
      q: 'What is DeltaMax?',
      keywords: ['what is deltamax', 'what does deltamax do', 'about deltamax', 'tell me about deltamax',
                 'what is this', 'what is the product', 'overview', 'introduction', 'explain deltamax',
                 'data quality platform', 'what is your product', 'deltamax'],
      a: "DeltaMax is an **intelligent data quality platform** — a live pulse on the health of your data, " +
         "so problems get caught before they reach production.\n\n" +
         "It continuously watches your pipelines for four things:\n" +
         "- **Anomalies** — unusual values and patterns your rules would miss\n" +
         "- **Drift** — schema and distribution shifts over time\n" +
         "- **Freshness** — data arriving late or not at all\n" +
         "- **Business rules** — your own logic and compliance checks\n\n" +
         "All four roll up into a single **Trust Score (0–100)** per dataset, so teams get one clear " +
         "signal instead of stitching together separate tools. Our tagline says it best: *never fly blind again.*",
      sources: [
        { label: 'Platform overview', href: 'data-quality.html', note: 'Architecture, core components and the full dataflow.' },
        { label: 'Home', href: 'index.html', note: 'The Trust Score breakdown and all ten features.' }
      ],
      related: ['trust-score', 'features', 'why-deltamax']
    },
    {
      id: 'why-deltamax',
      category: 'The platform',
      q: 'Why choose DeltaMax?',
      /* Note: no bare "better than" here — it would hijack "better than <competitor>". */
      keywords: ['why deltamax', 'why choose', 'what makes you different', 'differentiator', 'advantage',
                 'benefits', 'why should i', 'what sets you apart', 'unique', 'value',
                 'what makes deltamax better', 'why is deltamax better'],
      a: "Four things set DeltaMax apart:\n" +
         "- **One score, not five dashboards.** Anomaly, drift, freshness and business-rule health are " +
         "weighted into a single Trust Score instead of four disconnected tools.\n" +
         "- **It learns your data's rhythm.** Baselines are learned automatically, so you don't have to " +
         "hand-write every rule — and routine fluctuation stops paging you at 2am.\n" +
         "- **It explains itself.** The AI Agent tells you what changed, where, and whether it matters.\n" +
         "- **Days, not months.** Most teams are monitoring production pipelines within days, with " +
         "transparent pricing through the cloud marketplaces.\n\n" +
         "In our own capability scoring, DeltaMax leads at **42/50** against the major alternatives.",
      sources: [
        { label: 'Competitive Intel', href: 'competitive_intel.html', note: 'Why DeltaMax wins, scored against four rivals.' },
        { label: 'Home', href: 'index.html', note: 'The four pillars and how they are weighted.' }
      ],
      related: ['competitors', 'trust-score', 'ai-agent']
    },
    {
      id: 'trust-score',
      category: 'The platform',
      q: 'How does the Trust Score work?',
      keywords: ['trust score', 'trust', 'score', 'scoring', 'how is the score calculated', 'health score',
                 'rating', '0-100', 'single score', 'scoring engine', 'weights', 'how do you score data'],
      a: "The **Trust Score** is a single 0–100 number that answers one question: *can I rely on this dataset right now?*\n\n" +
         "The scoring engine computes five metrics — **Anomaly, Drift, Business, Freshness**, and the overall " +
         "**Trust Score** that blends them. The four pillars are weighted:\n" +
         "- Drift monitoring health — **28%**\n" +
         "- Business rules health — **25%**\n" +
         "- Anomaly detection health — **24%**\n" +
         "- Freshness monitoring health — **23%**\n\n" +
         "Each is calculated with weighted algorithms that account for historical patterns, rule violations " +
         "and timeliness — so the score is transparent, not a black box. Every score ships with an " +
         "**Agent Summary** explaining what changed, where, and what the impact is.",
      sources: [
        { label: 'Home', href: 'index.html', note: 'Interactive breakdown of the four weighted pillars.' },
        { label: 'Trust & Score Engine', href: 'data-quality.html', note: 'Where scoring sits in the architecture.' }
      ],
      related: ['ai-agent', 'anomaly-detection', 'algorithms']
    },
    {
      id: 'features',
      category: 'The platform',
      q: 'What features does DeltaMax have?',
      keywords: ['features', 'capabilities', 'what can it do', 'functionality', 'modules', 'list features',
                 'what do you offer', 'everything it does', 'full list'],
      a: "Ten capabilities, all in one platform:\n" +
         "- **Anomaly Detection** — learns normal behaviour and flags meaningful deviations\n" +
         "- **Drift Monitoring** — schema, statistical and concept drift\n" +
         "- **Freshness Monitoring** — latency and update cadence\n" +
         "- **Business Rules** — your own validation and compliance logic\n" +
         "- **AI Agent** — Trust Score plus a plain-English summary of what changed\n" +
         "- **Root Cause Analysis** — end-to-end lineage back to the source\n" +
         "- **Alerts** — prioritised by real business risk, not raw counts\n" +
         "- **Forecasting** — predicts quality issues before they happen\n" +
         "- **Budgets** — real-time compute, storage and processing spend\n" +
         "- **Hyperparameters** — tracked and versioned alongside quality metrics\n\n" +
         "Ask me about any one of them for the detail.",
      sources: [
        { label: 'Home', href: 'index.html', note: 'Each feature with a screenshot from the product.' },
        { label: 'Core components', href: 'data-quality.html', note: 'The technical building blocks behind them.' }
      ],
      related: ['anomaly-detection', 'drift-monitoring', 'ai-agent', 'forecasting']
    },
    {
      id: 'use-cases',
      category: 'The platform',
      q: 'What are the main use cases?',
      keywords: ['use cases', 'who uses', 'use case', 'applications', 'scenarios', 'examples',
                 'industries', 'what is it used for', 'real world'],
      a: "Four patterns come up most often:\n" +
         "- **Enterprise data quality monitoring** — regulatory compliance and fraud detection with " +
         "real-time validation and anomaly detection\n" +
         "- **Migration & modernisation validation** — proving data integrity when you move platforms, " +
         "with automated reason codes explaining *why* records differ\n" +
         "- **Regulatory reporting & compliance** — auditable quality history with configurable retention\n" +
         "- **Operational excellence & data trust** — quality across suppliers and logistics pipelines to " +
         "cut delays and improve forecasting",
      sources: [
        { label: 'Use Cases', href: 'data-quality.html', note: 'All four written out in full on the platform page.' }
      ],
      related: ['business-rules', 'security', 'demo']
    },
    {
      id: 'who-built-it',
      category: 'The platform',
      q: 'Who is behind DeltaMax?',
      keywords: ['who built', 'who made', 'who owns', 'company', 'team', 'about us', 'neualto',
                 'katalyst', 'katalyst street', 'joint venture', 'founders', 'who are you as a company'],
      a: "DeltaMax is a joint venture between **NeuAlto Technologies** and **Katalyst Street**.\n\n" +
         "It was built at the intersection of data engineering and AI, combining statistical rigour, " +
         "machine learning and contextual AI to surface data quality issues before they reach production.",
      sources: [
        { label: 'About us', href: 'about.html', note: 'Who we are, our mission and the partnership.' }
      ],
      related: ['contact', 'what-is-deltamax']
    },

    /* ===================== CAPABILITIES ===================== */
    {
      id: 'anomaly-detection',
      category: 'Capabilities',
      q: 'How does anomaly detection work?',
      keywords: ['anomaly', 'anomalies', 'anomaly detection', 'outlier', 'outliers', 'unusual data',
                 'weird data', 'spikes', 'detect problems', 'isolation forest'],
      a: "Most data issues aren't obvious — a small volume dip, an unexpected spike, a subtle shift that " +
         "never trips a predefined check.\n\n" +
         "DeltaMax watches how your data actually behaves across sources and over time, learns what normal " +
         "looks like, and flags meaningful deviations from that baseline. Under the hood it combines " +
         "statistical methods like the **Interquartile Range (IQR)** with ML models such as " +
         "**Isolation Forest**.\n\n" +
         "The payoff: you don't have to write a rule for every possible failure, hidden issues surface early, " +
         "and noise drops sharply because only meaningful deviations get raised.",
      sources: [
        { label: 'Core components', href: 'data-quality.html', note: 'Anomaly detection in the processing engine.' },
        { label: 'Blog', href: 'blog.html', note: 'How Isolation Forest detects anomalies, explained.' }
      ],
      related: ['drift-monitoring', 'algorithms', 'alerts']
    },
    {
      id: 'drift-monitoring',
      category: 'Capabilities',
      q: 'What is drift monitoring?',
      keywords: ['drift', 'drift monitoring', 'data drift', 'schema drift', 'concept drift', 'psi',
                 'population stability index', 'ks test', 'distribution change', 'model degradation'],
      a: "Drift is the slow killer — models and dashboards quietly get worse while nothing technically breaks.\n\n" +
         "DeltaMax automatically detects **schema drift, statistical drift and concept drift** across your " +
         "pipelines, tracking changes in distributions and in the relationships between features. Detection " +
         "uses **Population Stability Index (PSI)**, **Kolmogorov–Smirnov (KS)** tests and T-tests.\n\n" +
         "You get alerts *before* drift reaches downstream systems, plus a clear view of how patterns are " +
         "evolving against historical baselines. Drift carries the heaviest weight in the Trust Score at **28%**.",
      sources: [
        { label: 'Data Drift Detection', href: 'data-quality.html', note: 'PSI and KS-test detail in core components.' },
        { label: 'Home', href: 'index.html', note: 'Drift monitoring as one of the four scored pillars.' }
      ],
      related: ['trust-score', 'algorithms', 'forecasting']
    },
    {
      id: 'freshness-monitoring',
      category: 'Capabilities',
      q: 'How is data freshness monitored?',
      keywords: ['freshness', 'stale data', 'latency', 'late data', 'sla', 'update cadence',
                 'timeliness', 'data arriving late', 'refresh'],
      a: "DeltaMax tracks when each dataset was last refreshed and compares it against its expected arrival " +
         "time. The moment a critical dataset falls behind schedule, an alert goes out.\n\n" +
         "Different datasets get different expectations — an hourly feed and a monthly extract aren't held to " +
         "the same bar. Freshness metrics sit front and centre on the real-time dashboards, so nobody makes a " +
         "decision on last week's numbers by accident. It accounts for **23%** of the Trust Score.",
      sources: [
        { label: 'Home', href: 'index.html', note: 'Freshness monitoring health in the Trust Score.' },
        { label: 'Platform overview', href: 'data-quality.html', note: 'Where freshness fits in the dataflow.' }
      ],
      related: ['alerts', 'trust-score', 'architecture']
    },
    {
      id: 'business-rules',
      category: 'Capabilities',
      q: 'Can I define my own business rules?',
      keywords: ['business rules', 'custom rules', 'validation rules', 'rule engine', 'my own rules',
                 'compliance rules', 'dsl', 'governance policy', 'define rules', 'custom checks'],
      a: "Yes — that's the **Business Rule Engine**.\n\n" +
         "Rules range from simple field validations to complex multi-field and cross-dataset conditions, " +
         "written in a straightforward DSL. Incoming data is validated against them continuously, covering " +
         "both technical checks and domain-specific logic.\n\n" +
         "- Violations are flagged immediately, with the explanation and context attached\n" +
         "- Compliance teams get a repeatable way to prove regulatory requirements are met\n" +
         "- Rules can be updated on the fly without disrupting running pipelines\n\n" +
         "Business rule health is **25%** of the Trust Score.",
      sources: [
        { label: 'Business Rule Engine', href: 'data-quality.html', note: 'The rule engine in core technical components.' }
      ],
      related: ['trust-score', 'use-cases', 'security']
    },
    {
      id: 'ai-agent',
      category: 'Capabilities',
      q: 'What does the AI Agent do?',
      keywords: ['ai agent', 'agent', 'agent summary', 'ai', 'intelligent', 'explain changes',
                 'llm', 'assistant in product', 'copilot'],
      a: "The **AI Agent** is the intelligent core of the platform. It pairs anomaly detection with " +
         "contextual understanding, so you get an answer rather than a chart to interpret.\n\n" +
         "- A real-time **Trust Score** as the instant reliability indicator\n" +
         "- An **Agent Summary** describing exactly what changed and where\n" +
         "- A judgement on whether the change is expected, minor or critical\n" +
         "- Recommended next actions, connected to the detection that triggered them\n\n" +
         "Teams stop manually correlating signals across tools, which is where most investigation time goes.",
      sources: [
        { label: 'Home', href: 'index.html', note: 'The AI Agent feature with a product screenshot.' }
      ],
      related: ['trust-score', 'root-cause', 'alerts']
    },
    {
      id: 'root-cause',
      category: 'Capabilities',
      q: 'Does it do root cause analysis?',
      keywords: ['root cause', 'rca', 'lineage', 'data lineage', 'trace', 'where did it break',
                 'impact analysis', 'downstream impact', 'debugging'],
      a: "Yes. DeltaMax tracks **end-to-end data lineage** and traces problems back to their original source " +
         "automatically.\n\n" +
         "Each analysis includes an impact assessment across connected systems, suggested remediation steps, " +
         "and both the technical and business consequences spelled out. Historical patterns are kept so the " +
         "same failure doesn't quietly recur, and the reports are readable enough to share between " +
         "engineering and business teams.",
      sources: [
        { label: 'Home', href: 'index.html', note: 'Root Cause Analysis in the feature list.' },
        { label: 'Storage layer', href: 'data-quality.html', note: 'The Lineage Store that makes tracing possible.' }
      ],
      related: ['ai-agent', 'architecture', 'alerts']
    },
    {
      id: 'alerts',
      category: 'Capabilities',
      q: 'How does alerting work?',
      keywords: ['alerts', 'alerting', 'notifications', 'slack', 'email alerts', 'webhook', 'paging',
                 'alert fatigue', 'notify', 'integrations for alerts'],
      a: "Traditional alerting drowns people in noise. DeltaMax sends **context-rich notifications** instead.\n\n" +
         "Each one carries the severity assessment, the business impact, the current Trust Score and the " +
         "Agent Summary explaining the cause. Alerts are prioritised by actual risk to the business, so the " +
         "critical ones don't get buried.\n\n" +
         "Delivery goes to **email, Slack or webhooks**, and automated reason codes classify discrepancies — " +
         "explaining *why* records differ rather than just counting differences.",
      sources: [
        { label: 'Visualise & Alerts', href: 'data-quality.html', note: 'The alerting layer in the architecture.' }
      ],
      related: ['ai-agent', 'freshness-monitoring', 'root-cause']
    },
    {
      id: 'forecasting',
      category: 'Capabilities',
      q: 'What is forecasting used for?',
      keywords: ['forecasting', 'forecast', 'predict', 'prediction', 'proactive', 'early warning',
                 'before it happens', 'capacity planning', 'predictive'],
      a: "Forecasting moves data quality from reactive to proactive.\n\n" +
         "DeltaMax analyses historical patterns to predict drift, freshness problems and anomaly risk before " +
         "they occur, giving teams an early warning window to act in. It also supports capacity planning and " +
         "resource allocation, so future data health becomes something you can manage rather than discover.",
      sources: [
        { label: 'Home', href: 'index.html', note: 'Forecasting in the feature carousel.' }
      ],
      related: ['drift-monitoring', 'budgets', 'ai-agent']
    },
    {
      id: 'budgets',
      category: 'Capabilities',
      q: 'Can it track data costs and budgets?',
      keywords: ['budgets', 'budget', 'cost tracking', 'spend', 'compute cost', 'storage cost', 'finops',
                 'cost anomaly', 'expenses', 'cost control'],
      a: "Yes — **Budgets** gives real-time visibility into compute, storage and processing spend.\n\n" +
         "- Set custom budgets per pipeline or workload\n" +
         "- Get proactive alerts when spending crosses a threshold\n" +
         "- Catch unusual usage patterns and cost anomalies early\n" +
         "- Act on optimisation recommendations that don't compromise quality\n\n" +
         "Budget forecasting also supports longer-term resource planning, which gives finance and data teams " +
         "a shared set of numbers to work from.\n\n" +
         "*Note: this tracks your data-platform spend — it isn't DeltaMax's own pricing. Ask me about pricing " +
         "for that.*",
      sources: [
        { label: 'Home', href: 'index.html', note: 'Budgets in the feature carousel.' }
      ],
      related: ['pricing', 'forecasting', 'scale']
    },
    {
      id: 'hyperparameters',
      category: 'Capabilities',
      q: 'How are hyperparameters handled?',
      keywords: ['hyperparameters', 'hyperparameter', 'model tuning', 'ml models', 'model governance',
                 'reproducibility', 'experiments', 'versioning'],
      a: "DeltaMax tracks and **versions hyperparameters alongside data quality metrics**, so configuration " +
         "changes and their effects sit in the same place.\n\n" +
         "It monitors how parameter changes affect quality and model accuracy, surfaces optimisation " +
         "recommendations from observed performance, and detects hyperparameter drift automatically. Teams " +
         "keep full reproducibility across experiments and production, which is the foundation of decent " +
         "model governance.",
      sources: [
        { label: 'Home', href: 'index.html', note: 'Hyperparameters in the feature carousel.' }
      ],
      related: ['drift-monitoring', 'tech-stack', 'ai-agent']
    },

    /* ===================== HOW IT WORKS ===================== */
    {
      id: 'how-it-works',
      category: 'How it works',
      q: 'How does DeltaMax actually work?',
      keywords: ['how does it work', 'how it works', 'workflow', 'process', 'dataflow', 'steps',
                 'pipeline', 'end to end', 'stages', 'lifecycle'],
      a: "Five stages, running continuously:\n\n" +
         "**1. Ingest** — connect to databases, warehouses, lakes and applications; infer schema and profile " +
         "the data on the way in (row counts, null rates, type distributions).\n\n" +
         "**2. Profile & monitor** — establish a baseline of normal behaviour, your data's *rhythm*, so " +
         "routine fluctuation can be told apart from a real anomaly.\n\n" +
         "**3. Analyse & detect** — IQR and Isolation Forest for anomalies, PSI and T-tests for drift. This " +
         "is where the unknown-unknowns surface.\n\n" +
         "**4. Score & validate** — anomalies, drift, rule violations and freshness combine into the Trust " +
         "Score, with an Agent Summary explaining the change.\n\n" +
         "**5. Visualise & alert** — dashboards for the trends, and email, Slack or webhook alerts with " +
         "reason codes for the incidents.",
      sources: [
        { label: 'Dataflow Overview', href: 'data-quality.html', note: 'All five stages, step by step with diagrams.' }
      ],
      related: ['architecture', 'algorithms', 'trust-score']
    },
    {
      id: 'architecture',
      category: 'How it works',
      q: 'What is the platform architecture?',
      keywords: ['architecture', 'layers', 'design', 'system design', 'components', 'how is it built',
                 'stack architecture', 'infrastructure', 'storage layer', 'ingestion layer'],
      a: "Six layers:\n" +
         "- **Data Sources** — databases, warehouses, lakes, apps, flat files and REST APIs; cloud or on-prem\n" +
         "- **Ingestion Layer** — batch and streaming, millions of records a minute, with schema inference " +
         "and profiling on arrival\n" +
         "- **Processing & Analysis** — completeness, uniqueness, consistency, accuracy and validity checks " +
         "plus ML detection and statistical drift tests, running in parallel\n" +
         "- **Trust & Score Engine** — computes the Anomaly, Drift, Business, Freshness and overall Trust Scores\n" +
         "- **Storage Layer** — Metadata Store, Results Store and Lineage Store, with configurable retention " +
         "for audit and trending\n" +
         "- **Visualise & Alerts** — interactive dashboards, scheduled reports and intelligent alerting\n\n" +
         "All processing is distributed, so it scales to petabytes across thousands of tables.",
      sources: [
        { label: 'Platform Architecture', href: 'data-quality.html', note: 'Expand each of the six layers in detail.' }
      ],
      related: ['data-sources', 'scale', 'tech-stack']
    },
    {
      id: 'algorithms',
      category: 'How it works',
      q: 'What algorithms does DeltaMax use?',
      keywords: ['algorithms', 'algorithm', 'ml models', 'machine learning', 'statistics', 'statistical methods',
                 'isolation forest', 'iqr', 'psi', 'ks test', 't-test', 'math', 'techniques', 'how do you detect'],
      a: "A deliberate mix of statistics and machine learning:\n" +
         "- **Interquartile Range (IQR)** — robust statistical outlier detection\n" +
         "- **Isolation Forest** — ML-based anomaly detection for multivariate, non-obvious cases\n" +
         "- **Population Stability Index (PSI)** — quantifies distribution shift\n" +
         "- **Kolmogorov–Smirnov (KS) test** — detects changes in distribution shape\n" +
         "- **T-tests** — checks for significant shifts in central tendency\n\n" +
         "Rule-based and ML-based validation run **in parallel**, which is what gives the holistic view — " +
         "statistics catch what rules can't express, and rules catch what statistics don't know to care about.",
      sources: [
        { label: 'Blog', href: 'blog.html', note: 'Isolation Forest and IQR explained in plain language.' },
        { label: 'Core components', href: 'data-quality.html', note: 'Where each method runs in the pipeline.' }
      ],
      related: ['anomaly-detection', 'drift-monitoring', 'tech-stack']
    },
    {
      id: 'data-sources',
      category: 'How it works',
      q: 'What data sources can it connect to?',
      keywords: ['data sources', 'connectors', 'integrations', 'connect', 'databases', 'supported sources',
                 'postgres', 'mysql', 'oracle', 'sql server', 'kafka', 'kinesis', 'pub/sub', 'bigquery',
                 'snowflake connection', 'streaming', 'compatible with'],
      a: "Broad coverage, cloud-native and on-premise:\n" +
         "- **Databases** — PostgreSQL, MySQL, Oracle, SQL Server via native connectors\n" +
         "- **Warehouses & lakes** — including BigQuery at petabyte scale\n" +
         "- **Cloud platforms** — AWS, Azure and GCP\n" +
         "- **Streaming** — Apache Kafka, AWS Kinesis, Google Pub/Sub for real-time validation\n" +
         "- **Other** — enterprise applications, flat files and REST APIs\n\n" +
         "Structured, semi-structured and unstructured data are all supported. The platform automatically " +
         "discovers and catalogues available assets, and incremental ingestion keeps resource usage down by " +
         "processing only what changed.",
      sources: [
        { label: 'Data Source & Ingestion', href: 'data-quality.html', note: 'The first two architecture layers in full.' }
      ],
      related: ['architecture', 'deployment', 'scale']
    },
    {
      id: 'tech-stack',
      category: 'How it works',
      q: 'What is the tech stack?',
      keywords: ['tech stack', 'technology', 'built with', 'technologies', 'python', 'spark', 'react',
                 'fastapi', 'docker', 'what language', 'framework'],
      a: "DeltaMax is built on:\n" +
         "- **Backend** — Python, FastAPI\n" +
         "- **Data & ML** — Scikit-learn, Apache Spark, Pandas\n" +
         "- **Storage** — BigQuery, PostgreSQL\n" +
         "- **Frontend** — React, Chart.js\n" +
         "- **Infrastructure** — Docker, Google Cloud Platform, Pub/Sub",
      sources: [
        { label: 'Tech Stack', href: 'data-quality.html', note: 'The full stack with logos on the platform page.' }
      ],
      related: ['architecture', 'algorithms', 'deployment']
    },
    {
      id: 'scale',
      category: 'How it works',
      q: 'How well does it scale?',
      keywords: ['scale', 'scalability', 'performance', 'petabyte', 'large data', 'how much data',
                 'throughput', 'volume', 'big data', 'limits', 'size', 'how big', 'handle'],
      a: "It's built for production volume, not demo datasets.\n\n" +
         "The ingestion layer processes **millions of records per minute** at low latency across batch and " +
         "streaming. Processing is distributed and handles **petabytes across thousands of tables** without " +
         "performance degradation. Incremental processing keeps cost down by touching only changed data, with " +
         "full refresh available when you need historical analysis.",
      sources: [
        { label: 'Platform Architecture', href: 'data-quality.html', note: 'Throughput and scale notes per layer.' }
      ],
      related: ['architecture', 'data-sources', 'budgets']
    },

    /* ===================== BUYING & DEPLOYMENT ===================== */
    {
      id: 'demo',
      category: 'Buying & deployment',
      q: 'How do I book a demo?',
      keywords: ['demo', 'book a demo', 'schedule demo', 'trial', 'try it', 'see it', 'walkthrough',
                 'meeting', 'call', 'presentation', 'poc', 'proof of concept', 'test drive'],
      a: "Head to the **Schedule Demo** page and fill in the short form — name, work email, phone, company " +
         "and which service you're interested in (Data Quality Trust, Master Data Management, or Cloud " +
         "Migration Validation).\n\n" +
         "The team picks it up from there and arranges a personalised walkthrough on your use case.",
      actions: [{ label: 'Schedule a demo', href: 'schedule.html' }],
      sources: [
        { label: 'Our journey with you', href: 'index.html', note: 'The five phases that follow the demo.' }
      ],
      related: ['getting-started', 'pricing', 'contact']
    },
    {
      id: 'buy',
      category: 'Buying & deployment',
      q: 'Where can I buy DeltaMax?',
      keywords: ['buy', 'purchase', 'where to buy', 'marketplace', 'aws marketplace', 'azure marketplace',
                 'google cloud marketplace', 'gcp marketplace', 'procurement', 'order', 'subscribe',
                 'licensing', 'license'],
      a: "Through the cloud marketplaces, so it goes through procurement you already have in place:\n" +
         "- **Microsoft Azure Marketplace** — available now\n" +
         "- **Google Cloud Marketplace** — available now\n" +
         "- **AWS Marketplace** — shortly available\n\n" +
         "The marketplace links are in the **Buy Product** menu in the navigation bar. If you'd rather talk " +
         "it through first, book a demo and the team will walk you through the options.",
      actions: [{ label: 'Schedule a demo', href: 'schedule.html' }],
      sources: [
        { label: 'About', href: 'about.html', note: 'Live marketplace availability banner.' }
      ],
      related: ['pricing', 'deployment', 'getting-started']
    },
    {
      id: 'pricing',
      category: 'Buying & deployment',
      q: 'How much does DeltaMax cost?',
      keywords: ['pricing', 'price', 'cost', 'how much', 'quote', 'plans', 'tiers', 'subscription cost',
                 'expensive', 'budget for it', 'free', 'affordable', 'rates'],
      a: "Pricing isn't published on the site — it's handled through the cloud marketplace listings and " +
         "directly with the team, so it can be matched to your data volume and deployment.\n\n" +
         "What I can tell you is that **transparent pricing is a deliberate differentiator**: unlike vendors " +
         "where every deal is individually negotiated behind closed doors, DeltaMax lists through Azure, " +
         "Google Cloud and (shortly) AWS Marketplace.\n\n" +
         "For an actual number for your setup, the contact form is the quickest route.",
      actions: [{ label: 'Request pricing', href: 'schedule.html' }],
      sources: [
        { label: 'Competitive Intel', href: 'competitive_intel.html', note: 'How our pricing model compares.' }
      ],
      related: ['buy', 'demo', 'competitors']
    },
    {
      id: 'deployment',
      category: 'Buying & deployment',
      q: 'How is DeltaMax deployed?',
      keywords: ['deployment', 'deploy', 'install', 'setup', 'on premise', 'on-prem', 'cloud', 'saas',
                 'hosted', 'self hosted', 'installation', 'implementation', 'timeline', 'rollout',
                 'implementation time', 'how long to set up', 'how long', 'how quickly'],
      a: "DeltaMax is cloud-native and containerised (Docker, running on GCP), and connects to both " +
         "**cloud and on-premise** sources — so it fits your existing infrastructure rather than asking you " +
         "to move data to it.\n\n" +
         "Privacy checks run **in your environment**, and setup is measured in days: most teams are fully " +
         "monitoring production pipelines within days rather than months. Purchase runs through the Azure, " +
         "Google Cloud and (shortly) AWS marketplaces.",
      sources: [
        { label: 'Platform overview', href: 'data-quality.html', note: 'Cloud-native architecture and tech stack.' },
        { label: 'Our journey with you', href: 'index.html', note: 'The five phases from demo to scale.' }
      ],
      related: ['security', 'data-sources', 'buy']
    },
    {
      id: 'security',
      category: 'Buying & deployment',
      q: 'How does DeltaMax handle security and privacy?',
      keywords: ['security', 'privacy', 'compliance', 'gdpr', 'data protection', 'safe', 'governance',
                 'audit', 'regulatory', 'pii', 'sensitive data', 'certification', 'secure'],
      a: "Privacy and security score highest in our capability comparison, and the design reflects that:\n" +
         "- **In-environment privacy** — checks run where your data already lives\n" +
         "- **Synthetic data generation** — test against realistic data without exposing the real thing\n" +
         "- **Full lineage and audit trail** — the Results Store keeps quality history with configurable " +
         "retention for compliance verification\n" +
         "- **Governance policies** — enforced through the business rule engine\n\n" +
         "For specifics on certifications or a security questionnaire, the team can answer directly.",
      actions: [{ label: 'Ask the team', href: 'schedule.html' }],
      sources: [
        { label: 'Competitive Intel', href: 'competitive_intel.html', note: 'Privacy and security scored against rivals.' },
        { label: 'Storage layer', href: 'data-quality.html', note: 'Retention and audit trail detail.' }
      ],
      related: ['business-rules', 'deployment', 'use-cases']
    },
    {
      id: 'getting-started',
      category: 'Buying & deployment',
      q: 'How do I get started?',
      keywords: ['get started', 'getting started', 'onboarding', 'first step', 'next step', 'begin',
                 'how do i start', 'journey', 'process to buy', 'what happens next'],
      a: "Five phases:\n" +
         "**1. Explore solutions** — see how the platform maps to your challenges\n" +
         "**2. Schedule a demo** — the team arranges a personalised walkthrough\n" +
         "**3. Purchase via marketplaces** — AWS, GCP or Azure\n" +
         "**4. Technical support & customisation** — tailoring it to your pipelines\n" +
         "**5. Optimisation & scale** — ongoing tuning as your data grows\n\n" +
         "Step two is the one that needs you — the rest follows from it.",
      actions: [{ label: 'Schedule a demo', href: 'schedule.html' }],
      sources: [
        { label: 'Our journey with you', href: 'index.html', note: 'The five-phase timeline, interactive.' },
        { label: 'Platform overview', href: 'data-quality.html', note: 'Explore solutions before you book.' }
      ],
      related: ['demo', 'buy', 'deployment']
    },
    {
      id: 'contact',
      category: 'Buying & deployment',
      q: 'How do I contact the team?',
      keywords: ['contact', 'email', 'reach you', 'get in touch', 'support', 'phone', 'linkedin',
                 'address', 'talk', 'enquiry', 'inquiry', 'help desk'],
      a: "A few ways:\n" +
         "- **Contact form** — the fastest route, on the [Schedule Demo page](schedule.html)\n" +
         "- **Email** — [contact@katalyststreet.com](mailto:contact@katalyststreet.com)\n" +
         "- **LinkedIn** — [KatalystStreet](https://www.linkedin.com/company/katalyst-street) or " +
         "[NeuAlto](https://www.linkedin.com/company/neualto-technologies-pvt-ltd)",
      actions: [{ label: 'Open the contact form', href: 'schedule.html' }],
      sources: [
        { label: 'About us', href: 'about.html', note: 'Who you will be talking to.' }
      ],
      related: ['demo', 'who-built-it']
    },

    /* ===================== COMPARISON & RESOURCES ===================== */
    {
      id: 'competitors',
      category: 'Comparison & resources',
      q: 'How does DeltaMax compare to other tools?',
      keywords: ['competitors', 'competition', 'compare', 'comparison', 'alternatives', 'versus', 'vs',
                 'other tools', 'competitive', 'who else', 'rivals', 'market'],
      a: "DeltaMax leads our capability comparison with a total score of **42/50**, measured against Monte " +
         "Carlo, Databricks, Snowflake and Informatica.\n\n" +
         "Where it wins:\n" +
         "- Best-in-class **anomaly detection and drift monitoring**\n" +
         "- Full **data lineage and root cause analysis**\n" +
         "- Highest **privacy and security compliance**\n" +
         "- Superior **synthetic data generation**\n\n" +
         "Ask me about any specific vendor for the head-to-head.",
      sources: [
        { label: 'Competitive Intel', href: 'competitive_intel.html', note: 'All five platforms compared, card by card.' }
      ],
      related: ['vs-monte-carlo', 'vs-databricks', 'vs-snowflake', 'vs-informatica']
    },
    {
      id: 'vs-monte-carlo',
      category: 'Comparison & resources',
      q: 'How do you compare to Monte Carlo?',
      keywords: ['monte carlo', 'montecarlo', 'vs monte carlo', 'compare monte carlo'],
      a: "Monte Carlo pioneered data observability and is genuinely strong at ML-driven anomaly detection and " +
         "cross-system lineage — credit where it's due.\n\n" +
         "The differences: it's built primarily for **pipeline and metadata monitoring**, with less emphasis " +
         "on synthetic test data generation, and enterprise pricing is typically **negotiated rather than " +
         "published**. DeltaMax adds native synthetic data, in-environment privacy and transparent " +
         "marketplace pricing on top of the same detection and lineage strengths.",
      sources: [
        { label: 'Competitive Intel', href: 'competitive_intel.html', note: 'The Monte Carlo card, side by side with ours.' }
      ],
      related: ['competitors', 'pricing', 'security']
    },
    {
      id: 'vs-databricks',
      category: 'Comparison & resources',
      q: 'How do you compare to Databricks?',
      keywords: ['databricks', 'vs databricks', 'delta live tables', 'unity catalog', 'lakehouse'],
      a: "Databricks brings data quality into the lakehouse through **Delta Live Table expectations** and " +
         "**Unity Catalog** lineage — a natural fit if your Spark workloads already live there.\n\n" +
         "The constraint is that those quality checks are tightly coupled to the Databricks environment, so " +
         "validating data outside the lakehouse usually needs extra tooling. DeltaMax monitors across all " +
         "your sources — cloud, on-prem, streaming and applications — from one place.",
      sources: [
        { label: 'Competitive Intel', href: 'competitive_intel.html', note: 'The Databricks card in the comparison.' }
      ],
      related: ['competitors', 'data-sources', 'architecture']
    },
    {
      id: 'vs-snowflake',
      category: 'Comparison & resources',
      q: 'How do you compare to Snowflake?',
      keywords: ['snowflake', 'vs snowflake', 'compare snowflake'],
      a: "Snowflake offers industry-leading data privacy and governance with genuinely easy cloud-native " +
         "setup, and it's strong on migration validation.\n\n" +
         "Where it's thinner is **native anomaly detection, drift monitoring and synthetic data** — the " +
         "capabilities DeltaMax is built around. The two work well together: Snowflake as the platform, " +
         "DeltaMax as the quality intelligence layer on top of it.",
      sources: [
        { label: 'Competitive Intel', href: 'competitive_intel.html', note: 'The Snowflake card in the comparison.' }
      ],
      related: ['competitors', 'anomaly-detection', 'drift-monitoring']
    },
    {
      id: 'vs-informatica',
      category: 'Comparison & resources',
      q: 'How do you compare to Informatica?',
      keywords: ['informatica', 'vs informatica', 'mdm', 'master data management'],
      a: "Informatica has decades of enterprise data governance and MDM experience, which makes it a trusted " +
         "choice for large, highly regulated organisations with complex legacy systems.\n\n" +
         "That breadth comes with a **steeper learning curve and higher setup investment**, and teams often " +
         "need extra configuration before real-time anomaly alerts are running. DeltaMax is designed to be " +
         "monitoring production pipelines within days.",
      sources: [
        { label: 'Competitive Intel', href: 'competitive_intel.html', note: 'The Informatica card in the comparison.' }
      ],
      related: ['competitors', 'deployment', 'getting-started']
    },
    {
      id: 'blog',
      category: 'Comparison & resources',
      q: 'Where can I read more?',
      keywords: ['blog', 'blogs', 'articles', 'posts', 'linkedin posts', 'resources', 'read more',
                 'content', 'learn more', 'documentation', 'whitepaper', 'case study'],
      a: "The Blogs page collects our LinkedIn posts — practical pieces rather than marketing:\n" +
         "- The Cost of Second-Guessing\n" +
         "- How Confident Are You in Your Data Quality?\n" +
         "- How Isolation Forest Detects Anomalies\n" +
         "- The Power of the Interquartile Range (IQR)\n" +
         "- Data Monitoring Sounds Simple — Until You Actually Do It\n" +
         "- Building Data Culture, Scaling Data Governance, and What Is Data Quality?",
      sources: [
        { label: 'Blogs', href: 'blog.html', note: 'Every post, with the full write-up.' }
      ],
      related: ['algorithms', 'what-is-deltamax']
    },
    {
      id: 'site-guide',
      category: 'Comparison & resources',
      q: 'What is on this site?',
      keywords: ['site', 'website', 'pages', 'navigation', 'where do i find', 'sitemap', 'site map',
                 'what pages', 'menu', 'sections', 'guide me', 'show me around'],
      a: "Five pages, each with a different job:\n" +
         "- **Home** — the Trust Score breakdown, all ten features, and the five-phase journey\n" +
         "- **Platform** — architecture, core components, use cases, dataflow and tech stack\n" +
         "- **Competitive Intel** — how we score against Monte Carlo, Databricks, Snowflake and Informatica\n" +
         "- **About** — who builds DeltaMax and where you can buy it\n" +
         "- **Blogs** — practical write-ups on anomaly detection, drift and data culture\n\n" +
         "Plus **Schedule Demo** when you're ready to talk to someone.",
      sources: [
        { label: 'Home', href: 'index.html', note: 'Trust Score, features and the journey timeline.' },
        { label: 'Platform overview', href: 'data-quality.html', note: 'The deepest technical detail on the site.' }
      ],
      related: ['what-is-deltamax', 'competitors', 'blog']
    }
  ]
};
