import React, { useState, useRef } from 'react';
import { createSubmission } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiX } from 'react-icons/fi';
import { TiDelete } from 'react-icons/ti';
import { CgSpinner } from 'react-icons/cg';
import { uploadFileWithProgress, validateFile, FileUploadError } from '../file-upload/fileUploading';

interface CreateSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateSubmissionModal({ isOpen, onClose }: CreateSubmissionModalProps) {

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

  if (!isOpen) return null;

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
      e.target.value = ''; // Reset the input to allow reselection of the same file
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
      const fileReferences: { name: string; type: string; size: number; key?: string }[] = [];
      
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Set initial progress for this file
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));
        
        // Upload file with progress tracking
        const response = await uploadFileWithProgress({
          file,
          setUploadProgressPercent: (progress) => {
            setUploadProgress(prev => ({ ...prev, [i]: progress }));
          }
        });
        
        // Add file reference with key for downloading later
        fileReferences.push({
          name: file.name,
          type: file.type,
          size: file.size,
          key: response?.config?.url?.split('?')[0].split('/').pop() || undefined 
        });
      }

      // Create submission with file references
      await createSubmission({
        title,
        description,
        files: fileReferences
      });
      
      onClose();
      navigate('/vote'); // Refresh the submissions list
      
    } catch (err: any) {
      setError(err.message || 'Failed to create submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              type="button"
              className="text-gray-400 hover:text-gray-500"
              disabled={isSubmitting}
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Create New Submission</h3>
            
            {error && (
              <div className="bg-red-100 text-red-800 p-3 mb-4 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter submission title"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter submission description"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Files
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:bg-gray-50"
                  onClick={() => !isSubmitting && fileInputRef.current?.click()}
                >
                  <FiUpload className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-1 text-sm text-gray-500">
                    Click to upload files or drag and drop
                  </p>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>
                
                {files.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-gray-700">Selected Files:</h4>
                    <ul className="mt-1 space-y-1">
                      {files.map((file, index) => (
                        <li 
                          key={index} 
                          className="flex items-center justify-between bg-gray-50 text-xs p-2 rounded-md"
                        >
                          <div className="flex-1 truncate mr-2">
                            <span>{file.name}</span>
                            {uploadProgress[index] > 0 && uploadProgress[index] < 100 && (
                              <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                                <div 
                                  className="h-full bg-blue-500 rounded-full" 
                                  style={{ width: `${uploadProgress[index]}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                          {!isSubmitting && (
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TiDelete size={20} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="mr-3 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded-md"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className={`bg-blue-600 ${
                    isSubmitting || !title.trim() ? 'opacity-70' : 'hover:bg-blue-700'
                  } text-white font-medium py-2 px-4 rounded-md flex items-center`}
                >
                  {isSubmitting && <CgSpinner className="animate-spin mr-2" />}
                  {isSubmitting ? 'Creating...' : 'Create Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}