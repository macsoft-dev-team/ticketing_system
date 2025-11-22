/**
 * Milestone Configuration
 * Defines the workflow stages, role permissions, and requirements
 */

const ServiceStages = {
  TICKET_RAISED: "TICKET_RAISED",
  SERVICE_CENTER_ASSIGNED: "SERVICE_CENTER_ASSIGNED",
  REQUEST_CLEARED_AT_FIELD: "REQUEST_CLEARED_AT_FIELD",
  SENT_TO_SERVICE_CENTER: "SENT_TO_SERVICE_CENTER",
  RECEIVED_AT_SERVICE_CENTER: "RECEIVED_AT_SERVICE_CENTER",
  DIAGNOSIS_IN_PROGRESS: "DIAGNOSIS_IN_PROGRESS",
  SPARE_REQUESTED: "SPARE_REQUESTED",
  SPARE_APPROVED: "SPARE_APPROVED",
  REPAIR_IN_PROGRESS: "REPAIR_IN_PROGRESS",
  REPLACEMENT_IN_PROGRESS: "REPLACEMENT_IN_PROGRESS",
  REPAIRED: "REPAIRED",
  READY_FOR_DISPATCH: "READY_FOR_DISPATCH",
  DELIVERED_TO_FIELD: "DELIVERED_TO_FIELD",
  FIELD_CLEARANCE_APPROVED: "FIELD_CLEARANCE_APPROVED",
};

// Role definitions
const ROLES = {
  MACSOFT_ADMIN: "MACSOFT_ADMIN",
  MACSOFT_HEAD: "MACSOFT_HEAD",
  MACSOFT_SUPPORT: "MACSOFT_SUPPORT",
  CUSTOMER_SERVICE_HEAD: "CUSTOMER_SERVICE_HEAD",
  SERVICE_CENTER_TECHNICIAN: "SERVICE_CENTER_TECHNICIAN",
  CUSTOMER_FIELD_ENGINEER: "CUSTOMER_FIELD_ENGINEER",
};

