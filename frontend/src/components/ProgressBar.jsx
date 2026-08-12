import { memo } from 'react'

function ProgressBar({ value = 0, color = '#0f639d', height = 'h-1.5', showLabel = false }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="flex items-center gap-2">
      <div className={`w-full bg-surface-container-high rounded-full ${height}`}>
        <div className={`${height} rounded-full`} style={{ width: `${safe}%`, backgroundColor: color }} />
      </div>
      {showLabel && <span className="text-sm font-medium text-on-surface">{safe}%</span>}
    </div>
  )
}

export default memo(ProgressBar)