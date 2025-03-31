import { HttpError } from 'wasp/server';
import { Submission, SubmissionGroup, User, Vote } from 'wasp/entities';
import { getDateRangeForPeriod } from './utils';
import {
  type GetAllSubmissionsByUser,
  type CreateSubmission,
  type UpdateSubmission,
  type DeleteSubmission,
  type GetAllSubmissions,
  type GetSubmissionById,
  type GetSubmissionByWeek,
  type GetSubmissionByMonth,
  type GetSubmissionByYear,
  type VoteForSubmission,
  type CreateSubmissionGroup,
  type DeleteSubmissionGroup,
  type UpdateSubmissionGroup,
  type GetSubmissionGroupById,
  type GetSubmissionGroupByName,
  type GetSubmissionCountForGroup,
  type GetAllSubmissionGroups
} from 'wasp/server/operations';

export type CreateSubmissionInput = {
  title: string
  description?: string
  files?: Array<{
    name: string
    type: string
    size?: number
    key?: string
  }>
  groupId?: string
}

type UpdateSubmissionInput = {
  id: string
  title?: string
  description?: string
  files?: any[]
}

type DeleteSubmissionInput = {
  id: string
}

type GetSubmissionByIdInput = {
  id: string
}

type GetSubmissionByPeriodInput = {
  week?: number
  month?: number
  year: number
}

type VoteInput = {
  submissionId: string
}



export const createSubmission: CreateSubmission<CreateSubmissionInput,  Submission> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to create a submission')
  }

  if (!args.title) {
    throw new HttpError(400, 'Title is required')
  }

  // The files already got uploaded to S3 by the frontend
  // We just need to store the metadata in the submission
  const fileReferences = args.files || [];
  
  let submission = await context.entities.Submission.create({
    data: {
      title: args.title,
      description: args.description || '',
      fileReferences: fileReferences.length > 0 ? fileReferences : undefined,
      user: { connect: { id: context.user.id } },
      createdAt: new Date(),
      updatedAt: new Date(),
      votes: 0, // Initialize with zero votes
      }
  })

    submission = await context.entities.Submission.update({
      where: { id: submission.id },
      data: {
        submissionGroup: { connect: { id: args.groupId } }
      }
    })
  
  return submission
}

export const updateSubmission: UpdateSubmission<UpdateSubmissionInput, Submission> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to update a submission')
  }

  const submission = await context.entities.Submission.findUnique({
    where: { id: args.id },
    include: { user: true }
  })

  if (!submission) {
    throw new HttpError(404, 'Submission not found')
  }

  // Check if the user is the owner of the submission
  if (submission.user.id !== context.user.id) {
    throw new HttpError(403, 'You can only update your own submissions')
  }

  return context.entities.Submission.update({
    where: { id: args.id },
    data: {
      ...(args.title && { title: args.title }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.files && { files: args.files }),
      updatedAt: new Date()
    }
  })
}

export const deleteSubmission: DeleteSubmission<DeleteSubmissionInput, Submission> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to delete a submission')
  }

  const submission = await context.entities.Submission.findUnique({
    where: { id: args.id },
    include: { user: true }
  })

  if (!submission) {
    throw new HttpError(404, 'Submission not found')
  }

  // Check if the user is the owner of the submission
  if (submission.user.id !== context.user.id && !context.user.isAdmin) {
    throw new HttpError(403, 'You can only delete your own submissions')
  }

  return context.entities.Submission.delete({
    where: { id: args.id }
  })
}

export const getAllSubmissionsByUser: GetAllSubmissionsByUser<void, Submission[]> = async (_, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view submissions')
  }

  return context.entities.Submission.findMany({
    where: { user: { id: context.user.id } },
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  })
}

export const getAllSubmissions: GetAllSubmissions<void, Submission[]> = async (_, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view submissions')
  }

  return context.entities.Submission.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  })
}

export const getSubmissionById: GetSubmissionById<GetSubmissionByIdInput, any> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view this submission')
  }

  const submission = await context.entities.Submission.findUnique({
    where: { id: args.id },
    include: { user: true }
  })

  if (!submission) {
    throw new HttpError(404, 'Submission not found')
  }

  return submission
}

export const getSubmissionByWeek: GetSubmissionByWeek<GetSubmissionByPeriodInput, Submission[]> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view submissions')
  }

  const { startDate, endDate } = getDateRangeForPeriod('week', args.week, args.month, args.year)

  return context.entities.Submission.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  })
}

export const getSubmissionByMonth: GetSubmissionByMonth<GetSubmissionByPeriodInput, Submission[]> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view submissions')
  }

  const { startDate, endDate } = getDateRangeForPeriod('month', args.week, args.month, args.year)

  return context.entities.Submission.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  })
}

