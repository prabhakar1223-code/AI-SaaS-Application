import { Hash, Scissors, Sparkles } from 'lucide-react'
import React from 'react'
import { useState } from 'react'

const RemoveObject = () => {

  const [input, setInput] = useState('')

  const onSubmitHandler = async (e) => {
    e.preventDefault()
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-400'>

      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border'>

        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#F97316]' />
          <h1 className='text-xl font-semibold'>AI Object Removal</h1>
        </div>

        <input
          type="file"
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          placeholder='upload image,file,pdf'
          required
        />

        <p className='mt-6 text-sm font-medium'>
          Describe object to remove
        </p>

        <textarea
          type="text"
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          placeholder='eg..car in background,tree from the image'
          required
          onChange={(e) => setInput(e.target.value)}
          value={input}
        />

        <p>be specific about what you want to remove from the image</p>

        <br />

        <button className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'>
          <Hash className='w-5' />
          Remove Object
        </button>

      </form>

      {/* right box */}

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>

        <div className='flex items-center gap-3'>
          <Hash className='w-5 h-5 text-[#F97316]' />
          <h1 className='text-xl font-semibold'>Processed Image</h1>
        </div>

        <div className='flex-1 flex justify-center items-center gap-5 text-gray-400'>

          <Scissors className='w-9 h-9' />

          <p>
            upload an image or file and click "Remove Object" to get started
          </p>

        </div>

      </div>

    </div>
  )
}

export default RemoveObject