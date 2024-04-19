import React, { useState } from 'react';
import { BsFillShieldLockFill } from 'react-icons/bs';
import OtpInput from "otp-input-react";

const App = () => {
    const [otp, setOtp] = useState('');

    const handleOtpChange = (newOtp) => {
        setOtp(newOtp);
    };

    return (
        <section className="bg-emerald-500 flex items-center justify-center h-screen">
            <div>
                <div className="w-80 flex flex-col gap-4 rounded-lg p-4">
                    <h1 className="text-center leading-normal text-white font-medium text-3xl mb-6">
                        Welcome to<br />Code A Program
                    </h1>
                    <div className="bg-white text-emerald-500 w-fit mx-auto p-4 rounded-full">
                        <BsFillShieldLockFill className="text-white text-2xl" />
                    </div>
                    <label htmlFor="otp-input" className="font-bold text-2xl text-white text-center mb-4">
                        Enter your OTP
                    </label>
                    <OtpInput
                        OTPLength={6}
                        otpType="number"
                        disabled={false}
                        autoFocus={false}
                        value={otp}
                        onChange={handleOtpChange}
                    />
                </div>
            </div>
        </section>
    );
};

export default App;
