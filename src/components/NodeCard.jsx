function statusColor(value) {
  if (value == null) return 'bg-gray-500'
  if (value >= 90) return 'bg-green-500'
  if (value >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}

import { Link } from 'react-router-dom'

function slugify(text) {
  return text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ?? ''
}

export default function NodeCard({ identityKey, data }) {
  if (!data) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-3/4 mb-3" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
      </div>
    )
  }

  const {
    moniker,
    hostname,
    location,
    city,
    country,
    version,
    role,
    performance,
    routing_score,
    config_score,
    wireguard,
    bonded,
    last_polled,
  } = data

  return (
    <Link
      to={`/nodo/${slugify(moniker)}`}
      state={{ identityKey }}
      className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-semibold text-sm truncate">
            {moniker}
          </h3>
          <p className="text-gray-500 text-xs font-mono truncate mt-0.5">
            {identityKey}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0 ml-2">
          {bonded && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-medium">
              Bonded
            </span>
          )}
          {bonded === false && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-medium">
              Unbonded
            </span>
          )}
          {wireguard && (
            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-medium">
              WG
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
        <Info label="Host" value={hostname} />
        <Info label="Location" value={city ? `${city}, ${country}` : location} />
        <Info label="Version" value={version} />
        <Info label="Role" value={formatRole(role)} />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Perf:</span>
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${statusColor(performance)}`}
            />
            <span className="text-white text-xs font-medium">
              {performance != null ? `${performance}%` : '?'}
            </span>
          </div>
        </div>
        {routing_score != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Routing:</span>
            <span className="text-white text-xs font-medium">
              {(routing_score * 100).toFixed(0)}%
            </span>
          </div>
        )}
        {config_score != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Config:</span>
            <span className="text-white text-xs font-medium">
              {typeof config_score === 'number' && config_score <= 1
                ? `${(config_score * 10).toFixed(0)}/10`
                : `${config_score}/10`}
            </span>
          </div>
        )}
      </div>

      {last_polled && (
        <p className="text-gray-600 text-[10px]">
          Last polled: {new Date(last_polled).toLocaleString()}
        </p>
      )}
    </Link>
  )
}

function Info({ label, value }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-500">{label}:</span>
      <span className="text-gray-300 truncate">{value ?? '—'}</span>
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
