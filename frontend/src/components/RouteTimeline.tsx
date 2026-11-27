import React from 'react'
import { motion } from 'framer-motion'
import { Plane, MapPin } from 'lucide-react'
import type { SegmentPrice } from '../types'

interface RouteTimelineProps {
  source: string
  stops?: string[] | null
  destination: string
  segmentPrices?: SegmentPrice[] | null
  compact?: boolean
}

export default function RouteTimeline({
  source,
  stops,
  destination,
  segmentPrices,
  compact = false,
}: RouteTimelineProps) {
  const nodes = [source, ...(stops ?? []), destination].filter(Boolean)

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {nodes.map((city, idx) => {
          const isEndpoint = idx === 0 || idx === nodes.length - 1
          return (
            <React.Fragment key={`${city}-${idx}`}>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  isEndpoint ? 'text-navy-900 text-base' : 'text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full text-xs'
                }`}
              >
                {!isEndpoint && <MapPin className="w-3 h-3 text-sky-500" />}
                {city}
              </span>
              {idx < nodes.length - 1 && (
                <span className="flex items-center text-slate-400">
                  <span className="w-4 sm:w-6 border-t-2 border-dashed border-slate-300" />
                  <Plane className="w-3.5 h-3.5 text-coral-500 mx-0.5" />
                  <span className="w-4 sm:w-6 border-t-2 border-dashed border-slate-300" />
                </span>
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {nodes.map((city, idx) => {
          const isStart = idx === 0
          const isEnd = idx === nodes.length - 1
          return (
            <React.Fragment key={`${city}-${idx}`}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="flex flex-col items-center text-center"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                    isStart
                      ? 'bg-navy-900 text-white'
                      : isEnd
                      ? 'bg-coral-500 text-white'
                      : 'bg-sky-100 text-sky-700 border-2 border-sky-400'
                  }`}
                >
                  {isStart ? 'DEP' : isEnd ? 'ARR' : `S${idx}`}
                </div>
                <span className="mt-1.5 font-display font-bold text-sm text-navy-900">{city}</span>
                <span className="text-[11px] text-slate-500">
                  {isStart ? 'Departure' : isEnd ? 'Final Destination' : `Stop ${idx}`}
                </span>
              </motion.div>

              {idx < nodes.length - 1 && (
                <div className="flex-1 min-w-[40px] flex items-center justify-center relative">
                  <div className="w-full border-t-2 border-dashed border-sky-300" />
                  <motion.div
                    initial={{ x: -12, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 + 0.1 }}
                    className="absolute bg-white px-1.5"
                  >
                    <Plane className="w-4 h-4 text-coral-500" />
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {segmentPrices && segmentPrices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {segmentPrices.map((seg, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs"
            >
              <div className="font-bold text-navy-900 flex items-center gap-1.5 mb-2">
                <span className="px-1.5 py-0.5 rounded bg-navy-900 text-white text-[10px]">
                  LEG {idx + 1}
                </span>
                <span>{seg.from_location}</span>
                <Plane className="w-3 h-3 text-coral-500" />
                <span>{seg.to_location}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                <div className="bg-white rounded p-1.5 border border-slate-200 text-center">
                  <div className="text-slate-400 font-sans text-[10px]">Eco</div>
                  <div className="font-bold text-slate-800">₹{seg.economy}</div>
                </div>
                <div className="bg-white rounded p-1.5 border border-slate-200 text-center">
                  <div className="text-slate-400 font-sans text-[10px]">Prem</div>
                  <div className="font-bold text-sky-700">₹{seg.premium}</div>
                </div>
                <div className="bg-white rounded p-1.5 border border-slate-200 text-center">
                  <div className="text-slate-400 font-sans text-[10px]">Bus</div>
                  <div className="font-bold text-indigo-700">₹{seg.business}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
