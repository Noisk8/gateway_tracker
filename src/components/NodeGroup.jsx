import NodeCard from './NodeCard'

export default function NodeGroup({ name, nodes, data }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
        {name}
        <span className="text-sm font-normal text-gray-500">
          ({nodes.length})
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nodes.map((key) => (
          <NodeCard key={key} identityKey={key} data={data[key]} />
        ))}
      </div>
    </section>
  )
}
