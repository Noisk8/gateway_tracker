import { useMemo } from 'react'
import { GROUPS } from '../config/nodes'
import { useNodes } from '../hooks/useNodes'
import NodeGroup from './NodeGroup'

export default function Dashboard() {
  const allKeys = useMemo(
    () => GROUPS.flatMap((g) => g.nodes),
    []
  )
  const { data, loading, error } = useNodes(allKeys)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Nym Gateway Tracker</h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitoreo de gateways — NOI / Platohedro
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {loading && (
                <span className="text-yellow-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  Loading...
                </span>
              )}
              {error && (
                <span className="text-red-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Error: {error}
                </span>
              )}
              {!loading && !error && (
                <span className="text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Live (2min refresh)
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {GROUPS.map((group) => (
          <NodeGroup
            key={group.name}
            name={group.name}
            nodes={group.nodes}
            data={data}
          />
        ))}
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        Data from{' '}
        <a
          href="https://validator.nymtech.net"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-300 underline"
        >
          Nym Validator API
        </a>
      </footer>
    </div>
  )
}
