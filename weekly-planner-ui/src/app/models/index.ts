export interface Member {
  id: number;
  name: string;
  isLead: boolean;
}

export interface BacklogItem {
  id: number;
  title: string;
  description: string;
  category: 1 | 2 | 3;
  isActive: boolean;
}

export interface WeekCycle {
  id: number;
  planningDate: string;
  weekStartDate: string;
  weekEndDate: string;
  category1Percent: number;
  category2Percent: number;
  category3Percent: number;
  isActive: boolean;
}

export interface PlanEntry {
  id?: number;
  weeklyPlanId?: number;
  backlogItemId: number;
  backlogItem?: BacklogItem;
  plannedHours: number;
  progressPercent: number;
  actualHours?: number;
  lastUpdated?: string;
}

export interface WeeklyPlan {
  id?: number;
  memberId: number;
  weekCycleId: number;
  isFrozen: boolean;
  frozenAt?: string;
  planEntries: PlanEntry[];
}

export interface DashboardEntry {
  memberName: string;
  isFrozen: boolean;
  totalTasks: number;
  totalPlannedHrs: number;
  totalActualHrs: number;
  overallProgress: number;
  tasks: {
    title: string;
    category: number;
    plannedHours: number;
    progressPercent: number;
    actualHours?: number;
  }[];
}
