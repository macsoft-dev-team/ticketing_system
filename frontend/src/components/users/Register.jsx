import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Header from '../dashboard/Header'



const Register = () => {
    const API_URL = import.meta.env.VITE_APP_URL;

    const [name,setname]=useState('')
    const [phoneNo,setPhoneNo]=useState('')
    const [password,setPassword]=useState('')
    const [error,setError]=useState({})
    const role='admin'
    const Navigate=useNavigate()

    const handleSubmit= async(e)=>{
        e.preventDefault();
        const newerror={}
        if(!name) newerror.name="Name Required"
        if(!phoneNo) newerror.phoneNo="Phone Number  Required"
        if(!password) newerror.password="Password  Required"
        setError(newerror)
        if(Object.keys(newerror).length>0){
            return
        }
        try{
            // const response=await axios.post('http://localhost:8080/api/adduser',{name,phoneNo,password})
           const response=await axios.post(`${API_URL}/api/adduser`,{name,phoneNo,password})
            console.log(response.data)
            Navigate('/')
            reset()
        }catch(error){
            console.log("Error while Inserting",error)
        }
    }
    const reset=()=>{
        setname('')
        setPassword('')
        setPhoneNo('')
    }
  return (
    <>
    <Header/>
      <div className='container d-flex justify-content-center align-items-center vh-100 '>
        
    <form className='rounded shadow p-5 bg-light' onSubmit={handleSubmit}>
        <h2 className='text-center text-primary '>Register</h2>
            <div className='mb-3'>
                <label htmlFor="name" className='form-label'>Name</label>
                <input className='form-control' type="text"  value={name} onChange={(e)=>setname(e.target.value)} placeholder='Enter Full Name' />
                {error.name && <div className='text-danger'><small>{error.name}</small></div> }
            </div>
            <div className='mb-3'>
                <label htmlFor="phoneNo" className='form-label'>PhoneNo</label>
                <input className='form-control' type="text" value={phoneNo}  onChange={(e)=>setPhoneNo(e.target.value)} placeholder='Enter Phone No' />
                {error.phoneNo && <div className='text-danger'><small>{error.phoneNo}</small></div>}
            </div>
            <div className='mb-3'>
                <label htmlFor="password" className='form-label'>Password</label>
                <input className='form-control' type="password"  value={password} onChange={(e)=>setPassword(e.target.value)} placeholder='Enter Password' />
                {error.password && <div className='text-danger'><small>{error.password}</small></div>}
            </div>
            <button className='btn btn-primary'>Register</button>
        </form>
    </div>
    </>
  )
}

export default Register