export const getSubmissionByYear: GetSubmissionByYear<GetSubmissionByPeriodInput, Submission[]> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view submissions')
  }

  const { startDate, endDate } = getDateRangeForPeriod('year', args.week, args.month, args.year)

  return context.entities.Submission.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  })
}

// Vote operations
export const voteForSubmission: VoteForSubmission<VoteInput, Submission> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to vote')
  }

  const submission = await context.entities.Submission.findUnique({
    where: { id: args.submissionId }
  })

  if (!submission) {
    throw new HttpError(404, 'Submission not found')
  }

  // Check if user has already voted for this submission
  const existingVote = await context.entities.Vote.findFirst({
    where: {
      user: { id: context.user.id },
      submission: { id: args.submissionId }
    }
  })

  if (existingVote) {
    throw new HttpError(400, 'You have already voted for this submission')
  }

  // Create a vote record and increment the submission's vote count
  await context.entities.Vote.create({
    data: {
      user: { connect: { id: context.user.id } },
      submission: { connect: { id: args.submissionId } },
      createdAt: new Date(),
      isUpvote: true,
      isDownvote: false
    }
  })

  return context.entities.Submission.update({
    where: { id: args.submissionId },
    data: {
      votes: { increment: 1 }
    }
  })
}

export const removeVote: VoteForSubmission<VoteInput, Submission> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to remove a vote')
  }

  const vote = await context.entities.Vote.findFirst({
    where: {
      user: { id: context.user.id },
      submission: { id: args.submissionId }
    }
  })

  if (!vote) {
    throw new HttpError(404, 'Vote not found')
  }

  // Delete the vote and decrement the submission's vote count
  await context.entities.Vote.delete({
    where: { id: vote.id }
  })

  return context.entities.Submission.update({
    where: { id: args.submissionId },
    data: {
      votes: { decrement: 1 }
    }
  })
}

export const getVotesBySubmissionId = async (args: { submissionId: string }, context: any): Promise<Vote[]> => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view votes')
  }

  return context.entities.Vote.findMany({
    where: { submission: { id: args.submissionId } },
    include: { user: true }
  })
}

export const getAllSubmissionGroups: GetAllSubmissionGroups<void, SubmissionGroup[]> = async (_, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view submission groups');
  }

  return context.entities.SubmissionGroup.findMany({
    orderBy: { createdAt: 'desc' },
    include: { submissions: true },
  });
};

export const createSubmissionGroup: CreateSubmissionGroup<{ title: string; description: string }, SubmissionGroup> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to create a submission group');
  }

  if (!args.title) {
    throw new HttpError(400, 'Title is required');
  }

  return context.entities.SubmissionGroup.create({
    data: {
      title: args.title,
      description: args.description,
      isCompleted: false,
      isJudged: false,
      createdAt: new Date(),
    },
  });
};

export const getSubmissionCountForGroup: GetSubmissionCountForGroup<{ groupId: string }, number> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view submission counts');
  }

  const group = await context.entities.SubmissionGroup.findUnique({
    where: { id: args.groupId },
    include: { submissions: true },
  });

  return group?.submissions.length || 0;
};

export const deleteSubmissionGroup: DeleteSubmissionGroup<{ groupId: string }, SubmissionGroup> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to delete a submission group');
  }

  const group = await context.entities.SubmissionGroup.findUnique({
    where: { id: args.groupId },
  });

  if (!group) {
    throw new HttpError(404, 'Submission group not found');
  }

  return context.entities.SubmissionGroup.delete({
    where: { id: args.groupId },
  });
};

export const updateSubmissionGroup: UpdateSubmissionGroup<{ groupId: string; data: Partial<SubmissionGroup> }, SubmissionGroup> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to update a submission group');
  }

  const group = await context.entities.SubmissionGroup.findUnique({
    where: { id: args.groupId },
  });

  if (!group) {
    throw new HttpError(404, 'Submission group not found');
  }

  return context.entities.SubmissionGroup.update({
    where: { id: args.groupId },
    data: args.data,
  });
};

export const getSubmissionGroupById = async (args: { groupId: any; }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view a submission group');
  }
  console.log(args)
  const group = await context.entities.SubmissionGroup.findUnique({
    where: { id: args.groupId },
    include: { submissions: true },
  });

  if (!group) {
    throw new HttpError(404, 'Submission group not found');
  }

  return group;
};

export const getSubmissionGroupByName: GetSubmissionGroupByName<{ name: string }, SubmissionGroup> = async (args, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view a submission group');
  }

  const group = await context.entities.SubmissionGroup.findUnique({
    where: { title: args.name },
    include: { submissions: true },
  });

  if (!group) {
    throw new HttpError(404, 'Submission group not found');
  }

  return group;
};