import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { Landing } from './components/Landing'
import { Room } from './components/Room'



function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room" element={<Room />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
