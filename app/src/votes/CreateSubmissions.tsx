import { useState, useRef } from 'react';
import { CgSpinner } from 'react-icons/cg';
import { TiDelete } from 'react-icons/ti';
import { FiUpload } from 'react-icons/fi';
import { cn } from '../client/cn';

// Import file uploading utilities
import { uploadFileWithProgress, validateFile, FileUploadError } from '../file-upload/fileUploading';
// You'll need to create this operation in your Wasp app
import { createSubmission } from 'wasp/client/operations';

export default function CreateSubmissionPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      
      // Validate each file
      const invalidFiles = fileArray
        .map(file => ({ file, error: validateFile(file) }))
        .filter(({ error }) => error !== null);
      
      if (invalidFiles.length > 0) {
        setError(invalidFiles.map(({ error }) => (error as FileUploadError).message).join('\n'));
        return;
      }
      
      setFiles(prev => [...prev, ...fileArray]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    
    // Remove progress for this file if exists
    const updatedProgress = { ...uploadProgress };
    delete updatedProgress[index];
    setUploadProgress(updatedProgress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Upload files first and get their file references
      const fileReferences:{ name: string; type: string; size: number; key?: string }[] = [];
      
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Set initial progress for this file
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));
        
        // Upload file with progress tracking
        await uploadFileWithProgress({
          file,
          setUploadProgressPercent: (progress) => {
            setUploadProgress(prev => ({ ...prev, [i]: progress }));
          }
        });
        
        // Add file reference (we'll store the name and type of the file)
        fileReferences.push({
          name: file.name,
          type: file.type,
          size: file.size,
        });
      }

      // Create submission with file references instead of actual files
      const submissionData = {
        title,
        description,
        files: fileReferences
      };

      await createSubmission(submissionData);
      
      setSuccess(true);
      setTitle('');
      setDescription('');
      setFiles([]);
      setUploadProgress({});
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='py-10 lg:mt-10'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-3xl font-bold text-center mb-8'>Create Submission</h1>
        
        {success && (
          <div className='bg-green-100 text-green-800 p-4 mb-6 rounded-md text-center'>
            Submission created successfully!
          </div>
        )}
        
        {error && (
          <div className='bg-red-100 text-red-800 p-4 mb-6 rounded-md text-center'>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className='space-y-6'>
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
                      <div className='flex-1'>
                        <span className='text-sm truncate mr-2'>{file.name}</span>
                        {uploadProgress[index] > 0 && uploadProgress[index] < 100 && (
                          <div className='w-full h-1 bg-gray-200 rounded-full mt-1'>
                            <div 
                              className='h-full bg-blue-500 rounded-full' 
                              style={{ width: `${uploadProgress[index]}%` }}
                            ></div>
                          </div>
                        )}
                        {uploadProgress[index] === 100 && (
                          <span className='text-xs text-green-600'>Uploaded</span>
                        )}
                      </div>
                      <button
                        type='button'
                        onClick={() => removeFile(index)}
                        className='text-red-500 hover:text-red-700'
                        disabled={isSubmitting}
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
    </div>
  );
}
