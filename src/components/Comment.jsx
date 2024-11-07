import { useState } from 'react'

export default function Comment({ comment, onReply, onDelete }) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onReply(replyText)
      setReplyText('')
      setIsReplying(false)
    }
  }

  return (
    <div className="border-l-2 border-gray-200 pl-3 mb-3">
      <div className="flex justify-between items-start">
        <div className="text-sm text-gray-600">{comment.text}</div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Reply
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      
      {comment.replies?.map((reply, index) => (
        <div key={index} className="ml-4 mt-2 border-l-2 border-gray-100 pl-3">
          <div className="text-sm text-gray-600">{reply}</div>
        </div>
      ))}

      {isReplying && (
        <div className="mt-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="w-full p-2 text-sm border rounded-md mb-2"
            rows="2"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsReplying(false)}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReply}
              className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
