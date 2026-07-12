import {
  GA4_CUSTOM_EVENTS,
  GA4_EVENT_LABELS,
  GA4_KPI_METRICS,
} from "./ga4-config";
import { getCachedReport } from "./ga4-cache";
import { getGa4Client, getGa4PropertyName, withGa4Timeout } from "./ga4-client";
import { computeEvolution } from "./ga4-periods";
import {
  getDimensionValue,
  getMetricValue,
  getRows,
  mapDimensionMetricRows,
  mapMetricsFromRowTotals,
  normalizeDeviceLabel,
  normalizeTrafficSource,
} from "./ga4-mappers";
import { GA4_CACHE_TTL } from "./ga4-config";

/**
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 */
function standardDateRanges(period) {
  return [
    { startDate: period.startDate, endDate: period.endDate },
    { startDate: period.compareStartDate, endDate: period.compareEndDate },
  ];
}

/**
 * @param {string} suffix
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 * @param {boolean} refresh
 */
function cacheKey(suffix, period, refresh) {
  return `${suffix}:${period.range}:${period.startDate}:${period.endDate}:${refresh ? "1" : "0"}`;
}

/**
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 * @param {{ force?: boolean }} [options]
 */
export async function fetchOverviewReport(period, options = {}) {
  const key = cacheKey("overview", period, Boolean(options.force));
  return getCachedReport(
    key,
    GA4_CACHE_TTL.standard,
    async () => {
      const client = getGa4Client();
      const property = getGa4PropertyName();

      const [metricsResponse, eventsResponse] = await withGa4Timeout(() =>
        Promise.all([
          client.runReport({
            property,
            dateRanges: standardDateRanges(period),
            metrics: GA4_KPI_METRICS.map((name) => ({ name })),
          }),
          client.runReport({
            property,
            dateRanges: standardDateRanges(period),
            dimensions: [{ name: "eventName" }],
            metrics: [{ name: "eventCount" }],
            dimensionFilter: {
              filter: {
                fieldName: "eventName",
                inListFilter: { values: GA4_CUSTOM_EVENTS },
              },
            },
          }),
        ])
      );

      const currentMetrics = mapMetricsFromRowTotals(metricsResponse[0], 0);
      const previousMetrics = mapMetricsFromRowTotals(metricsResponse[0], 1);

      const eventCountsCurrent = {};
      const eventCountsPrevious = {};

      for (const eventName of GA4_CUSTOM_EVENTS) {
        eventCountsCurrent[eventName] = 0;
        eventCountsPrevious[eventName] = 0;
      }

      getRows(eventsResponse[0]).forEach((row) => {
        const eventName = getDimensionValue(row, 0);
        eventCountsCurrent[eventName] = getMetricValue(row, 0);
        eventCountsPrevious[eventName] = getMetricValue(row, 1);
      });

      const kpis = [
        {
          id: "activeUsers",
          label: "Utilisateurs actifs",
          ...buildKpi(currentMetrics.activeUsers, previousMetrics.activeUsers),
        },
        {
          id: "newUsers",
          label: "Nouveaux utilisateurs",
          ...buildKpi(currentMetrics.newUsers, previousMetrics.newUsers),
        },
        {
          id: "sessions",
          label: "Sessions",
          ...buildKpi(currentMetrics.sessions, previousMetrics.sessions),
        },
        {
          id: "screenPageViews",
          label: "Pages vues",
          ...buildKpi(currentMetrics.screenPageViews, previousMetrics.screenPageViews),
        },
        {
          id: "engagementRate",
          label: "Taux d'engagement",
          ...buildKpi(currentMetrics.engagementRate * 100, previousMetrics.engagementRate * 100, {
            isPercent: true,
          }),
        },
        {
          id: "averageSessionDuration",
          label: "Durée moyenne d'engagement",
          ...buildKpi(
            currentMetrics.averageSessionDuration,
            previousMetrics.averageSessionDuration,
            { isDuration: true }
          ),
        },
        ...GA4_CUSTOM_EVENTS.map((eventName) => ({
          id: eventName,
          label: GA4_EVENT_LABELS[eventName] || eventName,
          ...buildKpi(eventCountsCurrent[eventName], eventCountsPrevious[eventName]),
          isEvent: true,
        })),
      ];

      return {
        kpis,
        sessions: currentMetrics.sessions || 0,
        previousSessions: previousMetrics.sessions || 0,
      };
    },
    { force: options.force }
  );
}

