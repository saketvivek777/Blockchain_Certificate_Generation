import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";

const Auth1Page = ({ username, onLogout }) => {
  const [unsignedPdfs, setUnsignedPdfs] = useState([]);
  const [selectedUnsignedPdfs, setSelectedUnsignedPdfs] = useState([]);
  const [signature, setSignature] = useState(null);
  const [signedPdfs, setSignedPdfs] = useState([]);

  // Fetch unsigned PDFs from Admin’s localStorage when the component mounts.
  useEffect(() => {
    const storedUnsigned = localStorage.getItem("unsignedCertificates");
    if (storedUnsigned) {
      const parsed = JSON.parse(storedUnsigned);
      setUnsignedPdfs(parsed);
    }
  }, []);

  // Utility: Store a signed certificate in localStorage.
  const setSignedCertificate = async (key, blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem(key, reader.result);
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Utility: Store Auth2's signed PDFs in localStorage.
  const setAuth2SignedPdfs = async (pdfs) => {
    localStorage.setItem("auth2SignedPdfs", JSON.stringify(pdfs));
    return Promise.resolve();
  };

  // Open a PDF (data URI) in a new tab.
  const handleViewUnsignedPdf = (pdfData) => {
    const base64Index = pdfData.indexOf("base64,") + 7;
    const base64 = pdfData.substring(base64Index);
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  };

  // Upload signature image (only JPG allowed).
  const handleSignatureUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "image/jpeg") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSignature(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Only JPG signatures are allowed.");
    }
  };

  // Toggle selection for a single PDF.
  const handleSelectPdf = (index) => {
    if (selectedUnsignedPdfs.includes(index)) {
      setSelectedUnsignedPdfs(selectedUnsignedPdfs.filter((i) => i !== index));
    } else {
      setSelectedUnsignedPdfs([...selectedUnsignedPdfs, index]);
    }
  };

  // Handle the "Select All" checkbox.
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUnsignedPdfs(unsignedPdfs.map((_, index) => index));
    } else {
      setSelectedUnsignedPdfs([]);
    }
  };

  // ------------------ Sign Selected PDFs ------------------
  const handleSignSelectedPdfs = async () => {
    if (selectedUnsignedPdfs.length === 0) {
      alert("Please select at least one unsigned PDF to sign.");
      return;
    }
    if (!signature) {
      alert("Please upload a signature first.");
      return;
    }

    const newSignedPdfs = [];

    for (const index of selectedUnsignedPdfs) {
      const pdf = unsignedPdfs[index];
      // Convert the data URI to a byte array.
      const byteCharacters = atob(pdf.pdf.split(",")[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Load the PDF document using pdf-lib.
      const pdfDoc = await PDFDocument.load(byteArray);

      // Embed the signature image (JPG).
      const signatureBytes = Uint8Array.from(
        atob(signature.split(",")[1]),
        (c) => c.charCodeAt(0)
      );
      const signatureImage = await pdfDoc.embedJpg(signatureBytes);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const signatureWidth = 120;
      const signatureHeight = 60;
      // Adjust x and y values as needed.
      const x = 100;
      const y = 160;
      firstPage.drawImage(signatureImage, {
        x,
        y,
        width: signatureWidth,
        height: signatureHeight,
      });

      // Save the modified PDF as bytes.
      const modifiedPdfBytes = await pdfDoc.save();
      const modifiedBlob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(modifiedBlob);
      const signedName = pdf.name.replace("unsigned-certificate", "signed-certificate");

      try {
        await setSignedCertificate(signedName, modifiedBlob);
        newSignedPdfs.push({ name: signedName, url: pdfUrl });
        // Optionally open the signed PDF in a new tab.
        window.open(pdfUrl, "_blank");
      } catch (error) {
        console.error("Error storing signed PDF:", error);
        alert("Error storing signed PDF in localStorage.");
      }
    }
    alert("Selected PDFs signed successfully.");
    // Add the new signed PDFs to state.
    setSignedPdfs((prev) => [...prev, ...newSignedPdfs]);

    // Remove the signed PDFs from the unsigned list.
    const newUnsigned = unsignedPdfs.filter((_, i) => !selectedUnsignedPdfs.includes(i));
    setUnsignedPdfs(newUnsigned);
    setSelectedUnsignedPdfs([]);
    // Update the stored unsigned certificates.
    localStorage.setItem("unsignedCertificates", JSON.stringify(newUnsigned));
    // Store signed PDFs in Auth1's localStorage.
    localStorage.setItem("auth1SignedPdfs", JSON.stringify([...signedPdfs, ...newSignedPdfs]));
  };

  // Send signed PDFs to Auth2 by storing them in localStorage.
  const handleSendToAuth2 = async () => {
    if (signedPdfs.length === 0) {
      alert("No signed PDFs available to send.");
      return;
    }
    try {
      await setAuth2SignedPdfs(signedPdfs);
      alert("Signed PDFs have been sent to Auth2 and stored in localStorage.");
      console.log("Signed PDFs stored for Auth2:", signedPdfs);
    } catch (error) {
      console.error("Error storing signed PDFs for Auth2:", error);
      alert("Error sending signed PDFs to Auth2.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-blue-500 to-indigo-400 pt-16 pb-6">
      {/* Header with two images at top-left and top-right */}
      <header className="relative w-full mt-12 mb-8 flex flex-col items-center px-4 sm:px-8 md:px-16">
        <img
          src="src/assets/logo5.png"
          alt="Left Icon"
          className="absolute top-0 left-4 h-24 px-2 py-2"
        />
        <img
          src="src/assets/logo6.png"
          alt="Right Icon"
          className="absolute top-0 right-4 h-24 py-2 "
        />
        <h1 className="text-4xl font-bold text-white">Centre for Development of Advanced Computing</h1>
        <h1 className="text-3xl font-bold text-white">Auth1 Dashboard</h1>
        <div className="absolute top-8 right-4 flex mt-16 items-center space-x-4">
            <p className="text-xl text-white">Welcome, {username}!</p>
         <button
        onClick={onLogout}
        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md shadow-lg transition duration-300"
        >
        Logout
       </button>
       </div>

      </header>

      {/* Main content area */}
      <main className="flex items-center justify-center px-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl px-4 sm:px-8 md:px-16 py-6 transform transition-transform duration-300 hover:scale-105">
          <h2 className="text-2xl font-bold mb-4">Unsigned PDFs Inbox</h2>

          {/* Signature Upload Section */}
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-2">
              Upload Signature (JPG only):
            </label>
            <input
              type="file"
              accept="image/jpeg"
              onChange={handleSignatureUpload}
              className="border p-2 w-full rounded-md"
            />
            {signature && (
              <div className="mt-2">
                <p className="text-green-600">Signature uploaded successfully!</p>
                <img
                  src={signature}
                  alt="Uploaded signature"
                  className="mt-2 h-16"
                />
              </div>
            )}
          </div>

          {/* Unsigned PDFs List with Select Options */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={
                  unsignedPdfs.length > 0 &&
                  selectedUnsignedPdfs.length === unsignedPdfs.length
                }
                className="mr-2"
              />
              <span>Select All</span>
            </div>
            <div className="max-h-60 overflow-y-auto border p-4 rounded-md bg-white shadow mb-4">
              {unsignedPdfs.length > 0 ? (
                <ul className="space-y-4">
                  {unsignedPdfs.map((pdf, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
                    >
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedUnsignedPdfs.includes(index)}
                          onChange={() => handleSelectPdf(index)}
                          className="mr-2"
                        />
                        {pdf.name.replace("unsigned-certificate-", "")}
                      </label>
                      <button
                        onClick={() => handleViewUnsignedPdf(pdf.pdf)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        View
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No unsigned PDFs found.</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleSignSelectedPdfs}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            >
              Sign Selected PDFs
            </button>
            <button
              onClick={handleSendToAuth2}
              className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600"
            >
              Send to Auth2
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth1Page;
