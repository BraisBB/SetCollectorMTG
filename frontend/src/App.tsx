import React, { useEffect, useState } from "react";
import { getHello } from './services/api';
import Header from "./components/header";
import Footer from "./components/Footer";

const App: React.FC = () => {
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const fetchData = async () => {
        try {
            const data = await getHello();
            setMensaje(data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    fetchData();
}, []);

  return (
    <div>
      <Header />
      <h1>Frontend con React</h1>
      <p>Respuesta del backend: {mensaje}</p>
      <Footer />
    </div>
  );
};

export default App;
