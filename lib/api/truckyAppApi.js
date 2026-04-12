const BASE_API = 'https://api.114512.xyz/trucky'

module.exports = {
  async online (http, tmpId) {
    let result = null
    try {
      result = await http.get(`${BASE_API}/v3/map/online?playerID=${tmpId}`)
    } catch {
      return {
        error: true
      }
    }

    let data = {
      error: !result || !result.response || result.response.error
    }
    if (!data.error) {
      data.data = result.response
    }
    return data
  },
  async trafficTop (http, serverName) {
    let result = null
    try {
      result = await http.get(`${BASE_API}/v2/traffic/top?game=ets2&server=${serverName}`)
    } catch {
      return {
        error: true
      }
    }

    let data = {
      error: !result || !result.response || result.response.length <= 0
    }
    if (!data.error) {
      data.data = result.response
    }
    return data
  },
  async announcements (http) {
    let result = null
    try {
      result = await http.get(`${BASE_API}/v3/rss/truckyannouncements`)
    } catch {
      return {
        error: true
      }
    }

    let data = {
      error: !result || !result.response
    }
    if (!data.error) {
      data.data = result.response
    }
    return data
  },
  async time (http) {
    let result = null
    try {
      result = await http.get(`${BASE_API}/v2/truckersmp/time`)
    } catch {
      return {
        error: true
      }
    }

    let data = {
      error: !result || !result.response
    }
    if (!data.error) {
      data.data = result.response
    }
    return data
  }
}
