// src/pages/PlatformAdmin.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface Organization {
  id: string
  comercial_name: string
  legal_name: string
  city: string
  created_at: string
  status: string
}

interface Country {
  id: number
  name: string
  iso_code: string
}

type TabKey = 'orgs' | 'members'

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(' ')
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function statusBadgeClass(statusRaw: string) {
  const s = (statusRaw || '').toLowerCase()

  if (s.includes('active') || s.includes('enabled') || s.includes('verified')) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  }
  if (s.includes('pending') || s.includes('invited') || s.includes('review')) {
    return 'bg-amber-50 text-amber-700 ring-amber-200'
  }
  if (
    s.includes('disabled') ||
    s.includes('inactive') ||
    s.includes('blocked')
  ) {
    return 'bg-rose-50 text-rose-700 ring-rose-200'
  }
  return 'bg-slate-50 text-slate-700 ring-slate-200'
}

function Icon({
  name,
  className,
}: {
  name: 'search' | 'plus' | 'users' | 'org' | 'x' | 'copy' | 'check'
  className?: string
}) {
  // Tiny inline icons so you don't need extra deps.
  switch (name) {
    case 'search':
      return (
        <svg
          className={className}
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M21 21l-4.35-4.35'
          />
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z'
          />
        </svg>
      )
    case 'plus':
      return (
        <svg
          className={className}
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M12 5v14M5 12h14'
          />
        </svg>
      )
    case 'users':
      return (
        <svg
          className={className}
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'
          />
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'
          />
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M22 21v-2a4 4 0 0 0-3-3.87'
          />
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M16 3.13a4 4 0 0 1 0 7.75'
          />
        </svg>
      )
    case 'org':
      return (
        <svg
          className={className}
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M3 21h18'
          />
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M5 21V7l7-4 7 4v14'
          />
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M9 21v-8h6v8'
          />
        </svg>
      )
    case 'x':
      return (
        <svg
          className={className}
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M6 18 18 6M6 6l12 12'
          />
        </svg>
      )
    case 'copy':
      return (
        <svg
          className={className}
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M9 9h10v10H9z'
          />
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'
          />
        </svg>
      )
    case 'check':
      return (
        <svg
          className={className}
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
        >
          <path
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='m20 6-11 11-5-5'
          />
        </svg>
      )
  }
}

