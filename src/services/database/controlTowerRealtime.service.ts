import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { Json } from '../../types/database.types'

export interface ControlTowerRealtimeFilters {
  search?: string
}

export interface ControlTowerFleetSetLiveRow {
  org_id: string
  fleet_set_id: string | null
  carrier_id: number | null
  carrier_name: string | null
  driver_id: number | null
  driver_name: string | null
  vehicle_id: string | null
  vehicle_unit_code: string | null
  vehicle_plate: string | null
  vehicle_type: string | null
  trailer_id: string | null
  trailer_code: string | null
  trailer_plate: string | null
  supports_multi_zone: boolean
  source_device_type: 'VEHICLE' | 'TRAILER'
  source_connection_device_id: string | null
  message_ts: string | null
  lat: number | null
  lng: number | null
  speed_kph: number | null
  ignition: boolean | null
  is_online: boolean | null
  signal_age_sec: number | null
  is_moving: boolean | null
  address_text: string | null
  temperature_c: number | null
  temp_1_c: number | null
  temp_2_c: number | null
  telematics: Json | null
  signal_status: 'ONLINE' | 'STALE' | 'OFFLINE'
  fleet_set_updated_at: string
}

export interface ControlTowerFleetSetLiveRowWithCapabilities
  extends ControlTowerFleetSetLiveRow {
  has_can: boolean
  temp_mode: 'NONE' | 'SINGLE' | 'MULTI'
  motion_status: 'MOVING' | 'IDLE' | 'PARKED'
  device_health: 'OK' | 'WARN' | 'ERROR'
}

export interface ExecutionStatusRow {
  fleet_set_id: string
  substatus: 'IN_TRANSIT' | 'AT_DESTINATION' | 'DELIVERED'
  updated_at: string
}

export interface DriverDetailsRow {
  id: number
  name: string
  phone_number: string
  email: string | null
  license_number: string
}

let realtimeChannel: RealtimeChannel | null = null

interface DeviceCapabilityRow {
  id: string
  has_can: boolean | null
  temp_mode: string | null
}

interface VehicleTrackingRow {
  id: string
  org_id: string
  carrier_id: number | null
  unit_code: string | null
  plate: string | null
  vehicle_type: string | null
  supports_multi_zone: boolean | null
  connection_device_id: string | null
}

interface TrailerTrackingRow {
  id: string
  org_id: string
  carrier_id: number | null
  code: string | null
  plate: string | null
  supports_multi_zone: boolean | null
  connection_device_id: string | null
}

interface FleetSetTrackingRow {
  id: string
  org_id: string
  carrier_id: number | null
  driver_id: number | null
  vehicle_id: string | null
  trailer_id: string | null
  starts_at: string
  updated_at: string
}

interface CarrierNameRow {
  id: number
  commercial_name: string | null
}

interface DriverNameRow {
  id: number
  name: string | null
}

interface LiveStateRow {
  org_id: string
  connection_device_id: string
  message_ts: string | null
  server_ts: string | null
  lat: number | null
  lng: number | null
  speed_kph: number | null
  heading: number | null
  ignition: boolean | null
  is_online: boolean | null
  signal_age_sec: number | null
  temperature_c: number | null
  telematics: Json | null
  updated_at: string
  is_moving: boolean | null
  address_text: string | null
  temp_1_c: number | null
  temp_2_c: number | null
}

function normalizeTempMode(value: string | null | undefined): 'NONE' | 'SINGLE' | 'MULTI' {
  if (value === 'SINGLE' || value === 'MULTI') return value
  return 'NONE'
}

function isRecord(value: Json | null): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deriveMotionStatus(row: ControlTowerFleetSetLiveRow): 'MOVING' | 'IDLE' | 'PARKED' {
  if (!row.message_ts) return 'PARKED'
  if (row.is_moving === true || (row.speed_kph ?? 0) >= 3) return 'MOVING'
  if (row.ignition === true) return 'IDLE'
  return 'PARKED'
}

