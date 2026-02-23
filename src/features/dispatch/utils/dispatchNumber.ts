import { supabase } from '../../../lib/supabase'

/**
 * Generate a unique dispatch number for a new order
 * Format: ORG-YYYYMMDD-XXX (e.g., ACME-20260115-001)
 *
 * @param orgId - Organization ID
 * @param orgName - Organization name (used to create abbreviation)
 * @returns Unique dispatch number
 */
export async function generateDispatchNumber(
  orgId: string,
  orgName: string
): Promise<string> {
  // Create org abbreviation (first 4 letters, uppercase, no special chars)
  const orgAbbrev = createOrgAbbreviation(orgName)

  // Get today's date in YYYYMMDD format
  const today = new Date()
  const dateStr = formatDateForDispatch(today)

  // Prefix for today's orders
  const prefix = `${orgAbbrev}-${dateStr}-`

  // Find the highest sequence number for today
  const { data, error } = await supabase
    .from('dispatch_orders')
    .select('dispatch_number')
    .eq('org_id', orgId)
    .like('dispatch_number', `${prefix}%`)
    .order('dispatch_number', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching dispatch numbers:', error)
    // Fallback: use timestamp
    return `${orgAbbrev}-${dateStr}-${Date.now().toString().slice(-6)}`
  }

  // Calculate next sequence number
  let nextSeq = 1

  if (data && data.length > 0) {
    const lastNumber = data[0].dispatch_number
    const lastSeqStr = lastNumber.replace(prefix, '')
    const lastSeq = parseInt(lastSeqStr, 10)
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1
    }
  }

  // Format sequence with leading zeros (3 digits)
  const seqStr = nextSeq.toString().padStart(3, '0')

  return `${prefix}${seqStr}`
}

/**
 * Create an abbreviation from organization name
 * Takes first 4 characters, removes special chars, uppercase
 */
function createOrgAbbreviation(orgName: string): string {
  // Remove special characters and spaces
  const cleaned = orgName.replace(/[^a-zA-Z0-9]/g, '')

  // Take first 4 characters and uppercase
  const abbrev = cleaned.slice(0, 4).toUpperCase()

  // If too short, pad with 'X'
  return abbrev.padEnd(4, 'X')
}

/**
 * Format date as YYYYMMDD
 */
function formatDateForDispatch(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Parse a dispatch number to extract its components
 */
export function parseDispatchNumber(dispatchNumber: string): {
  orgAbbrev: string
  date: string
  sequence: number
} | null {
  const match = dispatchNumber.match(/^([A-Z0-9]{4})-(\d{8})-(\d+)$/)

  if (!match) return null

  return {
    orgAbbrev: match[1],
    date: match[2],
    sequence: parseInt(match[3], 10),
  }
}

/**
 * Validate dispatch number format
 */
export function isValidDispatchNumber(dispatchNumber: string): boolean {
  return /^[A-Z0-9]{4}-\d{8}-\d{3,}$/.test(dispatchNumber)
}
