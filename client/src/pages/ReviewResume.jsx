import React, { useState } from 'react'
import { FileText, Sparkles } from 'lucide-react'

const ReviewResume = () => {

  const [file, setFile] = useState(null)

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (!file) return

    console.log(file)
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-400'>

      {/* Left Box */}

      <form
        onSubmit={onSubmitHandler}
        className='w-full max-w-lg p-4 bg-white rounded-lg border'
      >

        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#00AD25]' />

          <h1 className='text-xl font-semibold'>
            Resume Review
          </h1>
        </div>

        <p className='mt-6 text-sm font-medium'>
          Upload Resume
        </p>

        <input
          type='file'
          accept='.pdf,.png,.jpg,.jpeg'
          onChange={(e) => setFile(e.target.files[0])}
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
          required
        />

        <p className='mt-2 text-xs text-gray-400'>
          Supports PDF, PNG, JPG formats
        </p>

        <button
          type='submit'
          className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00AD25] to-[#04A9E0] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'
        >
          <FileText className='w-5' />
          Review Resume
        </button>

      </form>


      {/* Right Box */}

      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]'>

        <div className='flex items-center gap-3'>
          <FileText className='w-5 h-5 text-[#00AD25]' />

          <h1 className='text-xl font-semibold'>
            Analysis Results
          </h1>
        </div>

        <div className='flex-1 flex flex-col justify-center items-center gap-5 text-gray-400'>

          <FileText className='w-9 h-9' />

          <p className='text-center'>
            Upload your resume and click "Review Resume" to get started
          </p>

        </div>

      </div>

    </div>
  )
}

export default ReviewResume