function deriveDeviceHealth(row: ControlTowerFleetSetLiveRow): 'OK' | 'WARN' | 'ERROR' {
  const telematics = isRecord(row.telematics) ? row.telematics : null
  const hasErrorCode =
    telematics !== null &&
    ['error_code', 'reefer_error_code', 'alarm_code'].some((key) => {
      const value = telematics[key]
      return value !== null && value !== undefined && String(value).trim() !== ''
    })

  if (hasErrorCode) return 'ERROR'
  if (!row.message_ts || row.signal_status !== 'ONLINE') return 'WARN'
  return 'OK'
}

async function enrichWithDeviceCapabilities(
  rows: ControlTowerFleetSetLiveRow[]
): Promise<ControlTowerFleetSetLiveRowWithCapabilities[]> {
  const deviceIds = Array.from(
    new Set(
      rows
        .map((row) => row.source_connection_device_id)
        .filter((id): id is string => !!id)
    )
  )

  if (deviceIds.length === 0) {
    return rows.map((row) => ({
      ...row,
      has_can: false,
      temp_mode: 'NONE',
      motion_status: deriveMotionStatus(row),
      device_health: deriveDeviceHealth(row),
    }))
  }

  const { data, error } = await supabase
    .from('connection_device')
    .select('id, has_can, temp_mode')
    .in('id', deviceIds)
    .returns<DeviceCapabilityRow[]>()

  if (error) {
    throw error
  }

  const capabilities = new Map<string, { has_can: boolean; temp_mode: 'NONE' | 'SINGLE' | 'MULTI' }>()
  for (const row of data ?? []) {
    capabilities.set(row.id, {
      has_can: row.has_can ?? false,
      temp_mode: normalizeTempMode(row.temp_mode),
    })
  }

  return rows.map((row) => {
    const capability = row.source_connection_device_id
      ? capabilities.get(row.source_connection_device_id)
      : undefined

    return {
      ...row,
      has_can: capability?.has_can ?? false,
      temp_mode: capability?.temp_mode ?? 'NONE',
      motion_status: deriveMotionStatus(row),
      device_health: deriveDeviceHealth(row),
    }
  })
}

