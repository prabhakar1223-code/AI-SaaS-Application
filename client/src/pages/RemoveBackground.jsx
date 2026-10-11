import { Eraser, Hash, Scissors, Sparkles } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const RemoveBackground = () => {
  const [file, setFile] = useState(null)
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (!file) {
      toast.error('Please select an image')
      return
    }

    try {
      setLoading(true)
      setImage('')

      const token = await getToken()
      const formData = new FormData()
      formData.append('image', file)

      const { data } = await axios.post(
        '/api/ai/remove-image-background',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {
        setImage(data.content)
        toast.success('Background removed successfully!')
      } else {
        toast.error(data.message || 'Failed to remove background')
      }
    } catch (error) {
      console.error('Background removal error:', error)
      toast.error(error.response?.data?.message || 'Failed to remove background')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-400'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'>Background Removal</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Upload image</p>
        <input
          type='file'
          accept='image/*'
          onChange={(e) => setFile(e.target.files[0] || null)}
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          required
        />
        <p className='text-xs text-gray-500 font-light mt-1'>Supports JPG, PNG, and other image formats</p>

        <button
          type='submit'
          disabled={loading}
          className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#F6AB41] to-[#FF4938] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-60'
        >
          <Scissors className='w-5' />
          {loading ? 'Removing Background...' : 'Remove Background'}
        </button>
      </form>

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>
        <div className='flex items-center gap-3'>
          <Hash className='w-5 h-5 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'>Processed Image</h1>
        </div>

        {!image ? (
          <div className='flex-1 flex justify-center items-center gap-5 text-gray-400'>
            {loading ? <p>Removing background...</p> : <><Eraser className='w-9 h-9' /><p>Upload an image and click "Remove Background" to get started</p></>}
          </div>
        ) : (
          <div className='mt-4'>
            <img src={image} alt='Background removed' className='w-full rounded-lg object-contain' />
            <a href={image} target='_blank' rel='noreferrer' className='inline-block mt-3 text-sm text-purple-600 underline'>Open processed image</a>
          </div>
        )}
      </div>
    </div>
  )
}

export default RemoveBackground