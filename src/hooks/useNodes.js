import { useState, useEffect, useCallback } from 'react'
import { fetchAllDescribed, fetchNodeFromSpectre } from '../services/api'

const FULL_REFRESH_MS = 300000

function normalizeNode(identityKey, spectreNode) {
  if (!spectreNode) {
    return { identityKey, moniker: identityKey.slice(0, 12) + '…' }
  }

  const desc = spectreNode.description || {}
  const aux = desc?.auxiliary_details || {}
  const host = desc?.host_information || {}
  const build = desc?.build_information || {}
  const sd = spectreNode.self_description || {}

  return {
    identityKey,
    node_id: spectreNode.node_id,
    moniker: sd.moniker ?? host.hostname ?? identityKey.slice(0, 12) + '…',
    hostname: host.hostname ?? null,
    location: aux.location ?? null,
    country: spectreNode.geoip?.country ?? null,
    city: spectreNode.geoip?.city ?? null,
    version: build.build_version ?? null,
    role: desc.declared_role ?? {},
    wireguard: desc.wireguard ?? null,
    mixnet_websockets: desc.mixnet_websockets ?? {},
    last_polled: desc.last_polled ?? null,
    build_info: build ?? {},
    bonded: spectreNode.bonded ?? null,
    performance: spectreNode.performance_score != null
      ? Math.round(spectreNode.performance_score * 100)
      : null,
    routing_score: spectreNode.routing_score ?? null,
    config_score: spectreNode.config_score ?? null,
    current_role: spectreNode.current_role ?? null,
    uptime: spectreNode.uptime ?? null,
    stake_saturation: spectreNode.stake_saturation ?? null,
  }
}

export function useNodes(identityKeys) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fullRefresh = useCallback(async () => {
    const describedRes = await fetchAllDescribed()
    const describedList = describedRes?.data || []

    const ids = {}
    for (const item of describedList) {
      const key = item?.description?.host_information?.keys?.ed25519
      if (key && identityKeys.includes(key) && item?.node_id) {
        ids[key] = item.node_id
      }
    }

    const spectreResults = await Promise.all(
      Object.values(ids).map((id) => fetchNodeFromSpectre(id))
    )

    const spectreMap = {}
    const keyList = Object.keys(ids)
    spectreResults.forEach((res, i) => {
      if (res) spectreMap[keyList[i]] = res
    })

    const merged = {}
    for (const key of identityKeys) {
      merged[key] = normalizeNode(key, spectreMap[key])
    }
    return merged
  }, [identityKeys])

  useEffect(() => {
    let cancelled = false

    const refreshAll = async () => {
      try {
        const fresh = await fullRefresh()
        if (cancelled) return
        setData(fresh)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    refreshAll()

    const interval = setInterval(async () => {
      try {
        const fresh = await fullRefresh()
        if (cancelled) return
        setData(fresh)
        setError(null)
      } catch {
        // silent
      }
    }, FULL_REFRESH_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [fullRefresh])

  return { data, loading, error }
}
