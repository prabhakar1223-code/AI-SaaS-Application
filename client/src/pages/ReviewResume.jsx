import { FileText, Sparkles } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import Markdown from 'react-markdown'
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const ReviewResume = () => {
  const [file, setFile] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (!file) {
      toast.error('Please upload your resume')
      return
    }

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF resume')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume file size must be 5MB or less')
      return
    }

    try {
      setLoading(true)
      setContent('')

      const token = await getToken()
      const formData = new FormData()
      formData.append('resume', file)

      const { data } = await axios.post(
        '/api/ai/resume-review',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {
        setContent(data.content)
        toast.success('Resume reviewed successfully!')
      } else {
        toast.error(data.message || 'Failed to review resume')
      }
    } catch (error) {
      console.error('Resume review error:', error)
      toast.error(error.response?.data?.message || 'Failed to review resume')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-400'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#00AD25]' />
          <h1 className='text-xl font-semibold'>Resume Review</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Upload Resume</p>
        <input
          type='file'
          accept='.pdf,application/pdf'
          onChange={(e) => setFile(e.target.files[0] || null)}
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          required
        />

        <p className='mt-2 text-xs text-gray-400'>Supports PDF files up to 5MB.</p>

        <button
          type='submit'
          disabled={loading}
          className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00AD25] to-[#04A9E0] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-60'
        >
          <FileText className='w-5' />
          {loading ? 'Reviewing Resume...' : 'Review Resume'}
        </button>
      </form>

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]'>
        <div className='flex items-center gap-3'>
          <FileText className='w-5 h-5 text-[#00AD25]' />
          <h1 className='text-xl font-semibold'>Analysis Results</h1>
        </div>

        {!content ? (
          <div className='flex-1 flex flex-col justify-center items-center gap-5 text-gray-400'>
            {loading ? (
              <p className='text-center'>Analyzing your resume...</p>
            ) : (
              <>
                <FileText className='w-9 h-9' />
                <p className='text-center'>Upload your resume and click "Review Resume" to get started</p>
              </>
            )}
          </div>
        ) : (
          <div className='mt-4 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap leading-6'>
           <div className='reset-tw'>
                         <Markdown>
                         {content}
                         </Markdown></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewResume