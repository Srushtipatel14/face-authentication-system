import './App.css';
import {BrowserRouter,Routes,Route} from "react-router-dom"
import FaceDescriptorCapture from './components/register';
import Login from './components/login';
import Home from './components/home';

function App() {
  return (
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<FaceDescriptorCapture/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/home' element={<Home/>}/>
    </Routes>
  </BrowserRouter>
  );
}

export default App;
