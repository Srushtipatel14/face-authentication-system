import React, { useEffect, useRef, useState } from 'react';
import axios from "axios";
import * as faceapi from 'face-api.js';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
    const videoRef = useRef(null);
    const [descriptor, setDescriptor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({});
    const [videoStream, setVideoStream] = useState(null);  // Track the video stream
    const [isFaceDetected, setIsFaceDetected] = useState(false);  // Track face detection status
    const [isNoFaceDetected, setIsNoFaceDetected] = useState(false); 
    const navigate = useNavigate();

    // Load Face API models
    useEffect(() => {
        const loadModels = async () => {
            setIsLoading(true);
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            setIsLoading(false);
            startVideo();  // Start video after models are loaded
        };

        loadModels();
    }, []);

    // Start video stream
    const startVideo = () => {
        setIsFaceDetected(false)
        setIsNoFaceDetected(false)
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setVideoStream(stream); // Store the stream reference
                }
            })
            .catch(err => {
                console.error("Error accessing webcam:", err);
                toast.error("Error accessing webcam. Please check your camera settings.", { position: "top-center" });
            });
    };

    // Stop the video stream
    const stopVideo = () => {
        if (videoStream) {
            const tracks = videoStream.getTracks();
            tracks.forEach(track => track.stop());  // Stop each track
            videoRef.current.srcObject = null;  // Clear the video source
            setVideoStream(null); // Clear the stream reference
        }
    };

    // Capture face descriptor
    const captureFaceDescriptor = async () => {
        if (videoRef.current) {
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                setDescriptor(detection.descriptor);
                setIsFaceDetected(true);  // Face detected successfully
                setFormData(prevData => ({
                    ...prevData,
                    descriptor: Array.from(detection.descriptor)  // Convert to array if not already
                }));
                stopVideo();  // Stop video after capturing face descriptor
            } else {
                toast.error("No face detected. Please try again.", {
                    position: "top-center",
                });
                setIsNoFaceDetected(true);  // Face not detected
                stopVideo();  // Stop the video stream if no face is detected
            }
        }
    };

    // Handle form submission
    const submitForm = async (e) => {
        try {
            e.preventDefault();
            // Make sure that the form data includes the faceDescriptor
            const response = await axios.post("http://localhost:8000/login", formData);
            console.log("Server Response:", response);

            if (response.status === 200) {
                navigate("/home");  // Redirect to home on successful login
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.message || "An unexpected error occurred!";
            toast.error(errorMessage, { position: "top-center" });
            setFormData({});  // Reset form data
            setIsLoading(false);  // Reload state
            setDescriptor(null);  // Clear the descriptor
            startVideo();  // Restart video stream
            setVideoStream(null);  // Reset video stream reference
            setIsFaceDetected(false);  // Reset face detection status
            console.log(errorMessage);
        }
    };

    return (
        <>
            <div style={{ width: "100%" }}>
                <h1 className='heading'>Login</h1>
                <form>
                    <div className='formCon'>
                        {isLoading ? (
                            <p>Loading models, please wait...</p>
                        ) : (
                            <>
                                <video ref={videoRef} autoPlay muted className='imgcap' />
                                <button
                                    type="button"
                                    className='imgCapbtn'
                                    onClick={captureFaceDescriptor}
                                    style={{ marginTop: '10px' }}
                                >
                                    Capture Face
                                </button>
                            </>
                        )}

                        <p>Not registered? <Link className='lnk' to="/">Register</Link></p>
                    </div>
                </form>

                <div className='btnPlace'>
                   {isFaceDetected &&(
                    <button type="button" className='btn' onClick={submitForm}>Submit</button>
                   )}

                    {/* Retry Button: Show only if no face detected */}
                    {isNoFaceDetected && !isLoading && (
                        <div className="retry-container">
                            <button className='btn' onClick={startVideo}>Retry</button>
                        </div>
                    )}
                </div>

            </div>

            <ToastContainer />
        </>
    );
};

export default Login;
