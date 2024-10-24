import React, { useState, useCallback } from 'react';
import { Upload, FileText, Download, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Typewriter from 'typewriter-effect';
const PDFConverter = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showFormat, setShowFormat] = useState(false);

  // Sample JSON output for documentation
  const sampleJson = {
    "metadata": {
      "total_pages": 2,
      "element_types": ["header", "text", "form_field", "date", "email", "phone", "amount"],
      "processing_date": "2024-02-20T14:30:00",
      "ocr_enabled": true
    },
    "page_1": [
      {
        "type": "header",
        "text": "INVOICE",
        "page": 1,
        "bbox": [100, 50, 200, 70],
        "confidence": 1.0
      },
      {
        "type": "date",
        "text": "02/20/2024",
        "page": 1,
        "bbox": [300, 50, 400, 70],
        "confidence": 1.0
      }
    ],
    "type_form_field": [
      {
        "type": "form_field",
        "text": "Total Amount: $1,234.56",
        "page": 1,
        "bbox": [100, 400, 300, 420],
        "confidence": 1.0
      }
    ]
  };

  // Handler functions remain the same as in the previous version
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a PDF file');
    }
  }, []);

  const handleFileInput = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a PDF file');
    }
  }, []);

  const handleSubmit = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const API_BASE_URL = 'http://localhost:8000'; // Note the port change to 8000

    try {
      // This code sends the uploaded PDF file to the server running on localhost:8000
      // The server will receive the file and convert it into a JSON object
      // The JSON object is then returned to the client as a response to this POST request
      const response = await fetch(`${API_BASE_URL}/api/convert-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }

      const jsonData = await response.json();
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-10">
        <div className="flex justify-center mt-10 " >
          <span className="text-5xl  mb-8 text-blue-900" style={{fontFamily: 'my-font-2'}}>
            {/* <Typewriter
              options={{
                strings: ['PDF to JSON'],
                autoStart: true,
                loop: false,
                delay: 300,
              }}
            /> */} PDF to JSON
          </span>
        </div>
        
      <div className="max-w-4xl mx-auto space-y-6 ">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>PDF to JSON Converter 📟</CardTitle>
            <CardDescription>
              Convert your PDF documents into structured JSON format with text extraction and OCR capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center
                transition-colors duration-200 ease-in-out
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
              />
              
              {!file ? (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-gray-600">
                      Drag and drop your PDF here, or{' '}
                      <label
                        htmlFor="file-input"
                        className="text-blue-500 hover:text-blue-600 cursor-pointer"
                      >
                        browse
                      </label>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Supports PDF files up to 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileText className="w-12 h-12 mx-auto text-blue-500" />
                  <div>
                    <p className="text-gray-600">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {file && !isProcessing && (
              <button
                onClick={handleSubmit}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Convert to JSON
              </button>
            )}

            {isProcessing && (
              <div className="mt-4 text-center text-gray-600">
                <div className="animate-pulse">Processing your PDF...</div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowFormat(!showFormat)}>
              <div>
                {/* {showFormat ? null : (
                  <CardTitle>Output Format Documentation</CardTitle>
                )} */}

                <CardTitle>Output Format Documentation 📄</CardTitle>
                  <CardDescription className="mt-2.5">
                    <div className=''>Learn about the structure of the generated JSON</div>
                  </CardDescription>
              </div>
              {showFormat ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </div>
          </CardHeader>
          {showFormat && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">JSON Structure</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">The output JSON contains:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li><span className="font-semibold">metadata:</span> Information about the processed PDF</li>
                      <li><span className="font-semibold">page_[number]:</span> Array of elements found on each page</li>
                      <li><span className="font-semibold">type_[elementType]:</span> Elements grouped by their type</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Element Types</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p><span className="font-semibold">header:</span> Page headers and titles</p>
                      <p><span className="font-semibold">text:</span> Regular text content</p>
                      <p><span className="font-semibold">form_field:</span> Form fields and their values</p>
                      <p><span className="font-semibold">date:</span> Dates in various formats</p>
                    </div>
                    <div className="space-y-1">
                      <p><span className="font-semibold">email:</span> Email addresses</p>
                      <p><span className="font-semibold">phone:</span> Phone numbers</p>
                      <p><span className="font-semibold">amount:</span> Currency amounts</p>
                      <p><span className="font-semibold">ocr_text:</span> Text extracted via OCR</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Sample Output</h3>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                  <code className="language-json">{JSON.stringify(sampleJson, null, 2)}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Element Properties</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li><span className="font-semibold">type:</span> The type of element detected</li>
                    <li><span className="font-semibold">text:</span> The actual text content</li>
                    <li><span className="font-semibold">page:</span> Page number where the element was found</li>
                    <li><span className="font-semibold">bbox:</span> Bounding box coordinates [x0, y0, x1, y1]</li>
                    <li><span className="font-semibold">confidence:</span> OCR confidence score (1.0 for regular text)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          )}
        </Card>


        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Benefits of Converting PDF to JSON 🎆</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 ">
            <li className="flex items-start">
              <span className="flex-none w-10 h-10 bg-gray-200 rounded-full mr-4 "></span>
              <div>
                <div className='font-semibold'>Structured Data for Easy Processing</div>
                <p className="text-sm p-4 text-gray-600">JSON organizes data into key-value pairs, making it much easier to parse, search, and manipulate programmatically compared to the unstructured PDF format. Elements like "header," "date," and "form_field" are extracted and categorized, allowing specific data types (e.g., dates, amounts) to be processed independently.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-none w-10 h-10 bg-gray-200 rounded-full mr-4"></span>
              <div>
                <div className='font-semibold'>Automated Data Extraction and Analysis</div>
                <p className="text-sm p-4 text-gray-600">Businesses can automatically extract key information (e.g., invoice numbers, dates, amounts) from PDFs like invoices, receipts, or forms without manual intervention. This data can be fed into other systems like accounting software or databases for further analysis, automation, or decision-making.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-none w-10 h-10 bg-gray-200 rounded-full mr-4"></span>
              <div>
                <div className='font-semibold'>Interoperability Across Systems</div>
                <p className="text-sm p-4 text-gray-600">JSON is a common format used by various APIs and web applications. Converting PDFs to JSON allows easy integration with web services, making it ideal for applications that need to exchange data between systems. An API that accepts JSON input can use the extracted PDF data directly without needing any additional transformation.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-none w-10 h-10 bg-gray-200 rounded-full mr-4"></span>
              <div>
                <div className='font-semibold'>Enhanced Search and Indexing</div>
                <p className="text-sm p-4 text-gray-600">JSON-based data can be indexed and searched more efficiently than PDFs. Specific elements like form fields, dates, or email addresses are easily searchable once extracted, which is useful for document management systems. You can create keyword-based searches or filters across multiple documents by accessing specific fields in the JSON output.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-none w-10 h-10 bg-gray-200 rounded-full mr-4"></span>
              <div>
                <div className='font-semibold'>Reduced Human Error</div>
                <p className="text-sm p-4 text-gray-600">By automating the extraction of key elements from PDFs (like invoices or legal documents), the risk of human error is reduced, especially in repetitive tasks like data entry.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-none w-10 h-10 bg-gray-200 rounded-full mr-4"></span>
              <div>
                <div className='font-semibold'>Improved OCR and Text Recognition</div>
                <p className="text-sm p-4 text-gray-600">Since OCR (optical character recognition) is enabled, even scanned documents (images) can be converted to text in JSON. This is useful for handling paper-based records or scanned images, which would otherwise be unreadable by machines.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-none w-10 h-10 bg-gray-200 rounded-full mr-4"></span>
              <div>
                <div className='font-semibold'>Flexibility in Data Presentation</div>
                <p className="text-sm p-4 text-gray-600">JSON provides a flexible structure for presenting hierarchical data like multi-page documents (e.g., "page_1", "page_2"). You can map the elements across different pages, making it easier to work with complex multi-page documents. Different bounding boxes (bbox) help to visualize the placement of text and elements on each page.</p>
              </div>
            </li>
          </ol>
        </section>
        <a
          href="https://umershahzeb02.github.io/my-portfolio/">
        <div className="flex justify-center mt-10 " >
          <span className="text-xl font-bold mb-8 text-blue-500" style={{fontFamily: 'monospace'}}>
            {/* <Typewriter
              options={{
                strings: ['umershahzeb'],
                autoStart: true,
                loop: true,
                delay: 300,
              }}
            /> */}umershahzeb
          </span>
        </div>
        </a>
        </div>
    </div>
  );
};

export default PDFConverter;
