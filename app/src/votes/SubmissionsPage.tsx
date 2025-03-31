import React, { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { Link } from 'react-router-dom';
import { getAllSubmissionsByUser } from 'wasp/client/operations';
import { FiPlus, FiFile, FiCalendar, FiThumbsUp } from 'react-icons/fi';
import CreateSubmissionModal from './CreateSubmissionModal';

export default function SubmissionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: submissions, isLoading, error } = useQuery(getAllSubmissionsByUser);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Submissions</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiPlus className="mr-2" />
          Create New
        </button>
      </div>

      {submissions && submissions.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {submissions.map((submission) => (
              <li key={submission.id} className="hover:bg-gray-50">
                <Link 
                  to={`/submission/${submission.id}`}
                  className="block p-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-medium text-blue-600">{submission.title}</h2>
                      <p className="mt-1 text-gray-600 line-clamp-2">{submission.description}</p>
                      
                      <div className="flex mt-3 text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <FiCalendar className="mr-1" />
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <FiThumbsUp className="mr-1" />
                          {submission.votes} votes
                        </div>
                        {Array.isArray(submission.fileReferences) && submission.fileReferences.length > 0 && (
                          <div className="flex items-center">
                            <FiFile className="mr-1" />
                            {submission.fileReferences.length} files
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <h2 className="text-xl font-medium text-gray-700 mb-2">No submissions yet</h2>
          <p className="text-gray-500 mb-6">Create your first submission to get started.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md inline-flex items-center"
          >
            <FiPlus className="mr-2" />
            Create Submission
          </button>
        </div>
      )}

      {isModalOpen && (
        <CreateSubmissionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
