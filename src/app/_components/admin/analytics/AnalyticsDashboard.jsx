"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  buildPeriodQuery,
  fetchAnalyticsEndpoint,
} from "@components/admin/analytics/analytics-api";
import { exportOverviewCsv, downloadCsv } from "@library/analytics/ga4-csv";
import {
  formatChartDateLabel,
  formatDuration,
  formatEvolutionPercent,
  formatFrenchDate,
  formatNumber,
  formatPercent,
} from "@library/analytics/ga4-format";
import { buildUtmUrl } from "@library/analytics/utm-builder";

const RANGE_OPTIONS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "yesterday", label: "Hier" },
  { id: "7d", label: "7 derniers jours" },
  { id: "30d", label: "30 derniers jours" },
  { id: "90d", label: "90 derniers jours" },
  { id: "year", label: "Cette année" },
  { id: "custom", label: "Personnalisée" },
];

const CHART_COLORS = ["#014196", "#1a73e8", "#5b8fd6", "#8eb5e8", "#c5d9f2", "#2e6b3e"];

const EMPTY = {
  overview: null,
  timeseries: null,
  sources: null,
  pages: null,
  devices: null,
  locations: null,
  events: null,
  campaigns: null,
  realtime: null,
  operational: null,
};

function EvolutionBadge({ evolution }) {
  if (!evolution) return <span className="tst-analytics-evolution tst-analytics-evolution--neutral">—</span>;
  const cls = `tst-analytics-evolution tst-analytics-evolution--${evolution.direction}`;
  const icon =
    evolution.direction === "up"
      ? "fa-arrow-up"
      : evolution.direction === "down"
        ? "fa-arrow-down"
        : "fa-minus";
  return (
    <span className={cls} aria-label={`${evolution.label} ${formatEvolutionPercent(evolution.percent)}`}>
      <i className={`fas ${icon}`} aria-hidden="true" /> {formatEvolutionPercent(evolution.percent)}
      <span className="sr-only">{evolution.label}</span>
    </span>
  );
}

function SectionCard({ title, description, children, actions, id }) {
  return (
    <section className="tst-analytics-section" aria-labelledby={id}>
      <div className="tst-analytics-section__head">
        <div>
          <h2 id={id}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="tst-analytics-section__actions">{actions}</div> : null}
      </div>
      <div className="tst-analytics-section__body">{children}</div>
    </section>
  );
}

function EmptyState({ message = "Aucune donnée pour cette période." }) {
  return <p className="tst-analytics-empty">{message}</p>;
}

function SkeletonGrid({ count = 4 }) {
  return (
    <div className="tst-analytics-kpis tst-analytics-kpis--loading" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="tst-analytics-kpi tst-analytics-kpi--skeleton" />
      ))}
    </div>
  );
}