/**
 * @param {number} current
 * @param {number} previous
 * @param {{ isPercent?: boolean, isDuration?: boolean }} [options]
 */
function buildKpi(current, previous, options = {}) {
  const evolution = computeEvolution(current, previous);
  return {
    value: Number(current) || 0,
    previousValue: Number(previous) || 0,
    evolution,
    isPercent: Boolean(options.isPercent),
    isDuration: Boolean(options.isDuration),
  };
}

/**
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 * @param {{ force?: boolean }} [options]
 */
export async function fetchTimeseriesReport(period, options = {}) {
  const key = cacheKey("timeseries", period, Boolean(options.force));
  return getCachedReport(
    key,
    GA4_CACHE_TTL.standard,
    async () => {
      const client = getGa4Client();
      const property = getGa4PropertyName();
      const dimension = period.hourly ? "dateHour" : "date";

      const [response] = await withGa4Timeout(() =>
        client.runReport({
          property,
          dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
          dimensions: [{ name: dimension }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
          ],
          orderBys: [{ dimension: { dimensionName: dimension } }],
        })
      );

      const points = mapDimensionMetricRows(response).map((row) => ({
        date: row[dimension],
        activeUsers: Number(row.activeUsers) || 0,
        sessions: Number(row.sessions) || 0,
        screenPageViews: Number(row.screenPageViews) || 0,
      }));

      return { points, dimension };
    },
    { force: options.force }
  );
}

/**
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 * @param {{ force?: boolean }} [options]
 */