// Milestone stage configuration
const milestoneStageConfig = [
  {
    stage: ServiceStages.TICKET_RAISED,
    order: 0,
    label: "Ticket Raised",
    description: "Initial ticket raised by field engineer",
    allowedRoles: ["CUSTOMER_FIELD_ENGINEER", "MACSOFT_ADMIN"],
    photoRequired: false,
    autoProgress: true, // Automatically created when ticket is created
    notes: "Ticket has been raised in the system",
  },
  {
    stage: ServiceStages.SERVICE_CENTER_ASSIGNED,
    order: 1,
    label: "Service Center Assigned",
    description:
      "Service center assigned - field engineer can issue solved or submit to service center",
    allowedRoles: ["MACSOFT_SUPPORT", "MACSOFT_ADMIN", "MACSOFT_HEAD"],
    photoRequired: false,
    notes:
      "Service center has been assigned - choose to issue solved or submit to service center",
  },
  {
    stage: ServiceStages.REQUEST_CLEARED_AT_FIELD,
    order: 2,
    label: "Request Cleared at Field",
    description: "Fault cleared on-site by field engineer",
    allowedRoles: ["CUSTOMER_FIELD_ENGINEER", "MACSOFT_ADMIN"],
    photoRequired: true,  
    minPhotos: 1,
    isFinal: true,
    notes: "Field clearance completed - photo required to confirm resolution",
  },
  {
    stage: ServiceStages.SENT_TO_SERVICE_CENTER,
    order: 3,
    label: "Sent to Service Center",
    description: "Controller submission to service centre initiated",
    allowedRoles: [
      "MACSOFT_SUPPORT",
      "MACSOFT_ADMIN",
      "MACSOFT_HEAD",
      "CUSTOMER_SERVICE_HEAD",
    ],
    photoRequired: false,
    notes: "Controller dispatched to service center",
  },
  {
    stage: ServiceStages.RECEIVED_AT_SERVICE_CENTER,
    order: 4,
    label: "Received at Service Center",
    description:
      "Controller physically received at service center (4 specific photos required)",
    allowedRoles: [
      "MACSOFT_HEAD",
      "MACSOFT_SUPPORT",
      "SERVICE_CENTER_TECHNICIAN",
      "MACSOFT_ADMIN",
    ],
    photoRequired: true,
    minPhotos: 4,
    requiredPhotos: [
      "Controller Front",
      "Controller Bottom",
      "Full View Open",
      "MCB Close Up",
    ],
    notes:
      "4 specific photos required: Controller Front, Controller Bottom, Full View Open, MCB Close Up",
  },
  {
    stage: ServiceStages.DIAGNOSIS_IN_PROGRESS,
    order: 5,
    label: "Diagnosis in Progress",
    description: "Diagnosis started to decide repair or replacement",
    allowedRoles: [
      "MACSOFT_HEAD",
      "MACSOFT_SUPPORT",
      "SERVICE_CENTER_TECHNICIAN",
      "MACSOFT_ADMIN",
    ],
    photoRequired: false,
    notes: "Technical diagnosis underway",
  },
  {
    stage: ServiceStages.REPAIR_IN_PROGRESS,
    order: 6,
    label: "Repair in Progress",
    description: "Controller repair initiated",
    allowedRoles: [
      "MACSOFT_HEAD",
      "MACSOFT_SUPPORT",
      "SERVICE_CENTER_TECHNICIAN",
      "MACSOFT_ADMIN",
    ],
    photoRequired: false,
    pathChoice: true,
    notes: "Repair work in progress",
  },
  {
    stage: ServiceStages.REPLACEMENT_IN_PROGRESS,
    order: 7, // First replacement stage
    label: "Replacement in Progress",
    description: "Replacement initiated (alternate to repair)",
    allowedRoles: [
      "MACSOFT_HEAD",
      "MACSOFT_SUPPORT",
      "SERVICE_CENTER_TECHNICIAN",
      "MACSOFT_ADMIN",
    ],
    photoRequired: false,
    pathChoice: true,
    notes: "Replacement work in progress",
  },
  {
    stage: ServiceStages.SPARE_REQUESTED,
    order: 8,
    label: "Spare Requested",
    description: "Spare parts requested",
    allowedRoles: [
      "MACSOFT_HEAD",
      "MACSOFT_SUPPORT",
      "SERVICE_CENTER_TECHNICIAN",
      "MACSOFT_ADMIN",
      "CUSTOMER_SERVICE_HEAD",
      "CUSTOMER_FIELD_ENGINEER",
    ],
    photoRequired: true,
    minPhotos: 1,
    requiresSpareRequest: true,
    notes: "Photo(s) of required spare parts",
  },
  {
    stage: ServiceStages.SPARE_APPROVED,
    order: 9,
    label: "Spare Approved",
    description: "Spare request approved by head",
    allowedRoles: ["MACSOFT_HEAD", "MACSOFT_ADMIN"],
    photoRequired: false,
    approvalGate: true,
    notes: "Approval required to proceed with spare parts",
  },
  {
    stage: ServiceStages.REPAIRED,
    order: 10,
    label: "Repaired",
    description: "Controller repaired and tested",
    allowedRoles: [
      "MACSOFT_HEAD",
      "MACSOFT_SUPPORT",
      "SERVICE_CENTER_TECHNICIAN",
      "MACSOFT_ADMIN",
    ],
    photoRequired: false,
    notes: "Controller repair completed",
  },
  {
    stage: ServiceStages.READY_FOR_DISPATCH,
    order: 11,
    label: "Ready for Dispatch",
    description: "Controller ready for dispatch",
    allowedRoles: ["MACSOFT_HEAD", "MACSOFT_SUPPORT", "MACSOFT_ADMIN"],
    photoRequired: true,
    minPhotos: 1,
    notes: "Photo of packaged controller required",
  },
  {
    stage: ServiceStages.DELIVERED_TO_FIELD,
    order: 12,
    label: "Delivered to Field",
    description:
      "Controller delivered/dispatched back to field - Final completion",
    allowedRoles: [
      "MACSOFT_ADMIN",
      "MACSOFT_HEAD",
      "MACSOFT_SUPPORT",
      "SERVICE_CENTER_TECHNICIAN",
    ],
    photoRequired: false,
    isFinal: true,
    notes: "Controller delivered back to field - Ticket completed",
  },
  {
    stage: ServiceStages.FIELD_CLEARANCE_APPROVED,
    order: 13,
    label: "Field Clearance Approved",
    description: "Field clearance approved by Head",
    allowedRoles: ["MACSOFT_HEAD", "MACSOFT_ADMIN"],
    photoRequired: false,
    isFinal: true,
    approvalGate: true,
    notes: "Final approval for field clearance",
  },
];

function getAllowedRolesForStage(stage) {
  const config = milestoneStageConfig.find((s) => s.stage === stage);
  return config ? config.allowedRoles : [];
}

function canRoleTransitionToStage(userRole, stage) {
  const allowedRoles = getAllowedRolesForStage(stage);
  return allowedRoles.includes(userRole);
}

function getStageConfig(stage) {
  return milestoneStageConfig.find((s) => s.stage === stage) || null;
}

