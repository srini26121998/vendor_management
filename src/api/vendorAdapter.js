/**
 * vendorAdapter.js
 * Bridges the gap between Spring Boot VendorResponseDTO fields
 * and the shape expected by the frontend components.
 *
 * Backend → Frontend field mapping:
 *   id (UUID)            → id
 *   vendorCode           → vendorCode
 *   legalName            → name
 *   tradeName            → tradeName
 *   businessType         → category
 *   kycStatus            → status  (PENDING|IN_REVIEW|ACTIVE|REJECTED|BLOCKED|INACTIVE)
 *   complianceStatus     → complianceStatus
 *   onboardingStage      → onboardingStage
 *   authRequired         → authRequired
 *   gstin                → gstin
 *   panNumber            → pan
 *   primaryMobile        → mobile
 *   primaryEmail         → email
 *   website              → website
 *   annualTurnoverRange  → annualTurnoverRange
 *   gstRegistrationType  → gstRegistrationType
 *   notes                → notes
 *   createdByName        → createdByName
 *   createdAt            → createdAt
 *   updatedAt            → lastUpdated
 *   locations[]          → locations[]
 *   bankAccounts[]       → bankAccounts[]
 *   documents[]          → documents[]
 */

/**
 * Maps a kycStatus from backend to a UI-friendly status string.
 * Frontend components use these strings for StatusBadge colors etc.
 */
export const KYC_STATUS = {
  PENDING:   'pending',
  IN_REVIEW: 'in_review',
  ACTIVE:    'active',
  REJECTED:  'rejected',
  BLOCKED:   'blocked',
  INACTIVE:  'inactive',
};

export const COMPLIANCE_STATUS = {
  PENDING:        'PENDING',
  COMPLIANT:      'COMPLIANT',
  EXPIRING_SOON:  'EXPIRING_SOON',
  NON_COMPLIANT:  'NON_COMPLIANT',
  BLOCKED:        'BLOCKED',
};

export const ONBOARDING_STAGE_LABELS = {
  CATEGORY_MANAGER_REVIEW: 'Category Manager Review',
  QUALITY_REVIEW:          'Quality Review',
  FINANCE_REVIEW:          'Finance Review',
  DIRECTOR_REVIEW:         'Director Review',
};

export const ONBOARDING_STAGE_ORDER = [
  'CATEGORY_MANAGER_REVIEW',
  'QUALITY_REVIEW',
  'FINANCE_REVIEW',
  'DIRECTOR_REVIEW',
];

/**
 * Converts a single VendorResponseDTO from the backend
 * into the flat shape used by frontend components.
 */
export function adaptVendor(dto) {
  if (!dto) return null;

  // Derive city from primary location (if any)
  const primaryLocation = dto.locations?.find(l => l.isPrimary) || dto.locations?.[0];

  return {
    // Identity
    id:                   dto.id,
    vendorCode:           dto.vendorCode,

    // Display names (frontend used v.name in most places)
    name:                 dto.legalName,
    legalName:            dto.legalName,
    tradeName:            dto.tradeName || '',

    // Category / business type
    category:             dto.businessType,
    businessType:         dto.businessType,

    // Status (frontend StatusBadge uses lowercase)
    status:               dto.kycStatus?.toLowerCase() || 'pending',
    kycStatus:            dto.kycStatus,
    complianceStatus:     dto.complianceStatus,

    // Onboarding
    onboardingStage:      dto.onboardingStage,
    authRequired:         dto.authRequired,

    // Tax identifiers
    gstin:                dto.gstin || '',
    pan:                  dto.panNumber || '',
    panNumber:            dto.panNumber || '',
    gstRegistrationType:  dto.gstRegistrationType || '',
    annualTurnoverRange:  dto.annualTurnoverRange || '',

    // Contact
    mobile:               dto.primaryMobile || '',
    primaryMobile:        dto.primaryMobile || '',
    email:                dto.primaryEmail || '',
    primaryEmail:         dto.primaryEmail || '',
    website:              dto.website || '',

    // Location shortcut
    city:                 primaryLocation?.city || '',
    stateCode:            primaryLocation?.stateCode || '',

    // Metadata
    notes:                dto.notes || '',
    createdByName:        dto.createdByName || '',
    createdAt:            dto.createdAt,
    lastUpdated:          dto.updatedAt
      ? new Date(dto.updatedAt).toISOString().split('T')[0]
      : '',
    updatedAt:            dto.updatedAt,

    // Sub-resources (pass through — already well-shaped from backend)
    locations:            dto.locations    || [],
    bankAccounts:         dto.bankAccounts || [],
    documents:            dto.documents    || [],

    // Legacy mock-compatible fields (keep so existing components don't break)
    fssai:                null, // not in backend — always null
    rating:               0,
    tier:                 'Bronze',
    totalOrders:          0,
    fulfillmentRate:      0,
    payables:             0,
    overdue:              0,
    lastOrder:            '—',
  };
}

/**
 * Maps an array of VendorResponseDTO objects.
 */
export function adaptVendorList(dtos) {
  if (!Array.isArray(dtos)) return [];
  return dtos.map(adaptVendor);
}

/**
 * Converts the frontend form state (from VendorOnboarding form)
 * into a VendorRequestDTO that the backend expects.
 *
 * Required by backend:
 *   legalName (string, required)
 *   businessType (string, required: MANUFACTURER|DISTRIBUTOR|TRADER|IMPORTER|SERVICE_PROVIDER)
 *   panNumber (string, required, pattern: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$)
 *   gstRegistrationType (string, required: REGULAR|COMPOSITION|SEZ|UNREGISTERED|EXPORT_ONLY)
 *   primaryMobile (string, required)
 *   primaryEmail (string, required, email format)
 *
 * Optional:
 *   tradeName, gstin, website, annualTurnoverRange, notes, authRequired
 */
export function adaptToRequestDTO(formData) {
  return {
    legalName:            (formData.legalName || formData.name || '').trim(),
    tradeName:            formData.tradeName?.trim() || null,
    businessType:         (formData.businessType || formData.category || '').toUpperCase(),
    gstin:                formData.gstin?.trim() || null,
    panNumber:            formData.panNumber?.trim()?.toUpperCase() || formData.pan?.trim()?.toUpperCase() || null,
    gstRegistrationType:  formData.gstRegistrationType || 'REGULAR',
    primaryMobile:        formData.primaryMobile || formData.mobile || '',
    primaryEmail:         formData.primaryEmail || formData.email || '',
    website:              formData.website?.trim() || null,
    annualTurnoverRange:  formData.annualTurnoverRange || null,
    notes:                formData.notes?.trim() || null,
    authRequired:         Boolean(formData.authRequired),
  };
}
