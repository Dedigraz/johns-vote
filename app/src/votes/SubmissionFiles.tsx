import React from 'react';
import { FiFile, FiImage, FiFileText, FiVideo, FiDownload } from 'react-icons/fi';
import { getDownloadFileSignedURL } from 'wasp/client/operations';

type FileReference = {
  name: string;
  type: string;
  size: number;
  key?: string;
};

interface SubmissionFilesProps {
  fileReferences?: FileReference[];
}

export default function SubmissionFiles({ fileReferences }: SubmissionFilesProps) {
  if (!fileReferences || fileReferences.length === 0) {
    return null;
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <FiImage className="text-blue-500" size={24} />;
    } else if (type.startsWith('text/')) {
      return <FiFileText className="text-green-500" size={24} />;
    } else if (type.startsWith('video/')) {
      return <FiVideo className="text-red-500" size={24} />;
    } else {
      return <FiFile className="text-gray-500" size={24} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + ' bytes';
    } else if (bytes < 1048576) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / 1048576).toFixed(1) + ' MB';
    }
  };

  const handleDownload = async (file: FileReference) => {
    try {
      if (!file.key) {
        console.error('File key is missing');
        return;
      }
      
      // Get a signed URL for downloading the file
      const downloadUrl = await getDownloadFileSignedURL({ key: file.key });
      
      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name; // Set the suggested filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again later.');
    }
  };

  return (
    <div className="mt-4">
      <h3 className="font-medium text-gray-700 mb-2">Files</h3>
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
        {fileReferences.map((file, index) => (
          <li key={index} className="flex items-center py-3 px-4 hover:bg-gray-50">
            <div className="mr-3">{getFileIcon(file.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
            <div className="ml-4">
              {file.key ? (
                <button 
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  onClick={() => handleDownload(file)}
                >
                  <FiDownload className="mr-1" />
                  Download
                </button>
              ) : (
                <span className="text-gray-400 text-sm flex items-center">
                  <FiDownload className="mr-1" />
                  Not available
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}