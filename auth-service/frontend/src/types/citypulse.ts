export type AlertCategory = "Road" | "Safety" | "Lost" | "Weather" | "Emergency" | "Event" | "Infrastructure" | "Environment" | "Traffic" | "Crime" | "PublicTransport" | "Construction" | "General"
export type AlertPriority = "Low" | "Medium" | "High" | "Critical"

export interface AlertLocation {
  lat: number | null
  lng: number | null
  address: string | null
}

export interface LocationHierarchy {
  point: string | null
  area: string | null
  sector: string | null
  city: string | null
}

export interface Alert {
  id: string
  title: string
  description: string | null
  category: AlertCategory
  priority: AlertPriority
  location: AlertLocation
  location_hierarchy: LocationHierarchy | null
  neighborhood: string | null
  area_type: string | null
  timestamp: number
  user_id: string
  phone: string | null
  email: string | null
  other_contact: string | null
}

export interface AlertCreateInput {
  title: string
  description: string | null
  category: AlertCategory
  priority: AlertPriority
  location: AlertLocation
  location_hierarchy?: LocationHierarchy | null
  neighborhood?: string | null
  area_type?: string | null
  username?: string | null  // Optional: if provided, link to that user; otherwise anonymous
  phone?: string | null
  email?: string | null
  other_contact?: string | null
}

export interface AlertAnalysisResult {
  is_valid_alert: boolean
  reason?: string  // Only present if is_valid_alert is false
  category?: AlertCategory
  priority?: AlertPriority
  title?: string
  description?: string | null
  location_mentions?: string[]
  suggestions?: string[]
  location?: AlertLocation
  location_hierarchy?: LocationHierarchy
  neighborhood?: string | null
  area_type?: string | null
  phone?: string | null
  email?: string | null
  other_contact?: string | null
}