export async function fetchSourcesReport(period, options = {}) {
  const key = cacheKey("sources", period, Boolean(options.force));
  return getCachedReport(
    key,
    GA4_CACHE_TTL.standard,
    async () => {
      const client = getGa4Client();
      const property = getGa4PropertyName();

      const [response] = await withGa4Timeout(() =>
        client.runReport({
          property,
          dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
          dimensions: [
            { name: "sessionSource" },
            { name: "sessionMedium" },
            { name: "sessionCampaignName" },
          ],
          metrics: [{ name: "sessions" }, { name: "activeUsers" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 50,
        })
      );

      const grouped = new Map();

      mapDimensionMetricRows(response).forEach((row) => {
        const label = normalizeTrafficSource(
          String(row.sessionSource),
          String(row.sessionMedium)
        );
        const existing = grouped.get(label) || {
          label,
          sessions: 0,
          activeUsers: 0,
        };
        existing.sessions += Number(row.sessions) || 0;
        existing.activeUsers += Number(row.activeUsers) || 0;
        grouped.set(label, existing);
      });

      const items = Array.from(grouped.values()).sort((a, b) => b.sessions - a.sessions);
      const details = mapDimensionMetricRows(response).slice(0, 20);

      return { items, details };
    },
    { force: options.force }
  );
}

/**
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 * @param {{ force?: boolean }} [options]
 */
export async function fetchPagesReport(period, options = {}) {
  const key = cacheKey("pages", period, Boolean(options.force));
  return getCachedReport(
    key,
    GA4_CACHE_TTL.standard,
    async () => {
      const client = getGa4Client();
      const property = getGa4PropertyName();

      const [response] = await withGa4Timeout(() =>
        client.runReport({
          property,
          dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
          dimensions: [{ name: "pageTitle" }, { name: "pagePath" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "userEngagementDuration" },
          ],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 15,
        })
      );

      const items = mapDimensionMetricRows(response).map((row) => ({
        title: row.pageTitle || "—",
        path: row.pagePath || "—",
        views: Number(row.screenPageViews) || 0,
        users: Number(row.activeUsers) || 0,
        engagementDuration: Number(row.userEngagementDuration) || 0,
      }));

      return { items };
    },
    { force: options.force }
  );
}

/**
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 * @param {{ force?: boolean }} [options]
 */
export async function fetchDevicesReport(period, options = {}) {
  const key = cacheKey("devices", period, Boolean(options.force));
  return getCachedReport(
    key,
    GA4_CACHE_TTL.standard,
    async () => {
      const client = getGa4Client();
      const property = getGa4PropertyName();

      const [response] = await withGa4Timeout(() =>
        client.runReport({
          property,
          dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "activeUsers" }, { name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        })
      );

      const items = mapDimensionMetricRows(response).map((row) => ({
        device: normalizeDeviceLabel(String(row.deviceCategory)),
        users: Number(row.activeUsers) || 0,
        sessions: Number(row.sessions) || 0,
      }));

      return { items };
    },
    { force: options.force }
  );
}

/**
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 * @param {{ force?: boolean }} [options]
 */
export async function fetchLocationsReport(period, options = {}) {
  const key = cacheKey("locations", period, Boolean(options.force));
  return getCachedReport(
    key,
    GA4_CACHE_TTL.standard,
    async () => {
      const client = getGa4Client();
      const property = getGa4PropertyName();

      const [citiesResponse, countriesResponse] = await withGa4Timeout(() =>
        Promise.all([
          client.runReport({
            property,
            dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
            dimensions: [{ name: "city" }, { name: "country" }],
            metrics: [{ name: "activeUsers" }],
            orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
            limit: 10,
          }),
          client.runReport({
            property,
            dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
            dimensions: [{ name: "country" }],
            metrics: [{ name: "activeUsers" }],
            orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
            limit: 10,
          }),
        ])
      );

      const cities = mapDimensionMetricRows(citiesResponse[0]).map((row) => ({
        city: row.city || "—",
        country: row.country || "—",
        users: Number(row.activeUsers) || 0,
      }));

      const countries = mapDimensionMetricRows(countriesResponse[0]).map((row) => ({
        country: row.country || "—",
        users: Number(row.activeUsers) || 0,
      }));

      return { cities, countries };
    },
    { force: options.force }
  );
}

/**
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 * @param {{ force?: boolean }} [options]
 */
export async function fetchEventsReport(period, options = {}) {
  const key = cacheKey("events", period, Boolean(options.force));
  return getCachedReport(
    key,
    GA4_CACHE_TTL.standard,
    async () => {
      const client = getGa4Client();
      const property = getGa4PropertyName();

      const [response] = await withGa4Timeout(() =>
        client.runReport({
          property,
          dateRanges: standardDateRanges(period),
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: {
            filter: {
              fieldName: "eventName",
              inListFilter: { values: GA4_CUSTOM_EVENTS },
            },
          },
        })
      );

      const counts = {};
      GA4_CUSTOM_EVENTS.forEach((name) => {
        counts[name] = { current: 0, previous: 0 };
      });

      getRows(response[0]).forEach((row) => {
        const eventName = getDimensionValue(row, 0);
        counts[eventName] = {
          current: getMetricValue(row, 0),
          previous: getMetricValue(row, 1),
        };
      });

      const items = GA4_CUSTOM_EVENTS.map((eventName) => ({
        id: eventName,
        label: GA4_EVENT_LABELS[eventName] || eventName,
        count: counts[eventName]?.current || 0,
        previousCount: counts[eventName]?.previous || 0,
        evolution: computeEvolution(
          counts[eventName]?.current || 0,
          counts[eventName]?.previous || 0
        ),
      }));

      return { items };
    },
    { force: options.force }
  );
}

/**
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 * @param {{ force?: boolean }} [options]
 */
export async function fetchFunnelReport(period, options = {}) {
  const key = cacheKey("funnel", period, Boolean(options.force));
  return getCachedReport(
    key,
    GA4_CACHE_TTL.standard,
    async () => {
      const client = getGa4Client();
      const property = getGa4PropertyName();

      const [usersResponse, reservationPageResponse, eventsResponse] =
        await withGa4Timeout(() =>
          Promise.all([
            client.runReport({
              property,
              dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
              metrics: [{ name: "activeUsers" }],
            }),
            client.runReport({
              property,
              dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
              dimensions: [{ name: "pagePath" }],
              metrics: [{ name: "screenPageViews" }],
              dimensionFilter: {
                filter: {
                  fieldName: "pagePath",
                  stringFilter: { matchType: "CONTAINS", value: "/reservation" },
                },
              },
            }),
            client.runReport({
              property,
              dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
              dimensions: [{ name: "eventName" }],
              metrics: [{ name: "eventCount" }],
              dimensionFilter: {
                filter: {
                  fieldName: "eventName",
                  inListFilter: {
                    values: ["reservation_started", "reservation_completed"],
                  },
                },
              },
            }),
          ])
        );

      const visitors = mapMetricsFromRowTotals(usersResponse[0], 0).activeUsers || 0;
      const reservationPageViews = mapDimensionMetricRows(reservationPageResponse[0]).reduce(
        (sum, row) => sum + (Number(row.screenPageViews) || 0),
        0
      );

      let started = 0;
      let completed = 0;
      mapDimensionMetricRows(eventsResponse[0]).forEach((row) => {
        if (row.eventName === "reservation_started") started = Number(row.eventCount) || 0;
        if (row.eventName === "reservation_completed") completed = Number(row.eventCount) || 0;
      });

      const steps = [
        { id: "visitors", label: "Visiteurs", value: visitors },
        {
          id: "reservation_page",
          label: "Page réservation consultée",
          value: reservationPageViews,
        },
        { id: "started", label: "Réservation commencée", value: started },
        { id: "completed", label: "Réservation terminée", value: completed },
      ];

      return { steps };
    },
    { force: options.force }
  );
}

/**
 * @param {import('./ga4-periods').AnalyticsPeriod} period
 * @param {{ force?: boolean }} [options]
 */
export async function fetchCampaignsReport(period, options = {}) {
  const key = cacheKey("campaigns", period, Boolean(options.force));
  return getCachedReport(
    key,
    GA4_CACHE_TTL.standard,
    async () => {
      const client = getGa4Client();
      const property = getGa4PropertyName();

      const [sessionsResponse, conversionsResponse] = await withGa4Timeout(() =>
        Promise.all([
          client.runReport({
            property,
            dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
            dimensions: [
              { name: "sessionCampaignName" },
              { name: "sessionSource" },
              { name: "sessionMedium" },
            ],
            metrics: [{ name: "sessions" }, { name: "activeUsers" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 25,
          }),
          client.runReport({
            property,
            dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
            dimensions: [
              { name: "sessionCampaignName" },
              { name: "sessionSource" },
              { name: "sessionMedium" },
              { name: "eventName" },
            ],
            metrics: [{ name: "eventCount" }],
            dimensionFilter: {
              filter: {
                fieldName: "eventName",
                stringFilter: { value: "reservation_completed" },
              },
            },
            limit: 100,
          }),
        ])
      );

      const conversionMap = new Map();
      mapDimensionMetricRows(conversionsResponse[0]).forEach((row) => {
        const keyName = `${row.sessionCampaignName}|${row.sessionSource}|${row.sessionMedium}`;
        conversionMap.set(keyName, (conversionMap.get(keyName) || 0) + (Number(row.eventCount) || 0));
      });

      const items = mapDimensionMetricRows(sessionsResponse[0]).map((row) => {
        const keyName = `${row.sessionCampaignName}|${row.sessionSource}|${row.sessionMedium}`;
        const sessions = Number(row.sessions) || 0;
        const completed = conversionMap.get(keyName) || 0;
        return {
          campaign: row.sessionCampaignName || "(not set)",
          source: row.sessionSource || "—",
          medium: row.sessionMedium || "—",
          users: Number(row.activeUsers) || 0,
          sessions,
          reservationsCompleted: completed,
          conversionRate: sessions > 0 ? Math.round((completed / sessions) * 1000) / 10 : 0,
        };
      });

      return { items };
    },
    { force: options.force }
  );
}

/**
 * @param {{ force?: boolean }} [options]
 */
export async function fetchRealtimeReport(options = {}) {
  const key = `realtime:${options.force ? "1" : "0"}`;
  return getCachedReport(
    key,
    GA4_CACHE_TTL.realtime,
    async () => {
      const client = getGa4Client();
      const property = getGa4PropertyName();

      const [usersResponse, pagesResponse] = await withGa4Timeout(() =>
        Promise.all([
          client.runRealtimeReport({
            property,
            metrics: [{ name: "activeUsers" }],
          }),
          client.runRealtimeReport({
            property,
            dimensions: [
              { name: "unifiedScreenName" },
              { name: "deviceCategory" },
              { name: "country" },
              { name: "city" },
            ],
            metrics: [{ name: "activeUsers" }],
            orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
            limit: 10,
          }),
        ])
      );

      const activeUsers = Number(usersResponse[0]?.rows?.[0]?.metricValues?.[0]?.value) || 0;
      const pages = mapDimensionMetricRows(pagesResponse[0]).map((row) => ({
        page: row.unifiedScreenName || "—",
        device: normalizeDeviceLabel(String(row.deviceCategory)),
        country: row.country || "—",
        city: row.city || "—",
        users: Number(row.activeUsers) || 0,
      }));

      return {
        activeUsers,
        pages,
        updatedAt: new Date().toISOString(),
      };
    },
    { force: options.force }
  );
}
