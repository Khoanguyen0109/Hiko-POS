import { useEffect, useState } from "react";
import restaurant from "../assets/images/restaurant-img.jpg"
import logo from "../assets/images/logo.png"
import Register from "../components/auth/Register";
import Login from "../components/auth/Login";

const Auth = () => {

  // useEffect(() => {
  //   document.title = "POS | Auth"
  // }, [])

  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full">
      {/* Left Section - Hidden on mobile, visible on large screens */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-cover">
        {/* BG Image */}
        <img className="w-full h-full object-cover" src={restaurant} alt="Restaurant Image" />

        {/* Black Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-80"></div>

        {/* Quote at bottom */}
        <blockquote className="absolute bottom-10 px-8 mb-10 text-xl xl:text-2xl italic text-brand">
          &quot;Start it as small, but always able to articulate the big story.&quot;
          <br />
          <span className="block mt-4 text-brand">- Founder of Hiko</span>
        </blockquote>
      </div>

      {/* Right Section - Full width on mobile, half width on large screens */}
      <div className="w-full lg:w-1/2 min-h-screen bg-[#1a1a1a] p-6 sm:p-10">
        <div className="flex flex-col items-center gap-2">
          <img src={logo} alt="Hiko Logo" className="h-14 w-14 border-2 rounded-full p-1" />
          <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">Hiko</h1>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl text-center mt-6 sm:mt-10 font-semibold text-brand mb-6 sm:mb-10">
          {isRegister ? "Employee Registration" : "Hiko login"}
        </h2>

        {/* Components */}  
        {isRegister ? <Register setIsRegister={setIsRegister} /> : <Login />}


        <div className="flex justify-center mt-6">
          <p className="text-sm text-[#ababab]">
            {isRegister ? "Already have an account?" : "Don 27t have an account?"}
            <a onClick={() => setIsRegister(!isRegister)} className="text-brand font-semibold hover:underline" href="#">
              {isRegister ? "Sign in" : "Sign up"}
            </a>
          </p>
        </div>


      </div>
    </div>
  );
};

export default Auth;
