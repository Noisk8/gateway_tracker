const VALIDATOR = 'https://validator.nymtech.net/api/v1'
const SPECTRE = 'https://api.nym.spectredao.net/api/v1'

async function tryFetch(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function fetchAllDescribed() {
  const res = await fetch(`${VALIDATOR}/nym-nodes/described`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchAnnotation(nodeId) {
  return tryFetch(`${VALIDATOR}/nym-nodes/annotation/${nodeId}`)
}

export async function fetchNodeFromSpectre(nodeId) {
  return tryFetch(`${SPECTRE}/nodes/${nodeId}`)
}

export async function fetchPerformanceHistory(nodeId) {
  return tryFetch(`${SPECTRE}/nodes/${nodeId}/performance-history`)
}
