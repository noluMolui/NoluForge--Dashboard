import { useMemo, useState } from 'react'

const NAV_ITEMS = [
  'Dashboard',
  'Projects',
  'Client Outreach',
  'Payments',
  'Settings',
]

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
    invoiceAmount: 9500,
    lastOutreach: '2026-08-01',
  },
  {
    id: 2,
    businessName: 'Soweto Auto Clinic',
    contactInfo: 'Sipho Dlamini | +27 71 110 1144',
    projectType: 'Service Booking Website',
    previewLink: 'https://preview.noluforge.co.za/soweto-auto',
    status: 'Concept / In Progress',
    invoiceAmount: 8400,
    lastOutreach: '2026-07-31',
  },
  {
    id: 3,
    businessName: 'Rosebank Artisan Bakery',
    contactInfo: 'Nadia Jacobs | +27 79 233 8821',
    projectType: 'Catalog and Order Enquiry',
    previewLink: 'https://preview.noluforge.co.za/rosebank-bakery',
    status: 'Awaiting Payment',
    invoiceAmount: 7800,
    lastOutreach: '2026-07-29',
  },
  {
    id: 4,
    businessName: 'Linden Property Group',
    contactInfo: 'Palesa Moyo | +27 83 994 2033',
    projectType: 'Portfolio and Lead Capture',
    previewLink: 'https://preview.noluforge.co.za/linden-property',
    status: 'Paid',
    invoiceAmount: 13200,
    lastOutreach: '2026-07-25',
  },
]

const INITIAL_FORM = {
  businessName: '',
  contactInfo: '',
  projectType: '',
  previewLink: '',
  invoiceAmount: '',
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
  const [projects, setProjects] = useState(SAMPLE_PROJECTS)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [paymentFilter, setPaymentFilter] = useState('all')

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

    return {
      totalProjects,
      activeBuilds,
      pendingReview,
      completedAndPaid,
    }
  }, [projects])

  const financials = useMemo(() => {
    const potentialRevenue = projects.reduce(
      (total, project) => total + project.invoiceAmount,
      0,
    )
    const collectedRevenue = projects
      .filter((project) => project.status === 'Paid')
      .reduce((total, project) => total + project.invoiceAmount, 0)

    const pendingRevenue = potentialRevenue - collectedRevenue

    return { potentialRevenue, collectedRevenue, pendingRevenue }
  }, [projects])

  const filteredProjects = useMemo(() => {
    if (paymentFilter === 'unpaid') {
      return projects.filter((project) => project.status !== 'Paid')
    }

    if (paymentFilter === 'awaiting') {
      return projects.filter((project) => project.status === 'Awaiting Payment')
    }

    return projects
  }, [projects, paymentFilter])

  const outreachQueue = useMemo(
    () =>
      projects
        .filter((project) => project.status !== 'Paid')
        .sort(
          (a, b) =>
            new Date(a.lastOutreach).getTime() - new Date(b.lastOutreach).getTime(),
        )
        .slice(0, 4),
    [projects],
  )

  function handleStatusUpdate(projectId, nextStatus) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              status: nextStatus,
              lastOutreach: new Date().toISOString().slice(0, 10),
            }
          : project,
      ),
    )
  }

  function moveToNextStatus(projectId) {
    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== projectId) {
          return project
        }

        const currentIndex = STATUS_ORDER.indexOf(project.status)
        const nextIndex = Math.min(currentIndex + 1, STATUS_ORDER.length - 1)

        return {
          ...project,
          status: STATUS_ORDER[nextIndex],
          lastOutreach: new Date().toISOString().slice(0, 10),
        }
      }),
    )
  }

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function handleAddProject(event) {
    event.preventDefault()

    const newProject = {
      id: Date.now(),
      businessName: formData.businessName,
      contactInfo: formData.contactInfo,
      projectType: formData.projectType,
      previewLink: formData.previewLink,
      status: 'Concept / In Progress',
      invoiceAmount: Number(formData.invoiceAmount) || 0,
      lastOutreach: new Date().toISOString().slice(0, 10),
    }

    setProjects((currentProjects) => [newProject, ...currentProjects])
    setFormData(INITIAL_FORM)
    setShowAddModal(false)
  }

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
                  Noluforge Tracking Dashboard
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Manage redesign builds, outreach touches, and payment progress in
                  one command center.
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
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          </section>

          <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl text-white">Project Pipeline</h2>
                  <p className="text-sm text-zinc-400">
                    Business, contact, staging links, and progress status.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                      <th className="px-3 py-3 font-medium">Business</th>
                      <th className="px-3 py-3 font-medium">Contact</th>
                      <th className="px-3 py-3 font-medium">Type</th>
                      <th className="px-3 py-3 font-medium">Staging URL</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="border-b border-zinc-900 text-zinc-200 transition hover:bg-zinc-800/40"
                      >
                        <td className="px-3 py-3 font-medium text-white">
                          {project.businessName}
                        </td>
                        <td className="px-3 py-3 text-zinc-300">{project.contactInfo}</td>
                        <td className="px-3 py-3 text-zinc-300">{project.projectType}</td>
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
                              onClick={() => moveToNextStatus(project.id)}
                              className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 transition hover:border-[#c5a880]"
                            >
                              Next Stage
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(project.id, 'Paid')}
                              className="rounded-lg border border-emerald-700/70 bg-emerald-700/20 px-2 py-1 text-xs text-emerald-200 transition hover:border-emerald-500"
                            >
                              Mark Paid
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div>
                <h2 className="font-display text-xl text-white">Financial Overview</h2>
                <p className="text-sm text-zinc-400">
                  Potential vs collected and pending invoices.
                </p>
              </div>

              <div className="grid gap-3">
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
                    Collected Revenue
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#c5a880]">
                    {formatCurrency(financials.collectedRevenue)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Pending Revenue
                  </p>
                  <p className="mt-2 text-xl font-semibold text-orange-200">
                    {formatCurrency(financials.pendingRevenue)}
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

              <div>
                <h3 className="text-sm font-semibold text-white">Outreach Follow-Up Queue</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {outreachQueue.map((project) => (
                    <li
                      key={project.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
                    >
                      <p className="font-medium text-zinc-100">{project.businessName}</p>
                      <p className="text-zinc-400">Last touch: {project.lastOutreach}</p>
                      <p className="text-zinc-400">Status: {project.status}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </section>
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
                  name="invoiceAmount"
                  value={formData.invoiceAmount}
                  onChange={handleInputChange}
                  required
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
