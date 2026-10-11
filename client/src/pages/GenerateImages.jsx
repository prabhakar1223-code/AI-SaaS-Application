import { Hash, Sparkles, Image } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const GenerateImages = () => {
  const imageStyle = [
    'Realistic', 'Ghibli Style', 'Anime', '3D Render',
    'Digital Art', 'Oil Painting', 'Watercolor', 'Pixel Art',
    'Cinematic', 'Fantasy Art', 'Cyberpunk', 'Minimalist',
    'Comic Book', 'Sketch', 'Photorealistic'
  ]

  const [selected, setSelected] = useState(imageStyle[0])
  const [input, setInput] = useState('')
  const [publish, setPublish] = useState(false)
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState('')

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setImage('')

      const token = await getToken()
      const prompt = `${input.trim()}, ${selected} style`

      const { data } = await axios.post(
        '/api/ai/generate-image',
        { prompt, publish },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {
        setImage(data.content)
        toast.success('Image generated successfully!')
      } else {
        toast.error(data.message || 'Failed to generate image')
      }
    } catch (error) {
      console.error('Image generation error:', error)
      toast.error(error.response?.data?.message || 'Failed to generate image')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-400'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#00AD25]' />
          <h1 className='text-xl font-semibold'>AI Image Generator</h1>
        </div>

        <p className='mt-6 text-sm font-medium'>Describe Your Image</p>
        <textarea
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          placeholder='Describe what you want to see in the image'
          required
          onChange={(e) => setInput(e.target.value)}
          value={input}
          rows={4}
        />

        <p className='mt-4 text-sm font-medium'>Style</p>
        <div className='mt-3 flex gap-3 flex-wrap'>
          {imageStyle.map((item) => (
            <span
              key={item}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${
                selected === item
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : 'text-gray-500 border-gray-300'
              }`}
              onClick={() => setSelected(item)}
            >
              {item}
            </span>
          ))}
        </div>

        <div className='my-6 flex items-center gap-2'>
          <label className='relative cursor-pointer'>
            <input
              type='checkbox'
              onChange={(e) => setPublish(e.target.checked)}
              checked={publish}
              className='sr-only peer'
            />
            <div className='w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition' />
            <span className='absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4' />
          </label>
          <p>Make this image public</p>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00AD25] to-[#04FF50] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-60'
        >
          {loading ? 'Generating Image...' : <><Image className='w-5' /> Generate Image</>}
        </button>
      </form>

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>
        <div className='flex items-center gap-3'>
          <Hash className='w-5 h-5 text-[#00AD25]' />
          <h1 className='text-xl font-semibold'>Generated Images</h1>
        </div>

        {!image ? (
          <div className='flex-1 flex justify-center items-center gap-5 text-gray-400'>
            {loading ? (
              <p>Generating your image...</p>
            ) : (
              <>
                <Image className='w-9 h-9' />
                <p>Enter a description and click "Generate Image" to get started</p>
              </>
            )}
          </div>
        ) : (
          <div className='mt-4'>
            <img src={image} alt={input} className='w-full rounded-lg object-contain' />
            <a href={image} target='_blank' rel='noreferrer' className='inline-block mt-3 text-sm text-green-600 underline'>
              Open generated image
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default GenerateImages