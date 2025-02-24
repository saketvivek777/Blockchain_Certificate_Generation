import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";

// Helper: Convert a data URI to a Blob.
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

// Helper: Convert a Blob to a data URI.
function blobToDataURI(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const Auth2Page = ({ username, onLogout }) => {
  const [signedPdfs, setSignedPdfs] = useState([]); // PDFs fetched from Auth1 localStorage
  const [selectedSignedPdfs, setSelectedSignedPdfs] = useState([]); // Indices of PDFs selected for final signing
  const [signature, setSignature] = useState(null); // Second signature (JPG)
  const [finalSignedPdfs, setFinalSignedPdfs] = useState([]); // Final PDFs after second signature

  // On mount, load signed PDFs from localStorage (Auth1 should have stored these under "auth1SignedPdfs")
  useEffect(() => {
    const storedSigned = localStorage.getItem("auth1SignedPdfs");
    if (storedSigned) {
      const parsed = JSON.parse(storedSigned);
      setSignedPdfs(parsed);
    }
  }, []);

  // Handle uploading the second signature (JPG only)
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

  // Open a PDF in a new tab using its URL
  const handleViewSignedPdf = (pdfUrl) => {
    window.open(pdfUrl, "_blank");
  };

  // Apply second signature to selected signed PDFs and generate final signed PDFs
  const handleSignSelectedFinalPdfs = async () => {
    if (selectedSignedPdfs.length === 0) {
      alert("Please select at least one signed PDF.");
      return;
    }
    if (!signature) {
      alert("Please upload your second signature.");
      return;
    }
    const newFinalSigned = [];
    for (const index of selectedSignedPdfs) {
      const pdfItem = signedPdfs[index];
      // Fetch the PDF as a Blob from the stored URL.
      const response = await fetch(pdfItem.url);
      const blob = await response.blob();
      const pdfBytes = await blob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBytes));

      // Embed the second signature image into the PDF.
      const base64String = signature.split(",")[1];
      const signatureBytes = Uint8Array.from(atob(base64String), (c) =>
        c.charCodeAt(0)
      );
      const signatureImage = await pdfDoc.embedJpg(signatureBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width } = firstPage.getSize();
      const signatureWidth = 120;
      const signatureHeight = 60;
      // Position the signature (adjust x and y as needed)
      const x = width - signatureWidth -86;
      const y = 160;
      firstPage.drawImage(signatureImage, {
        x,
        y,
        width: signatureWidth,
        height: signatureHeight,
      });

      // Save the modified PDF and generate a URL for it.
      const modifiedPdfBytes = await pdfDoc.save();
      const modifiedBlob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
      const finalPdfUrl = URL.createObjectURL(modifiedBlob);
      const finalSignedName = pdfItem.name.replace(
        "signed-certificate",
        "final-signed-certificate"
      );
      newFinalSigned.push({ name: finalSignedName, url: finalPdfUrl });
      window.open(finalPdfUrl, "_blank");
    }
    alert("Selected PDFs have been final signed.");
    // Update state with the new final signed PDFs.
    setFinalSignedPdfs((prev) => [...prev, ...newFinalSigned]);
    // Remove the processed PDFs from the signed list.
    const remaining = signedPdfs.filter((_, i) => !selectedSignedPdfs.includes(i));
    setSignedPdfs(remaining);
    setSelectedSignedPdfs([]);
    localStorage.setItem("auth1SignedPdfs", JSON.stringify(remaining));
    // Also store the final signed PDFs in localStorage.
    const storedFinal = localStorage.getItem("finalSignedPdfs");
    let finalPdfsArray = storedFinal ? JSON.parse(storedFinal) : [];
    finalPdfsArray = [...finalPdfsArray, ...newFinalSigned];
    localStorage.setItem("finalSignedPdfs", JSON.stringify(finalPdfsArray));
  };

  // Copy the final signed PDFs to Admin's localStorage (using key "adminFinalSignedPdfs")
  const handleSendToAdmin = () => {
    if (finalSignedPdfs.length === 0) {
      alert("No final signed PDFs available to send.");
      return;
    }
    localStorage.setItem("adminFinalSignedPdfs", JSON.stringify(finalSignedPdfs));
    alert("Final signed PDFs have been sent to Admin (stored in localStorage).");
  };

  return (
    // <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-blue-500 to-indigo-400 pt-16 pb-6">
    // {/* Header with two images at top-left and top-right */}
    // <header className="relative w-full mt-34 mb-12 flex flex-col items-center px-10 sm:px-8 md:px-16">
    // <img
    //       src="src/assets/logo3.jpeg"
    //       alt="Left Icon"
    //       className="absolute top-0 left-4 h-24 px-2 py-2"
    //     />
    //     <img
    //       src="src/assets/logo6.png"
    //       alt="Right Icon"
    //       className="absolute top-0 right-4 h-24 py-2 "
    //     />
    //     <h1 className="text-4xl font-bold text-white mt-56">Centre for Development of Advanced Computing</h1>
    //     <h1 className="text-3xl font-bold text-white">Auth2 Dashboard</h1>
    //     <p className="text-xl text-white mt-4">Welcome, {username}!</p>
    //     <button
    //       onClick={onLogout}
    //       className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md shadow-lg transition duration-300"
    //     >
    //       Logout
    //     </button>
    //   </header>

    //   {/* Main content area */}
    //   <main className="flex items-center justify-center px-4">
    //     <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl px-4 sm:px-8 md:px-16 py-6 transform transition-transform duration-300 hover:scale-105">
    //       {/* Section: List of Signed PDFs from Auth1 */}
    //       <h2 className="text-2xl font-bold mb-4">Signed Certificates from Auth1</h2>
    //       <div className="mb-4">
    //         <label className="block font-semibold mb-2">
    //           <input
    //             type="checkbox"
    //             checked={
    //               signedPdfs.length > 0 &&
    //               selectedSignedPdfs.length === signedPdfs.length
    //             }
    //             onChange={(e) => {
    //               if (e.target.checked) {
    //                 setSelectedSignedPdfs(signedPdfs.map((_, i) => i));
    //               } else {
    //                 setSelectedSignedPdfs([]);
    //               }
    //             }}
    //             className="mr-2"
    //           />
    //           <span>Select All</span>
    //         </label>
    //       </div>
    //       <div className="max-h-60 overflow-y-auto border p-4 rounded-md bg-white shadow mb-4">
    //         {signedPdfs.length > 0 ? (
    //           <ul className="space-y-4">
    //             {signedPdfs.map((pdf, index) => (
    //               <li
    //                 key={index}
    //                 className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
    //               >
    //                 <div className="flex items-center gap-2">
    //                   <input
    //                     type="checkbox"
    //                     checked={selectedSignedPdfs.includes(index)}
    //                     onChange={() => {
    //                       if (selectedSignedPdfs.includes(index)) {
    //                         setSelectedSignedPdfs(
    //                           selectedSignedPdfs.filter((i) => i !== index)
    //                         );
    //                       } else {
    //                         setSelectedSignedPdfs([...selectedSignedPdfs, index]);
    //                       }
    //                     }}
    //                     className="mr-2"
    //                   />
    //                   <span>{pdf.name.replace("signed-certificate", "")}</span>
    //                 </div>
    //                 <button
    //                   onClick={() => handleViewSignedPdf(pdf.url)}
    //                   className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    //                 >
    //                   View
    //                 </button>
    //               </li>
    //             ))}
    //           </ul>
    //         ) : (
    //           <p className="text-gray-500">No signed PDFs found.</p>
    //         )}
    //       </div>

        

    //       {/* Section: Upload Second Signature */}
    //       <div className="mb-6">
    //         <label className="block text-lg font-semibold mb-2">
    //           Upload Second Signature:
    //         </label>
    //         <input
    //           type="file"
    //           accept="image/jpeg"
    //           onChange={handleSignatureUpload}
    //           className="border p-2 w-full rounded-md"
    //         />
    //         {signature && (
    //           <div className="mt-2">
    //             <p className="text-green-600">Signature uploaded successfully!</p>
    //             <img src={signature} alt="Uploaded signature" className="mt-2 h-16" />
    //           </div>
    //         )}
    //       </div>
    //       {/* Section: Sign Selected Final PDFs */}
    //       <div className="flex justify-center mb-4">
    //         <button
    //           onClick={handleSignSelectedFinalPdfs}
    //           className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    //         >
    //           Sign Selected Final PDFs
    //         </button>
    //       </div>
    //       {/* Section: Send Final PDFs to Admin */}
    //       <div className="flex justify-center mb-4">
    //         <button
    //           onClick={handleSendToAdmin}
    //           className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600"
    //         >
    //           Send Final PDFs to Admin
    //         </button>
    //       </div>

    //       {/* Section: Display Final Signed PDFs */}
    //       <h2 className="text-2xl font-bold mb-4">Final Signed PDFs</h2>
    //       <div className="max-h-60 overflow-y-auto border p-4 rounded-md bg-white shadow mb-4">
    //         {finalSignedPdfs.length > 0 ? (
    //           <ul className="space-y-4">
    //             {finalSignedPdfs.map((pdf, index) => (
    //               <li
    //                 key={index}
    //                 className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
    //               >
    //                 <span>{pdf.name}</span>
    //                 <button
    //                   onClick={() => window.open(pdf.url, "_blank")}
    //                   className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    //                 >
    //                   View Final PDF
    //                 </button>
    //               </li>
    //             ))}
    //           </ul>
    //         ) : (
    //           <p className="text-gray-500">No final signed PDFs available.</p>
    //         )}
    //       </div>
    //     </div>
    //   </main>
    // </div>
    <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-blue-500 to-indigo-400 mt-56 pt-16 pb-6">
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
      className="absolute top-0 right-4 h-24 py-2"
    />
    <h1 className="text-4xl font-bold text-white">
      Centre for Development of Advanced Computing
    </h1>
    <h1 className="text-3xl font-bold text-white">Auth2 Dashboard</h1>
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
      {/* Section: List of Signed PDFs from Auth1 */}
      <h2 className="text-2xl font-bold mb-4">Signed Certificates from Auth1</h2>
      <div className="mb-4">
        <label className="block font-semibold mb-2">
          <input
            type="checkbox"
            checked={
              signedPdfs.length > 0 &&
              selectedSignedPdfs.length === signedPdfs.length
            }
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedSignedPdfs(signedPdfs.map((_, i) => i));
              } else {
                setSelectedSignedPdfs([]);
              }
            }}
            className="mr-2"
          />
          <span>Select All</span>
        </label>
      </div>
      <div className="max-h-60 overflow-y-auto border p-4 rounded-md bg-white shadow mb-4">
        {signedPdfs.length > 0 ? (
          <ul className="space-y-4">
            {signedPdfs.map((pdf, index) => (
              <li
                key={index}
                className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedSignedPdfs.includes(index)}
                    onChange={() => {
                      if (selectedSignedPdfs.includes(index)) {
                        setSelectedSignedPdfs(
                          selectedSignedPdfs.filter((i) => i !== index)
                        );
                      } else {
                        setSelectedSignedPdfs([...selectedSignedPdfs, index]);
                      }
                    }}
                    className="mr-2"
                  />
                  <span>{pdf.name.replace("signed-certificate", "")}</span>
                </div>
                <button
                  onClick={() => handleViewSignedPdf(pdf.url)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No signed PDFs found.</p>
        )}
      </div>

      {/* Section: Upload Second Signature */}
      <div className="mb-6">
        <label className="block text-lg font-semibold mb-2">
          Upload Second Signature:
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
            <img src={signature} alt="Uploaded signature" className="mt-2 h-16" />
          </div>
        )}
      </div>

      {/* Section: Sign Selected Final PDFs */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handleSignSelectedFinalPdfs}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Sign Selected Final PDFs
        </button>
      </div>

      {/* Section: Send Final PDFs to Admin */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handleSendToAdmin}
          className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600"
        >
          Send Final PDFs to Admin
        </button>
      </div>

      {/* Section: Display Final Signed PDFs */}
      <h2 className="text-2xl font-bold mb-4">Final Signed PDFs</h2>
      <div className="max-h-60 overflow-y-auto border p-4 rounded-md bg-white shadow mb-4">
        {finalSignedPdfs.length > 0 ? (
          <ul className="space-y-4">
            {finalSignedPdfs.map((pdf, index) => (
              <li
                key={index}
                className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
              >
                <span>{pdf.name}</span>
                <button
                  onClick={() => window.open(pdf.url, "_blank")}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  View Final PDF
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No final signed PDFs available.</p>
        )}
      </div>
    </div>
  </main>
</div>

  );
};

export default Auth2Page;
