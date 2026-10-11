
import React, { useEffect, useState } from 'react'
import { Gem, Sparkles } from 'lucide-react'
import { Protect, useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import CreationItem from '../components/CreationItem'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const Dashboard = () => {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()

  const getDashboardData = async () => {
    try {
      setLoading(true)

      const token = await getToken()

      const { data } = await axios.get('/api/user/get-user-creations', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      console.log('Dashboard creations:', data)

      if (data.success) {
        setCreations(data.creations || [])
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getDashboardData()
  }, [])

  return (
    <div className='h-full overflow-y-scroll p-6'>

      <div className='flex justify-start gap-4 flex-wrap'>

        {/* Total creation card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>

          <div className='text-slate-600'>
            <p className='text-sm'>Total Creations</p>
            <h2 className='text-2xl font-semibold'>
              {creations.length}
            </h2>
          </div>

          <div className='p-3 bg-gradient-to-r from-[#3c81f6] to-[#9234EA] rounded-lg'>
            <Sparkles className='w-5 h-5 text-white' />
          </div>

        </div>

        {/* Active plan card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>

          <div className='text-slate-600'>
            <p className='text-sm'>Active Plan</p>
            <h2 className='text-xl font-semibold'>
              <Protect plan='premium' fallback='Free'>
                Premium
              </Protect>
            </h2>
          </div>

          <div className='p-3 bg-gradient-to-r from-[#FF61C5] to-[#9E53EE] rounded-lg'>
            <Gem className='w-5 h-5 text-white' />
          </div>

        </div>

      </div>

      <div className='space-y-3'>
        <p className='mt-6 mb-4'>Recent Creations</p>

        {loading ? (
          <p className='text-gray-500'>Loading your creations...</p>
        ) : creations.length > 0 ? (
          creations.map((item) => (
            <CreationItem key={item.id} item={item} />
          ))
        ) : (
          <p className='text-gray-500'>No creations found.</p>
        )}
      </div>

    </div>
  )
}

export default Dashboard
