import axios from "axios"; import { auth } from "../firebase";


const axiosInstance = axios.create({ 
    baseURL: process.env.REACT_APP_BACKEND_URL, 
});

axiosInstance.interceptors.request.use( 
    async (config) => { 
        const currentUser = auth.currentUser;
        if (currentUser) {
            const token = await currentUser.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    }, (error) => { 
        return Promise.reject(error); 
    } 
);


export default axiosInstance;      