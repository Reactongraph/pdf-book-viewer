import React, { useState } from "react";
import PDFBookViewer from "./PDFBookViewer.js";
const App = () => {
  const [pdfUrl, setPdfUrl] = useState("");
  const handleFile = (e) => {
    setPdfUrl(URL.createObjectURL(e.target.files[0]));
  };
  return (
    <div>
     <div className="pdf-upload-col">
     <p>Select PDF File</p>
     <input type="file" accept="application/pdf" onChange={handleFile} />
     </div>
      {pdfUrl && <PDFBookViewer pdfUrl={pdfUrl} />}
    </div>
  );
};

export default App;