const AnalyticsDashboard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [configured, setConfigured] = useState(true);
  const [customStart, setCustomStart] = useState(searchParams.get("start") || "");
  const [customEnd, setCustomEnd] = useState(searchParams.get("end") || "");
  const [realtimeUpdatedAt, setRealtimeUpdatedAt] = useState(null);

  const [utmForm, setUtmForm] = useState({
    url: "https://latablemarine.com",
    source: "",
    medium: "",
    campaign: "",
    content: "",
    term: "",
  });
  const [utmResult, setUtmResult] = useState({ url: "", error: "" });

  const range = searchParams.get("range") || "30d";
  const periodQuery = useMemo(() => buildPeriodQuery(searchParams), [searchParams]);

  const updateUrl = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const loadDashboard = useCallback(
    async (force = false) => {
      const query = buildPeriodQuery(searchParams);
      if (force) query.set("refresh", "1");

      try {
        setError(null);

        const operationalRes = await fetchAnalyticsEndpoint(
          "/api/admin/analytics/operational",
          new URLSearchParams()
        );

        const gaEndpoints = [
          ["/api/admin/analytics/overview", query],
          ["/api/admin/analytics/timeseries", query],
          ["/api/admin/analytics/sources", query],
          ["/api/admin/analytics/pages", query],
          ["/api/admin/analytics/devices", query],
          ["/api/admin/analytics/locations", query],
          ["/api/admin/analytics/events", query],
          ["/api/admin/analytics/campaigns", query],
        ];

        const gaResults = await Promise.allSettled(
          gaEndpoints.map(([endpoint, params]) =>
            fetchAnalyticsEndpoint(endpoint, params)
          )
        );

        const firstRejected = gaResults.find((r) => r.status === "rejected");
        if (firstRejected?.reason?.configured === false) {
          setConfigured(false);
          setError(firstRejected.reason.message);
        } else if (firstRejected) {
          setConfigured(true);
          setError(firstRejected.reason?.message || "Erreur Analytics.");
        } else {
          setConfigured(true);
        }

        const get = (index) =>
          gaResults[index]?.status === "fulfilled" ? gaResults[index].value : null;

        setData({
          overview: get(0),
          timeseries: get(1),
          sources: get(2),
          pages: get(3),
          devices: get(4),
          locations: get(5),
          events: get(6),
          campaigns: get(7),
          realtime: null,
          operational: operationalRes,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue.";
        setError(message);
      }
    },
    [searchParams]
  );

  const loadRealtime = useCallback(async (force = false) => {
    try {
      const query = new URLSearchParams();
      if (force) query.set("refresh", "1");
      const res = await fetchAnalyticsEndpoint("/api/admin/analytics/realtime", query);
      setData((prev) => ({ ...prev, realtime: res }));
      setRealtimeUpdatedAt(res.realtime?.updatedAt || new Date().toISOString());
    } catch {
      // Temps réel optionnel — ne bloque pas le dashboard
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([loadDashboard(false), loadRealtime(false)]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadDashboard, loadRealtime]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadRealtime(false);
    }, 60000);
    return () => clearInterval(timer);
  }, [loadRealtime]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDashboard(true), loadRealtime(true)]);
    setRefreshing(false);
  };

  const handleRangeChange = (nextRange) => {
    if (nextRange === "custom") {
      updateUrl({ range: "custom", start: customStart || null, end: customEnd || null });
      return;
    }
    updateUrl({ range: nextRange, start: null, end: null });
  };

  const handleCustomApply = () => {
    updateUrl({ range: "custom", start: customStart, end: customEnd });
  };

  const handleExportCsv = () => {
    if (!data.overview?.overview) return;
    const csv = exportOverviewCsv(data.overview.overview, data.overview.period);
    downloadCsv(`analytics-latablemarine-${data.overview.period?.endDate || "export"}.csv`, csv);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUtmGenerate = () => {
    const result = buildUtmUrl(utmForm.url, utmForm);
    setUtmResult({ url: result.url || "", error: result.error || "" });
  };

  const handleUtmCopy = async () => {
    if (!utmResult.url) return;
    try {
      await navigator.clipboard.writeText(utmResult.url);
    } catch {
      // ignore
    }
  };

  const kpis = data.overview?.overview?.kpis || [];
  const mainKpis = kpis.filter((k) => !k.isEvent);
  const eventKpis = kpis.filter((k) => k.isEvent);

  return (
    <div className="tst-analytics-dashboard">
      <header className="tst-admin-panel__header tst-analytics-header">
        <div>
          <h1>Statistiques</h1>
          <p>Fréquentation du site via Google Analytics 4 — données agrégées uniquement.</p>
        </div>
        <div className="tst-analytics-header__actions">
          <button
            type="button"
            className="tst-analytics-btn tst-analytics-btn--ghost"
            onClick={handleExportCsv}
            disabled={loading || !data.overview}
          >
            <i className="fas fa-file-csv" aria-hidden="true" /> Exporter CSV
          </button>
          <button
            type="button"
            className="tst-analytics-btn tst-analytics-btn--ghost"
            onClick={handlePrint}
          >
            <i className="fas fa-print" aria-hidden="true" /> Imprimer / PDF
          </button>
          <button
            type="button"
            className="tst-analytics-btn tst-analytics-btn--primary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <i className={`fas fa-sync${refreshing ? " fa-spin" : ""}`} aria-hidden="true" /> Actualiser
          </button>
        </div>
      </header>

      <div className="tst-analytics-toolbar">
        <div className="tst-analytics-toolbar__ranges" role="group" aria-label="Période">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`tst-analytics-range-btn${range === opt.id ? " is-active" : ""}`}
              onClick={() => handleRangeChange(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {range === "custom" ? (
          <div className="tst-analytics-toolbar__custom">
            <label>
              Début
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </label>
            <label>
              Fin
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </label>
            <button type="button" className="tst-analytics-btn tst-analytics-btn--secondary" onClick={handleCustomApply}>
              Appliquer
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="tst-analytics-error" role="alert">
          <i className="fas fa-exclamation-circle" aria-hidden="true" /> {error}
        </div>
      ) : null}

      {!configured && !loading ? (
        <div className="tst-analytics-config-alert" role="alert">
          <i className="fas fa-exclamation-triangle" aria-hidden="true" />
          <div>
            <h2>Google Analytics 4 non configuré côté serveur</h2>
            <p>
              Les statistiques GA4 sont indisponibles. Consultez <code>docs/analytics-dashboard.md</code> pour
              configurer <code>GA4_PROPERTY_ID</code>, <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> et{" "}
              <code>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code>.
            </p>
          </div>
        </div>
      ) : null}

      {loading ? <SkeletonGrid count={8} /> : null}

      {!loading && data.overview?.summary ? (
        <SectionCard
          id="analytics-summary-title"
          title="Résumé de la période"
          description="Synthèse calculée localement à partir des chiffres GA4."
        >
          <p className="tst-analytics-summary">{data.overview.summary}</p>
        </SectionCard>
      ) : null}

      {!loading && mainKpis.length > 0 ? (
        <div className="tst-analytics-kpis" aria-label="Indicateurs principaux">
          {mainKpis.map((kpi) => (
            <article key={kpi.id} className="tst-analytics-kpi">
              <span className="tst-analytics-kpi__label">{kpi.label}</span>
              <strong className="tst-analytics-kpi__value">
                {kpi.isDuration
                  ? formatDuration(kpi.value)
                  : kpi.isPercent
                    ? formatPercent(kpi.value, { isRatio: false })
                    : formatNumber(kpi.value)}
              </strong>
              <div className="tst-analytics-kpi__meta">
                <span>Préc. : {kpi.isDuration ? formatDuration(kpi.previousValue) : formatNumber(kpi.previousValue)}</span>
                <EvolutionBadge evolution={kpi.evolution} />
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!loading && eventKpis.length > 0 ? (
        <div className="tst-analytics-kpis tst-analytics-kpis--events" aria-label="Événements clés">
          {eventKpis.map((kpi) => (
            <article key={kpi.id} className="tst-analytics-kpi tst-analytics-kpi--compact">
              <span className="tst-analytics-kpi__label">{kpi.label}</span>
              <strong className="tst-analytics-kpi__value">{formatNumber(kpi.value)}</strong>
              <EvolutionBadge evolution={kpi.evolution} />
              {kpi.value === 0 ? <small>Aucune donnée</small> : null}
            </article>
          ))}
        </div>
      ) : null}

      <div className="tst-analytics-grid">
        <SectionCard
          id="analytics-realtime-title"
          title="Temps réel"
          description="Utilisateurs actifs sur les 30 dernières minutes."
          actions={
            <button type="button" className="tst-analytics-btn tst-analytics-btn--ghost" onClick={() => loadRealtime(true)}>
              Actualiser
            </button>
          }
        >
          <div className="tst-analytics-realtime">
            <div className="tst-analytics-realtime__count">
              <span>Utilisateurs actifs</span>
              <strong>{formatNumber(data.realtime?.realtime?.activeUsers || 0)}</strong>
            </div>
            <p className="tst-analytics-realtime__updated">
              Dernière mise à jour : {formatFrenchDate(realtimeUpdatedAt, { withTime: true })}
            </p>
            {(data.realtime?.realtime?.pages || []).length > 0 ? (
              <table className="tst-analytics-table">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Appareil</th>
                    <th>Ville</th>
                    <th>Pays</th>
                    <th>Utilisateurs</th>
                  </tr>
                </thead>
                <tbody>
                  {data.realtime.realtime.pages.map((row, index) => (
                    <tr key={`${row.page}-${index}`}>
                      <td>{row.page}</td>
                      <td>{row.device}</td>
                      <td>{row.city}</td>
                      <td>{row.country}</td>
                      <td>{formatNumber(row.users)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="Aucune activité en temps réel pour le moment." />
            )}
          </div>
        </SectionCard>

        <SectionCard id="analytics-traffic-title" title="Évolution du trafic" description="Utilisateurs, sessions et pages vues.">
          {(data.timeseries?.timeseries?.points || []).length > 0 ? (
            <div className="tst-analytics-chart" role="img" aria-label="Graphique d'évolution du trafic">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.timeseries.timeseries.points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ebef" />
                  <XAxis dataKey="date" tickFormatter={formatChartDateLabel} />
                  <YAxis />
                  <Tooltip labelFormatter={formatChartDateLabel} />
                  <Legend />
                  <Line type="monotone" dataKey="activeUsers" name="Utilisateurs" stroke="#014196" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#1a73e8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="screenPageViews" name="Pages vues" stroke="#5b8fd6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </SectionCard>

        <SectionCard id="analytics-sources-title" title="Sources du trafic">
          {(data.sources?.sources?.items || []).length > 0 ? (
            <div className="tst-analytics-chart">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.sources.sources.items} dataKey="sessions" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
                    {data.sources.sources.items.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </SectionCard>

        <SectionCard id="analytics-devices-title" title="Appareils">
          {(data.devices?.devices?.items || []).length > 0 ? (
            <div className="tst-analytics-chart">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.devices.devices.items}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ebef" />
                  <XAxis dataKey="device" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sessions" name="Sessions" fill="#014196" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="users" name="Utilisateurs" fill="#5b8fd6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </SectionCard>

        <SectionCard id="analytics-pages-title" title="Pages les plus consultées">
          {(data.pages?.pages?.items || []).length > 0 ? (
            <div className="tst-analytics-table-wrap">
              <table className="tst-analytics-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Chemin</th>
                    <th>Vues</th>
                    <th>Utilisateurs</th>
                    <th>Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pages.pages.items.map((row) => (
                    <tr key={`${row.path}-${row.title}`}>
                      <td>{row.title}</td>
                      <td><code>{row.path}</code></td>
                      <td>{formatNumber(row.views)}</td>
                      <td>{formatNumber(row.users)}</td>
                      <td>{formatDuration(row.engagementDuration)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState />
          )}
        </SectionCard>

        <SectionCard id="analytics-locations-title" title="Villes et pays">
          <div className="tst-analytics-split-tables">
            <div>
              <h3>Villes</h3>
              {(data.locations?.locations?.cities || []).length > 0 ? (
                <table className="tst-analytics-table">
                  <thead><tr><th>Ville</th><th>Pays</th><th>Utilisateurs</th></tr></thead>
                  <tbody>
                    {data.locations.locations.cities.map((row) => (
                      <tr key={`${row.city}-${row.country}`}>
                        <td>{row.city}</td><td>{row.country}</td><td>{formatNumber(row.users)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <EmptyState />}
            </div>
            <div>
              <h3>Pays</h3>
              {(data.locations?.locations?.countries || []).length > 0 ? (
                <table className="tst-analytics-table">
                  <thead><tr><th>Pays</th><th>Utilisateurs</th></tr></thead>
                  <tbody>
                    {data.locations.locations.countries.map((row) => (
                      <tr key={row.country}><td>{row.country}</td><td>{formatNumber(row.users)}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <EmptyState />}
            </div>
          </div>
        </SectionCard>

        <SectionCard id="analytics-funnel-title" title="Entonnoir de réservation">
          {(data.events?.funnel?.steps || []).length > 0 ? (
            <div className="tst-analytics-funnel">
              {data.events.funnel.steps.map((step, index) => (
                <div key={step.id} className="tst-analytics-funnel__step">
                  <span className="tst-analytics-funnel__index">{index + 1}</span>
                  <div>
                    <strong>{step.label}</strong>
                    <span>{formatNumber(step.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </SectionCard>

        <SectionCard id="analytics-goals-title" title="Objectifs" description="Taux de conversion = événement / sessions × 100">
          {(data.overview?.goals?.items || []).length > 0 ? (
            <div className="tst-analytics-goals">
              {data.overview.goals.items.map((goal) => (
                <article key={goal.id} className="tst-analytics-goal">
                  <h3>{goal.label}</h3>
                  <strong>{formatNumber(goal.value)}</strong>
                  <EvolutionBadge evolution={goal.evolution} />
                  <p>Taux : {goal.conversionRate.toLocaleString("fr-FR")} %</p>
                  <small>{goal.formula}</small>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </SectionCard>

        <SectionCard id="analytics-campaigns-title" title="Campagnes UTM">
          {(data.campaigns?.campaigns?.items || []).length > 0 ? (
            <div className="tst-analytics-table-wrap">
              <table className="tst-analytics-table">
                <thead>
                  <tr>
                    <th>Campagne</th><th>Source</th><th>Medium</th>
                    <th>Utilisateurs</th><th>Sessions</th><th>Réservations</th><th>Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.campaigns.items.map((row, i) => (
                    <tr key={`${row.campaign}-${i}`}>
                      <td>{row.campaign}</td><td>{row.source}</td><td>{row.medium}</td>
                      <td>{formatNumber(row.users)}</td><td>{formatNumber(row.sessions)}</td>
                      <td>{formatNumber(row.reservationsCompleted)}</td>
                      <td>{row.conversionRate.toLocaleString("fr-FR")} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState />
          )}
          <div className="tst-analytics-utm">
            <h3>Générateur d&apos;URL UTM</h3>
            <div className="tst-analytics-utm__grid">
              <label>URL <input value={utmForm.url} onChange={(e) => setUtmForm((f) => ({ ...f, url: e.target.value }))} /></label>
              <label>Source <input value={utmForm.source} onChange={(e) => setUtmForm((f) => ({ ...f, source: e.target.value }))} placeholder="instagram" /></label>
              <label>Medium <input value={utmForm.medium} onChange={(e) => setUtmForm((f) => ({ ...f, medium: e.target.value }))} placeholder="social" /></label>
              <label>Campagne <input value={utmForm.campaign} onChange={(e) => setUtmForm((f) => ({ ...f, campaign: e.target.value }))} placeholder="lancement_juillet" /></label>
              <label>Contenu <input value={utmForm.content} onChange={(e) => setUtmForm((f) => ({ ...f, content: e.target.value }))} /></label>
              <label>Terme <input value={utmForm.term} onChange={(e) => setUtmForm((f) => ({ ...f, term: e.target.value }))} /></label>
            </div>
            <div className="tst-analytics-utm__actions">
              <button type="button" className="tst-analytics-btn tst-analytics-btn--secondary" onClick={handleUtmGenerate}>Générer</button>
              <button type="button" className="tst-analytics-btn tst-analytics-btn--ghost" onClick={handleUtmCopy} disabled={!utmResult.url}>Copier</button>
            </div>
            {utmResult.error ? <p className="tst-analytics-utm__error">{utmResult.error}</p> : null}
            {utmResult.url ? <code className="tst-analytics-utm__result">{utmResult.url}</code> : null}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        id="analytics-operational-title"
        title="Données opérationnelles — Base du site"
        description="Données MongoDB distinctes de Google Analytics. Totaux agrégés uniquement."
      >
        {data.operational?.operational ? (
          <div className="tst-analytics-operational">
            <div className="tst-analytics-kpis tst-analytics-kpis--compact">
              <article className="tst-analytics-kpi tst-analytics-kpi--compact">
                <span className="tst-analytics-kpi__label">Réservations totales</span>
                <strong className="tst-analytics-kpi__value">{formatNumber(data.operational.operational.reservations.total)}</strong>
              </article>
              <article className="tst-analytics-kpi tst-analytics-kpi--compact">
                <span className="tst-analytics-kpi__label">Réservations du jour</span>
                <strong className="tst-analytics-kpi__value">{formatNumber(data.operational.operational.reservations.today)}</strong>
              </article>
              <article className="tst-analytics-kpi tst-analytics-kpi--compact">
                <span className="tst-analytics-kpi__label">En attente</span>
                <strong className="tst-analytics-kpi__value">{formatNumber(data.operational.operational.reservations.pending)}</strong>
              </article>
              <article className="tst-analytics-kpi tst-analytics-kpi--compact">
                <span className="tst-analytics-kpi__label">Messages</span>
                <strong className="tst-analytics-kpi__value">{formatNumber(data.operational.operational.messages.total)}</strong>
              </article>
              <article className="tst-analytics-kpi tst-analytics-kpi--compact">
                <span className="tst-analytics-kpi__label">Avis</span>
                <strong className="tst-analytics-kpi__value">{formatNumber(data.operational.operational.reviews.total)}</strong>
              </article>
            </div>
            {(data.operational.operational.reservations.timeline || []).length > 0 ? (
              <div className="tst-analytics-chart">
                <h3>Réservations enregistrées (30 derniers jours)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.operational.operational.reservations.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5ebef" />
                    <XAxis dataKey="date" tickFormatter={formatChartDateLabel} />
                    <YAxis allowDecimals={false} />
                    <Tooltip labelFormatter={formatChartDateLabel} />
                    <Bar dataKey="count" name="Réservations" fill="#014196" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState message="Données opérationnelles indisponibles." />
        )}
      </SectionCard>
    </div>
  );
};

export default AnalyticsDashboard;
