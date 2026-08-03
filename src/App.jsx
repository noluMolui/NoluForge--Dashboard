import { useEffect, useMemo, useState } from 'react'

const NAV_ITEMS = [
  'Dashboard',
  'Projects',
  'Client Outreach',
  'Payments',
  'Settings',
]

const STORAGE_KEY = 'noluforge-dashboard-projects-v1'
const DEFAULT_DEPOSIT_PERCENT = 30
const ACTIVITY_LIMIT = 30
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

const STATUS_ORDER = [
  'Concept / In Progress',
  'Ready for Review',
  'Awaiting Payment',
  'Paid',
]

const STATUS_STYLE = {
  'Concept / In Progress':
    'bg-zinc-800 text-zinc-100 border-zinc-700 hover:border-[#c5a880]',
  'Ready for Review':
    'bg-amber-500/10 text-amber-200 border-amber-600/50 hover:border-amber-500',
  'Awaiting Payment':
    'bg-orange-500/10 text-orange-200 border-orange-600/50 hover:border-orange-500',
  Paid: 'bg-emerald-500/10 text-emerald-200 border-emerald-600/50 hover:border-emerald-500',
}

const SAMPLE_PROJECTS = [
  {
    id: 1,
    businessName: 'Maboneng Wellness Spa',
    contactInfo: 'Lebo Khumalo | +27 82 555 0132',
    projectType: 'Luxury Brochure Site',
    previewLink: 'https://preview.noluforge.co.za/maboneng-spa',
    status: 'Ready for Review',
    quoteAmount: 9500,
    progress: 72,
    amountPaid: 3500,
    lastOutreach: '2026-08-01',
  },
  {
    id: 2,
    businessName: 'Soweto Auto Clinic',
    contactInfo: 'Sipho Dlamini | +27 71 110 1144',
    projectType: 'Service Booking Website',
    previewLink: 'https://preview.noluforge.co.za/soweto-auto',
    status: 'Concept / In Progress',
    quoteAmount: 8400,
    progress: 32,
    amountPaid: 0,
    lastOutreach: '2026-07-31',
  },
  {
    id: 3,
    businessName: 'Rosebank Artisan Bakery',
    contactInfo: 'Nadia Jacobs | +27 79 233 8821',
    projectType: 'Catalog and Order Enquiry',
    previewLink: 'https://preview.noluforge.co.za/rosebank-bakery',
    status: 'Awaiting Payment',
    quoteAmount: 7800,
    progress: 92,
    amountPaid: 2340,
    lastOutreach: '2026-07-29',
  },
  {
    id: 4,
    businessName: 'Linden Property Group',
    contactInfo: 'Palesa Moyo | +27 83 994 2033',
    projectType: 'Portfolio and Lead Capture',
    previewLink: 'https://preview.noluforge.co.za/linden-property',
    status: 'Paid',
    quoteAmount: 13200,
    progress: 100,
    amountPaid: 13200,
    lastOutreach: '2026-07-25',
  },
]

const INITIAL_FORM = {
  businessName: '',
  contactInfo: '',
  projectType: '',
  previewLink: '',
  quoteAmount: '',
  amountPaid: '',
}

function getDepositRequired(project, depositPercent) {
  return Math.round(project.quoteAmount * (depositPercent / 100))
}

function getPaymentHealth(project, depositPercent) {
  const depositRequired = getDepositRequired(project, depositPercent)

  if (project.amountPaid >= project.quoteAmount) {
    return 'paid'
  }

  if (project.amountPaid >= depositRequired) {
    return 'deposit-cleared'
  }

  return 'deposit-due'
}

function getProgressFromStatus(status) {
  if (status === 'Concept / In Progress') return 35
  if (status === 'Ready for Review') return 75
  if (status === 'Awaiting Payment') return 92
  return 100
}

function createActivity(type, text) {
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    type,
    text,
    timestamp: new Date().toISOString(),
  }
}

function appendActivity(project, entry) {
  const current = Array.isArray(project.activity) ? project.activity : []
  return {
    ...project,
    activity: [entry, ...current].slice(0, ACTIVITY_LIMIT),
  }
}