function getNextAvailableStages(currentStage, userRole) {
  // Define allowed transitions based on new workflow
  const allowedTransitions = {
    TICKET_RAISED: ["REQUEST_CLEARED_AT_FIELD", "SERVICE_CENTER_ASSIGNED"],
    REQUEST_CLEARED_AT_FIELD: [], // Final stage
    SERVICE_CENTER_ASSIGNED: [
      "REQUEST_CLEARED_AT_FIELD",
      "SENT_TO_SERVICE_CENTER",
    ],
    SENT_TO_SERVICE_CENTER: ["RECEIVED_AT_SERVICE_CENTER"],
    RECEIVED_AT_SERVICE_CENTER: ["DIAGNOSIS_IN_PROGRESS"],
    DIAGNOSIS_IN_PROGRESS: ["REPAIR_IN_PROGRESS", "REPLACEMENT_IN_PROGRESS"],
    SPARE_REQUESTED: ["SPARE_APPROVED"],
    SPARE_APPROVED: ["READY_FOR_DISPATCH", "REQUEST_CLEARED_AT_FIELD"], // Direct completion options after spare approval
    REPAIR_IN_PROGRESS: ["REPAIRED"], // Repair goes directly to repaired
    REPLACEMENT_IN_PROGRESS: [
      "SPARE_REQUESTED",
      "REQUEST_CLEARED_AT_FIELD",
      "REPAIRED",
    ],
    REPAIRED: ["READY_FOR_DISPATCH"],
    READY_FOR_DISPATCH: ["DELIVERED_TO_FIELD"],
    DELIVERED_TO_FIELD: [], // Final stage
    FIELD_CLEARANCE_APPROVED: [], // No longer used as final stage
  };

  const nextStageNames = allowedTransitions[currentStage] || [];

  // Get config for each allowed next stage and filter by role permission
  const nextStages = nextStageNames
    .map((stageName) => getStageConfig(stageName))
    .filter(
      (config) => config && canRoleTransitionToStage(userRole, config.stage)
    );

  return nextStages;
}

function validateMilestoneTransition(
  userRole,
  targetStage,
  currentMilestone,
  data = {}
) {
  const targetConfig = getStageConfig(targetStage);
  if (!targetConfig) {
    return {
      valid: false,
      error: `Invalid stage: ${targetStage}`,
    };
  }

  // Check role permission for the TARGET stage
  if (!canRoleTransitionToStage(userRole, targetStage)) {
    return {
      valid: false,
      error: `Your role (${userRole}) does not have permission to transition to ${targetConfig.label}`,
    };
  }

  // Photo gate: Check if CURRENT milestone requires photos before leaving
  if (currentMilestone) {
    const currentConfig = getStageConfig(currentMilestone.stage);
    if (currentConfig && currentConfig.photoRequired) {
      // Check if current milestone has attachments
      const currentPhotoCount = currentMilestone.attachments?.length || 0;
      const minPhotos = currentConfig.minPhotos || 1;

      if (currentPhotoCount < minPhotos) {
        return {
          valid: false,
          error: `Cannot leave ${currentConfig.label}. At least ${minPhotos} photo(s) must be attached to the current milestone.`,
        };
      }
    }
  }

  // Validate that this is an allowed transition
  if (currentMilestone) {
    const currentStage = currentMilestone.stage;
    const currentConfig = getStageConfig(currentStage);
    const allowedTransitions = {
      TICKET_RAISED: ["REQUEST_CLEARED_AT_FIELD", "SERVICE_CENTER_ASSIGNED"],
      REQUEST_CLEARED_AT_FIELD: [], // Final stage
      SERVICE_CENTER_ASSIGNED: [
        "REQUEST_CLEARED_AT_FIELD",
        "SENT_TO_SERVICE_CENTER",
      ],
      SENT_TO_SERVICE_CENTER: ["RECEIVED_AT_SERVICE_CENTER"],
      RECEIVED_AT_SERVICE_CENTER: ["DIAGNOSIS_IN_PROGRESS"],
      DIAGNOSIS_IN_PROGRESS: ["REPAIR_IN_PROGRESS", "REPLACEMENT_IN_PROGRESS"],
      SPARE_REQUESTED: ["SPARE_APPROVED"],
      SPARE_APPROVED: ["READY_FOR_DISPATCH", "REQUEST_CLEARED_AT_FIELD"], // Direct completion options after spare approval
      REPAIR_IN_PROGRESS: ["REPAIRED"], // Repair goes directly to repaired
      REPLACEMENT_IN_PROGRESS: [
        "SPARE_REQUESTED",
        "REQUEST_CLEARED_AT_FIELD",
        "REPAIRED",
      ],
      REPAIRED: ["READY_FOR_DISPATCH"],
      READY_FOR_DISPATCH: ["DELIVERED_TO_FIELD"],
      DELIVERED_TO_FIELD: [], // Final stage
      FIELD_CLEARANCE_APPROVED: [], // No longer used as final stage
    };
    const allowed = allowedTransitions[currentStage] || [];
    if (!allowed.includes(targetStage)) {
      return {
        valid: false,
        error: `Invalid transition from ${
          currentConfig?.label || currentStage
        } to ${targetConfig.label}`,
      };
    }
  }

  return { valid: true };
}

module.exports = {
  getAllowedRolesForStage,
  canRoleTransitionToStage,
  getStageConfig,
  getNextAvailableStages,
  validateMilestoneTransition,
};
