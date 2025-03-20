import React, { useEffect, useState } from "react";
import api from "./services/api";
import Header from "./components/header";
import Footer from "./components/Footer";

const App: React.FC = () => {
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    api
      .get("/hola")
      .then((response) => {
        setMensaje(response.data);
      })
      .catch((error) => {
        console.error("Error al obtener el mensaje:", error);
      });
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
