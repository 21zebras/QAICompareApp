import { useState, forwardRef } from 'react'
import Comment from './Comment'

const Pin = forwardRef(({ 
  x, 
  y, 
  comments, 
  files, 
  completed,
  onDelete, 
  onUpdate, 
  onToggleComplete,
  isSelected, 
  onClick,
  pinNumber
}, ref) => {
  const [isHovered, setIsHovered] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [attachedFiles, setAttachedFiles] = useState(files || [])

  const handleFileChange = (e) => {
    const newFiles = [...attachedFiles]
    for (let file of e.target.files) {
      newFiles.push(file)
    }
    setAttachedFiles(newFiles)
    onUpdate({ comments, files: newFiles })
  }

  const handleRemoveFile = (index) => {
    const newFiles = attachedFiles.filter((_, i) => i !== index)
    setAttachedFiles(newFiles)
    onUpdate({ comments, files: newFiles })
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      const updatedComments = [...comments, { text: newComment.trim(), replies: [] }]
      onUpdate({ comments: updatedComments, files: attachedFiles })
      setNewComment('')
    }
  }

  const handleReply = (commentIndex, replyText) => {
    const updatedComments = comments.map((comment, index) => {
      if (index === commentIndex) {
        return {
          ...comment,
          replies: [...(comment.replies || []), replyText]
        }
      }
      return comment
    })
    onUpdate({ comments: updatedComments, files: attachedFiles })
  }

  const handleDeleteComment = (commentIndex) => {
    const updatedComments = comments.filter((_, index) => index !== commentIndex)
    onUpdate({ comments: updatedComments, files: attachedFiles })
  }

  const handleBlur = () => {
    if (comments.length === 0 && !newComment.trim()) {
      onDelete()
    }
  }

  return (
    <>
      <div
        ref={ref}
        className={`absolute w-6 h-6 -translate-x-3 -translate-y-3 cursor-pointer group ${
          isSelected ? 'z-30' : 'z-20'
        }`}
        style={{ left: x, top: y }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        onBlur={handleBlur}
        tabIndex={0} // Make the div focusable to detect blur
      >
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          completed 
            ? 'bg-green-500 border-green-600' 
            : isSelected 
              ? 'bg-blue-500 border-blue-600' 
              : 'bg-red-500 border-red-600'
        } ${isHovered ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
          <span className="text-white text-xs">{pinNumber}</span>
        </div>
      </div>

      {isSelected && (
        <div className="absolute z-40 bg-white rounded-lg shadow-lg p-4 mt-2 w-96"
             style={{ left: x + 24, top: y }}>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onToggleComplete}
              className={`px-3 py-1 text-sm text-white rounded ${
                completed 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {completed ? 'Reopen Thread' : 'Mark Complete'}
            </button>
            <button
              onClick={onDelete}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 border rounded-md mb-2"
              rows="2"
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className={`px-3 py-1 text-sm text-white rounded ${
                  newComment.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
                }`}
              >
                Comment
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-60 overflow-y-auto">
            {comments.map((comment, index) => (
              <Comment
                key={index}
                comment={comment}
                onReply={(replyText) => handleReply(index, replyText)}
                onDelete={() => handleDeleteComment(index)}
              />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 mb-2
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {attachedFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Attached Files:</p>
                <ul className="text-sm">
                  {attachedFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center py-1">
                      <span className="truncate">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
})

export default Pin
