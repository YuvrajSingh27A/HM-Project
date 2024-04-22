import React, { useState } from "react";
import { getAuth, signInWithPhoneNumber, ConfirmationResult, RecaptchaVerifier, sendEmailVerification } from "firebase/auth";
import { toast } from "react-toastify";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";
import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "@/firebase/firebase";

const AuthComponent = () => {
    const router = useRouter();
    const firebaseAuth = getAuth();

    // State for user inputs
    const [inputs, setInputs] = useState({ email: "", displayName: "", password: "", phoneNumber: "", code: "" });
    // State for tracking the chosen method of authentication
    const [authMethod, setAuthMethod] = useState<"email" | "phone" | null>(null);
    // State for confirmation result (used for phone verification)
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInputs((prev) => ({ ...prev, [name]: value }));
    };

    // Handle registering the user
    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Check which method the user is trying to register with
        if (authMethod === "email") {
            await handleEmailRegistration();
        } else if (authMethod === "phone") {
            await handlePhoneRegistration();
        }
    };

    // Handle email registration
    const handleEmailRegistration = async () => {
        if (!inputs.email || !inputs.password || !inputs.displayName) {
            toast.error("Please fill all fields for email registration", { position: "top-center" });
            return;
        }

        try {
            const [createUserWithEmailAndPassword] = useCreateUserWithEmailAndPassword(firebaseAuth);
            const newUserCredential = await createUserWithEmailAndPassword(inputs.email, inputs.password);
            const user = newUserCredential.user;

            // Send email veification
            await sendEmailVerification(user);
            toast.info("Email verification link sent! Please verify your email to complete registration.", { position: "top-center" });

            // Save user data to Firestore
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: inputs.displayName,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                likedProblems: [],
                dislikedProblems: [],
                solvedProblems: [],
                starredProblems: [],
            };
            await setDoc(doc(firestore, "users", user.uid), userData);

            // Redirect user to verification page
            router.push(`/verification?email=${inputs.email}`);
        } catch (error: any) {
            toast.error(error.message, { position: "top-center" });
        }
    };

    // Handle phone registration
    const handlePhoneRegistration = async () => {
        if (!inputs.phoneNumber) {
            toast.error("Please enter a phone number for phone registration", { position: "top-center" });
            return;
        }

        try {
            // Set up reCAPTCHA
            const appVerifier = new RecaptchaVerifier("recaptcha-container", {
                size: "normal",
                callback: (response:boolean) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber
                },
                "expired-callback": () => {
                    toast.error("reCAPTCHA expired. Please try again.", { position: "top-center" });
                },
            }, firebaseAuth);

            // Send SMS with verification code
            const result = await signInWithPhoneNumber(firebaseAuth, inputs.phoneNumber, appVerifier);
            setConfirmationResult(result);
            toast.success("SMS sent! Please enter the verification code.", { position: "top-center" });

        } catch (error: any) {
            toast.error(`Error sending SMS: ${error.message}`, { position: "top-center" });
        }
    };

    // Handle code confirmation for phone verification
    const handleConfirmCode = async () => {
        if (confirmationResult && inputs.code) {
            try {
                const result = await confirmationResult.confirm(inputs.code);
                const user = result.user;

                // User signed in successfully
                toast.success("Successfully signed in!", { position: "top-center" });

                // Redirect to dashboard or home page
                router.push("/dashboard");
            } catch (error: any) {
                toast.error(`Error confirming code: ${error.message}`, { position: "top-center" });
            }
        }
    };

    // Function to handle sending SMS
    const handleSendSms = async () => {
        if (!inputs.phoneNumber) {
            toast.error("Please enter a phone number to send an SMS", { position: "top-center" });
            return;
        }

        try {
            // Set up reCAPTCHA
            const appVerifier = new RecaptchaVerifier("recaptcha-container", {
                size: "normal",
                callback: () => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber
                },
                "expired-callback": () => {
                    toast.error("reCAPTCHA expired. Please try again.", { position: "top-center" });
                },
            }, firebaseAuth);

            // Send SMS with verification code
            const result = await signInWithPhoneNumber(firebaseAuth, inputs.phoneNumber, appVerifier);
            setConfirmationResult(result);
            toast.success("SMS sent! Please enter the verification code.", { position: "top-center" });

        } catch (error: any) {
            toast.error(`Error sending SMS: ${error.message}`, { position: "top-center" });
        }
    };

    return (
        <form onSubmit={handleRegister} className="space-y-6 px-6 pb-4">
            <h3 className="text-xl font-medium text-white">Register with Email or Phone</h3>

            {/* Authentication method buttons */}
            <div className="flex justify-between mb-4">
                <button
                    type="button"
                    onClick={() => setAuthMethod("email")}
                    className={`${
                        authMethod === "email" ? "bg-brand-orange" : "bg-gray-500"
                    } text-white py-2 px-4 rounded`}
                >
                    Register with Email
                </button>
                <button
                    type="button"
                    onClick={() => setAuthMethod("phone")}
                    className={`${
                        authMethod === "phone" ? "bg-brand-orange" : "bg-gray-500"
                    } text-white py-2 px-4 rounded`}
                >
                    Register with Phone
                </button>
            </div>

            {/* Email registration form */}
            {authMethod === "email" && (
                <>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium block mb-2 text-gray-300">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={inputs.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                            className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="displayName" className="text-sm font-medium block mb-2 text-gray-300">Display Name</label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={inputs.displayName}
                            onChange={handleInputChange}
                            placeholder="Enter your display name"
                            className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium block mb-2 text-gray-300">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={inputs.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                            className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
                        />
                    </div>
                </>
            )}

            {/* Phone registration form */}
            {authMethod === "phone" && (
                <>
                    <div>
                        <label htmlFor="phoneNumber" className="text-sm font-medium block mb-2 text-gray-300">Phone Number</label>
                        <input
                            type="text"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={inputs.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="Enter your phone number"
                            className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
                        />
                    </div>
                    <div id="recaptcha-container"></div>
                    <button
                        type="button"
                        onClick={handleSendSms}
                        className="mt-2 bg-brand-orange text-white py-2 px-4 rounded"
                    >
                        Send SMS
                    </button>
                    <div>
                        <label htmlFor="code" className="text-sm font-medium block mb-2 text-gray-300">Verification Code</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={inputs.code}
                            onChange={handleInputChange}
                            placeholder="Enter the verification code"
                            className="border-2 outline-none sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleConfirmCode}
                        className="mt-2 bg-brand-orange text-white py-2 px-4 rounded"
                    >
                        Confirm Code
                    </button>
                </>
            )}

            {/* Submit button */}
            <button type="submit" className="w-full bg-brand-orange text-white py-2 px-4 rounded">
                Register
            </button>
        </form>
    );
};

export default AuthComponent;