function Alert({
  type,
  title,
  children,
}: {
  type: 'success' | 'error'
  title: string
  children?: React.ReactNode
}) {
  const styles =
    type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
      : 'bg-rose-50 border-rose-200 text-rose-900'
  return (
    <div className={cx('rounded-xl border p-4', styles)}>
      <div className='text-sm font-semibold'>{title}</div>
      {children ? (
        <div className='mt-1 text-sm opacity-90'>{children}</div>
      ) : null}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className='rounded-2xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <div className='text-xs font-medium text-slate-500'>{label}</div>
          <div className='mt-1 text-2xl font-semibold text-slate-900'>
            {value}
          </div>
          {sub ? (
            <div className='mt-1 text-xs text-slate-500'>{sub}</div>
          ) : null}
        </div>
        <div className='h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700'>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function PlatformAdmin() {
  const { isPlatformAdmin, loading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('orgs')

  // Organization state
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [orgLoading, setOrgLoading] = useState(false)

  // Organization form
  const [orgForm, setOrgForm] = useState({
    owner_email: '',
    comercial_name: '',
    legal_name: '',
    city: '',
    base_country_id: '',
  })

  // Member state
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [memberLoading, setMemberLoading] = useState(false)

  // Member form
  const [memberForm, setMemberForm] = useState({
    email: '',
    role: 'STAFF' as 'OWNER' | 'ADMIN' | 'STAFF' | 'DRIVER',
  })

  // Success/error messages
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)

  // UI filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL')

  useEffect(() => {
    if (!authLoading && !isPlatformAdmin) navigate('/auth/redirect')
  }, [isPlatformAdmin, authLoading, navigate])

  useEffect(() => {
    if (isPlatformAdmin) {
      fetchOrganizations()
      fetchCountries()
    }
  }, [isPlatformAdmin])

  // Escape to close modal
  useEffect(() => {
    if (!showOrgModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeOrgModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOrgModal])

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setOrganizations(data)
  }

  const fetchCountries = async () => {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name')
    if (!error && data) setCountries(data)
  }

  const closeOrgModal = () => {
    setShowOrgModal(false)
    setMessage(null)
    setTempPassword('')
    setCopied(false)
  }

  const copyTempPassword = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // silent; clipboard can fail on insecure contexts
    }
  }

  const filteredOrganizations = useMemo(() => {
    const q = search.trim().toLowerCase()
    return organizations.filter((o) => {
      const matchesSearch =
        !q ||
        (o.comercial_name || '').toLowerCase().includes(q) ||
        (o.legal_name || '').toLowerCase().includes(q) ||
        (o.city || '').toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'ALL' ? true : (o.status || '') === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [organizations, search, statusFilter])

  const distinctStatuses = useMemo(() => {
    const set = new Set<string>()
    for (const o of organizations) if (o.status) set.add(o.status)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [organizations])

  const stats = useMemo(() => {
    const total = organizations.length
    const latest = organizations[0]?.created_at
      ? formatDate(organizations[0].created_at)
      : '—'
    const activeLike = organizations.filter((o) =>
      (o.status || '').toLowerCase().includes('active')
    ).length
    return { total, latest, activeLike }
  }, [organizations])

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrgLoading(true)
    setMessage(null)
    setTempPassword('')
    setCopied(false)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/provision-org-owner`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...orgForm,
            base_country_id: parseInt(orgForm.base_country_id),
          }),
        }
      )

      const result = await response.json()

      if (!response.ok)
        throw new Error(result.error || 'Failed to create organization')

      setMessage({
        type: 'success',
        text: 'Organization created successfully!',
      })
      setTempPassword(result.temp_password)

      setOrgForm({
        owner_email: '',
        comercial_name: '',
        legal_name: '',
        city: '',
        base_country_id: '',
      })

      fetchOrganizations()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create organization',
      })
    } finally {
      setOrgLoading(false)
    }
  }

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrgId) {
      setMessage({ type: 'error', text: 'Please select an organization' })
      return
    }

    setMemberLoading(true)
    setMessage(null)
    setTempPassword('')
    setCopied(false)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/provision-org-member`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            org_id: selectedOrgId,
            email: memberForm.email,
            role: memberForm.role,
          }),
        }
      )

      const result = await response.json()
      if (!response.ok)
        throw new Error(result.error || 'Failed to create member')

      setMessage({ type: 'success', text: 'Member created successfully!' })
      setTempPassword(result.temp_password)
      setMemberForm({ email: '', role: 'STAFF' })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create member',
      })
    } finally {
      setMemberLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className='min-h-screen grid place-items-center bg-gradient-to-b from-slate-50 to-white'>
        <div className='flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm'>
          <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900' />
          <div className='text-sm text-slate-700'>Loading admin console…</div>
        </div>
      </div>
    )
  }

  if (!isPlatformAdmin) return null

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-white'>
      {/* Header */}
      <div className='border-b border-slate-200 bg-white/70 backdrop-blur'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
            <div>
              <div className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600'>
                <span className='h-2 w-2 rounded-full bg-emerald-500' />
                Platform Admin
              </div>

              <h1 className='mt-3 text-3xl font-semibold tracking-tight text-slate-900'>
                Administration Console
              </h1>
              <p className='mt-2 text-sm text-slate-600'>
                Create organizations and provision members with secure edge
                functions.
              </p>
            </div>

            <div className='flex items-center gap-3'>
              <button
                onClick={signOut}
                className='inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition'
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <StatCard
              icon={
                <Icon
                  name='org'
                  className='h-5 w-5'
                />
              }
              label='Organizations'
              value={String(stats.total)}
              sub='Total in platform'
            />
            <StatCard
              icon={
                <Icon
                  name='users'
                  className='h-5 w-5'
                />
              }
              label='Active-like'
              value={String(stats.activeLike)}
              sub='Statuses containing “active”'
            />
            <StatCard
              icon={
                <Icon
                  name='org'
                  className='h-5 w-5'
                />
              }
              label='Latest created'
              value={stats.latest}
              sub='Most recent org record'
            />
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Tabs */}
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div className='inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm w-fit'>
            <button
              onClick={() => setActiveTab('orgs')}
              className={cx(
                'px-4 py-2 text-sm font-medium rounded-xl transition',
                activeTab === 'orgs'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              Organizations
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={cx(
                'px-4 py-2 text-sm font-medium rounded-xl transition',
                activeTab === 'members'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              Add Members
            </button>
          </div>

          {activeTab === 'orgs' ? (
            <button
              onClick={() => {
                setShowOrgModal(true)
                setMessage(null)
                setTempPassword('')
                setCopied(false)
              }}
              className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-neutral-400 shadow-sm hover:bg-slate-800 active:scale-[0.99] transition'
            >
              <Icon
                name='plus'
                className='h-4 w-4'
              />
              Create Organization
            </button>
          ) : null}
        </div>

        {/* Global message */}
        {message ? (
          <div className='mt-6'>
            <Alert
              type={message.type}
              title={
                message.type === 'success' ? 'Success' : 'Something went wrong'
              }
            >
              {message.text}
              {tempPassword ? (
                <div className='mt-3 rounded-xl border border-slate-200 bg-white p-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='text-xs font-medium text-slate-600'>
                        Temporary password
                      </div>
                      <code className='mt-1 block text-sm font-mono text-slate-900 break-all'>
                        {tempPassword}
                      </code>
                      <div className='mt-1 text-xs text-slate-500'>
                        Save it now — it won’t be shown again.
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={copyTempPassword}
                      className='shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50'
                    >
                      {copied ? (
                        <Icon
                          name='check'
                          className='h-4 w-4'
                        />
                      ) : (
                        <Icon
                          name='copy'
                          className='h-4 w-4'
                        />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ) : null}
            </Alert>
          </div>
        ) : null}

        {/* Content */}
        <div className='mt-6'>
          {activeTab === 'orgs' && (
            <div className='space-y-4'>
              {/* Filters */}
              <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
                <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                  <div className='flex-1'>
                    <label className='text-xs font-medium text-slate-600'>
                      Search
                    </label>
                    <div className='mt-1 relative'>
                      <Icon
                        name='search'
                        className='h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2'
                      />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder='Search by name or city…'
                        className='w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                      />
                    </div>
                  </div>

                  <div className='w-full md:w-64'>
                    <label className='text-xs font-medium text-slate-600'>
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                    >
                      <option value='ALL'>All statuses</option>
                      {distinctStatuses.map((s) => (
                        <option
                          key={s}
                          value={s}
                        >
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className='rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
                <div className='px-4 py-3 border-b border-slate-200 flex items-center justify-between'>
                  <div className='text-sm font-semibold text-slate-900'>
                    Organizations
                  </div>
                  <div className='text-xs text-slate-500'>
                    Showing{' '}
                    <span className='font-medium text-slate-700'>
                      {filteredOrganizations.length}
                    </span>{' '}
                    of{' '}
                    <span className='font-medium text-slate-700'>
                      {organizations.length}
                    </span>
                  </div>
                </div>

                <div className='overflow-x-auto'>
                  <table className='min-w-full'>
                    <thead className='sticky top-0 bg-slate-50 border-b border-slate-200'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-slate-600'>
                          Commercial Name
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-slate-600'>
                          Legal Name
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-slate-600'>
                          City
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-slate-600'>
                          Status
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-slate-600'>
                          Created
                        </th>
                      </tr>
                    </thead>

                    <tbody className='divide-y divide-slate-100'>
                      {filteredOrganizations.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className='px-6 py-10 text-center'
                          >
                            <div className='text-sm font-medium text-slate-900'>
                              No organizations found
                            </div>
                            <div className='mt-1 text-sm text-slate-500'>
                              Try clearing your filters or create a new org.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredOrganizations.map((org) => (
                          <tr
                            key={org.id}
                            className='hover:bg-slate-50/70 transition-colors'
                          >
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div className='text-sm font-semibold text-slate-900'>
                                {org.comercial_name}
                              </div>
                              <div className='text-xs text-slate-500 font-mono truncate max-w-[360px]'>
                                {org.id}
                              </div>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>
                              {org.legal_name}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>
                              {org.city || '—'}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <span
                                className={cx(
                                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                                  statusBadgeClass(org.status)
                                )}
                              >
                                {org.status || 'UNKNOWN'}
                              </span>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>
                              {formatDate(org.created_at)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
              <div className='lg:col-span-3'>
                <div className='rounded-2xl border border-slate-200 bg-white shadow-sm p-6'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <h2 className='text-lg font-semibold text-slate-900'>
                        Add Organization Member
                      </h2>
                      <p className='mt-1 text-sm text-slate-600'>
                        Provision a user and attach them to an organization with
                        a role.
                      </p>
                    </div>
                    <div className='h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700'>
                      <Icon
                        name='users'
                        className='h-5 w-5'
                      />
                    </div>
                  </div>

                  <form
                    onSubmit={handleCreateMember}
                    className='mt-6 space-y-5'
                  >
                    <div>
                      <label
                        htmlFor='org-select'
                        className='block text-xs font-medium text-slate-600 mb-1'
                      >
                        Organization
                      </label>
                      <select
                        id='org-select'
                        value={selectedOrgId}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        required
                        className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                      >
                        <option value=''>Select an organization</option>
                        {organizations.map((org) => (
                          <option
                            key={org.id}
                            value={org.id}
                          >
                            {org.comercial_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor='member-email'
                        className='block text-xs font-medium text-slate-600 mb-1'
                      >
                        Email
                      </label>
                      <input
                        id='member-email'
                        type='email'
                        required
                        value={memberForm.email}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            email: e.target.value,
                          })
                        }
                        className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                        placeholder='member@example.com'
                      />
                    </div>

                    <div>
                      <label
                        htmlFor='member-role'
                        className='block text-xs font-medium text-slate-600 mb-1'
                      >
                        Role
                      </label>
                      <select
                        id='member-role'
                        value={memberForm.role}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            role: e.target.value as any,
                          })
                        }
                        className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                      >
                        <option value='STAFF'>Staff</option>
                        <option value='ADMIN'>Admin</option>
                        <option value='OWNER'>Owner</option>
                        <option value='DRIVER'>Driver</option>
                      </select>
                      <p className='mt-2 text-xs text-slate-500'>
                        Tip: for testing, keep “OWNER” and “ADMIN” limited to
                        people you trust.
                      </p>
                    </div>

                    <button
                      type='submit'
                      disabled={memberLoading}
                      className='w-full inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-neutral-400 shadow-sm hover:bg-slate-800 disabled:opacity-50 active:scale-[0.99] transition'
                    >
                      {memberLoading ? 'Creating…' : 'Create Member'}
                    </button>
                  </form>
                </div>
              </div>

              <div className='lg:col-span-2'>
                <div className='rounded-2xl border border-slate-200 bg-white shadow-sm p-6'>
                  <h3 className='text-sm font-semibold text-slate-900'>
                    Notes
                  </h3>
                  <ul className='mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5'>
                    <li>Provisioning happens via Supabase edge functions.</li>
                    <li>Temporary passwords should be saved immediately.</li>
                    <li>
                      If you add more roles later, update the select list and
                      your edge function validation.
                    </li>
                  </ul>

                  {tempPassword ? (
                    <div className='mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4'>
                      <div className='text-xs font-medium text-slate-600'>
                        Latest temporary password
                      </div>
                      <code className='mt-1 block text-sm font-mono text-slate-900 break-all'>
                        {tempPassword}
                      </code>
                      <button
                        type='button'
                        onClick={copyTempPassword}
                        className='mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50'
                      >
                        {copied ? (
                          <Icon
                            name='check'
                            className='h-4 w-4'
                          />
                        ) : (
                          <Icon
                            name='copy'
                            className='h-4 w-4'
                          />
                        )}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Organization Modal */}
      {showOrgModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4'
          role='dialog'
          aria-modal='true'
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) closeOrgModal()
          }}
        >
          <div className='absolute inset-0 bg-slate-900/40 backdrop-blur-sm' />

          <div className='relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl'>
            <div className='flex items-start justify-between gap-4 p-6 border-b border-slate-200'>
              <div>
                <h3 className='text-lg font-semibold text-slate-900'>
                  Create new organization
                </h3>
                <p className='mt-1 text-sm text-slate-600'>
                  This will provision an owner and attach them to the org.
                </p>
              </div>
              <button
                onClick={closeOrgModal}
                className='rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50'
                aria-label='Close modal'
              >
                <Icon
                  name='x'
                  className='h-5 w-5'
                />
              </button>
            </div>

            <form
              onSubmit={handleCreateOrg}
              className='p-6 space-y-4'
            >
              <div>
                <label className='block text-xs font-medium text-slate-600 mb-1'>
                  Owner email
                </label>
                <input
                  type='email'
                  required
                  value={orgForm.owner_email}
                  onChange={(e) =>
                    setOrgForm({ ...orgForm, owner_email: e.target.value })
                  }
                  className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                  placeholder='owner@example.com'
                />
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <label className='block text-xs font-medium text-slate-600 mb-1'>
                    Commercial name
                  </label>
                  <input
                    type='text'
                    required
                    value={orgForm.comercial_name}
                    onChange={(e) =>
                      setOrgForm({ ...orgForm, comercial_name: e.target.value })
                    }
                    className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-slate-600 mb-1'>
                    City
                  </label>
                  <input
                    type='text'
                    value={orgForm.city}
                    onChange={(e) =>
                      setOrgForm({ ...orgForm, city: e.target.value })
                    }
                    className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                  />
                </div>
              </div>

              <div>
                <label className='block text-xs font-medium text-slate-600 mb-1'>
                  Legal name
                </label>
                <input
                  type='text'
                  required
                  value={orgForm.legal_name}
                  onChange={(e) =>
                    setOrgForm({ ...orgForm, legal_name: e.target.value })
                  }
                  className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                />
              </div>

              <div>
                <label className='block text-xs font-medium text-slate-600 mb-1'>
                  Country
                </label>
                <select
                  required
                  value={orgForm.base_country_id}
                  onChange={(e) =>
                    setOrgForm({ ...orgForm, base_country_id: e.target.value })
                  }
                  className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                >
                  <option value=''>Select a country</option>
                  {countries.map((country) => (
                    <option
                      key={country.id}
                      value={country.id}
                    >
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {tempPassword ? (
                <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='text-xs font-medium text-slate-600'>
                        Temporary password
                      </div>
                      <code className='mt-1 block text-sm font-mono text-slate-900 break-all'>
                        {tempPassword}
                      </code>
                      <div className='mt-1 text-xs text-slate-500'>
                        Save it now — it won’t be shown again.
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={copyTempPassword}
                      className='shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50'
                    >
                      {copied ? (
                        <Icon
                          name='check'
                          className='h-4 w-4'
                        />
                      ) : (
                        <Icon
                          name='copy'
                          className='h-4 w-4'
                        />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className='flex items-center justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={closeOrgModal}
                  className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={orgLoading}
                  className='rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-neutral-400 shadow-sm hover:bg-slate-800 disabled:opacity-50 active:scale-[0.99] transition'
                >
                  {orgLoading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
