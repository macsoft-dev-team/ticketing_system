import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  ArrowRight,
  Camera,
  CheckCircle,
  Clock,
  Send,
  Truck,
  Settings,
  Wrench,
  RotateCcw,
  X
} from 'lucide-react';

// Role-based permissions - matches backend milestoneConfig.js
const STAGE_ROLE_PERMISSIONS = {
  // ticket creation / field actions
  TICKET_RAISED: ['CUSTOMER_FIELD_ENGINEER', 'MACSOFT_ADMIN'],
  REQUEST_CLEARED_AT_FIELD: ['CUSTOMER_FIELD_ENGINEER', 'MACSOFT_SUPPORT', 'MACSOFT_ADMIN', 'MACSOFT_HEAD'],

  // assigning / submitting to service centre (image shows Macsoft roles + support/head)
  SERVICE_CENTER_ASSIGNED: ['MACSOFT_SUPPORT', 'MACSOFT_ADMIN', 'MACSOFT_HEAD'],
  SENT_TO_SERVICE_CENTER: ['MACSOFT_SUPPORT', 'MACSOFT_ADMIN', 'MACSOFT_HEAD', 'CUSTOMER_SERVICE_HEAD'],

  // service centre arrival / work
  RECEIVED_AT_SERVICE_CENTER: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT','SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN'],
  DIAGNOSIS_IN_PROGRESS: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT','SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN'],

  // spares workflow
  SPARE_REQUESTED: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN', 'CUSTOMER_SERVICE_HEAD', 'CUSTOMER_FIELD_ENGINEER'],
  SPARE_APPROVED: ['MACSOFT_HEAD', 'MACSOFT_ADMIN'],

  // repair / replacement
  REPAIR_IN_PROGRESS: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT','SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN'],
  REPLACEMENT_IN_PROGRESS: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT','SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN'],
  REPAIRED: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT','SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN'],

  // dispatch / field delivery / final clearance
  READY_FOR_DISPATCH: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT','MACSOFT_ADMIN'],
  DELIVERED_TO_FIELD: ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT','SERVICE_CENTER_TECHNICIAN'],
  FIELD_CLEARANCE_APPROVED: ['MACSOFT_HEAD', 'MACSOFT_ADMIN']
};

// Utility function to check if user role can transition to a specific stage
const canUserTransitionToStage = (userRole, targetStage) => {
  const allowedRoles = STAGE_ROLE_PERMISSIONS[targetStage];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
};

/**
 * Dynamic action button that changes based on current milestone stage
 * Handles milestone transitions and related actions
 * 
 * Role-based visibility: Only shows actions that the user has permission to perform
 * based on their role and the target stage requirements.
 */
