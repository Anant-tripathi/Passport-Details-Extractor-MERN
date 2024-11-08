import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a document file.");
      return;
    }

  setLoading(true);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await axios.post('http://localhost:5000/api/process-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setData(response.data);
      setError(null);
    } catch (err) {
      setError('Error processing document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="app">
      <header>
        <h1>Passport Details Extractor</h1>
      </header>

      <div className="container">
        <div className="container-upload">
          {file && (
            <div className="img">
              <img src={URL.createObjectURL(file)} alt="Uploaded preview" />
            </div>
          )}
          <div className="sub-container-left">
            <form onSubmit={handleSubmit}>
              <input
                type="file"
                onChange={handleFileChange}
                accept='jpg'
                aria-label="Upload Document"
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Extract'}
              </button>
            </form>
          </div>
        </div>

        {data && (
          <div className="container-details">
            <p><b>Name: </b>{data.name || 'Not found'}</p>
            <p><b>Document Number: </b>{data.documentNumber?.replace(/\s/g, '') || 'Not found'}</p>
            <p><b>Expiry Date: </b>{data.expiryDate || 'Not found'}</p>
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      <footer>
        <p>Made by <a href="https://www.linkedin.com/in/anant-tripathi79" target="_blank" rel="noopener noreferrer">Anant Tripathi</a></p>
        <p>GitHub: <a href="https://github.com/Anant-tripathi" target="_blank" rel="noopener noreferrer">https://github.com/Anant-tripathi</a></p>
        <p>For DocuVille internship</p>
      </footer>
    </div>
  );
}

export default App;
