

# 📄 PDF to JSON Converter Web App

Welcome to the **PDF to JSON Converter**! This app allows you to easily convert PDF documents into a structured JSON format for better manipulation and use in web applications. 🚀
Frontend is live here: pdf2json.vercel.app
## 🌟 Features

- **PDF to JSON Conversion**: Extract text, forms, metadata, and more from your PDF files.
- **Element Categorization**: Automatically identifies elements like headers, dates, form fields, amounts, and other key data.
- **OCR Support**: Converts scanned PDF images to text where applicable.
- **Metadata Extraction**: Includes processing details like total pages, element types, and the processing date.
- **Simple Interface**: User-friendly interface for uploading PDFs and downloading JSON output.
- **Responsive Design**: Optimized for all devices, from desktop to mobile.

## 🛠️ Tech Stack

This project uses the following technologies:

- **Frontend**: ⚛️ React.js
- **Backend**: 🐍 FastAPI
- **PDF Parsing**: 📄 PyPDF2, PDFMiner
- **OCR**: 🖼️ Tesseract OCR (for scanned PDFs)
- **Styling**: 💅 Tailwind CSS
- **Deployment**: ☁️ Docker (frontend is deployed on vercel, but it does not support backend.) Why?? 💵Money🦀

## 🚀 Getting Started

Follow these instructions to get the project up and running locally.

### Prerequisites

- **Node.js** (v14+)
- **Python** (v3.7+)
- **Docker** (optional, for containerized setup)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/pdf-to-json-converter.git
   cd pdf-to-json-converter
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install backend dependencies**:
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Run the app**:

   - **Frontend**:
     ```bash
     npm start
     ```
   - **Backend**:
     ```bash
     cd backend
     uvicorn main:app --reload
     ```

5. **Visit the app** in your browser at `http://localhost:3000`.

## 🖥️ Usage

1. **Upload a PDF** via the web interface.
2. **Convert** the uploaded file to JSON format.
3. **Download** the JSON file and use it as needed.

## 🛠️ Development

### Frontend

The frontend is built with **React.js** and **Tailwind CSS** for a smooth and responsive user interface. You'll find all the relevant code inside the `src/` folder.

### Backend

The backend is powered by **FastAPI** and handles the PDF processing and JSON conversion. It uses libraries like **PyPDF2** and **PDFMiner** for parsing, and **Tesseract OCR** to handle scanned PDFs. Check the `backend/` folder for the API code.

## 🤖 Future Improvements

- ✨ Add support for extracting images from PDFs.
- 🔍 Implement keyword-based search within the PDF content.
- 📈 Include a dashboard for visualizing metadata and content summaries.

## 🤝 Contributing

Contributions are always welcome! Feel free to fork this repository and submit a pull request.

## 📧 Contact

If you have any questions or feedback, reach out to me at: [umershahzeb@gmail.com](mailto:umershahzeb@gmail.com)

---

### ⭐ Don't forget to give this repo a star if you found it useful!

---