function deriveSignalStatus(signalAgeSec: number | null): 'ONLINE' | 'STALE' | 'OFFLINE' {
  if (signalAgeSec !== null && signalAgeSec <= 120) return 'ONLINE'
  if (signalAgeSec !== null && signalAgeSec <= 900) return 'STALE'
  return 'OFFLINE'
}

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function getLiveUnits(
  orgId: string,
  filters?: ControlTowerRealtimeFilters
): Promise<ControlTowerFleetSetLiveRowWithCapabilities[]> {
  const search = filters?.search?.trim().toLowerCase()
  const [vehiclesRes, trailersRes, fleetSetsRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, org_id, carrier_id, unit_code, plate, vehicle_type, supports_multi_zone, connection_device_id')
      .eq('org_id', orgId)
      .returns<VehicleTrackingRow[]>(),
    supabase
      .from('trailers')
      .select('id, org_id, carrier_id, code, plate, supports_multi_zone, connection_device_id')
      .eq('org_id', orgId)
      .returns<TrailerTrackingRow[]>(),
    supabase
      .from('fleet_sets')
      .select('id, org_id, carrier_id, driver_id, vehicle_id, trailer_id, starts_at, updated_at')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .is('ends_at', null)
      .returns<FleetSetTrackingRow[]>(),
  ])

  if (vehiclesRes.error) throw vehiclesRes.error
  if (trailersRes.error) throw trailersRes.error
  if (fleetSetsRes.error) throw fleetSetsRes.error

  const allVehicles = vehiclesRes.data ?? []
  const allTrailers = trailersRes.data ?? []
  const vehicles = allVehicles.filter((vehicle): vehicle is VehicleTrackingRow & { connection_device_id: string } =>
    typeof vehicle.connection_device_id === 'string' && vehicle.connection_device_id.trim().length > 0
  )
  const trailers = allTrailers.filter((trailer): trailer is TrailerTrackingRow & { connection_device_id: string } =>
    typeof trailer.connection_device_id === 'string' && trailer.connection_device_id.trim().length > 0
  )
  const activeFleetSets = fleetSetsRes.data ?? []

  const connectionDeviceIds = Array.from(
    new Set(
      [...vehicles.map((v) => v.connection_device_id), ...trailers.map((t) => t.connection_device_id)].filter(
        (value): value is string => !!value
      )
    )
  )

  const liveStateByDevice = new Map<string, LiveStateRow>()
  if (connectionDeviceIds.length > 0) {
    const { data, error } = await supabase
      .from('ct_unit_live_state')
      .select(`
        org_id,
        connection_device_id,
        message_ts,
        server_ts,
        lat,
        lng,
        speed_kph,
        heading,
        ignition,
        is_online,
        signal_age_sec,
        temperature_c,
        telematics,
        updated_at,
        is_moving,
        address_text,
        temp_1_c,
        temp_2_c
      `)
      .eq('org_id', orgId)
      .in('connection_device_id', connectionDeviceIds)
      .returns<LiveStateRow[]>()

    if (error) throw error

    for (const row of data ?? []) {
      liveStateByDevice.set(row.connection_device_id, row)
    }
  }

  const fleetSetByVehicle = new Map<string, FleetSetTrackingRow>()
  const fleetSetByTrailer = new Map<string, FleetSetTrackingRow>()
  for (const fs of activeFleetSets) {
    if (fs.vehicle_id) fleetSetByVehicle.set(fs.vehicle_id, fs)
    if (fs.trailer_id) fleetSetByTrailer.set(fs.trailer_id, fs)
  }

  const trailerById = new Map<string, TrailerTrackingRow>()
  for (const trailer of allTrailers) {
    trailerById.set(trailer.id, trailer)
  }
  const vehicleById = new Map<string, VehicleTrackingRow>()
  for (const vehicle of allVehicles) {
    vehicleById.set(vehicle.id, vehicle)
  }

  const carrierIds = Array.from(
    new Set(
      [
        ...allVehicles.map((v) => v.carrier_id),
        ...allTrailers.map((t) => t.carrier_id),
        ...activeFleetSets.map((fs) => fs.carrier_id),
      ].filter((value): value is number => typeof value === 'number')
    )
  )

  const driverIds = Array.from(
    new Set(activeFleetSets.map((fs) => fs.driver_id).filter((value): value is number => typeof value === 'number'))
  )

  const [carrierNamesRes, driverNamesRes] = await Promise.all([
    carrierIds.length
      ? supabase
          .from('carriers')
          .select('id, commercial_name')
          .in('id', carrierIds)
          .returns<CarrierNameRow[]>()
      : Promise.resolve({ data: [], error: null } as { data: CarrierNameRow[]; error: null }),
    driverIds.length
      ? supabase
          .from('drivers')
          .select('id, name')
          .eq('org_id', orgId)
          .in('id', driverIds)
          .returns<DriverNameRow[]>()
      : Promise.resolve({ data: [], error: null } as { data: DriverNameRow[]; error: null }),
  ])

  if (carrierNamesRes.error) throw carrierNamesRes.error
  if (driverNamesRes.error) throw driverNamesRes.error

  const carrierNameById = new Map<number, string | null>(
    (carrierNamesRes.data ?? []).map((carrier) => [carrier.id, carrier.commercial_name ?? null])
  )
  const driverNameById = new Map<number, string | null>(
    (driverNamesRes.data ?? []).map((driver) => [driver.id, driver.name ?? null])
  )

  const rows: ControlTowerFleetSetLiveRow[] = []

  for (const vehicle of vehicles) {
    const fleetSet = fleetSetByVehicle.get(vehicle.id) ?? null
    const contextTrailer = fleetSet?.trailer_id ? trailerById.get(fleetSet.trailer_id) ?? null : null
    const liveState = liveStateByDevice.get(vehicle.connection_device_id) ?? null
    const signalAgeSec = liveState?.signal_age_sec ?? null

    rows.push({
      org_id: orgId,
      fleet_set_id: fleetSet?.id ?? null,
      carrier_id: fleetSet?.carrier_id ?? vehicle.carrier_id ?? null,
      carrier_name:
        (fleetSet?.carrier_id ? carrierNameById.get(fleetSet.carrier_id) : undefined) ??
        (vehicle.carrier_id ? carrierNameById.get(vehicle.carrier_id) : undefined) ??
        null,
      driver_id: fleetSet?.driver_id ?? null,
      driver_name: fleetSet?.driver_id ? driverNameById.get(fleetSet.driver_id) ?? null : null,
      vehicle_id: vehicle.id,
      vehicle_unit_code: normalizeText(vehicle.unit_code),
      vehicle_plate: normalizeText(vehicle.plate),
      vehicle_type: normalizeText(vehicle.vehicle_type),
      trailer_id: contextTrailer?.id ?? null,
      trailer_code: normalizeText(contextTrailer?.code),
      trailer_plate: normalizeText(contextTrailer?.plate),
      supports_multi_zone: Boolean(contextTrailer?.supports_multi_zone ?? vehicle.supports_multi_zone ?? false),
      source_device_type: 'VEHICLE',
      source_connection_device_id: vehicle.connection_device_id,
      message_ts: liveState?.message_ts ?? null,
      server_ts: liveState?.server_ts ?? null,
      lat: liveState?.lat ?? null,
      lng: liveState?.lng ?? null,
      speed_kph: liveState?.speed_kph ?? null,
      heading: liveState?.heading ?? null,
      ignition: liveState?.ignition ?? null,
      is_online: liveState?.is_online ?? null,
      signal_age_sec: signalAgeSec,
      is_moving: liveState?.is_moving ?? null,
      address_text: normalizeText(liveState?.address_text),
      temperature_c: liveState?.temperature_c ?? null,
      temp_1_c: liveState?.temp_1_c ?? null,
      temp_2_c: liveState?.temp_2_c ?? null,
      telematics: liveState?.telematics ?? null,
      signal_status: deriveSignalStatus(signalAgeSec),
      fleet_set_updated_at: fleetSet?.updated_at ?? liveState?.updated_at ?? new Date(0).toISOString(),
    })
  }

  for (const trailer of trailers) {
    const fleetSet = fleetSetByTrailer.get(trailer.id) ?? null
    const contextVehicle = fleetSet?.vehicle_id ? vehicleById.get(fleetSet.vehicle_id) ?? null : null
    const liveState = liveStateByDevice.get(trailer.connection_device_id) ?? null
    const signalAgeSec = liveState?.signal_age_sec ?? null

    rows.push({
      org_id: orgId,
      fleet_set_id: fleetSet?.id ?? null,
      carrier_id: fleetSet?.carrier_id ?? trailer.carrier_id ?? null,
      carrier_name:
        (fleetSet?.carrier_id ? carrierNameById.get(fleetSet.carrier_id) : undefined) ??
        (trailer.carrier_id ? carrierNameById.get(trailer.carrier_id) : undefined) ??
        null,
      driver_id: fleetSet?.driver_id ?? null,
      driver_name: fleetSet?.driver_id ? driverNameById.get(fleetSet.driver_id) ?? null : null,
      vehicle_id: contextVehicle?.id ?? fleetSet?.vehicle_id ?? null,
      vehicle_unit_code: normalizeText(contextVehicle?.unit_code),
      vehicle_plate: normalizeText(contextVehicle?.plate),
      vehicle_type: normalizeText(contextVehicle?.vehicle_type),
      trailer_id: trailer.id,
      trailer_code: normalizeText(trailer.code),
      trailer_plate: normalizeText(trailer.plate),
      supports_multi_zone: Boolean(trailer.supports_multi_zone ?? false),
      source_device_type: 'TRAILER',
      source_connection_device_id: trailer.connection_device_id,
      message_ts: liveState?.message_ts ?? null,
      server_ts: liveState?.server_ts ?? null,
      lat: liveState?.lat ?? null,
      lng: liveState?.lng ?? null,
      speed_kph: liveState?.speed_kph ?? null,
      heading: liveState?.heading ?? null,
      ignition: liveState?.ignition ?? null,
      is_online: liveState?.is_online ?? null,
      signal_age_sec: signalAgeSec,
      is_moving: liveState?.is_moving ?? null,
      address_text: normalizeText(liveState?.address_text),
      temperature_c: liveState?.temperature_c ?? null,
      temp_1_c: liveState?.temp_1_c ?? null,
      temp_2_c: liveState?.temp_2_c ?? null,
      telematics: liveState?.telematics ?? null,
      signal_status: deriveSignalStatus(signalAgeSec),
      fleet_set_updated_at: fleetSet?.updated_at ?? liveState?.updated_at ?? new Date(0).toISOString(),
    })
  }

  const rowsWithCapabilities = (await enrichWithDeviceCapabilities(rows)).sort((a, b) => {
    const byFleetSetUpdate =
      new Date(b.fleet_set_updated_at).getTime() - new Date(a.fleet_set_updated_at).getTime()
    if (byFleetSetUpdate !== 0) return byFleetSetUpdate
    return new Date(b.message_ts ?? 0).getTime() - new Date(a.message_ts ?? 0).getTime()
  })

  if (!search) return rowsWithCapabilities

  return rowsWithCapabilities.filter((row) => {
    const unitCode = row.vehicle_unit_code?.toLowerCase() ?? ''
    const unitPlate = row.vehicle_plate?.toLowerCase() ?? ''
    const trailerCode = row.trailer_code?.toLowerCase() ?? ''
    const trailerPlate = row.trailer_plate?.toLowerCase() ?? ''
    const driverName = row.driver_name?.toLowerCase() ?? ''
    const carrierName = row.carrier_name?.toLowerCase() ?? ''

    return (
      unitCode.includes(search) ||
      unitPlate.includes(search) ||
      trailerCode.includes(search) ||
      trailerPlate.includes(search) ||
      driverName.includes(search) ||
      carrierName.includes(search)
    )
  })
}

