import * as spendPermissionUtils from ':interface/public-utilities/spend-permission/index.js';
import { ActionType, AnalyticsEventImportance, ComponentType, logEvent } from '../logEvent.js';

export type SpendPermissionUtilType = keyof typeof spendPermissionUtils;

export const logSpendPermissionUtilStarted = (functionName: SpendPermissionUtilType) => {
  logEvent(
    `spend_permission_utils.${functionName}.started`,
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
    },
    AnalyticsEventImportance.high
  );
};

export const logSpendPermissionUtilCompleted = (functionName: SpendPermissionUtilType) => {
  logEvent(
    `spend_permission_utils.${functionName}.completed`,
    {
      action: ActionType.unknown,
      componentType: ComponentType.unknown,
    },
    AnalyticsEventImportance.high
  );
};

export const logSpendPermissionUtilError = (
  functionName: SpendPermissionUtilType,
  errorMessage: string
) => {
  logEvent(
    `spend_permission_utils.${functionName}.error`,
    {
      action: ActionType.error,
      componentType: ComponentType.unknown,
      errorMessage,
    },
    AnalyticsEventImportance.high
  );
};
