import axios from 'axios'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../dashboard/Header'



const Login = () => {

    const API_URL = import.meta.env.VITE_APP_URL;
 
    
    const [phoneNo,setPhoneNo]=useState('')
    const [password,setPassword]=useState('')
    const [finalError,setFinalError]=useState('')
    const [error,setError]=useState({})
    const navigate=useNavigate()

    const handleSubmit=async(e)=>{
        e.preventDefault()

        const newerrors={}
        if(!phoneNo) newerrors.phoneNo="Phone Number is Required"
        if(!password) newerrors.password="Password is Required"
        setError(newerrors)
        if(Object.keys(newerrors).length>0){
            return
        }
        try{
         //   const response=await axios.post('http://localhost:8080/api/loginuser', {phoneNo,password});
            const response = await axios.post(`${API_URL}/api/loginuser`, { phoneNo, password });
            const token=response.data.token
            console.log("JWT Token:", token);
            sessionStorage.setItem('authtoken', token)
              // navigate('/dashboard')
              navigate('/statusdashboard')
            reset()
        }catch(error){
            console.log(error)
            setFinalError('Invalid credentials')
        }
    }
    const reset=()=>{
        setPassword('')
        setPhoneNo('')
    }
  return (
    <>
    <Header/>
    <div className='container d-flex vh-100 justify-content-center align-items-center'>
        <form onSubmit={handleSubmit} className='p-5 shadow rounded bg-light'>
            <h3 className='text-center text-primary'>Login</h3>

            <div className='mb-3'>
                <label htmlFor="phoneNo" className='form-label'>PhoneNo</label>
                <input type="text" className='form-control' value={phoneNo} onChange={(e)=>setPhoneNo(e.target.value)} placeholder='Enter Phone No'/>
                {error.phoneNo && <div className='text-danger'><small>{error.phoneNo}</small></div>}
            </div>
           
            <div className='mb-3'>
                <label htmlFor="password" className='form-label'>Password</label>
                <input type="password" className='form-control' value={password} onChange={(e)=>setPassword(e.target.value)} placeholder='Enter Password' />
                {error.password && <div className='text-danger'><small>{error.password}</small></div>}
            </div>
            <div className='d-flex justify-content-between'>
            <button  className='btn-primary btn '>Submit</button>
            <Link to='/register' style={{textDecoration:'none'}} className='mt-1'>Register_Now?</Link>
            </div>
            <div className='text-danger mt-2'>{finalError}</div>
        </form>
    </div>
    </>
  )
}

export default Login