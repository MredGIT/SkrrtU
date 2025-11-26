import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'

export default function ReportModal({ profile, onClose, onSubmit }) {
  const [selectedReason, setSelectedReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reasons = [
    'Inappropriate photos',
    'Fake profile/Catfish',
    'Harassment or bullying',
    'Spam or scam',
    'Underage',
    'Other'
  ]

  const handleSubmit = async () => {
    if (!selectedReason) return
    
    setSubmitting(true)
    await onSubmit({ reason: selectedReason, details, profileId: profile.id })
    setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-bold text-neutral-900">Report {profile.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-neutral-600 mb-4">
          Your report is anonymous. We'll review it and take appropriate action.
        </p>

        <div className="space-y-2 mb-4">
          {reasons.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                selectedReason === reason
                  ? 'bg-red-100 border-2 border-red-500 text-red-700'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Additional details (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full bg-neutral-100 border-0 rounded-xl p-4 text-neutral-900 placeholder-neutral-500 resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={3}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 bg-neutral-100 text-neutral-900 py-3 rounded-full font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || submitting}
            className="flex-1 bg-red-500 text-white py-3 rounded-full font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
