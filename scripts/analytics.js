class Analytics {
  constructor(manager) {
    this.manager = manager;
    this.data = {};
  }

  async loadGlobalAnalytics(url = '/global/analytics.json') {
    const resp = await fetch(url);
    const json = await resp.json();
    const dataArray = json.data.map((row) => [row.Key, row.Value]);
    this.setData(Object.fromEntries(dataArray));
  }

  setData(data) {
    this.data = { ...this.data, ...data };
  }

  async initialize(defaults, url) {
    this.setData(defaults);
    if (!this.manager.endpoint) return;
    await this.loadGlobalAnalytics(url);
    window.pfAnalyticsData = window.pfAnalyticsData || {};
    window.pfAnalyticsData = {
      pfPage: this.data,
    };
  }
}

export default Analytics;
