export interface Member {
  id: number;
  name: string;
  isLead: boolean;
  isActive: boolean;
}

export interface BacklogItem {
  id: number;
  title: string;
  description: string;
  category: number;
  isActive: boolean;
  estimatedHours?: number;
  status?: string;
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
  state?: string;
}

export interface PlanEntry {
  id?: number;
  backlogItemId: number;
  backlogItem?: BacklogItem;
  plannedHours: number;
  progressPercent: number;
  actualHours?: number;
  progressStatus?: string;
  progressNote?: string;
  weeklyPlanId?: number;
}

export interface WeeklyPlan {
  id: number;
  memberId: number;
  member?: Member;
  weekCycleId: number;
  isFrozen: boolean;
  frozenAt?: string;
  planEntries: PlanEntry[];
}
