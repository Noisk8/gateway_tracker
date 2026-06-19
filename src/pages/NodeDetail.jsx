import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { fetchNodeFromSpectre, fetchAllDescribed, fetchPerformanceHistory } from '../services/api'

function slugify(text) {
  return text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ?? ''
}

function statusColor(value) {
  if (value == null) return 'bg-gray-500'
  if (value >= 90) return 'bg-green-500'
  if (value >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}

function perfColor(value) {
  if (value == null || value >= 90) return '#22c55e'
  if (value >= 70) return '#eab308'
  return '#ef4444'
}

export default function NodeDetail() {
  const { slug } = useParams()
  const { state } = useLocation()
  const [node, setNode] = useState(null)
  const [perfHistory, setPerfHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const identityKey = state?.identityKey

    const load = async () => {
      try {
        let nodeId = null

        if (!identityKey) {
          const describedRes = await fetchAllDescribed()
          const list = describedRes?.data || []
          for (const item of list) {
            const desc = item?.description || {}
            const host = desc?.host_information || {}
            const sd = item?.self_description || {}
            const moniker = sd?.moniker ?? host?.hostname ?? ''
            if (slugify(moniker) === slug && item?.node_id) {
              nodeId = item.node_id
              break
            }
          }
          if (!nodeId) {
            if (!cancelled) setError('Node not found')
            return
          }
        } else {
          const describedRes = await fetchAllDescribed()
          const list = describedRes?.data || []
          for (const item of list) {
            const keys = item?.description?.host_information?.keys
            if (keys?.ed25519 === identityKey) {
              nodeId = item.node_id
              break
            }
          }
          if (!nodeId) {
            if (!cancelled) setError('Node not found')
            return
          }
        }

        const [nodeRes, perfRes] = await Promise.all([
          fetchNodeFromSpectre(nodeId),
          fetchPerformanceHistory(nodeId),
        ])

        if (!cancelled) {
          setNode(nodeRes)
          setPerfHistory(perfRes?.data ?? null)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug, state?.identityKey])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading node data...</p>
        </div>
      </div>
    )
  }

  if (error || !node) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-300 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Node not found'}</p>
          <Link to="/" className="text-blue-400 hover:underline text-sm">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const desc = node.description || {}
  const host = desc?.host_information || {}
  const build = desc?.build_information || {}
  const aux = desc?.auxiliary_details || {}
  const sd = node.self_description || {}
  const role = desc?.declared_role || {}
  const geoip = node.geoip || {}
  const perf = node.performance_score != null ? Math.round(node.performance_score * 100) : null
  const rd = node.rewarding_details || {}

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
            &larr; Dashboard
          </Link>
          <span className="text-xs text-gray-600 font-mono">{node.identity_key?.slice(0, 16)}...</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{sd.moniker || host.hostname}</h1>
            <p className="text-gray-500 text-sm font-mono mt-1 break-all">{node.identity_key}</p>
          </div>
          <div className="flex gap-2">
            {node.bonded && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-medium">Bonded</span>
            )}
            {desc?.wireguard && (
              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded font-medium">WireGuard</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Performance</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${statusColor(perf)}`} />
              <span className="text-2xl font-bold text-white">{perf != null ? `${perf}%` : '?'}</span>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Routing Score</p>
            <span className="text-2xl font-bold text-white">
              {node.routing_score != null ? `${(node.routing_score * 100).toFixed(1)}%` : '?'}
            </span>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Config Score</p>
            <span className="text-2xl font-bold text-white">
              {node.config_score != null
                ? `${(node.config_score * 10).toFixed(0)}/10`
                : '?'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PerformanceChart data={perfHistory} />
          <RewardsChart node={node} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Node Info</h2>
            <div className="space-y-3 text-sm">
              <Row label="Hostname" value={host.hostname} />
              <Row label="Version" value={build.build_version} />
              <Row label="Binary" value={build.binary_name} />
              <Row label="Role" value={formatRole(role)} />
              <Row label="Location" value={aux.location} />
              <Row label="Country" value={geoip.country} />
              <Row label="City" value={geoip.city} />
              <Row label="ISP" value={geoip.org} />
              <Row label="IP" value={host.ip_address?.[0]} />
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Staking & Rewards</h2>
            <div className="space-y-3 text-sm">
              <Row label="Bonded" value={node.bonded ? 'Yes' : 'No'} />
              <Row label="Uptime" value={node.uptime != null ? `${(node.uptime * 100).toFixed(1)}%` : null} />
              <Row label="Stake Saturation" value={node.stake_saturation != null ? `${(node.stake_saturation * 100).toFixed(1)}%` : null} />
              <Row label="Current Role" value={node.current_role} />
              <Row label="Total Stake" value={node.total_stake != null ? formatNYM(node.total_stake) : null} />
              <Row label="Original Pledge" value={node.original_pledge != null ? formatNYM(node.original_pledge) : null} />
              <Row label="Operator Reward" value={rd.operator != null ? formatNYM(Number(rd.operator)) : null} />
              <Row label="Delegators" value={rd.unique_delegations ?? null} />
              <Row label="Total Delegations" value={rd.delegates != null ? formatNYM(Number(rd.delegates)) : null} />
              <Row label="Unit Reward" value={rd.total_unit_reward != null ? formatNYM(Number(rd.total_unit_reward)) : null} />
              <Row label="Last Rewarded Epoch" value={rd.last_rewarded_epoch ?? null} />
              <Row label="Profit Margin" value={rd.cost_params?.profit_margin_percent != null ? `${(Number(rd.cost_params.profit_margin_percent) * 100).toFixed(1)}%` : null} />
              <Row label="Operating Cost" value={rd.cost_params?.interval_operating_cost?.amount != null ? formatNYM(Number(rd.cost_params.interval_operating_cost.amount)) : null} />
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Self Description</h2>
            <div className="space-y-3 text-sm">
              <Row label="Moniker" value={sd.moniker} />
              <Row label="Details" value={sd.details} />
              <Row label="Website" value={sd.website} />
              <Row label="Contact" value={sd.security_contact} />
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Ports & Network</h2>
            <div className="space-y-3 text-sm">
              <Row label="Mix Port" value={aux.announce_ports?.mix_port} />
              <Row label="Verloc Port" value={aux.announce_ports?.verloc_port} />
              <Row label="WS Port" value={desc.mixnet_websockets?.ws_port} />
              <Row label="WSS Port" value={desc.mixnet_websockets?.wss_port} />
              <Row label="WireGuard Port" value={desc.wireguard?.port} />
              <Row label="WG Tunnel Port" value={desc.wireguard?.tunnel_port} />
              <Row label="Last Polled" value={desc.last_polled ? new Date(desc.last_polled).toLocaleString() : null} />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function PerformanceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Performance History (30 days)</h2>
        <p className="text-gray-600 text-sm">No performance history available</p>
      </section>
    )
  }

  const W = 500, H = 200, P = 30
  const values = data.map(d => d.performance * 100)
  const max = 100, min = 0
  const range = max - min

  const points = values.map((v, i) => {
    const x = P + (i / (values.length - 1)) * (W - 2 * P)
    const y = H - P - ((v - min) / range) * (H - 2 * P)
    return { x, y, v, date: data[i].date }
  })

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaD = lineD + ` L${points[points.length - 1].x},${H - P} L${points[0].x},${H - P} Z`

  const lastColor = perfColor(values[values.length - 1])

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-white font-semibold text-sm mb-4">Performance History (30 days)</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 220 }}>
        <defs>
          <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lastColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lastColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[25, 50, 75, 100].map(y => {
          const yPos = H - P - ((y - min) / range) * (H - 2 * P)
          return (
            <g key={y}>
              <line x1={P} y1={yPos} x2={W - P} y2={yPos} stroke="#1f2937" strokeWidth="1" />
              <text x={P - 4} y={yPos + 3} textAnchor="end" className="fill-gray-600" fontSize="9">{y}%</text>
            </g>
          )
        })}

        <path d={areaD} fill="url(#perfGrad)" />
        <path d={lineD} fill="none" stroke={lastColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {points.filter((_, i) => i % Math.ceil(points.length / 7) === 0 || i === points.length - 1).map(p => (
          <g key={p.date}>
            <circle cx={p.x} cy={p.y} r="3" fill={lastColor} />
            <text x={p.x} y={H - 8} textAnchor="middle" className="fill-gray-600" fontSize="8">
              {p.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>Min: {Math.min(...values).toFixed(0)}%</span>
        <span>Avg: {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}%</span>
        <span>Max: {Math.max(...values).toFixed(0)}%</span>
      </div>
    </section>
  )
}

function RewardsChart({ node }) {
  const rd = node.rewarding_details || {}
  const pledge = node.original_pledge ?? 0
  const delegations = Number(rd.delegates ?? 0)
  const operatorReward = Number(rd.operator ?? 0)
  const unitReward = Number(rd.total_unit_reward ?? 0)
  const profitMargin = rd.cost_params?.profit_margin_percent != null ? Number(rd.cost_params.profit_margin_percent) : null
  const operatingCost = rd.cost_params?.interval_operating_cost?.amount != null ? Number(rd.cost_params.interval_operating_cost.amount) : null

  const maxStake = pledge + delegations || 1
  const pledgePct = (pledge / maxStake) * 100
  const delegPct = (delegations / maxStake) * 100

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-white font-semibold text-sm mb-4">Rewards & Stake Distribution</h2>

      <div className="space-y-4">
        <div>
          <p className="text-gray-500 text-xs mb-2">Stake Composition</p>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex">
            <div className="bg-blue-500 transition-all" style={{ width: `${pledgePct}%` }} title={`Pledge: ${formatNYM(pledge)}`} />
            <div className="bg-purple-500 transition-all" style={{ width: `${delegPct}%` }} title={`Delegations: ${formatNYM(delegations)}`} />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Pledge: {formatNYM(pledge)}</span>
            <span>Delegations: {formatNYM(delegations)}</span>
          </div>
        </div>

        <div>
          <p className="text-gray-500 text-xs mb-2">Current Epoch Rewards</p>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 transition-all" style={{ width: `${Math.min((operatorReward / (operatorReward || 1)) * 100, 100)}%` }} title={`Operator: ${formatNYM(operatorReward)}`} />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Operator: {formatNYM(operatorReward)}</span>
            <span>Unit: {formatNYM(unitReward)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
          <div className="text-center">
            <p className="text-gray-500 text-xs">Stake Saturation</p>
            <p className="text-white font-semibold text-lg">
              {node.stake_saturation != null ? `${(node.stake_saturation * 100).toFixed(1)}%` : '?'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs">Profit Margin</p>
            <p className="text-white font-semibold text-lg">
              {profitMargin != null ? `${(profitMargin * 100).toFixed(1)}%` : '?'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs">Operating Cost</p>
            <p className="text-white font-semibold text-lg">
              {operatingCost != null ? formatNYM(operatingCost) : '?'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs">Delegators</p>
            <p className="text-white font-semibold text-lg">
              {rd.unique_delegations ?? '?'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300 text-right ml-4">{value ?? '—'}</span>
    </div>
  )
}

function formatRole(role) {
  if (!role) return '—'
  const parts = []
  if (role.entry) parts.push('Entry')
  if (role.exit_nr) parts.push('Exit(NR)')
  if (role.exit_ipr) parts.push('Exit(IPR)')
  if (role.mixnode) parts.push('Mix')
  return parts.join(', ') || '—'
}

function formatNYM(amount) {
  const nym = amount / 1_000_000
  if (nym >= 1_000_000) return `${(nym / 1_000_000).toFixed(2)}M NYM`
  if (nym >= 1_000) return `${(nym / 1_000).toFixed(2)}k NYM`
  return `${nym.toFixed(2)} NYM`
}
