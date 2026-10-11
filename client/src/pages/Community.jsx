
import { useUser, useAuth } from '@clerk/clerk-react'
import React, { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const Community = () => {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()

  const fetchCreations = async () => {
    try {
      setLoading(true)
      setError('')

      const token = await getToken()

      const { data } = await axios.get(
        '/api/user/get-publish-creations',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {
        setCreations(
          (data.creations || []).map((creation) => ({
            ...creation,
            likes: Array.isArray(creation.likes) ? creation.likes : []
          }))
        )
      } else {
        setError(data.message || 'Failed to fetch published creations.')
      }
    } catch (error) {
      console.error('Fetch creations error:', error)
      setError(
        error.response?.data?.message ||
        'Failed to fetch published creations.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (creationId) => {
    if (!user) {
      toast.error('Please sign in to like a creation.')
      return
    }

    const creation = creations.find(
      (item) => item.id === creationId
    )

    if (!creation) return

    const alreadyLiked = creation.likes.includes(user.id)

    // Update the UI immediately
    setCreations((previous) =>
      previous.map((item) => {
        if (item.id !== creationId) return item

        return {
          ...item,
          likes: alreadyLiked
            ? item.likes.filter((id) => id !== user.id)
            : [...item.likes, user.id]
        }
      })
    )

    try {
      const token = await getToken()

      const { data } = await axios.post(
        '/api/user/toggle-like-creations',
        { creationId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!data.success) {
        throw new Error(data.message || 'Failed to update like.')
      }

      // Use the server result if it returns the updated likes array
      if (Array.isArray(data.likes)) {
        setCreations((previous) =>
          previous.map((item) =>
            item.id === creationId
              ? { ...item, likes: data.likes }
              : item
          )
        )
      }
    } catch (error) {
      // Restore the original UI if the request fails
      setCreations((previous) =>
        previous.map((item) => {
          if (item.id !== creationId) return item

          return {
            ...item,
            likes: alreadyLiked
              ? [...item.likes, user.id]
              : item.likes.filter((id) => id !== user.id)
          }
        })
      )

      console.error('Like error:', error)
      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Failed to update like.'
      )
    }
  }

  useEffect(() => {
    if (!isLoaded) return

    if (user) {
      fetchCreations()
    } else {
      setCreations([])
      setLoading(false)
    }
  }, [user, isLoaded])

  return (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>

      <h1 className='text-xl font-semibold'>
        Community
      </h1>

      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll'>

        {loading ? (
          <p className='p-4 text-gray-500'>
            Loading published creations...
          </p>
        ) : error ? (
          <p className='p-4 text-red-500'>
            {error}
          </p>
        ) : creations.length === 0 ? (
          <p className='p-4 text-gray-500'>
            No published creations found.
          </p>
        ) : (
          creations.map((creation, index) => (

            <div
              key={creation.id || index}
              className='relative group inline-block pl-3 pt-3 w-full sm:max-w-1/2 lg:max-w-1/3'
            >

              <img
                src={creation.content}
                alt={creation.prompt || 'Community creation'}
                className='w-full h-full object-cover rounded-lg'
              />

              <div className='absolute bottom-0 top-0 right-0 left-3 flex gap-2 items-end justify-end group-hover:justify-between p-3 group-hover:bg-gradient-to-b from-transparent to-black/80 text-white rounded-lg'>

                <p className='text-sm hidden group-hover:block'>
                  {creation.prompt}
                </p>

                <button
                  type='button'
                  onClick={() => handleLike(creation.id)}
                  aria-label={
                    creation.likes.includes(user?.id)
                      ? 'Unlike creation'
                      : 'Like creation'
                  }
                  className='flex gap-1 items-center'
                >
                  <p>{creation.likes.length}</p>

                  <Heart
                    className={`min-w-5 h-5 transition-transform hover:scale-110 ${
                      creation.likes.includes(user?.id)
                        ? 'fill-red-500 text-red-600'
                        : 'text-white'
                    }`}
                  />
                </button>

              </div>

            </div>

          ))
        )}

      </div>

    </div>
  )
}

export default Community