export async function getLiveUnitById(
  orgId: string,
  unitId: string
): Promise<ControlTowerFleetSetLiveRowWithCapabilities | null> {
  const rows = await getLiveUnits(orgId)
  const match = rows.find((row) => {
    const syntheticId = `${row.source_device_type}:${row.source_connection_device_id}`
    return row.fleet_set_id === unitId || syntheticId === unitId
  })
  return match ?? null
}

export async function getExecutionStatusByFleetSets(
  orgId: string,
  fleetSetIds: string[]
): Promise<Map<string, ExecutionStatusRow['substatus']>> {
  if (fleetSetIds.length === 0) {
    return new Map<string, ExecutionStatusRow['substatus']>()
  }

  const { data, error } = await supabase
    .from('dispatch_orders')
    .select('fleet_set_id, substatus, updated_at')
    .eq('org_id', orgId)
    .eq('stage', 'EXECUTION')
    .in('fleet_set_id', fleetSetIds)
    .in('substatus', ['IN_TRANSIT', 'AT_DESTINATION', 'DELIVERED'])
    .order('updated_at', { ascending: false })
    .returns<ExecutionStatusRow[]>()

  if (error) {
    throw error
  }

  const map = new Map<string, ExecutionStatusRow['substatus']>()
  for (const row of data ?? []) {
    if (!row.fleet_set_id || map.has(row.fleet_set_id)) {
      continue
    }
    map.set(row.fleet_set_id, row.substatus)
  }

  return map
}

