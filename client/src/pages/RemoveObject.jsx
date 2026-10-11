import { Hash, Scissors, Sparkles } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const RemoveObject = () => {
  const [input, setInput] = useState('')
  const [file, setFile] = useState(null)
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (!file || !input.trim()) {
      toast.error('Please select an image and describe the object')
      return
    }

    try {
      setLoading(true)
      setImage('')

      const token = await getToken()
      const formData = new FormData()
      formData.append('image', file)
      formData.append('object', input.trim())

      const { data } = await axios.post(
        '/api/ai/remove-image-object',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {
        setImage(data.content)
        toast.success('Object removed successfully!')
      } else {
        toast.error(data.message || 'Failed to remove object')
      }
    } catch (error) {
      console.error('Object removal error:', error)
      toast.error(error.response?.data?.message || 'Failed to remove object')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-400'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#F97316]' />
          <h1 className='text-xl font-semibold'>AI Object Removal</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Upload image</p>
        <input
          type='file'
          accept='image/*'
          onChange={(e) => setFile(e.target.files[0] || null)}
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          required
        />

        <p className='mt-6 text-sm font-medium'>Describe object to remove</p>
        <textarea
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          placeholder='e.g. car in background, tree from the image'
          required
          onChange={(e) => setInput(e.target.value)}
          value={input}
          rows={3}
        />

        <p className='text-xs text-gray-500 mt-2'>Be specific about what you want to remove from the image.</p>

        <button
          type='submit'
          disabled={loading}
          className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-60'
        >
          <Scissors className='w-5' />
          {loading ? 'Removing Object...' : 'Remove Object'}
        </button>
      </form>

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>
        <div className='flex items-center gap-3'>
          <Hash className='w-5 h-5 text-[#F97316]' />
          <h1 className='text-xl font-semibold'>Processed Image</h1>
        </div>

        {!image ? (
          <div className='flex-1 flex justify-center items-center gap-5 text-gray-400'>
            {loading ? <p>Removing object...</p> : <><Scissors className='w-9 h-9' /><p>Upload an image and click "Remove Object" to get started</p></>}
          </div>
        ) : (
          <div className='mt-4'>
            <img src={image} alt='Object removed' className='w-full rounded-lg object-contain' />
            <a href={image} target='_blank' rel='noreferrer' className='inline-block mt-3 text-sm text-orange-600 underline'>Open processed image</a>
          </div>
        )}
      </div>
    </div>
  )
}

export default RemoveObject