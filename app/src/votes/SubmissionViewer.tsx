import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { getSubmissionGroupById, voteForSubmission, createSubmission, createFile } from 'wasp/client/operations';
import { CgSpinner } from 'react-icons/cg';
import { TiDelete } from 'react-icons/ti';
import { FiUpload, FiPlus } from 'react-icons/fi';
import { cn } from '../client/cn';
import { useQuery, useAction } from 'wasp/client/operations';
import { Submission } from 'wasp/entities';
import { CreateSubmissionInput } from './operations';

export default function SubmissionViewer() {
  const { groupId } = useParams<'groupId'>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const {data: submissionGroup, isLoading, refetch} = useQuery(getSubmissionGroupById, {groupId: groupId ?? ''});
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state for new submission
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      if (groupId) {
        setSubmissions(submissionGroup.submissions);
      }
    }
    fetchSubmissions();
  }, [groupId, submissionGroup]);

  const handleVote = async (submissionId: any) => {
    useQuery(voteForSubmission, { submissionId });
    console.log(`Voted for submission with ID: ${submissionId}`);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % submissions.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + submissions.length) % submissions.length);
  };

  const handleFileChange = (e: { target: { files:FileList|null }; }) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setFiles(prev => [...prev, ...fileArray]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmitNewSubmission = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Create submission data with the current group ID
      const submissionData = {
        title,
        description,
        files,
      };
      
      // Upload files and get their references
      const fileReferences = await Promise.all(
        files.map(async (file) => {
          const fileReference = await createFile({
            name: file.name,
            fileType: file.type,
            size: file.size,
          });
          return fileReference;
        })
      );

      // Create submission with file references
      const submissionInput = {
        title,
        description,
        files: fileReferences,
        groupId,
      };
      let b = await createSubmission(submissionInput);
      

      setSubmissions([...submissions, b]);
      
      setSuccess(true);
      setTitle('');
      setDescription('');
      setFiles([]);
      setShowCreateForm(false);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create submission');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    isLoading ? (
      <div className='flex items-center justify-center h-screen'>
        <CgSpinner className='animate-spin h-10 w-10 text-blue-500' />
      </div>
    ) : (<div className='py-10 lg:mt-10'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-3xl font-bold text-center'>
          {submissionGroup ? submissionGroup.title : 'Submission Viewer'}
        </h1>
        
        {success && (
          <div className='bg-green-100 text-green-800 p-4 mt-4 mb-6 rounded-md text-center'>
            Submission created successfully!
          </div>
        )}
        
        {error && (
          <div className='bg-red-100 text-red-800 p-4 mt-4 mb-6 rounded-md text-center'>
            {error}
          </div>
        )}
        
        <div className='my-4'>
          {submissions.length > 0 ? (
            <div className='text-center'>
              <h2 className='text-xl font-bold'>{submissions[currentIndex].title}</h2>
              <p className='mt-2'>{submissions[currentIndex].description}</p>
              
              <div className='flex justify-center gap-4 mt-4'>
                <button onClick={handlePrevious} className='border p-2'>Previous</button>
                <button onClick={() => handleVote(submissions[currentIndex].id)} className='border p-2'>Vote</button>
                <button onClick={handleNext} className='border p-2'>Next</button>
              </div>
            </div>
          ) : (
            <p className='text-center'>No submissions available.</p>
          )}
        </div>
        
        <div className='mt-8 text-center'>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className='flex items-center justify-center gap-2 mx-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md'
          >
            <FiPlus /> {showCreateForm ? 'Cancel' : 'Create New Submission'}
          </button>
        </div>
        
        {showCreateForm && (
          <div className='mt-6 p-6 border rounded-lg'>
            <h2 className='text-xl font-bold mb-4'>Create New Submission</h2>
            
            <form onSubmit={handleSubmitNewSubmission} className='space-y-4'>
              <div>
                <label htmlFor='title' className='block text-sm font-medium mb-1'>
                  Title <span className='text-red-500'>*</span>
                </label>
                <input
                  id='title'
                  type='text'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter submission title'
                  required
                />
              </div>
              
              <div>
                <label htmlFor='description' className='block text-sm font-medium mb-1'>
                  Description
                </label>
                <textarea
                  id='description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter submission description'
                />
              </div>
              
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Files
                </label>
                <div 
                  className='border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:bg-gray-50'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUpload className='mx-auto h-12 w-12 text-gray-400' />
                  <p className='mt-2 text-sm text-gray-500'>
                    Click to upload files or drag and drop
                  </p>
                  <input
                    type='file'
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className='hidden'
                  />
                </div>
                
                {files.length > 0 && (
                  <div className='mt-4'>
                    <h4 className='text-sm font-medium'>Selected Files:</h4>
                    <ul className='mt-2 space-y-2'>
                      {files.map((file, index) => (
                        <li 
                          key={index} 
                          className='flex items-center justify-between bg-gray-100 p-2 rounded-md'
                        >
                          <span className='text-sm truncate'>{file.name}</span>
                          <button
                            type='button'
                            onClick={() => removeFile(index)}
                            className='text-red-500 hover:text-red-700'
                          >
                            <TiDelete size={20} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className='flex justify-end'>
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className={cn(
                    'px-4 py-2 rounded-md text-white font-medium flex items-center space-x-2',
                    isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  )}
                >
                  {isSubmitting && <CgSpinner className='animate-spin h-5 w-5' />}
                  <span>{isSubmitting ? 'Submitting...' : 'Create Submission'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>)
  );
}