export async function getDriversByIds(
  orgId: string,
  driverIds: number[]
): Promise<Map<number, DriverDetailsRow>> {
  if (driverIds.length === 0) {
    return new Map<number, DriverDetailsRow>()
  }

  const { data, error } = await supabase
    .from('drivers')
    .select('id, name, phone_number, email, license_number')
    .eq('org_id', orgId)
    .in('id', driverIds)
    .returns<DriverDetailsRow[]>()

  if (error) {
    throw error
  }

  const map = new Map<number, DriverDetailsRow>()
  for (const row of data ?? []) {
    map.set(row.id, row)
  }
  return map
}

export function subscribeLive(
  orgId: string,
  onChange: () => void
): () => void {
  unsubscribe()

  realtimeChannel = supabase
    .channel(`ct-unit-live-state-${orgId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ct_unit_live_state',
        filter: `org_id=eq.${orgId}`,
      },
      () => onChange()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fleet_sets',
        filter: `org_id=eq.${orgId}`,
      },
      () => onChange()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dispatch_orders',
        filter: `org_id=eq.${orgId}`,
      },
      () => onChange()
    )
    .subscribe()

  return () => unsubscribe()
}

export function unsubscribe(): void {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
}

// Legacy export for backward compatibility
export const controlTowerRealtimeService = {
  getLiveUnits,
  getLiveUnitById,
  getExecutionStatusByFleetSets,
  getDriversByIds,
  subscribeLive,
  unsubscribe
}
