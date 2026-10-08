import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import AITools from '../components/AITools'
import Testimonials from '../components/Testimonials' 
import Plan from '../components/Plan'
import Footer from '../components/Footer'
const Home = () => {
  return (
   <>
    <Navbar/>
    <Hero/>
    <AITools/>
    <Testimonials/>
    <Plan/>
    <Footer/>
   </>
  )
}

export default Home
