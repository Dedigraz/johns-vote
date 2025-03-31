import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getSubmissionById } from 'wasp/client/operations';
import SubmissionFiles from './SubmissionFiles';
import { FiArrowLeft, FiCalendar, FiUser, FiThumbsUp } from 'react-icons/fi';

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: submission, isLoading, error } = useQuery(getSubmissionById, { id: id || '' });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="text-gray-600">{error.message}</p>
        <Link to="/submissions" className="mt-4 text-blue-500 hover:underline flex items-center">
          <FiArrowLeft className="mr-2" /> Back to Submissions
        </Link>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Submission Not Found</h1>
        <p className="text-gray-600">The submission you are looking for does not exist.</p>
        <Link to="/submissions" className="mt-4 text-blue-500 hover:underline flex items-center">
          <FiArrowLeft className="mr-2" /> Back to Submissions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link to="/submissions" className="text-blue-500 hover:underline flex items-center mb-6">
        <FiArrowLeft className="mr-2" /> Back to Submissions
      </Link>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">{submission.title}</h1>
        
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
          <div className="flex items-center">
            <FiUser className="mr-2" />
            <span>{submission.user?.username || 'Anonymous'}</span>
          </div>
          <div className="flex items-center">
            <FiCalendar className="mr-2" />
            <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <FiThumbsUp className="mr-2" />
            <span>{submission.votes} votes</span>
          </div>
        </div>
        
        <div className="prose max-w-none mb-8">
          <p>{submission.description}</p>
        </div>
        
        {/* Display the uploaded files using our SubmissionFiles component */}
        {submission.fileReferences && (
          <SubmissionFiles fileReferences={submission.fileReferences} />
        )}
      </div>
    </div>
  );
}