const MilestoneActionButton = ({
  currentMilestone,
  availableTransitions = [],
  onAction,
  className = '',
  disabled = false,
  userRole = null,
  allMilestones = []
}) => {

  // Define action configurations for each milestone stage
  const actionConfigs = useMemo(() => {
    if (!currentMilestone) {
      return [];
    }

    const { stage, attachments = [] } = currentMilestone;
    const photoCount = attachments.length;

    // Check if service center is already assigned or if ticket has been sent to service center
    const isServiceCenterAssigned = allMilestones.some(
      milestone => milestone.stage === 'SERVICE_CENTER_ASSIGNED' || milestone.stage === 'SENT_TO_SERVICE_CENTER'
    );

    // Stages that require photos
    const photoRequiredStages = [
      'REQUEST_CLEARED_AT_FIELD',
      'RECEIVED_AT_SERVICE_CENTER',
      'SPARE_REQUESTED',
      'READY_FOR_DISPATCH'
    ];

    // Check if photos are needed based on stage requirements
    const needsPhotos = photoRequiredStages.includes(stage) && (
      stage === 'RECEIVED_AT_SERVICE_CENTER' ? photoCount < 4 : photoCount === 0
    );

    

    // Configuration for each stage - now returns array of possible actions
    const configs = {
      TICKET_RAISED: [
        {
          title: 'Issue Solved',
          shortTitle: 'Field Clear',
          icon: CheckCircle,
          color: 'green',
          action: 'transition',
          targetStage: 'REQUEST_CLEARED_AT_FIELD',
          requiresPhotos: true,
        },
        // Only show "Assign SC" if service center is not already assigned
        ...(!isServiceCenterAssigned ? [{
          title: 'Assign Service Center',
          shortTitle: 'Assign SC',
          icon: Settings,
          color: 'purple',
          action: 'service_center_assignment',
          targetStage: 'SERVICE_CENTER_ASSIGNED',
          requiresPhotos: false,
        }] : [])
      ],
      REQUEST_CLEARED_AT_FIELD: needsPhotos ? [
        {
          title: 'Add Field Clearance Photos',
          shortTitle: 'Add Photos',
          icon: Camera,
          color: 'orange',
          action: 'upload_photos',
          requiresPhotos: true,
        }
      ] : [],
      SERVICE_CENTER_ASSIGNED: [
        {
          title: 'Issue Solved',
          shortTitle: 'Field Clear',
          icon: CheckCircle,
          color: 'green',
          action: 'transition',
          targetStage: 'REQUEST_CLEARED_AT_FIELD',
          requiresPhotos: true,
        },
        {
          title: 'Submit to service center',
          shortTitle: 'Submit to SC',
          icon: Send,
          color: 'blue',
          action: 'transition',
          targetStage: 'SENT_TO_SERVICE_CENTER',
          requiresPhotos: false,
        }
      ],
      SENT_TO_SERVICE_CENTER: [
        {
          title: 'Receive at Service Center',
          shortTitle: 'Receive',
          icon: CheckCircle,
          color: 'blue',
          action: 'transition',
          targetStage: 'RECEIVED_AT_SERVICE_CENTER',
          requiresPhotos: true,
        }
      ],
      RECEIVED_AT_SERVICE_CENTER: needsPhotos ? [
        {
          title: 'Add Receipt Photos',
          shortTitle: 'Add Photos',
          icon: Camera,
          color: 'orange',
          action: 'upload_photos',
          requiresPhotos: true,
        }
      ] : [
        {
          title: 'Start Diagnosis',
          shortTitle: 'Diagnose',
          icon: Settings,
          color: 'blue',
          action: 'transition',
          targetStage: 'DIAGNOSIS_IN_PROGRESS',
          requiresPhotos: false,
        }
      ],
      DIAGNOSIS_IN_PROGRESS: [
        {
          title: 'Start Repair',
          shortTitle: 'Repair',
          icon: Wrench,
          color: 'emerald',
          action: 'transition',
          targetStage: 'REPAIR_IN_PROGRESS',
          requiresPhotos: false,
        },
        {
          title: 'Start Replacement',
          shortTitle: 'Replace',
          icon: RotateCcw,
          color: 'blue',
          action: 'transition',
          targetStage: 'REPLACEMENT_IN_PROGRESS',
          requiresPhotos: false,
        }
      ],

      REPLACEMENT_IN_PROGRESS: (() => {
        // Check if spares have already been requested (SPARE_REQUESTED or SPARE_APPROVED exists)
        const hasSpareRequest = allMilestones.some(
          milestone => milestone.stage === 'SPARE_REQUESTED' || milestone.stage === 'SPARE_APPROVED'
        );

        if (hasSpareRequest) {
          // If spares already requested/approved, show completion option
          return [
            {
              title: 'Mark as Repaired',
              shortTitle: 'Repaired',
              icon: CheckCircle,
              color: 'green',
              action: 'transition',
              targetStage: 'REPAIRED',
              requiresPhotos: false,
            },
            {
              title: 'Issue Solved',
              shortTitle: 'Field Clear',
              icon: CheckCircle,
              color: 'green',
              action: 'transition',
              targetStage: 'REQUEST_CLEARED_AT_FIELD',
              requiresPhotos: true,
            },
          ];
        } else {
          // If no spare request yet, show spare request option
          return [
            {
              title: 'Request Spare Parts',
              shortTitle: 'Request Spare',
              icon: Package,
              color: 'orange',
              action: 'spare_request',
              targetStage: 'SPARE_REQUESTED',
              requiresPhotos: false,
            },
            {
              title: 'Issue Solved',
              shortTitle: 'Field Clear',
              icon: CheckCircle,
              color: 'green',
              action: 'transition',
              targetStage: 'REQUEST_CLEARED_AT_FIELD',
              requiresPhotos: true,
            },
          ];
        }
      })(),
      SPARE_REQUESTED: [
        // Always show approve button for authorized roles
        ...(canUserTransitionToStage(userRole, 'SPARE_APPROVED') ? [{
          title: 'Approve Spare Request',
          shortTitle: 'Approve',
          icon: CheckCircle,
          color: needsPhotos ? 'gray' : 'green',
          action: 'transition',
          targetStage: 'SPARE_APPROVED',
          requiresPhotos: false,
          disabled: needsPhotos,
          disabledNote: needsPhotos ? 'Pending for spare request photos' : null,
        }] : []),
        // Show add photos button if photos are needed
        ...(needsPhotos ? [{
          title: 'Add Spare Photos',
          shortTitle: 'Add Photos',
          icon: Camera,
          color: 'orange',
          action: 'upload_photos',
          requiresPhotos: true,
        }] : [])
      ],
      SPARE_APPROVED: [
        {
          title: 'Ready for Dispatch',
          shortTitle: 'Ready',
          icon: Package,
          color: 'blue',
          action: 'transition',
          targetStage: 'READY_FOR_DISPATCH',
          requiresPhotos: true,
        },
        {
          title: 'Issue Solved',
          shortTitle: 'Field Clear',
          icon: CheckCircle,
          color: 'green',
          action: 'transition',
          targetStage: 'REQUEST_CLEARED_AT_FIELD',
          requiresPhotos: true,
        }
      ],
      REPAIR_IN_PROGRESS: [
        {
          title: 'Mark as Repaired',
          shortTitle: 'Repaired',
          icon: CheckCircle,
          color: 'green',
          action: 'transition',
          targetStage: 'REPAIRED',
          requiresPhotos: false,
        }
      ],
      REPAIRED: [
        {
          title: 'Ready for Dispatch',
          shortTitle: 'Ready',
          icon: Package,
          color: 'blue',
          action: 'transition',
          targetStage: 'READY_FOR_DISPATCH',
          requiresPhotos: false,
        }
      ],
      READY_FOR_DISPATCH: needsPhotos ? [
        {
          title: 'Add Dispatch Photos',
          shortTitle: 'Add Photos',
          icon: Camera,
          color: 'orange',
          action: 'upload_photos',
          requiresPhotos: true,
        }
      ] : [
        {
          title: 'Mark as Delivered',
          shortTitle: 'Mark Delivered',
          icon: Truck,
          color: 'blue',
          action: 'transition',
          targetStage: 'DELIVERED_TO_FIELD',
          requiresPhotos: false,
        }
      ],
      DELIVERED_TO_FIELD: [], // Final stage - no further actions needed
      FIELD_CLEARANCE_APPROVED: [], // No longer used as final stage
    };

    const stageConfigs = configs[stage] || [];

    // Filter actions based on user role permissions
    if (!userRole) {
      return stageConfigs; // If no role provided, show all actions (fallback)
    }

    const filteredActions = stageConfigs.filter(config => {
      // Special handling for spare_request action - any role can create spare requests
      if (config.action === 'spare_request') {
        return true; // All roles can create spare requests
      }

      // Special handling for service_center_assignment action
      if (config.action === 'service_center_assignment') {
        return ['MACSOFT_ADMIN', 'MACSOFT_SUPPORT', 'MACSOFT_HEAD'].includes(userRole);
      }

      // For transition actions, check if user can transition to target stage
      if (config.action === 'transition' && config.targetStage) {
        return canUserTransitionToStage(userRole, config.targetStage);
      }

      // For upload_photos and other non-transition actions, allow if user can access current stage
      if (config.action === 'upload_photos') {
        return canUserTransitionToStage(userRole, stage);
      }

      // Default: allow action if user can access current stage
      return canUserTransitionToStage(userRole, stage);
    });

    return filteredActions;
  }, [currentMilestone, userRole, allMilestones]);

  // If no action configs or no current milestone, return null
  if (!actionConfigs.length || !currentMilestone) {
    return null;
  }

  // Enforce mutual exclusivity between REPAIR_IN_PROGRESS and REPLACEMENT_IN_PROGRESS
  // If both actions are present, prefer the one that appears first in availableTransitions (server-provided)
  let filteredConfigs = actionConfigs.slice();
  try {
    const hasReplace = filteredConfigs.some(c => c.targetStage === 'REPLACEMENT_IN_PROGRESS');
    const hasRepair = filteredConfigs.some(c => c.targetStage === 'REPAIR_IN_PROGRESS');

    if (hasReplace && hasRepair && Array.isArray(availableTransitions) && availableTransitions.length > 0) {
      // Build a lookup of available transition stages for ordering
      const availOrder = availableTransitions.reduce((acc, t, idx) => {
        acc[t.stage] = idx;
        return acc;
      }, {});

      const replaceOrder = typeof availOrder['REPLACEMENT_IN_PROGRESS'] === 'number' ? availOrder['REPLACEMENT_IN_PROGRESS'] : Infinity;
      const repairOrder = typeof availOrder['REPAIR_IN_PROGRESS'] === 'number' ? availOrder['REPAIR_IN_PROGRESS'] : Infinity;

      if (replaceOrder < repairOrder) {
        filteredConfigs = filteredConfigs.filter(c => c.targetStage !== 'REPAIR_IN_PROGRESS');
      } else if (repairOrder < replaceOrder) {
        filteredConfigs = filteredConfigs.filter(c => c.targetStage !== 'REPLACEMENT_IN_PROGRESS');
      } else {
        // If both have equal priority (or neither present in availableTransitions), pick one based on default preference
        // Default preference: REPAIR_IN_PROGRESS over REPLACEMENT_IN_PROGRESS
        filteredConfigs = filteredConfigs.filter(c => c.targetStage !== 'REPLACEMENT_IN_PROGRESS');
      }
    }
  } catch (err) {
    // Fallback: don't crash - keep original configs
    filteredConfigs = actionConfigs.slice();
  }

  // Get color classes
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    gray: 'bg-gray-400 cursor-not-allowed',
  };

  const handleClick = (actionConfig) => {
    if (disabled || actionConfig.disabled) return;

     onAction({
      action: actionConfig.action,
      targetStage: actionConfig.targetStage,
      requiresPhotos: actionConfig.requiresPhotos,
      currentStage: currentMilestone.stage,
    });
  };

  // If only one action, render as single button
  if (filteredConfigs.length === 1) {
    const actionConfig = filteredConfigs[0];
    const Icon = actionConfig.icon;
    const bgColor = colorClasses[actionConfig.color] || colorClasses.blue;
    const isButtonDisabled = disabled || actionConfig.disabled;

    return (
      <div className={className}>
        {actionConfig.disabledNote && (
          <div className="text-xs text-orange-600 mb-1 font-medium">
            {actionConfig.disabledNote}
          </div>
        )}
        <motion.button
          whileHover={!isButtonDisabled ? { scale: 1.05 } : {}}
          whileTap={!isButtonDisabled ? { scale: 0.95 } : {}}
          onClick={() => handleClick(actionConfig)}
          disabled={isButtonDisabled}
          className={`flex items-center uppercase gap-2 px-3 sm:px-4 py-2 ${bgColor} text-white rounded-lg transition-colors text-sm tracking-wide ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          <Icon size={16} />
          <span className="hidden sm:inline">{actionConfig.title}</span>
          <span className="sm:hidden">{actionConfig.shortTitle}</span>
        </motion.button>
      </div>
    );
  }

  // If multiple actions, render as button group
  const hasAnyDisabledNotes = filteredConfigs.some(config => config.disabledNote);

  return (
    <div className={className}>
      {hasAnyDisabledNotes && (
        <div className="mb-2">
          {filteredConfigs.map((actionConfig, index) => 
            actionConfig.disabledNote ? (
              <div key={`note-${index}`} className="text-xs text-orange-600 mb-1 font-medium">
                {actionConfig.disabledNote}
              </div>
            ) : null
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {filteredConfigs.map((actionConfig, index) => {
          const Icon = actionConfig.icon;
          const bgColor = colorClasses[actionConfig.color] || colorClasses.blue;
          const isButtonDisabled = disabled || actionConfig.disabled;

          return (
            <motion.button
              key={index}
              whileHover={!isButtonDisabled ? { scale: 1.05 } : {}}
              whileTap={!isButtonDisabled ? { scale: 0.95 } : {}}
              onClick={() => handleClick(actionConfig)}
              disabled={isButtonDisabled}
              className={`flex items-center uppercase gap-1 px-2 sm:px-3 py-1.5 ${bgColor} text-white rounded-lg transition-colors text-xs tracking-wide ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{actionConfig.shortTitle}</span>
              <span className="sm:hidden">{actionConfig.shortTitle}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MilestoneActionButton;
