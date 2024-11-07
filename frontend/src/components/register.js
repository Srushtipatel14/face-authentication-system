import React, { useEffect, useRef, useState } from 'react';
import axios from "axios";
import * as faceapi from 'face-api.js';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FaceDescriptorCapture = () => {
    const videoRef = useRef(null);
    const [descriptor, setDescriptor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({});
    const [videoStream, setVideoStream] = useState(null); // Track the video stream
    const [isFaceDetected, setIsFaceDetected] = useState(false); // Track face detection status
    const [isNoFaceDetected, setIsNoFaceDetected] = useState(false);

    // Load Face API models
    useEffect(() => {
        const loadModels = async () => {
            setIsLoading(true);
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            setIsLoading(false);
            startVideo(); // Start the video after models are loaded
        };

        loadModels();
    }, []);

    // Start video stream
    const startVideo = () => {
        setIsFaceDetected(false);
        setIsNoFaceDetected(false);

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                // Stop the old stream if any before starting a new one
                if (videoStream) {
                    const tracks = videoStream.getTracks();
                    tracks.forEach(track => track.stop());
                }
                // Set the new stream and video reference
                setVideoStream(stream);
                videoRef.current.srcObject = stream;
            })
            .catch(err => {
                console.error("Error accessing webcam:", err);
                toast.error("Unable to access webcam.");
            });
    };

    const stopVideo = () => {
        if (videoStream) {
            const tracks = videoStream.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setVideoStream(null);
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
                // Add the descriptor to the formData
                setFormData(prevData => ({
                    ...prevData,
                    descriptor: Array.from(detection.descriptor) // Convert to array if not already
                }));
                setIsFaceDetected(true);
                // Stop the video stream after capturing the face descriptor
                stopVideo();
            } else {
                toast.error("No face detected. Please try again.", {
                    position: "top-center",
                });
                setIsNoFaceDetected(true); // Face not detected
                stopVideo(); // Stop the video stream
            }
        }
    };

    const handlechange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const submitForm = async (e) => {
        try {
            e.preventDefault();
            const response = await axios.post("http://localhost:8000/register", formData);
            console.log("Server Response:", response);
            toast.success("User Registered successfully",{
                position:"top-center"
            })
            setVideoStream(null)
            startVideo()
            setFormData({})
            setDescriptor(null)
            setIsFaceDetected(false);
            setIsNoFaceDetected(false);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div style={{ width: "100%" }}>
            <h1 className='heading'>Register</h1>
            <form>
                <div className='formCon'>
                    <label>UserName</label>
                    <input value={formData.user || ''} name='user' onChange={handlechange} type='text' />
                    <label>Password</label>
                    <input value={formData.pwd || ''} name='pwd' onChange={handlechange} type='text' />
                    {isLoading ? (
                        <p>Loading models, please wait...</p>
                    ) : (
                        <>
                            <video ref={videoRef} autoPlay muted className='imgcap' />
                            <button type="button" className='imgCapbtn' onClick={captureFaceDescriptor} style={{ marginTop: '10px' }}>
                                Capture Face Descriptor
                            </button>
                        </>
                    )}
                    <p>Already registered? <Link className='lnk' to="/login">Login</Link></p>
                </div>
            </form>

            <div className='btnPlace'>
                {isFaceDetected && (
                    <button type="button" className='btn' onClick={submitForm}>Submit</button>
                )}

                {/* Retry Button: Show only if no face detected */}
                {isNoFaceDetected && !isLoading && (
                    <div className="retry-container">
                        <button className='btn' onClick={startVideo}>Retry</button>
                    </div>
                )}
            </div>

            <ToastContainer />
        </div>
    );
};

export default FaceDescriptorCapture;