function normalizeProjects(rawProjects) {
  if (!Array.isArray(rawProjects)) return SAMPLE_PROJECTS

  return rawProjects.map((project) => ({
    ...project,
    quoteAmount: project.quoteAmount ?? project.invoiceAmount ?? 0,
    amountPaid: project.amountPaid ?? 0,
    progress: project.progress ?? getProgressFromStatus(project.status),
    activity: Array.isArray(project.activity) ? project.activity : [],
  }))
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value)
}

function App() {
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? normalizeProjects(JSON.parse(saved)) : normalizeProjects(SAMPLE_PROJECTS)
    } catch {
      return normalizeProjects(SAMPLE_PROJECTS)
    }
  })
  const [selectedProjectId, setSelectedProjectId] = useState(() =>
    SAMPLE_PROJECTS[0]?.id ?? null,
  )
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [depositPercent, setDepositPercent] = useState(DEFAULT_DEPOSIT_PERCENT)
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  }, [projects])

  useEffect(() => {
    async function loadFromBackend() {
      try {
        const payload = await apiRequest('/projects')
        if (Array.isArray(payload.data) && payload.data.length > 0) {
          setProjects(normalizeProjects(payload.data))
          setSelectedProjectId(payload.data[0].id)
        }
        setBackendStatus('connected')
      } catch {
        setBackendStatus('offline')
      }
    }

    loadFromBackend()
  }, [])

  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProjectId(null)
      return
    }

    if (!projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const metrics = useMemo(() => {
    const totalProjects = projects.length
    const activeBuilds = projects.filter(
      (project) => project.status === 'Concept / In Progress',
    ).length
    const pendingReview = projects.filter(
      (project) => project.status === 'Ready for Review',
    ).length
    const completedAndPaid = projects.filter(
      (project) => project.status === 'Paid',
    ).length
    const depositsCleared = projects.filter(
      (project) => getPaymentHealth(project, depositPercent) !== 'deposit-due',
    ).length
    const avgProgress =
      totalProjects === 0
        ? 0
        : Math.round(
            projects.reduce((sum, project) => sum + (project.progress || 0), 0) /
              totalProjects,
          )

    return {
      totalProjects,
      activeBuilds,
      pendingReview,
      completedAndPaid,
      depositsCleared,
      avgProgress,
    }
  }, [projects, depositPercent])

  const financials = useMemo(() => {
    const potentialRevenue = projects.reduce(
      (total, project) => total + project.quoteAmount,
      0,
    )
    const collectedRevenue = projects.reduce(
      (total, project) => total + project.amountPaid,
      0,
    )

    const pendingRevenue = Math.max(potentialRevenue - collectedRevenue, 0)
    const depositTarget = projects.reduce(
      (total, project) => total + getDepositRequired(project, depositPercent),
      0,
    )
    const depositsCollected = projects.reduce(
      (total, project) =>
        total + Math.min(project.amountPaid, getDepositRequired(project, depositPercent)),
      0,
    )

    const unpaidCount = projects.filter(
      (project) => project.amountPaid < project.quoteAmount,
    ).length

    return {
      potentialRevenue,
      collectedRevenue,
      pendingRevenue,
      depositTarget,
      depositsCollected,
      unpaidCount,
    }
  }, [projects, depositPercent])

  const filteredProjects = useMemo(() => {
    if (paymentFilter === 'unpaid') {
      return projects.filter((project) => project.amountPaid < project.quoteAmount)
    }

    if (paymentFilter === 'awaiting') {
      return projects.filter((project) => project.status === 'Awaiting Payment')
    }

    if (paymentFilter === 'depositDue') {
      return projects.filter(
        (project) => getPaymentHealth(project, depositPercent) === 'deposit-due',
      )
    }

    return projects
  }, [projects, paymentFilter, depositPercent])

  const outreachQueue = useMemo(
    () =>
      projects
        .filter((project) => project.amountPaid < project.quoteAmount)
        .sort(
          (a, b) =>
            new Date(a.lastOutreach).getTime() - new Date(b.lastOutreach).getTime(),
        )
        .slice(0, 4),
    [projects],
  )

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  function upsertProjectFromApi(apiProject) {
    const normalized = normalizeProjects([apiProject])[0]
    setProjects((currentProjects) => {
      const existingIndex = currentProjects.findIndex(
        (project) => project.id === normalized.id,
      )

      if (existingIndex === -1) {
        return [normalized, ...currentProjects]
      }

      const clone = [...currentProjects]
      clone[existingIndex] = normalized
      return clone
    })
  }

  async function syncProjectPatch(projectId, patch) {
    if (backendStatus !== 'connected') return

    try {
      const payload = await apiRequest(`/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      upsertProjectFromApi(payload.data)
    } catch {
      setBackendStatus('offline')
    }
  }

  async function syncProjectEvent(projectId, eventType, message, metadata) {
    if (backendStatus !== 'connected') return

    try {
      await apiRequest(`/projects/${projectId}/events`, {
        method: 'POST',
        body: JSON.stringify({
          eventType,
          message,
          metadata,
        }),
      })
    } catch {
      setBackendStatus('offline')
    }
  }

  async function syncProjectPayment(projectId, kind, amount, reference) {
    if (backendStatus !== 'connected') return

    try {
      const payload = await apiRequest(`/projects/${projectId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          kind,
          amount,
          reference,
        }),
      })
      upsertProjectFromApi(payload.data)
    } catch {
      setBackendStatus('offline')
    }
  }

  async function syncOutreach(projectId, note) {
    if (backendStatus !== 'connected') return

    try {
      const payload = await apiRequest(`/projects/${projectId}/outreach`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
      upsertProjectFromApi(payload.data)
    } catch {
      setBackendStatus('offline')
    }
  }

  function handleStatusUpdate(projectId, nextStatus) {
    const project = projects.find((item) => item.id === projectId)
    if (!project) return

    const nextProgress = Math.max(project.progress, getProgressFromStatus(nextStatus))
    const nextAmountPaid = nextStatus === 'Paid' ? project.quoteAmount : project.amountPaid

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? appendActivity(
              {
                ...project,
                status: nextStatus,
                progress: nextProgress,
                amountPaid: nextAmountPaid,
                lastOutreach: new Date().toISOString().slice(0, 10),
              },
              createActivity('status', `Status changed to ${nextStatus}.`),
            )
          : project,
      ),
    )

    syncProjectPatch(projectId, {
      status: nextStatus,
      progress: nextProgress,
      amountPaid: nextAmountPaid,
      lastOutreach: new Date().toISOString(),
    })
    syncProjectEvent(projectId, 'status', `Status changed to ${nextStatus}.`, {
      status: nextStatus,
    })
  }

  function moveToNextStatus(projectId) {
    const project = projects.find((item) => item.id === projectId)
    if (!project) return

    const currentIndex = STATUS_ORDER.indexOf(project.status)
    const nextIndex = Math.min(currentIndex + 1, STATUS_ORDER.length - 1)
    const nextStatus = STATUS_ORDER[nextIndex]
    const nextProgress = Math.max(project.progress, getProgressFromStatus(nextStatus))
    const nextAmountPaid = nextStatus === 'Paid' ? project.quoteAmount : project.amountPaid

    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== projectId) {
          return project
        }

        return appendActivity(
          {
            ...project,
            status: nextStatus,
            progress: nextProgress,
            amountPaid: nextAmountPaid,
            lastOutreach: new Date().toISOString().slice(0, 10),
          },
          createActivity('status', `Moved to next stage: ${nextStatus}.`),
        )
      }),
    )

    syncProjectPatch(projectId, {
      status: nextStatus,
      progress: nextProgress,
      amountPaid: nextAmountPaid,
      lastOutreach: new Date().toISOString(),
    })
    syncProjectEvent(projectId, 'status', `Moved to next stage: ${nextStatus}.`, {
      status: nextStatus,
    })
  }

  function updateProgress(projectId, step) {
    const project = projects.find((item) => item.id === projectId)
    if (!project) return

    const nextProgress = Math.max(0, Math.min(project.progress + step, 100))
    const nextStatus = nextProgress === 100 ? 'Paid' : project.status
    const nextAmountPaid = nextProgress === 100 ? project.quoteAmount : project.amountPaid

    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== projectId) return project

        return appendActivity(
          {
            ...project,
            progress: nextProgress,
            status: nextStatus,
            amountPaid: nextAmountPaid,
          },
          createActivity('progress', `Progress updated to ${nextProgress}%.`),
        )
      }),
    )

    syncProjectPatch(projectId, {
      progress: nextProgress,
      status: nextStatus,
      amountPaid: nextAmountPaid,
    })
    syncProjectEvent(projectId, 'progress', `Progress updated to ${nextProgress}%.`, {
      progress: nextProgress,
    })
  }

  function markClientContacted(projectId) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? appendActivity(
              { ...project, lastOutreach: new Date().toISOString().slice(0, 10) },
              createActivity('outreach', 'Client follow-up marked as contacted today.'),
            )
          : project,
      ),
    )

    syncProjectPatch(projectId, {
      lastOutreach: new Date().toISOString(),
    })
    syncOutreach(projectId, 'Client follow-up marked as contacted today.')
  }

  function recordDeposit(projectId) {
    const project = projects.find((item) => item.id === projectId)
    if (!project) return
    const depositRequired = getDepositRequired(project, depositPercent)
    const nextAmountPaid = Math.max(project.amountPaid, depositRequired)
    const delta = nextAmountPaid - project.amountPaid

    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== projectId) return project

        return appendActivity(
          {
            ...project,
            amountPaid: nextAmountPaid,
            progress: Math.max(project.progress, 25),
            lastOutreach: new Date().toISOString().slice(0, 10),
          },
          createActivity(
            'payment',
            `Deposit recorded: ${formatCurrency(nextAmountPaid)} received.`,
          ),
        )
      }),
    )

    if (delta > 0) {
      syncProjectPayment(projectId, 'DEPOSIT', delta, 'Deposit capture')
    } else {
      syncProjectEvent(projectId, 'payment', 'Deposit already met for this project.', {
        depositRequired,
      })
    }
  }

  function recordFinalPayment(projectId) {
    const project = projects.find((item) => item.id === projectId)
    if (!project) return
    const delta = Math.max(project.quoteAmount - project.amountPaid, 0)

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? appendActivity(
              {
                ...project,
                amountPaid: project.quoteAmount,
                status: 'Paid',
                progress: 100,
                lastOutreach: new Date().toISOString().slice(0, 10),
              },
              createActivity(
                'payment',
                `Final payment received: ${formatCurrency(project.quoteAmount)} total collected.`,
              ),
            )
          : project,
      ),
    )

    if (delta > 0) {
      syncProjectPayment(projectId, 'FINAL', delta, 'Final settlement')
    } else {
      syncProjectPatch(projectId, {
        amountPaid: project.quoteAmount,
        status: 'Paid',
        progress: 100,
      })
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleAddProject(event) {
    event.preventDefault()

    if (backendStatus === 'connected') {
      try {
        const payload = await apiRequest('/projects', {
          method: 'POST',
          body: JSON.stringify({
            businessName: formData.businessName,
            contactInfo: formData.contactInfo,
            projectType: formData.projectType,
            previewLink: formData.previewLink,
            status: 'Concept / In Progress',
            quoteAmount: Number(formData.quoteAmount) || 0,
            amountPaid: Number(formData.amountPaid) || 0,
            progress: 0,
            lastOutreach: new Date().toISOString(),
            depositPercent,
          }),
        })

        upsertProjectFromApi(payload.data)
        setSelectedProjectId(payload.data.id)
        setFormData(INITIAL_FORM)
        setShowAddModal(false)
        return
      } catch {
        setBackendStatus('offline')
      }
    }

    const newProject = {
      id: Date.now(),
      businessName: formData.businessName,
      contactInfo: formData.contactInfo,
      projectType: formData.projectType,
      previewLink: formData.previewLink,
      status: 'Concept / In Progress',
      quoteAmount: Number(formData.quoteAmount) || 0,
      amountPaid: Number(formData.amountPaid) || 0,
      progress: 0,
      lastOutreach: new Date().toISOString().slice(0, 10),
      activity: [],
    }

    const createdProject = appendActivity(
      newProject,
      createActivity(
        'created',
        `Project created with quote ${formatCurrency(newProject.quoteAmount)}.`,
      ),
    )

    if (createdProject.amountPaid > 0) {
      createdProject.activity = [
        createActivity(
          'payment',
          `Upfront payment captured: ${formatCurrency(createdProject.amountPaid)}.`,
        ),
        ...createdProject.activity,
      ].slice(0, ACTIVITY_LIMIT)
    }

    setProjects((currentProjects) => [createdProject, ...currentProjects])
    setSelectedProjectId(createdProject.id)
    setFormData(INITIAL_FORM)
    setShowAddModal(false)
  }

  const pageTitle =
    activeSection === 'Dashboard'
      ? 'Noluforge Tracking Dashboard'
      : `${activeSection} Workspace`

  const pageSummary =
    activeSection === 'Dashboard'
      ? 'Manage redesign builds, outreach touches, and payment progress in one command center.'
      : 'Use this section to keep operations focused and remove admin friction from delivery.'

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-[#c5a880] selection:text-zinc-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(197,168,128,0.20),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(197,168,128,0.10),transparent_35%)]" />

      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-4 p-4 md:p-6 lg:flex-row lg:p-8">
        <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5 backdrop-blur lg:w-64">
          <p className="font-display text-lg tracking-[0.25em] text-[#c5a880]">
            NOLUFORGE
          </p>
          <p className="mt-2 text-sm text-zinc-400">Internal Project Desk</p>

          <nav className="mt-8 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveSection(item)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? 'border-[#c5a880] bg-[#c5a880]/15 text-[#d8be90]'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </nav>

          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Weekly Goal
            </p>
            <p className="mt-1 text-2xl font-semibold text-[#c5a880]">6</p>
            <p className="text-xs text-zinc-400">Client demos shipped</p>
          </div>
        </aside>

        <main className="flex-1 space-y-5">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl text-white md:text-3xl">
                  {pageTitle}
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  {pageSummary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="rounded-xl border border-[#c5a880] bg-[#c5a880] px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-[#d8be90]"
              >
                Add New Project
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
              <span>Backend:</span>
              <span
                className={`rounded-full border px-2 py-0.5 ${
                  backendStatus === 'connected'
                    ? 'border-emerald-700/70 bg-emerald-500/10 text-emerald-200'
                    : backendStatus === 'checking'
                      ? 'border-amber-700/70 bg-amber-500/10 text-amber-200'
                      : 'border-orange-700/70 bg-orange-500/10 text-orange-200'
                }`}
              >
                {backendStatus === 'connected'
                  ? 'Connected'
                  : backendStatus === 'checking'
                    ? 'Checking'
                    : 'Offline (local mode)'}
              </span>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Pipeline</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {metrics.totalProjects}
              </p>
              <p className="mt-1 text-sm text-zinc-400">Total projects</p>
            </article>
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Active Builds
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {metrics.activeBuilds}
              </p>
              <p className="mt-1 text-sm text-zinc-400">Spec revamps in motion</p>
            </article>
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Pending Review
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {metrics.pendingReview}
              </p>
              <p className="mt-1 text-sm text-zinc-400">Sent to clients</p>
            </article>
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Completed and Paid
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#c5a880]">
                {metrics.completedAndPaid}
              </p>
              <p className="mt-1 text-sm text-zinc-400">Closed projects</p>
            </article>
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Deposit Cleared
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#d8be90]">
                {metrics.depositsCleared}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                At least {depositPercent}% received
              </p>
            </article>
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Avg Progress
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {metrics.avgProgress}%
              </p>
              <p className="mt-1 text-sm text-zinc-400">Across all builds</p>
            </article>
          </section>

          {(activeSection === 'Dashboard' || activeSection === 'Projects') && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl text-white">Project Pipeline</h2>
                  <p className="text-sm text-zinc-400">
                    Track execution progress, payment readiness, and delivery stage.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                      <th className="px-3 py-3 font-medium">Business</th>
                      <th className="px-3 py-3 font-medium">Progress</th>
                      <th className="px-3 py-3 font-medium">Payment</th>
                      <th className="px-3 py-3 font-medium">Activity</th>
                      <th className="px-3 py-3 font-medium">Staging URL</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => {
                      const depositRequired = getDepositRequired(project, depositPercent)
                      const paymentHealth = getPaymentHealth(project, depositPercent)

                      return (
                        <tr
                          key={project.id}
                          className="border-b border-zinc-900 text-zinc-200 transition hover:bg-zinc-800/40"
                        >
                          <td className="px-3 py-3">
                            <p className="font-medium text-white">{project.businessName}</p>
                            <p className="text-xs text-zinc-400">{project.projectType}</p>
                            <p className="text-xs text-zinc-500">{project.contactInfo}</p>
                          </td>
                          <td className="px-3 py-3">
                            <p className="mb-1 text-xs text-zinc-300">{project.progress}%</p>
                            <div className="h-2 w-44 rounded-full bg-zinc-800">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-[#8f784f] to-[#d8be90]"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-xs text-zinc-300">
                              Paid: {formatCurrency(project.amountPaid)} / {formatCurrency(project.quoteAmount)}
                            </p>
                            <p className="text-xs text-zinc-400">
                              Deposit target ({depositPercent}%): {formatCurrency(depositRequired)}
                            </p>
                            <p
                              className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${
                                paymentHealth === 'paid'
                                  ? 'border-emerald-600/60 bg-emerald-500/10 text-emerald-200'
                                  : paymentHealth === 'deposit-cleared'
                                    ? 'border-amber-600/60 bg-amber-500/10 text-amber-200'
                                    : 'border-orange-600/60 bg-orange-500/10 text-orange-200'
                              }`}
                            >
                              {paymentHealth === 'paid'
                                ? 'Fully Paid'
                                : paymentHealth === 'deposit-cleared'
                                  ? 'Deposit Cleared'
                                  : 'Deposit Due'}
                            </p>
                          </td>
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={() => setSelectedProjectId(project.id)}
                                className={`rounded-lg border px-2 py-1 text-xs transition ${
                                  selectedProjectId === project.id
                                    ? 'border-[#c5a880] bg-[#c5a880]/15 text-[#d8be90]'
                                    : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600'
                                }`}
                              >
                                View Timeline
                              </button>
                            </td>
                          <td className="px-3 py-3">
                            <a
                              href={project.previewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#d8be90] underline decoration-zinc-600 underline-offset-4 transition hover:decoration-[#d8be90]"
                            >
                              Preview
                            </a>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-xs ${STATUS_STYLE[project.status]}`}
                            >
                              {project.status}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => updateProgress(project.id, 10)}
                                className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 transition hover:border-[#c5a880]"
                              >
                                +10% Progress
                              </button>
                              <button
                                type="button"
                                onClick={() => moveToNextStatus(project.id)}
                                className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 transition hover:border-[#c5a880]"
                              >
                                Next Stage
                              </button>
                              <button
                                type="button"
                                onClick={() => recordDeposit(project.id)}
                                className="rounded-lg border border-amber-700/70 bg-amber-700/20 px-2 py-1 text-xs text-amber-200 transition hover:border-amber-500"
                              >
                                Record 30% Deposit
                              </button>
                              <button
                                type="button"
                                onClick={() => recordFinalPayment(project.id)}
                                className="rounded-lg border border-emerald-700/70 bg-emerald-700/20 px-2 py-1 text-xs text-emerald-200 transition hover:border-emerald-500"
                              >
                                Mark Fully Paid
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">Project Activity Timeline</h3>
                  {selectedProject ? (
                    <p className="text-xs text-zinc-400">
                      {selectedProject.businessName}
                    </p>
                  ) : null}
                </div>

                {selectedProject && selectedProject.activity.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedProject.activity.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] uppercase tracking-wide text-zinc-300">
                            {item.type}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {formatDateTime(item.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-200">{item.text}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400">
                    No timeline events yet for this project. Trigger any action to start the log.
                  </p>
                )}
              </div>
            </section>
          )}

          {(activeSection === 'Dashboard' || activeSection === 'Payments') && (
            <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
              <article className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <div>
                  <h2 className="font-display text-xl text-white">Financial Overview</h2>
                  <p className="text-sm text-zinc-400">
                    See cash already in and what still needs follow-up.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Total Potential Revenue
                    </p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {formatCurrency(financials.potentialRevenue)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Collected Cash
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[#c5a880]">
                      {formatCurrency(financials.collectedRevenue)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Pending Balance
                    </p>
                    <p className="mt-2 text-xl font-semibold text-orange-200">
                      {formatCurrency(financials.pendingRevenue)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Deposit Collection
                    </p>
                    <p className="mt-2 text-xl font-semibold text-zinc-100">
                      {formatCurrency(financials.depositsCollected)} / {formatCurrency(financials.depositTarget)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Invoice Filter
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentFilter('all')}
                      className={`rounded-lg border px-3 py-1 text-xs transition ${
                        paymentFilter === 'all'
                          ? 'border-[#c5a880] bg-[#c5a880]/20 text-[#d8be90]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentFilter('depositDue')}
                      className={`rounded-lg border px-3 py-1 text-xs transition ${
                        paymentFilter === 'depositDue'
                          ? 'border-[#c5a880] bg-[#c5a880]/20 text-[#d8be90]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600'
                      }`}
                    >
                      Deposit Due
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentFilter('unpaid')}
                      className={`rounded-lg border px-3 py-1 text-xs transition ${
                        paymentFilter === 'unpaid'
                          ? 'border-[#c5a880] bg-[#c5a880]/20 text-[#d8be90]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600'
                      }`}
                    >
                      Unpaid and Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentFilter('awaiting')}
                      className={`rounded-lg border px-3 py-1 text-xs transition ${
                        paymentFilter === 'awaiting'
                          ? 'border-[#c5a880] bg-[#c5a880]/20 text-[#d8be90]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600'
                      }`}
                    >
                      Awaiting Payment
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
                    >
                      <p className="font-medium text-zinc-100">{project.businessName}</p>
                      <p className="text-sm text-zinc-400">
                        Paid {formatCurrency(project.amountPaid)} of {formatCurrency(project.quoteAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="text-sm font-semibold text-white">Payment Focus</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {financials.unpaidCount} project(s) still have an outstanding balance.
                </p>
                <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                  Keep delivery moving by collecting the {depositPercent}% deposit early,
                  then updating status and progress after each milestone.
                </div>
              </article>
            </section>
          )}

          {(activeSection === 'Dashboard' || activeSection === 'Client Outreach') && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3">
                <h2 className="font-display text-xl text-white">Outreach Follow-Up Queue</h2>
                <p className="text-sm text-zinc-400">
                  Prioritize clients who are waiting on a payment nudge or update.
                </p>
              </div>
              <ul className="grid gap-2 md:grid-cols-2">
                {outreachQueue.map((project) => (
                  <li
                    key={project.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
                  >
                    <p className="font-medium text-zinc-100">{project.businessName}</p>
                    <p className="text-zinc-400">Last touch: {project.lastOutreach}</p>
                    <p className="text-zinc-400">Status: {project.status}</p>
                    <button
                      type="button"
                      onClick={() => markClientContacted(project.id)}
                      className="mt-2 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 transition hover:border-[#c5a880]"
                    >
                      Mark Contacted Today
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeSection === 'Settings' && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="font-display text-xl text-white">Internal Rules</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Tune defaults to match Noluforge workflow.
              </p>
              <div className="mt-4 max-w-sm space-y-3">
                <label className="grid gap-1 text-sm text-zinc-300">
                  Default Deposit Percentage
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={depositPercent}
                    onChange={(event) => setDepositPercent(Number(event.target.value) || 0)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none transition focus:border-[#c5a880]"
                  />
                </label>
                <p className="text-xs text-zinc-500">
                  This controls the deposit target shown across projects and payments.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>

      {showAddModal ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-zinc-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-white">Add New Project</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-zinc-700 px-2 py-1 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddProject} className="grid gap-3">
              <label className="grid gap-1 text-sm text-zinc-300">
                Local Business Name
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none transition focus:border-[#c5a880]"
                />
              </label>
              <label className="grid gap-1 text-sm text-zinc-300">
                Contact Info
                <input
                  type="text"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleInputChange}
                  placeholder="Contact person and number"
                  required
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none transition focus:border-[#c5a880]"
                />
              </label>
              <label className="grid gap-1 text-sm text-zinc-300">
                Project Type
                <input
                  type="text"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleInputChange}
                  required
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none transition focus:border-[#c5a880]"
                />
              </label>
              <label className="grid gap-1 text-sm text-zinc-300">
                Preview / Staging Link
                <input
                  type="url"
                  name="previewLink"
                  value={formData.previewLink}
                  onChange={handleInputChange}
                  placeholder="https://preview.noluforge.co.za/client-site"
                  required
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none transition focus:border-[#c5a880]"
                />
              </label>
              <label className="grid gap-1 text-sm text-zinc-300">
                Invoice Amount (ZAR)
                <input
                  type="number"
                  min="0"
                  name="quoteAmount"
                  value={formData.quoteAmount}
                  onChange={handleInputChange}
                  required
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none transition focus:border-[#c5a880]"
                />
              </label>
              <label className="grid gap-1 text-sm text-zinc-300">
                Amount Paid Before Start (Optional)
                <input
                  type="number"
                  min="0"
                  name="amountPaid"
                  value={formData.amountPaid}
                  onChange={handleInputChange}
                  placeholder="Enter upfront deposit if received"
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none transition focus:border-[#c5a880]"
                />
              </label>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-[#c5a880] bg-[#c5a880] px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-[#d8be90]"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
