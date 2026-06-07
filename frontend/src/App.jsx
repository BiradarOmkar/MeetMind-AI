import { useState, useEffect, useCallback } from 'react'

const API = 'http://localhost:8000'

// ─── Shared Components ────────────────────────────────────────────────────────

const SkeletonCard = ({ className = '' }) => (
  <div className={`rounded-xl bg-slate-800/80 animate-pulse ${className}`} />
)

const InfoCard = ({ icon, title, accent, children, className = '' }) => (
  <div className={`card ${className}`}>
    <div className={`flex items-center gap-2 mb-3 ${accent}`}>
      <span className="text-lg">{icon}</span>
      <h3 className="font-semibold text-sm tracking-wide uppercase">{title}</h3>
    </div>
    {children}
  </div>
)

const Spinner = () => (
  <div className="flex items-center gap-3">
    <div className="spinner" />
    <span className="text-xs text-indigo-400 font-bold tracking-wider animate-pulse">
      Processing...
    </span>
  </div>
)

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV_TABS = [
  { id: 'summarizer', label: '🤖 Process Meeting' },
  { id: 'history', label: '📁 Meeting History' },
  { id: 'tracker', label: '📋 Action & Decisions' },
  { id: 'assistant', label: '🤖 Meeting Assistant' },
]

