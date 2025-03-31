import { User } from "wasp/entities";

type PeriodType = 'week' | 'month' | 'year'

/**
 * Get date range for a specific period
 */
export function getDateRangeForPeriod(
  period: PeriodType,
  week?: number,
  month?: number,
  year: number = new Date().getFullYear()
): { startDate: Date; endDate: Date } {
  const now = new Date()
  
  if (period === 'week' && week) {
    // Get the first day of the year
    const firstDayOfYear = new Date(year, 0, 1)
    
    // Calculate the first day of the week
    // Week 1 is the first week with a Thursday in this year
    const dayOffset = firstDayOfYear.getDay() || 7; // Make Sunday 7 instead of 0
    const firstThursday = new Date(year, 0, 1 + (4 - dayOffset))
    
    // Calculate the start date of the requested week
    const startDate = new Date(firstThursday)
    startDate.setDate(startDate.getDate() + (week - 1) * 7 - 3) // Go back to Monday
    
    // Calculate the end date (Sunday of the same week)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)
    
    return { startDate, endDate }
  } else if (period === 'month' && month) {
    // Get first day of the month
    const startDate = new Date(year, month - 1, 1)
    
    // Get last day of the month
    const endDate = new Date(year, month, 0)
    endDate.setHours(23, 59, 59, 999)
    
    return { startDate, endDate }
  } else if (period === 'year') {
    // Get first day of the year
    const startDate = new Date(year, 0, 1)
    
    // Get last day of the year
    const endDate = new Date(year, 11, 31)
    endDate.setHours(23, 59, 59, 999)
    
    return { startDate, endDate }
  }
  
  // Default to current date
  return {
    startDate: now,
    endDate: now
  }
}

export type Submission = {
    id: string;
    createdAt: Date;
    userId: string;
    title: string;
    description: string;
    isPublished: boolean;
    submissionGroupId: string | null;
}

export type SubmissionGroup = {
    id: string;
    createdAt: Date;
    userId: string;
    title: string;
    description: string;
    isCompleted: boolean;
    isJudged: boolean;
    winningSubmissionId: string | null;
    vote: Vote[];
    submissions: Submission[];
}

export type Vote = {
    id: string;
    createdAt: Date;
    userId: string;
    user: User;
    submissionId: string;
    isUpvote: boolean;
    submission: Submission;
    submissionGroup: SubmissionGroup;
    isDownvote: boolean;
}