const Navbar = ({ activeTab, setActiveTab }) => {
  const handleTab = (id) => setActiveTab(id)

  return (
    <nav className="sticky top-0 z-20 border-b border-indigo-950/60 bg-slate-900/80 backdrop-blur-lg px-6 py-4 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg text-white font-extrabold text-xl shadow-indigo-500/20">
          ✦
        </div>
        <div>
          <p className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            MeetingAI
          </p>
          <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">
            Knowledge Assistant
          </p>
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-indigo-950/50">
        {NAV_TABS.map(tab => (
          <button
            key={tab.id}
            id={`nav-${tab.id}`}
            onClick={() => handleTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
              activeTab === tab.id ? 'tab-active' : 'tab-inactive'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile Select */}
      <div className="md:hidden">
        <select
          value={activeTab}
          onChange={e => handleTab(e.target.value)}
          className="bg-slate-900 border border-indigo-950 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none"
        >
          {NAV_TABS.map(tab => (
            <option key={tab.id} value={tab.id}>{tab.label}</option>
          ))}
        </select>
      </div>
    </nav>
  )
}

// ─── Summarizer Tab ───────────────────────────────────────────────────────────

const SummarizerTab = ({ onMeetingProcessed }) => {
  const [transcript, setTranscript] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [participants, setParticipants] = useState('')
  const [model, setModel] = useState('bart-llama')
  const [summary, setSummary] = useState('')
  const [structured, setStructured] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length

  const handleProcess = async () => {
    if (!transcript.trim()) return
    setLoading(true)
    setError('')
    setSummary('')
    setStructured(null)
    try {
      const res = await fetch(`${API}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcript,
          model,
          title: title || 'Untitled Meeting',
          date,
          participants
        })
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setSummary(data.summary || '')
      setStructured(data.structured_output || null)
      onMeetingProcessed()
    } catch (e) {
      setError(e.message || 'Failed to process meeting.')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight gradient-text">
          Meeting Summarizer
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Compress lengthy transcripts with state-of-the-art models and automatically extract
          structured action items, decisions, and issues.
        </p>
      </div>

      {/* Input Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Meeting Details */}
        <div className="md:col-span-1 bg-slate-900/30 border border-indigo-950/50 rounded-3xl p-6 space-y-4">
          <h3 className="font-extrabold text-sm uppercase text-indigo-400 tracking-wider mb-2">
            Meeting Details
          </h3>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-semibold">Title / Project</label>
            <input
              id="meeting-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q3 Roadmap Review"
              className="input-field"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-semibold">Date</label>
            <input
              id="meeting-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-semibold">Participants</label>
            <input
              id="meeting-participants"
              type="text"
              value={participants}
              onChange={e => setParticipants(e.target.value)}
              placeholder="e.g. Alice, Bob, Charlie"
              className="input-field"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-semibold">Summarization Model</label>
            <select
              id="meeting-model"
              value={model}
              onChange={e => setModel(e.target.value)}
              className="input-field"
            >
              <option value="bart-llama">BART + LLaMA (Structured)</option>
              <option value="facebook/bart-large-cnn">BART Large</option>
              <option value="t5-small">T5 Small (Fast)</option>
              <option value="google/pegasus-xsum">Pegasus XSum</option>
            </select>
          </div>
        </div>

        {/* Transcript Input */}
        <div className="md:col-span-2 space-y-4">
          <div className="relative">
            <textarea
              id="meeting-transcript"
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Paste meeting transcript here... (e.g. Alice: Let's start the API migration. Bob: I'll complete it by Friday.)"
              rows={12}
              className="w-full rounded-3xl bg-slate-900/35 border border-indigo-950/70 text-slate-100 placeholder-slate-600 p-6 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <div className="absolute bottom-5 right-6 text-xs text-slate-500 font-bold">
              {wordCount} words
            </div>
          </div>

          <button
            id="process-btn"
            onClick={handleProcess}
            disabled={loading || !transcript.trim()}
            className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="spinner" />
                Extracting meeting intelligence...
              </>
            ) : (
              '🧠 Analyze & Summarize'
            )}
          </button>

          {error && (
            <div className="rounded-2xl border border-rose-950 bg-rose-950/20 px-5 py-4 text-xs text-rose-400 font-semibold">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      {/* Output */}
      {(summary || structured) && (
        <div className="space-y-6 pt-6 border-t border-indigo-950/40 animate-slideUp">
          <h2 className="text-xl font-extrabold tracking-wide text-slate-200">Meeting Output</h2>

          {summary && (
            <InfoCard icon="📝" title="Executive Summary" accent="text-indigo-400">
              <p className="text-sm text-slate-300 leading-relaxed font-medium">{summary}</p>
            </InfoCard>
          )}

          {structured && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard icon="🔑" title="Key Points" accent="text-blue-400">
                {structured.key_points?.length > 0 ? (
                  <ul className="space-y-2">
                    {structured.key_points.map((p, i) => (
                      <li key={i} className="flex gap-2 text-xs text-slate-350 leading-relaxed">
                        <span className="text-indigo-500">◆</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No key points extracted.</p>
                )}
              </InfoCard>

              <InfoCard icon="✅" title="Decisions Made" accent="text-emerald-400">
                {structured.decisions?.length > 0 ? (
                  <ul className="space-y-2">
                    {structured.decisions.map((d, i) => (
                      <li key={i} className="flex gap-2 text-xs text-slate-350 leading-relaxed">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No explicit decisions recorded.</p>
                )}
              </InfoCard>

              <InfoCard icon="📌" title="Action Items" accent="text-amber-400">
                {structured.action_items?.length > 0 ? (
                  <ul className="space-y-2.5">
                    {structured.action_items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs bg-slate-950/40 p-2.5 rounded-xl border border-indigo-950/20">
                        <span className="text-amber-500 font-semibold mt-0.5">→</span>
                        <div>
                          <p className="text-slate-300 font-medium">{item.task}</p>
                          {item.owner && (
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                              Assignee: {item.owner}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No action items assigned.</p>
                )}
              </InfoCard>

              <InfoCard icon="🚨" title="Issues & Blockers" accent="text-rose-400">
                {structured.issues?.length > 0 ? (
                  <ul className="space-y-2">
                    {structured.issues.map((issue, i) => (
                      <li key={i} className="flex gap-2 text-xs text-slate-350 leading-relaxed">
                        <span className="text-rose-500 font-extrabold">!</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No blockers identified.</p>
                )}
              </InfoCard>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── History Tab ──────────────────────────────────────────────────────────────

const MeetingDetailModal = ({ meeting, onClose }) => {
  if (!meeting) return null
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-indigo-950 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-zoomIn">
        {/* Header */}
        <div className="p-6 border-b border-indigo-950/80 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-black text-white tracking-wide">{meeting.title}</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {meeting.date} · {meeting.participants}
            </p>
          </div>
          <button
            id="close-detail-modal"
            onClick={onClose}
            className="h-8 w-8 bg-slate-950 hover:bg-slate-800 border border-indigo-950/50 rounded-lg flex items-center justify-center font-bold text-xs text-slate-400 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-300">
          {/* Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">📝 Summary</h3>
            <p className="text-sm leading-relaxed text-slate-300">{meeting.summary}</p>
          </div>

          {/* Key Points */}
          {meeting.key_points?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400">🔑 Key Points</h3>
              <ul className="space-y-1">
                {meeting.key_points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-400">
                    <span className="text-indigo-500">◆</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Decisions */}
          {meeting.decisions?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">✅ Decisions</h3>
              <ul className="space-y-1">
                {meeting.decisions.map((d, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-400">
                    <span className="text-emerald-500">✓</span>{d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {meeting.action_items?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">📌 Action Items</h3>
              <ul className="space-y-2">
                {meeting.action_items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between text-xs bg-slate-950/40 p-2.5 rounded-xl border border-indigo-950/20">
                    <div>
                      <p className="text-slate-300">{item.task}</p>
                      {item.owner && <p className="text-[10px] text-slate-500 mt-0.5">@{item.owner}</p>}
                    </div>
                    <span className={item.status === 'completed' ? 'badge-completed' : 'badge-pending'}>
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transcript */}
          {meeting.transcript && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">📄 Meeting Transcript</h3>
              <div className="text-xs text-slate-400 bg-slate-950/40 border border-indigo-950/30 p-5 rounded-2xl leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                {meeting.transcript}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-indigo-950/60 bg-slate-950/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold rounded-xl text-white transition-all shadow-md shadow-indigo-600/10"
          >
            Close Repository View
          </button>
        </div>
      </div>
    </div>
  )
}

const HistoryTab = () => {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchMeetings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/meetings`)
      if (res.ok) setMeetings(await res.json())
    } catch (e) {
      console.error('Failed to fetch meetings:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMeetings() }, [fetchMeetings])

  const openMeeting = async (id) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`${API}/meeting/${id}`)
      if (res.ok) setSelectedMeeting(await res.json())
    } catch (e) {
      console.error('Failed to fetch meeting details:', e)
    }
    setDetailLoading(false)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-200">Meeting Repository</h1>
        <p className="text-slate-400 text-xs mt-1">Review summaries and full details of processed meetings.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard className="h-40" />
          <SkeletonCard className="h-40" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-indigo-950/50 rounded-3xl">
          <p className="text-sm text-slate-500 italic">No meetings stored yet. Process a meeting to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map(m => (
            <button
              key={m.meeting_id}
              id={`meeting-card-${m.meeting_id}`}
              onClick={() => openMeeting(m.meeting_id)}
              className="card text-left hover:border-indigo-500/50 hover:shadow-indigo-600/10 transition-all group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">{m.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{m.date} · {m.participants}</p>
                </div>
                <span className="text-indigo-400 text-lg flex-shrink-0">📁</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{m.summary}</p>
              <div className="mt-3 flex justify-end">
                <span className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase group-hover:text-indigo-300">
                  View Details →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            <p className="text-xs text-indigo-400 font-bold">Loading meeting details...</p>
          </div>
        </div>
      )}

      <MeetingDetailModal meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} />
    </div>
  )
}

// ─── Tracker Tab ──────────────────────────────────────────────────────────────

const ReminderModal = ({ item, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [reminder, setReminder] = useState(null)
  const [copiedSlack, setCopiedSlack] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  useEffect(() => {
    const generate = async () => {
      try {
        const res = await fetch(`${API}/action-items/${item.id}/remind`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        if (res.ok) setReminder(await res.json())
        else throw new Error('Failed')
      } catch {
        setReminder({
          slack_message: `Hi @${item.owner || 'here'}, just a quick reminder about your task: '${item.task}' from our meeting.`,
          email_subject: `Reminder: ${item.task}`,
          email_body: `Hi ${item.owner || 'Team'},\n\nJust a quick follow-up reminder for your task: '${item.task}' from the meeting.\n\nThanks!`
        })
      }
      setLoading(false)
    }
    generate()
  }, [item])

  const copySlack = () => {
    navigator.clipboard.writeText(reminder.slack_message)
    setCopiedSlack(true)
    setTimeout(() => setCopiedSlack(false), 2000)
  }

  const copyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${reminder.email_subject}\n\n${reminder.email_body}`)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-indigo-950 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-zoomIn">
        <div className="p-6 border-b border-indigo-950/80 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-white tracking-wide">🤖 AI Action Item Follow-up</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Drafting reminder for:{' '}
              <span className="text-amber-400">"{item.task}"</span>
              {' '}(Owner: @{item.owner || 'Unassigned'})
            </p>
          </div>
          <button
            id="close-reminder-modal"
            onClick={onClose}
            className="h-8 w-8 bg-slate-950 hover:bg-slate-800 border border-indigo-950/50 rounded-lg flex items-center justify-center font-bold text-xs text-slate-400 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          {loading ? (
            <div className="space-y-4 py-10 flex flex-col items-center justify-center">
              <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full" />
              <p className="text-xs text-indigo-400 font-bold tracking-wider animate-pulse">
                Composing personalized reminder drafts using AI context...
              </p>
            </div>
          ) : reminder ? (
            <div className="space-y-6">
              {/* Slack Message */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Slack Notification Draft</h4>
                  <button
                    id="copy-slack-btn"
                    onClick={copySlack}
                    className={`px-3 py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                      copiedSlack
                        ? 'bg-emerald-950 border-emerald-900 text-emerald-400'
                        : 'bg-slate-950 border-indigo-950/50 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500'
                    }`}
                  >
                    {copiedSlack ? '✓ Copied!' : '📋 Copy Draft'}
                  </button>
                </div>
                <div className="text-xs text-slate-350 bg-slate-950/40 border border-indigo-950/30 p-4 rounded-2xl leading-relaxed whitespace-pre-wrap select-all font-mono">
                  {reminder.slack_message}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Email Notification Draft</h4>
                  <button
                    id="copy-email-btn"
                    onClick={copyEmail}
                    className={`px-3 py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                      copiedEmail
                        ? 'bg-emerald-950 border-emerald-900 text-emerald-400'
                        : 'bg-slate-950 border-indigo-950/50 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500'
                    }`}
                  >
                    {copiedEmail ? '✓ Copied Email!' : '📋 Copy Subject + Body'}
                  </button>
                </div>
                <div className="space-y-2 bg-slate-950/40 border border-indigo-950/30 p-4 rounded-2xl">
                  <div className="text-xs border-b border-indigo-950/30 pb-2 mb-2 font-medium">
                    <span className="text-slate-500 font-bold">Subject:</span>{' '}
                    <span className="text-slate-200">{reminder.email_subject}</span>
                  </div>
                  <div className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap select-all font-mono">
                    {reminder.email_body}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-rose-400 font-bold text-center py-6">
              ❌ Failed to generate reminder.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-indigo-950/60 bg-slate-950/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold rounded-xl text-white transition-all shadow-md shadow-indigo-600/10"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

const TrackerTab = () => {
  const [actionItems, setActionItems] = useState([])
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(false)
  const [reminderItem, setReminderItem] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, dRes] = await Promise.all([
        fetch(`${API}/action-items`),
        fetch(`${API}/decisions`)
      ])
      if (aRes.ok) setActionItems(await aRes.json())
      if (dRes.ok) setDecisions(await dRes.json())
    } catch (e) {
      console.error('Failed to fetch tracker data:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    try {
      const res = await fetch(`${API}/action-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        setActionItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))
      }
    } catch (e) {
      console.error('Failed to update action item:', e)
    }
  }

  const pending = actionItems.filter(i => i.status !== 'completed')
  const completed = actionItems.filter(i => i.status === 'completed')

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-200">Action & Decisions</h1>
        <p className="text-slate-400 text-xs mt-1">Track action items across all meetings and view all recorded decisions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="card text-center">
          <p className="text-3xl font-black text-amber-400">{pending.length}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">Pending Items</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-black text-emerald-400">{completed.length}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">Completed Items</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-black text-indigo-400">{decisions.length}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">Total Decisions</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard className="h-16" />
          <SkeletonCard className="h-16" />
          <SkeletonCard className="h-16" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Action Items */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              📌 Action Items
              <span className="px-2 py-0.5 bg-amber-950/50 border border-amber-900/50 rounded-lg text-[10px]">
                {actionItems.length} total
              </span>
            </h2>

            {actionItems.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-indigo-950/50 rounded-2xl">
                <p className="text-xs text-slate-500 italic">No action items yet.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {actionItems.map(item => (
                  <li
                    key={item.id}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                      item.status === 'completed'
                        ? 'border-emerald-950/50 bg-emerald-950/10'
                        : 'border-indigo-950/40 bg-slate-900/30 hover:border-indigo-900/60'
                    }`}
                  >
                    <button
                      id={`toggle-${item.id}`}
                      onClick={() => toggleStatus(item.id, item.status)}
                      className={`h-5 w-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        item.status === 'completed'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-indigo-800 hover:border-indigo-500'
                      }`}
                    >
                      {item.status === 'completed' && <span className="text-[10px] font-black">✓</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${item.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                        {item.task}
                      </p>
                      {item.owner && (
                        <p className="text-[10px] text-slate-600 font-bold mt-0.5">@{item.owner}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={item.status === 'completed' ? 'badge-completed' : 'badge-pending'}>
                        {item.status}
                      </span>
                      <button
                        id={`remind-${item.id}`}
                        onClick={() => setReminderItem(item)}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-950/50 border border-indigo-900/50 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all"
                      >
                        Remind
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Decisions */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              ✅ Decisions Log
              <span className="px-2 py-0.5 bg-emerald-950/50 border border-emerald-900/50 rounded-lg text-[10px]">
                {decisions.length} total
              </span>
            </h2>

            {decisions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-indigo-950/50 rounded-2xl">
                <p className="text-xs text-slate-500 italic">No decisions recorded yet.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {decisions.map((d, i) => (
                  <li key={i} className="p-3.5 rounded-2xl border border-emerald-950/30 bg-emerald-950/10">
                    <div className="flex gap-2 text-xs">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <div>
                        <p className="text-slate-300 font-medium">{d.decision}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">from: {d.meeting_title}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {reminderItem && (
        <ReminderModal item={reminderItem} onClose={() => setReminderItem(null)} />
      )}
    </div>
  )
}

// ─── Assistant Tab ────────────────────────────────────────────────────────────

const AssistantTab = () => {
  const [question, setQuestion] = useState('')
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAsk = async () => {
    if (!question.trim()) return
    setLoading(true)
    setError('')
    const q = question
    setQuestion('')
    try {
      const res = await fetch(`${API}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      })
      if (!res.ok) throw new Error(`Server responded with code ${res.status}`)
      const data = await res.json()
      setConversations(prev => [{ question: q, answer: data.answer, sources: data.sources || [] }, ...prev])
    } catch (e) {
      setError(e.message || 'Failed to communicate with assistant.')
      setQuestion(q)
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-200">Meeting Assistant</h1>
        <p className="text-slate-400 text-xs">Ask questions about any of your past meetings using semantic search.</p>
      </div>

      {/* Input */}
      <div className="relative">
        <textarea
          id="assistant-input"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your meetings... e.g. 'What were the decisions in the Q3 review?' or 'Who is responsible for the API migration?'"
          rows={3}
          className="w-full rounded-2xl bg-slate-900/60 border border-indigo-950/70 text-slate-100 placeholder-slate-600 p-5 pr-16 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
        />
        <button
          id="ask-btn"
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="absolute right-3 bottom-3 h-10 w-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-indigo-600/20"
        >
          {loading ? (
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          ) : (
            <span className="text-sm font-bold">→</span>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-950 bg-rose-950/20 px-4 py-3 text-xs text-rose-400 font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Conversations */}
      {conversations.length > 0 && (
        <div className="space-y-6">
          {conversations.map((conv, i) => (
            <div key={i} className="space-y-3 animate-fadeIn">
              {/* Question */}
              <div className="flex justify-end">
                <div className="max-w-lg bg-indigo-600/20 border border-indigo-600/30 rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-sm text-indigo-200 font-medium">{conv.question}</p>
                </div>
              </div>

              {/* Answer */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/20">
                  ✦
                </div>
                <div className="flex-1 space-y-3">
                  <div className="bg-slate-900/60 border border-indigo-950/50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm text-slate-200 leading-relaxed">{conv.answer}</p>
                  </div>

                  {/* Sources */}
                  {conv.sources?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Sources</p>
                      <div className="flex flex-wrap gap-2">
                        {conv.sources.map((src, j) => (
                          <span key={j} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-slate-800 border border-indigo-950/50 text-slate-400">
                            📁 {src.title} · {src.source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {conversations.length === 0 && !loading && (
        <div className="text-center py-12 border border-dashed border-indigo-950/50 rounded-3xl space-y-4">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-indigo-950/50 border border-indigo-900/50 flex items-center justify-center text-2xl">
            🤖
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Your MeetingAI assistant is ready</p>
            <p className="text-xs text-slate-600 mt-1">Ask questions about decisions, action items, or anything from your meetings.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('summarizer')

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className="max-w-5xl mx-auto px-4 py-10">
        {activeTab === 'summarizer' && (
          <SummarizerTab onMeetingProcessed={() => {}} />
        )}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'tracker' && <TrackerTab />}
        {activeTab === 'assistant' && <AssistantTab />}
      </main>
    </div>
  )
}
